# Workflow Execution Spec — v1

This is the execution model the engine implements in v1. It is small on purpose;
anything not covered here is out of scope for v1.

## What a workflow is

A **workflow** is a directed acyclic graph (DAG) of nodes and edges, plus a
declared input schema and a per-workflow concurrency cap.

```ts
type Workflow = {
  id: string
  name: string
  graph: { nodes: Node[]; edges: Edge[] }
  inputSchema: Json          // describes shape of parameters at trigger
  maxConcurrent: number      // see "Loop concurrency" below
}

type Node = {
  id: string
  kind: "trigger" | "connector" | "llm" | "loop" | "branch"
  name: string
  config: Record<string, unknown>   // may contain `{{ ... }}` template strings
}

type Edge = { id: string; source: string; target: string }
```

Nodes the engine ships with in v1:

- **Trigger** — entry point. Carries the run's parameters.
- **Connector** — calls a hardcoded HTTP API connector (e.g. mock labs / radiology / EHR notes).
- **LLM** — calls Claude with a templated prompt; output is text or structured JSON.
- **Loop** — iterates over a templated array reference (`{{ trigger.patients }}` or `{{ fetchPatients.list }}`); runs its body per item. Flat only — no nested loops in v1. Concurrency follows the workflow's `maxConcurrent`.
- **Branch (If)** — evaluates a templated condition; routes to one of two outputs (true / false).
- **Join** — implicit. A node with N parents waits for all N to finish (no explicit Join node needed).

## Parameters

A run is started with a JSON payload. Two shapes:

- **Object** — a single payload, e.g. `{ patientId: "abc" }`. The workflow runs once.
- **Array of objects** — the workflow is expected to use a Loop node to iterate.

Parameters live on the run row (`WorkflowRun.input`). They are referenced inside
templates as `{{ trigger.<field> }}`.

## Data flow — template strings

Each node has named outputs available under its node id. Downstream nodes
reference them inside config string fields with `{{ ... }}` expressions.

```jsonc
// Node "labs" config — the {{ trigger.patientId }} resolves at run time
{
  "url": "http://labs:4000/observations?patient={{ trigger.patientId }}"
}

// Node "summarize" config — pulls outputs from the three sibling connector nodes
{
  "prompt": "Summarize:\nLabs: {{ labs.body }}\nRadiology: {{ radiology.body }}\nNotes: {{ notes.body }}"
}
```

The runtime context passed to the template engine is:

```ts
type Context = {
  trigger: Json                 // the run's input payload
  [nodeId: string]: NodeOutput  // every completed node's output, keyed by node id
}
```

Templates render to strings only. Structured pass-through (arrays, objects) is
done by referencing the whole node output as `{{ labs }}` and trusting the
connector's `Content-Type` — but in v1 we only template into string fields.

## Parallelism and join

Independent branches of the DAG run **in parallel** with no cap. The 3 demo
connector calls (labs, radiology, EHR notes) all fire at once.

A node with multiple parents waits for **all** parents to finish before firing.
No explicit Join node is required — it is implicit in the DAG.

## Loop concurrency (per-workflow cap)

`Workflow.maxConcurrent` caps how many Loop iterations of that workflow run
concurrently. If a Loop has 10 items and `maxConcurrent = 5`, the engine runs
the first 5 in parallel, then the next 5 once the first batch finishes.

The cap is on the workflow itself, not on individual Loop nodes or connectors.
Within a single iteration, parallel DAG branches still run uncapped.

## Failure handling

**Fail-fast.** Any node that throws kills the entire run. Downstream nodes do
not fire. The run row's `status` becomes `FAILED`, `error` records the failing
node id and message. Step rows for downstream nodes stay `PENDING`.

There are **no retries** in v1. A connector may do its own internal retries
for transient HTTP errors before throwing — that is the connector's
responsibility, not the engine's.

## Timeouts

Each connector declares its own timeout in milliseconds. If a node's connector
does not declare one, the default is **50,000 ms** (50s). On timeout the node
throws and the run fails (per fail-fast).

```ts
type ConnectorDefinition = {
  name: string
  timeoutMs?: number   // default 50_000
  // ...
}
```

## Persistence

The engine writes a `WorkflowStepRun` row **per node** with the node's full
input and output JSON. Status transitions:

```
PENDING → RUNNING → SUCCEEDED | FAILED
```

Run-level rows update at start and at terminal state. Per-step rows update
synchronously around node execution. This supports the "click step → see raw
input/output" UX in the dashboard.

## Trigger API contract

Triggering is fully async. The HTTP endpoint never blocks on workflow completion.

```
POST /api/runs
Body: { workflowId: string, input: Json | Json[] }

Response (immediate):
{ runId: string, status: "PENDING" }
```

The dashboard then polls `GET /api/runs/{id}` to observe state changes.

## Run output

There is no Return node. When a run completes, its `WorkflowRun.output` is
populated as a map of every completed step's output:

```ts
WorkflowRun.output = { [nodeId]: nodeOutput }
```

This is redundant with the per-step rows but convenient for callers that just
want the bag of results.

## Live progress

The dashboard polls `GET /api/runs/{id}` every 1–2s while a run is in progress.
The endpoint returns the run row plus all current step rows. Streaming (SSE,
WebSockets) is out of scope for v1.

## Trigger surface in v1

- **Manual via dashboard only.** Admin clicks Run on a workflow, pastes JSON
  parameters, run is enqueued.
- No cron / scheduled triggers.
- No webhook triggers.
- No MCP server interface (Fuse exposed as MCP server is v2).

## Open questions (still)

- Workflow versioning — when an admin edits a published workflow, do existing in-flight runs use the old version or new?
- LLM node config — Claude model id picker in editor, or hardcoded per workflow?
- Connector palette — flat list or grouped by category?
