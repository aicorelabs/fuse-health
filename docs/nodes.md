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
| `branch` | `BranchNode` | `{ cases, default? }` | wired |
| `filter` | `FilterNode` | `{ condition }` | wired |
| `loop` | `LoopNode` | `{ over, itemVar? }` | wired (single-node body) |
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

### Conditions

`branch` and `filter` share a structured condition shape (no string-eval, no
sandbox needed):

```ts
type Condition = {
  left: unknown    // template-rendered
  op: "==" | "!=" | "===" | "!==" | ">" | "<" | ">=" | "<=" | "in" | "truthy" | "falsy"
  right?: unknown  // template-rendered (omitted for truthy/falsy)
}
```

`left` and `right` are rendered through `renderValue` against the run context,
so `{{ trigger.input.score }}` works in either side. Numeric comparisons use
`Number(...)` coercion; `in` requires `right` to be an array.

### `branch`

Multi-output conditional. Outgoing edges carry a `condition` string that
matches a case's `edge` label; the matching edge fires, the rest are
skip-marked.

```jsonc
{
  "kind": "branch",
  "name": "Score router",
  "config": {
    "cases": [
      { "when": { "left": "{{ trigger.input.score }}", "op": ">=", "right": 80 }, "edge": "high" },
      { "when": { "left": "{{ trigger.input.score }}", "op": "<",  "right": 50 }, "edge": "low"  }
    ],
    "default": "mid"
  }
}
```

Cases evaluate in order — first match wins. If none match and `default` is
set, the edge labeled with `default` fires. Otherwise all outgoing edges are
skipped.

Output: `{ matchedEdge: string | null }`. Each non-matching outgoing edge is
recorded in the executor's `skippedEdges` set so downstream nodes are skipped
(see [workflow-execution.md](workflow-execution.md#skipped-edge-propagation)).

### `filter`

Terminal gate for one branch. If the condition holds, downstream fires;
otherwise the filter's outgoing edges are skip-marked and downstream is
skipped (recursively). The filter step itself always succeeds — this is not
the same as `stop`, which fails the entire run.

```jsonc
{
  "kind": "filter",
  "name": "Proceed only if labs requested",
  "config": {
    "condition": {
      "left": "{{ trigger.input.includeLabs }}",
      "op": "truthy"
    }
  }
}
```

Output: `{ passed: boolean }`.

### `loop`

Iterates an upstream array, running a single-node body once per item.

```jsonc
{
  "kind": "loop",
  "name": "Per patient",
  "config": {
    "over": "{{ trigger.input.patients }}",
    "itemVar": "patient"
  }
}
```

`over` resolves via `renderValue` and must be an array (otherwise the run
fails). `itemVar` defaults to `"item"`. The loop's single outgoing edge points
at the **body node** — the executor runs that node N times, sequentially,
with `ctx[itemVar]` set to the current item per iteration.

After all iterations, both the loop and the body get one aggregate step row
with `output = [bodyOutput, ...]`. Nodes downstream of the body see the array
via `ctx[bodyId]` and fire once.

**v1 constraints:**

- Single-node body only — multi-step bodies require subgraph delimiters and
  are deferred. Workarounds: chain a follow-up `set` or `merge` after the
  loop.
- No nested loops — the body cannot itself be a loop.
- Sequential — iterations don't run in parallel. (Predictable; simple to
  reason about.)
- Loops sharing an `itemVar` cannot run in parallel branches without
  collision; pick distinct names if a graph has more than one loop at the
  same level.

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
