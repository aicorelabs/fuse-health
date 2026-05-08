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
2. Inserts a `WorkflowRun` row (status `PENDING`, with the input payload **and
   a `graphSnapshot` copy of the workflow's graph at start time**).
3. Returns `{ runId, status: "PENDING" }` to the caller.
4. Schedules `runInBackground` on the same Node process — not awaited.

`runInBackground` then:

1. Acquires a per-workflow concurrency slot (see Concurrency).
2. Marks the run `RUNNING`, sets `startedAt`.
3. Hydrates the graph **from `WorkflowRun.graphSnapshot`** (falling back to
   the live `Workflow.graph` for legacy rows where the snapshot is null) and
   invokes the executor.
4. On terminal state, updates the run row (`SUCCEEDED` + `output` map, or
   `FAILED` + `error` message) and releases the slot.

**Versioning via snapshot.** Editing a workflow updates its `graph` in place,
but in-flight runs continue against the version they hydrated at start. The
run-detail UI reads the snapshot too, so a run displayed weeks later shows
the graph it actually ran with — not the current edited one.

The dashboard polls `GET /api/runs/{id}` every 1–2s while a run is in
flight. Streaming (SSE/WebSockets) is out of scope for v1.

### Parameters

A run is started with a JSON `input` payload — usually an object like
`{ patientId: "abc" }`. It is stored on `WorkflowRun.input` and exposed
inside templates as `{{ trigger.input.<field> }}`.

For batch processing, pass an array; the workflow author uses a `loop` node
to fan out per item — see [nodes.md](nodes.md#loop).

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

1. Initial ready set = nodes whose incoming edges are all resolved (from
   completed *or* skipped nodes; the trigger initially, since it has no
   incoming edges).
2. Of the ready set, nodes whose every incoming edge is closed (skipped
   source or `skippedEdges` member) become **skipped** themselves — write a
   `SKIPPED` step row, propagate skip-marking to outgoing edges, no node
   logic runs.
3. The rest run in **parallel** with `Promise.all`.
4. Loop nodes are special-cased inside the parallel batch (see Loop section).
5. Wait for the batch to settle, then re-compute the ready set.
6. Repeat until the ready set is empty.

This means independent branches fan out without cap. Three sibling action
nodes (labs / radiology / ehr-notes) all fire in the same batch.

A node with multiple incoming edges waits for all of them (implicit join).
The `merge` node is just a regular node that inspects its upstreams via the
context and combines them under a chosen `mode`; the join itself is
implicit in any node's "all incoming complete" gate.

### Skipped-edge propagation

`branch` and `filter` decide *not* to fire some of their outgoing edges. The
executor tracks this with `skippedEdges: Set<edgeId>`:

- `filter` whose condition resolves false → all outgoing edges added.
- `branch` → every outgoing edge whose `condition` label doesn't equal the
  matched case is added.

A node downstream of skipped edges is itself skipped if **every** incoming
edge is closed (source skipped *or* edge in `skippedEdges`). Skipping
propagates: that node's outgoing edges are also marked, recursively closing
the dead branch. A node with at least one *open* incoming edge runs normally
— so a join after a branch where one path was taken still fires, with
`ctx[skippedSource]` simply undefined.

`SKIPPED` is one of the values of `RunStatus`. Skipped nodes get a step row
just like succeeded ones, with `output` and `error` null and matching
`startedAt`/`finishedAt` timestamps.

### Per-iteration context frames (loop)

`loop` is single-node-bodied in v1: the loop's single outgoing edge points at
the body node. Iteration runs sequentially:

1. Resolve `over` → must be an array.
2. For each `item`, set `ctx[itemVar] = item`, then call the body's compute
   logic *without* writing a per-iteration step row. Accumulate the body's
   return into `bodyOutputs[]`.
3. Restore the previous `ctx[itemVar]` (or delete it).
4. Write **one** aggregate step row each for the loop and the body, with
   `output = bodyOutputs`.
5. Mark both the loop and body as completed; downstream of body fires once
   with `ctx[bodyId] = bodyOutputs`.

Two practical implications:

- A loop is not parallel; if you need parallel fanout, structure with sibling
  branches instead of a loop.
- Two loops at the same DAG level that share an `itemVar` will collide
  through `ctx`. Pick distinct names (`patient`, `study`, etc.).

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

- **Cancellation** — there's no API to stop an in-flight run. The DB has a
  `CANCELLED` enum value reserved.
- **Multi-step loop bodies** — `loop` v1 takes a single-node body. Multi-step
  bodies need subgraph delimiters and are deferred.
- **Nested loops** — body-of-loop cannot itself be a loop.
- **Durable wait** — the `wait` node is in-process `setTimeout`; a server
  restart kills the run. Long-running pauses (hours/days) need a DB-backed
  scheduler.
- **Streaming output / SSE** — polling only.
- **Multi-instance coordination** — single Node process assumed.
