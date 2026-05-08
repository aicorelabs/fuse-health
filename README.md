# fuse-home

AI-native workflow automation for healthcare. Self-hostable, open source, MCP-ready.

## Stack

- **Language:** TypeScript (strict)
- **App:** Next.js 15 (App Router), Tailwind, React Flow editor (planned)
- **DB:** Postgres via Prisma (local in Docker)
- **Auth:** env-based admin login, JWT cookie via `jose` (currently bypassed — dashboard is open)
- **LLM:** Groq (`groq-sdk`)
- **Distribution:** `docker compose up`
- **License:** Apache-2.0

## Layout

```
apps/
  web/             Next.js app — UI + API routes; embeds the engine in-process
packages/
  core/            Workflow types (nodes, edges, graph), template renderer
  connectors/      Integration model + registry + built-in integrations
  engine/          Run lifecycle, DAG executor, concurrency slotter, LLM client
  db/              Prisma schema + Postgres client singleton
docs/              Architecture, node reference, integrations, execution spec
```

No `User` table (single admin via env). No `Patient` table (parameters supplied
at trigger). Workflow execution runs in the Next.js process for v1 — no
separate worker, no Redis.

## Getting started

```bash
corepack enable
pnpm install

# 1. Postgres up
pnpm compose:up

# 2. Configure env
cp .env.example .env
pnpm hash-password '<your-admin-password>'   # paste output into ADMIN_PASSWORD_HASH
openssl rand -hex 32                          # paste output into SESSION_SECRET
# Drop your Groq key into GROQ_API_KEY (required for the `llm` node)

# 3. Migrate + run
pnpm db:generate
pnpm --filter @fuse/db exec prisma migrate dev --name init
pnpm dev
```

Open http://localhost:3000. Auth is currently disabled — the dashboard is
directly accessible. To re-enable, restore the matcher in
`apps/web/src/middleware.ts`.

## Docs

- [Architecture](docs/architecture.md) — package layout, dependency graph, in-process execution model
- [Nodes](docs/nodes.md) — the 13-kind taxonomy with config schemas and engine status
- [Integrations](docs/integrations.md) — Integration / IntegrationFunction model, built-ins, how to add new
- [Workflow execution spec](docs/workflow-execution.md) — run lifecycle, DAG traversal, concurrency, failure semantics
