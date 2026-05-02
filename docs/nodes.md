## Node taxonomy

A workflow is a DAG of nodes connected by edges. Every node has a `kind`,
a stable `id`, a human `name`, an optional `position` for the editor, and a
typed `config`. Configs are validated at graph load with zod
(`WorkflowGraph.fromJSON`).

The 13 v1 kinds are listed below. **Status** is whether the engine actually
runs them; stubs throw `NotImplementedNodeError` and exist only so the
schemas, classes, and editor surface are stable.

### Quick reference

| Kind | Class | Config | Status |
|------|-------|--------|--------|
| `trigger.manual` | `TriggerManualNode` | `{}` | wired |
| `trigger.webhook` | `TriggerWebhookNode` | `{ path, method, secret? }` | wired (executor); receiver TBD |
| `trigger.schedule` | `TriggerScheduleNode` | `{ cron, timezone? }` | wired (executor); cron daemon TBD |
| `action` | `ActionNode` | `{ integration, function, input }` | wired |
| `http` | `HttpNode` | `{ method, url, headers?, query?, body?, timeoutMs? }` | wired |
| `llm` | `LLMNode` | `{ prompt, model? }` | wired (Groq) |
| `branch` | `BranchNode` | `{ expression }` | stubbed |
| `filter` | `FilterNode` | `{ condition }` | stubbed |
| `loop` | `LoopNode` | `{ over, itemVar? }` | stubbed |
| `merge` | `MergeNode` | `{ mode: "object" \| "array" \| "concat" }` | wired |
| `set` | `SetNode` | `{ fields }` | wired |
| `wait` | `WaitNode` | `{ seconds }` | wired |
| `stop` | `StopNode` | `{ reason? }` | wired |

### Trigger nodes

All three trigger kinds execute identically inside the engine: they output
the run's `input` payload as-is. They differ only in how a run is *started*.

- `trigger.manual` — fired by the dashboard "Run" button.
- `trigger.webhook` — modeled now so editors can place it; v1 has no HTTP
  receiver wired. Future: `POST /api/triggers/{path}` validates `secret` and
  calls `startRun`.
- `trigger.schedule` — modeled now; v1 has no cron daemon. Future: a
  scheduler tick polls for due workflows and calls `startRun`.

Output: the input object passed to `startRun`.

### `action`

Calls an `IntegrationFunction` registered in `@fuse/connectors`. Resolution
is `resolveFunction(integration, function)`.

```jsonc
{
  "kind": "action",
  "name": "Get labs",
  "config": {
    "integration": "labs",
    "function": "getResults",
    "input": { "patientId": "{{ trigger.input.patientId }}" }
  }
}
```

The `input` object is template-rendered against the run context, then validated
against the function's `inputSchema` before invocation. Output is whatever the
function returns. Per-function timeout (default 50s) applied via
`withTimeout`.

### `http`

Generic HTTP request — call any URL without registering an integration.
Useful for one-off external systems (FHIR endpoints, webhooks, etc.).

```jsonc
{
  "kind": "http",
  "config": {
    "method": "POST",
    "url": "https://api.example.com/v1/observations",
    "headers": { "Authorization": "Bearer {{ trigger.input.token }}" },
    "body": { "patientId": "{{ trigger.input.patientId }}" },
    "timeoutMs": 10000
  }
}
```

JSON-aware: object bodies are stringified and sent with
`Content-Type: application/json` (unless caller overrides). Response is parsed
as JSON when the response Content-Type indicates JSON; otherwise returned as
text.

Output:
```ts
{ status: number; ok: boolean; headers: Record<string,string>; body: unknown }
```

Timeout uses `AbortController`. Default 50s.

### `llm`

Calls Groq with a templated prompt.

```jsonc
{
  "kind": "llm",
  "config": {
    "prompt": "Summarize for the attending physician:\nLabs: {{ getLabs.results }}\nRadiology: {{ getRadiology.studies }}\nNotes: {{ getNotes.notes }}",
    "model": "llama-3.3-70b-versatile"
  }
}
```

Default model: `llama-3.3-70b-versatile`. Default timeout: 60s. Default
max_tokens: 4096. Reads `GROQ_API_KEY` from env.

Output:
```ts
{ text: string; model: string; usage?: { promptTokens, completionTokens, totalTokens } }
```

Reference downstream as `{{ summarize.text }}`.

### `branch` *(stubbed)*

Multi-output conditional. Subsumes if-else and switch. Current schema is
minimal (`{ expression }`); will be enriched to structured cases (left/op/
right comparisons mapped to outgoing edge labels) when wired. Wiring requires
executor changes for skipped-edge tracking — see workflow-execution.md.

### `filter` *(stubbed)*

Terminal gate for one branch. If the rendered condition is truthy, downstream
fires; otherwise this branch ends without affecting other branches. Distinct
from `stop`, which terminates the whole run. Same executor traversal change
needed as Branch.

### `loop` *(stubbed)*

Iterates an upstream array, producing one execution of the loop body per item.
Flat only — no nested loops in v1. `over` is a template ref (e.g.
`{{ trigger.input.patients }}`), `itemVar` defaults to `item`. Wiring requires
per-iteration context frames.

### `merge`

Explicit join. Reads outputs from every upstream node connected by an
incoming edge and combines them per `mode`:

- `object` (default) — shallow-merges object-typed upstream outputs into one
  object. Non-object upstreams are skipped.
- `array` — wraps every upstream output into a positional array.
- `concat` — flattens arrays from upstream outputs into a single array;
  non-array values pass through as singleton items.

The DAG executor's "wait for all incoming edges" guarantee means a `merge`
can also just be a regular downstream node if you only need implicit join —
the explicit `merge` is for when you want the combination semantics
configurable in the editor.

### `set`

Declarative field transform. Each value is template-rendered. Output is the
rendered fields object — convenient for normalizing or projecting upstream
outputs without writing code.

```jsonc
{
  "kind": "set",
  "config": {
    "fields": {
      "patientId": "{{ trigger.input.patientId }}",
      "labsAbnormal": "{{ getLabs.results.0.flag }}"
    }
  }
}
```

### `wait`

Pauses the branch using `setTimeout` for `seconds` seconds. In-process only —
on a server restart the run breaks (no durable pause in v1).

### `stop`

Explicit termination. Throws `WorkflowStoppedError`, which the run loop maps
to `WorkflowRun.status = FAILED` with the configured `reason` recorded in
`error`. Use this when you want a workflow to fail intentionally with a
domain-specific message rather than throwing inside an action.

### Edges

Edges have an `id`, `source`, `target`, and an optional `condition` string.
Today only the structural fields are used by the executor; `condition` is
reserved for the upcoming Branch wiring.

```ts
type EdgeJSON = { id: string; source: string; target: string; condition?: string }
```

### Adding a new node kind

1. Add the literal to `NodeKindSchema` in `packages/core/src/workflow/node.ts`.
2. Define the zod schema (`MyNodeSchema`) with shared `baseFields` + a literal
   `kind` + a typed `config`.
3. Add the schema to the `NodeSchema` discriminated union.
4. Add a class extending `BaseNode<MyNodeJSON["config"]>`.
5. Add it to the `AnyNode` union and the `nodeFromJSON` switch.
6. Add a `case "my.kind":` to the executor's `runNode` switch in
   `packages/engine/src/executor.ts`.
