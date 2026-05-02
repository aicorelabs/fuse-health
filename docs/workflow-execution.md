## Workflow Execution Spec — v1

This is the model the engine implements today. Anything not described here
is out of scope for v1.

### What a workflow is

A workflow is a directed acyclic graph of nodes and edges, plus a
per-workflow concurrency cap. The graph is stored as JSON on the
`Workflow.graph` column.

```ts
type Workflow = {
  id: string
  name: string
  description?: string
  graph: { nodes: NodeJSON[]; edges: EdgeJSON[] }
  maxConcurrent: number       // default 5; see Concurrency below
}
```

Nodes are validated against a discriminated zod union on load
(`WorkflowGraph.fromJSON`). Each kind has a typed config — see [nodes.md](nodes.md)
for the full taxonomy and config schemas.

### Run lifecycle

`startRun(workflowId, input)` is fully async:

```
POST /api/runs                     (planned route — engine surface exists)
Body: { workflowId, input }

Response (immediate):
{ runId, status: "PENDING" }
```

The engine does this in order:

1. Loads the workflow.
2. Inserts a `WorkflowRun` row (status `PENDING`, with the input payload).
3. Returns `{ runId, status: "PENDING" }` to the caller.
4. Schedules `runInBackground` on the same Node process — not awaited.

`runInBackground` then:

1. Acquires a per-workflow concurrency slot (see Concurrency).
2. Marks the run `RUNNING`, sets `startedAt`.
3. Hydrates the graph and invokes the executor.
4. On terminal state, updates the run row (`SUCCEEDED` + `output` map, or
   `FAILED` + `error` message) and releases the slot.

The dashboard polls `GET /api/runs/{id}` every 1–2s while a run is in
flight. Streaming (SSE/WebSockets) is out of scope for v1.

### Parameters

A run is started with a JSON `input` payload — usually an object like
`{ patientId: "abc" }`. It is stored on `WorkflowRun.input` and exposed
inside templates as `{{ trigger.input.<field> }}`.

For batch processing, pass an array; the workflow author uses a `loop` node
to fan out per item. (Loop is currently stubbed — see [nodes.md](nodes.md#loop-stubbed).)

### Templates

Strings inside any node's config can contain `{{ path.to.value }}` references.
Two helpers exist in `@fuse/core`:

- `renderTemplate(str, ctx)` — substitutes refs into a string. Always returns
  a string.
- `renderValue(value, ctx)` — walks objects, arrays, and strings. **A string
  whose entire content is one ref preserves the resolved value's type** —
  e.g. `"{{ getLabs }}"` returns the lab result object, not its
  stringification. Embedded refs (`"Patient {{ x }}"`) stringify as expected.

The runtime context:

```ts
type Context = {
  trigger: { input: unknown }     // run.input as supplied to startRun
  [nodeId: string]: unknown       // every completed node's output, keyed by node id
}
```

The executor renders an action node's `input` via `renderValue` before
validating it against the function's `inputSchema`. The `http` and `set`
nodes do the same on their templated fields.

### DAG execution

The executor is a level-set BFS:

1. Initial ready set = nodes whose incoming edges are all from completed
   nodes (the trigger initially, since it has no incoming edges).
2. Run every node in the ready set in **parallel** with `Promise.all`.
3. Wait for the batch to settle, then re-compute the ready set.
4. Repeat until the ready set is empty.

This means independent branches fan out without cap. Three sibling action
nodes (labs / radiology / ehr-notes) all fire in the same batch.

A node with multiple incoming edges waits for all of them (implicit join).
The `merge` node is just a regular node that inspects its upstreams via the
context and combines them under a chosen `mode`; the join itself is
implicit in any node's "all incoming complete" gate.

### Concurrency cap (per workflow)

`Workflow.maxConcurrent` (default 5) caps how many runs of a workflow execute
simultaneously. The slotter is in-memory:

```
acquireSlot(workflowId, max) → resolves immediately if running < max
                             → otherwise queues the caller until a slot frees
releaseSlot(workflowId)      → decrements, drains the queue
```

The queue is FIFO. When `acquireSlot` resolves a queued caller, `running` is
incremented inside the drain (not by the caller after-await) so the
microtask delay can't let drain over-grant.

This is in-process only — multi-instance deployments would need a DB-backed
queue (Postgres advisory lock, etc.).

### Failure handling

**Fail-fast.** Any node that throws makes the entire run terminal-`FAILED`:

- The failing node's `WorkflowStepRun` row is marked `FAILED` with the error
  message.
- Already-running nodes in the same batch finish (we don't yank them mid-IO),
  but no new batches start.
- Nodes that hadn't been picked up yet stay at `PENDING` on disk.
- The `WorkflowRun` row is marked `FAILED` with the first failure's message
  in `error`.

There are **no retries** in v1. Connectors may retry transient errors
internally before throwing — that is the connector's responsibility.

The `stop` node throws `WorkflowStoppedError`, treated like any other failure
but with the configured `reason` as the error message.

### Timeouts

Each `IntegrationFunction` declares a `timeoutMs` (default 50_000). The
executor wraps `fn.invoke(...)` in `withTimeout`, which races against a
`setTimeout` that rejects with `TimeoutError`.

The `http` node uses `AbortController` for native cancellation, also
defaulting to 50s.

The `llm` node has its own default timeout (60s).

### Persistence

Per node, the executor writes a `WorkflowStepRun` row with:

- `nodeId` — the node's stable id from the graph
- `input` — rendered input JSON
- `output` — return value JSON
- `error` — populated only on failure
- `status`, `startedAt`, `finishedAt`

The `WorkflowRun` row is updated at start and at terminal state. Its `output`
is a flat map `{ [nodeId]: nodeOutput }` — redundant with the per-step rows
but convenient for callers that just want the bag of results.

There is no `Return` node — the run output is always the full bag.

### Trigger surface

| Kind | Status |
|------|--------|
| Dashboard manual | wired (engine surface exists; UI route pending) |
| Webhook (`POST /api/triggers/{path}`) | engine treats `trigger.webhook` as passthrough; HTTP receiver TBD |
| Schedule (cron) | engine treats `trigger.schedule` as passthrough; daemon TBD |
| MCP server-trigger | v2 |

### What v1 still doesn't do

- **Branch / Filter / Loop** — schemas + classes exist; executor stubs throw
  `NotImplementedNodeError`. Wiring needs skipped-edge tracking and
  per-iteration context frames; see the relevant sections in
  [nodes.md](nodes.md).
- **Cancellation** — there's no API to stop an in-flight run. The DB has a
  `CANCELLED` enum value reserved.
- **Workflow versioning** — editing a workflow updates the row in place;
  in-flight runs continue with the version they hydrated at start.
- **Streaming output / SSE** — polling only.
- **Multi-instance coordination** — single Node process assumed.
