# fuse-home

AI-native workflow automation platform with first-class MCP (Model Context Protocol) servers and a visual builder.

## Stack

- **Language:** TypeScript (strict)
- **Frontend:** Next.js 15 (App Router) + Tailwind + React Flow
- **Backend:** Next.js API routes / server actions + a separate Node worker
- **DB:** Postgres via Prisma (Supabase)
- **Auth:** Supabase Auth (`@supabase/ssr`)
- **Queue:** BullMQ + Redis (Upstash)
- **LLM:** Anthropic SDK (Claude) + Vercel AI SDK
- **Monorepo:** pnpm workspaces

## Layout

```
apps/
  web/        Next.js app (UI + API)
  worker/     Workflow execution worker (BullMQ)
packages/
  core/       Shared types, workflow + template engine
  db/         Prisma schema + client
  mcp/        MCP server implementations
```

## Prerequisites

- Node 20.12+ (`.nvmrc`)
- pnpm 9 (auto-managed via corepack — `corepack enable`)
- Postgres + Redis (Supabase + Upstash recommended)

## Getting started

```bash
corepack enable
pnpm install
cp .env.example .env   # then fill in values
pnpm db:generate
pnpm dev
```
