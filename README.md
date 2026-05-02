# fuse-home

AI-native workflow automation for healthcare. Self-hostable, open source, MCP-ready.

## Stack

- **Language:** TypeScript (strict)
- **App:** Next.js 15 (App Router), Tailwind, React Flow editor
- **DB:** Postgres via Prisma (local in Docker)
- **Auth:** env-based admin login, JWT cookie via `jose`
- **LLM:** Anthropic SDK (Claude)
- **Distribution:** `docker compose up`
- **License:** Apache-2.0

## Layout

```
apps/
  web/             Next.js app — UI, API, workflow execution (in-process)
packages/
  core/            Shared types, workflow + template engine
  connectors/      Hardcoded API connectors (mock for v1; real integrations later)
  db/              Prisma schema + client
docs/
  workflow-execution.md   v1 execution spec
```

No `User` table (single admin via env). No `Patient` table (params supplied at trigger).
Workflow execution runs in the Next.js process for v1 — no separate worker, no Redis.

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

# 3. Migrate + run
pnpm db:generate
pnpm --filter @fuse/db exec prisma migrate dev --name init
pnpm dev
```

Open http://localhost:3000 → log in with `ADMIN_EMAIL` + the password you hashed.

## Spec

See `docs/workflow-execution.md` for the v1 execution model.
