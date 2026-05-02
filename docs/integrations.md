## Integrations

An **integration** is a vendor or system Fuse connects to (LabCorp, Epic,
Twilio, etc.). Each integration exposes one or more **functions** — discrete
operations like `labs.getResults` or `epic.createAppointment`. A workflow's
`action` node references one function via `{ integration, function, input }`.

This is the inbound model — Fuse calls *out* to these systems via hardcoded
TypeScript code. The opposite direction (external EHR systems calling *into*
Fuse via MCP) is v2.

### Model

```ts
class IntegrationFunction<TIn, TOut> {
  name: string
  description: string
  inputSchema: z.ZodType<TIn>
  timeoutMs: number             // default 50_000
  invoke(rawInput: unknown): Promise<TOut>   // validates then runs
}

abstract class BaseIntegration {
  name: string                  // e.g. "labs"
  description: string
  category: string              // free-form taxonomy ("diagnostics", "ehr", ...)
  getFunction(name: string): IntegrationFunction | undefined
  listFunctions(): IntegrationFunction[]
}
```

The registry is a flat map keyed by integration name. `resolveFunction(int,
fn)` is what the executor calls to look up a function.

```ts
import { resolveFunction } from "@fuse/connectors"

const fn = resolveFunction("labs", "getResults")
const out = await fn?.invoke({ patientId: "abc" })
```

### Built-in integrations (v1)

All v1 integrations are mocked — the functions return hardcoded JSON so the
engine and demo flows can be tested without external dependencies. Real
implementations replace the `run` body without changing the function's name
or schema.

| Integration | Category | Functions | Output shape |
|-------------|----------|-----------|--------------|
| `labs` | diagnostics | `getResults` | `{ patientId, results: LabResult[] }` |
| `radiology` | diagnostics | `getStudies` | `{ patientId, studies: RadiologyStudy[] }` |
| `ehr-notes` | ehr | `getRecentNotes` | `{ patientId, notes: EncounterNote[] }` |

Each function takes `{ patientId: string }` (with an optional `limit` for
`ehr-notes.getRecentNotes`).

### File layout

```
packages/connectors/src/
  function.ts           IntegrationFunction class
  integration.ts        BaseIntegration abstract class
  registry.ts           registerIntegration / resolveFunction / listIntegrations
  index.ts              barrel + registerBuiltInIntegrations()
  integrations/
    labs/
      index.ts          LabsIntegration definition
      get-results.ts    getResults function
    radiology/
      index.ts
      get-studies.ts
    ehr-notes/
      index.ts
      get-recent-notes.ts
```

`registerBuiltInIntegrations()` is idempotent and called once from
`@fuse/engine` on first import — workflow runs see all built-ins without any
explicit setup.

### Adding a new integration

1. Make a folder under `packages/connectors/src/integrations/<name>/`.
2. For each function, write a file exporting an `IntegrationFunction`
   instance. Each declares its `inputSchema` (zod), an optional `timeoutMs`,
   and a `run(input)` returning the output.
3. Add an `index.ts` that subclasses `BaseIntegration` and lists all the
   function instances. Export a singleton.
4. Import the singleton in `packages/connectors/src/index.ts` and register it
   inside `registerBuiltInIntegrations()`.

#### Function template

```ts
import { z } from "zod"
import { IntegrationFunction } from "../../function.js"

const inputSchema = z.object({
  patientId: z.string().min(1),
})

export const getResults = new IntegrationFunction<
  z.infer<typeof inputSchema>,
  { patientId: string; results: unknown[] }
>({
  name: "getResults",
  description: "Fetch the most recent lab panel results for a patient.",
  inputSchema,
  timeoutMs: 30_000,    // optional override
  async run({ patientId }) {
    // call a real API here in production
    return { patientId, results: [] }
  },
})
```

#### Integration template

```ts
import { BaseIntegration } from "../../integration.js"
import { getResults } from "./get-results.js"

class LabsIntegration extends BaseIntegration {
  constructor() {
    super({
      name: "labs",
      description: "LabCorp / Quest aggregator (mocked in v1).",
      category: "diagnostics",
      functions: [getResults],
    })
  }
}

export const labsIntegration = new LabsIntegration()
```

### Why integrations vs flat connectors

Earlier iterations had a flat connector list (`mock-labs`, `mock-radiology`).
The grouped model exists because:

- A real vendor exposes many operations (Epic alone has dozens). Grouping by
  vendor matches how SaaS like n8n and Zapier present their palette.
- Auth and rate-limiting will eventually be per-integration (one bearer token
  for all `labs.*` functions, not per-function), and the registry can hold
  that state in the integration object.

### What functions are *not*

Functions are not generic HTTP calls — for that, use the [`http` node](nodes.md#http).
Functions encode domain operations with typed input and output. If you find
yourself writing a function that just URL-encodes its input and proxies a
fetch, prefer the `http` node and skip the integration ceremony.
