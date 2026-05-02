## Architecture

Fuse is an AI-native workflow automation platform for healthcare. It is
self-hosted, open source, and uses a single Postgres database. Workflow
execution runs in-process inside the Next.js server — there is no separate
worker, no Redis, no message broker.

External EHR systems will eventually invoke Fuse workflows over MCP (v2). v1
exposes one entry point: a manual trigger from the admin dashboard.

### Package layout

```
apps/
  web/            Next.js 15 app — UI + API routes; embeds the engine in-process
packages/
  core/           Workflow types (nodes, edges, graph), template renderer
  connectors/     Integration model + registry + built-in integrations
  engine/         Run lifecycle, DAG executor, concurrency slotter, LLM client
  db/             Prisma schema + Postgres client singleton
docs/
  architecture.md This file
  nodes.md        13-kind node taxonomy reference
  integrations.md How integrations and functions work
  workflow-execution.md  v1 execution spec
```

### Dependency graph

```
apps/web ──► packages/engine ──► packages/connectors ──► packages/core
                  │                                          ▲
                  ├─► packages/db                            │
                  └────────────────────────────────────────► (uses graph + templates)
```

`@fuse/core` has no upstream workspace deps. `@fuse/connectors` depends on
`@fuse/core` for shared types. `@fuse/engine` orchestrates the others.
`apps/web` depends on engine + db.

### Per-package responsibilities

| Package | Responsibility |
|---------|----------------|
| `@fuse/core` | Pure types: `BaseNode` and 13 subclasses, `Edge`, `WorkflowGraph`, `renderTemplate` / `renderValue`. No IO. |
| `@fuse/connectors` | `BaseIntegration`, `IntegrationFunction`, registry. Built-in integrations: `labs`, `radiology`, `ehr-notes`. v1 functions return hardcoded mock JSON. |
| `@fuse/engine` | `startRun`, `getRun`, DAG executor, concurrency slotter, timeout helper, Groq LLM client. Persists to DB via `@fuse/db`. |
| `@fuse/db` | Prisma schema + singleton client. Models: `Workflow`, `WorkflowRun`, `WorkflowStepRun`. |
| `@fuse/web` | Next.js UI + API routes. Embeds the engine in-process; no out-of-band workers. |

### Execution model (in-process)

`startRun(workflowId, input)` does this:

1. Loads the workflow row.
2. Inserts a `WorkflowRun` row with status `PENDING`.
3. Returns `{ runId, status: "PENDING" }` immediately.
4. Fires `runInBackground()` on the same Node process — not awaited.

`runInBackground` then:

1. Acquires a per-workflow concurrency slot (`Workflow.maxConcurrent`,
   default 5). Excess runs wait in an in-memory queue.
2. Marks the run `RUNNING`, records `startedAt`.
3. Hydrates the graph from JSON, traverses with the executor, persists each
   step.
4. On success or failure, marks the run terminal and releases the slot.

Single-instance assumption: the slotter and queue are in-memory. Running
multiple Node processes pointed at the same DB will not coordinate — fine for
v1's local-only deploy, must be replaced with a DB-backed queue for HA.

### Persistence

Every node write produces a `WorkflowStepRun` row with rendered input + output
JSON. This is intentionally redundant with `WorkflowRun.output` (which is a
flat map of every completed step's output) and exists so the dashboard can
show step-by-step traces without joining anything.

```
WorkflowRun ──┐
              └─ WorkflowStepRun (one per node execution)
```

Status transitions per row: `PENDING → RUNNING → SUCCEEDED | FAILED |
CANCELLED`. The `CANCELLED` value exists in the enum but is unused in v1
(fail-fast, no manual cancel UI).

### Auth

Auth is currently **disabled** — `apps/web/src/middleware.ts` matches no
paths, so the dashboard is open. The original env-based admin login (bcrypt
hash, `jose` JWT cookie) is in source but commented out at the middleware.
The session module and login form exist; re-enabling is a one-line matcher
change once the dashboard surface stabilizes.

### Configuration

All env vars live in a single `.env` at repo root, symlinked to
`apps/web/.env` so Next.js picks them up.

| Var | Purpose |
|-----|---------|
| `DATABASE_URL`, `DIRECT_URL` | Postgres connection strings |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` | Admin login (currently bypassed) |
| `SESSION_SECRET` | JWT signing key for the session cookie |
| `GROQ_API_KEY` | LLM provider key, required for the `llm` node |

`ADMIN_PASSWORD_HASH` requires each `$` in the bcrypt hash to be escaped as
`\$` because Next.js applies dotenv-expand on load. `pnpm hash-password`
emits the line pre-escaped — paste it directly.

### What v1 deliberately omits

- Separate worker / Redis / message broker
- React Flow editor (planned)
- Webhook trigger receiver, cron daemon (schemas exist; receivers don't)
- LLM streaming (request/response only)
- Run cancellation UI
- Workflow versioning
- Multi-instance coordination
