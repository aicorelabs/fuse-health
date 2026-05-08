import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma, type RunStatus } from "@fuse/db";
import { startRun } from "@fuse/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const VALID_STATUSES: RunStatus[] = [
  "PENDING",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "SKIPPED",
];

/**
 * Paginated run history. Hides isPartial=true previews so the timeline
 * matches what a human ran intentionally.
 *
 * Query params:
 *   workflowId=<id>           (filter to one workflow)
 *   status=PENDING|…           (repeatable; OR-matched)
 *   since=2026-05-01T00:00:00Z (strictly newer than)
 *   cursor=<runId>
 *   limit=1..200
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  const workflowId = sp.get("workflowId") ?? undefined;
  const since = sp.get("since") ?? undefined;
  const cursor = sp.get("cursor") ?? undefined;
  const limitRaw = Number(sp.get("limit") ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(MAX_LIMIT, Math.max(1, Math.floor(limitRaw)))
    : DEFAULT_LIMIT;

  const statusParams = sp.getAll("status");
  const statuses: RunStatus[] = [];
  for (const s of statusParams) {
    if (VALID_STATUSES.includes(s as RunStatus)) {
      statuses.push(s as RunStatus);
    } else {
      return NextResponse.json(
        { error: `Invalid status: ${s}` },
        { status: 400 },
      );
    }
  }

  const where: Record<string, unknown> = { isPartial: false };
  if (workflowId) where.workflowId = workflowId;
  if (statuses.length > 0) where.status = { in: statuses };
  if (since) {
    const ts = new Date(since);
    if (isNaN(ts.getTime())) {
      return NextResponse.json(
        { error: "Invalid `since` — must be an ISO timestamp" },
        { status: 400 },
      );
    }
    where.createdAt = { gt: ts };
  }

  const runs = await prisma.workflowRun.findMany({
    where,
    select: {
      id: true,
      workflowId: true,
      status: true,
      startedAt: true,
      finishedAt: true,
      createdAt: true,
      error: true,
      workflow: { select: { name: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  const nextCursor = runs.length === limit ? runs[runs.length - 1]!.id : null;

  return NextResponse.json({ runs, nextCursor });
}

const bodySchema = z.object({
  workflowId: z.string().min(1),
  input: z.record(z.unknown()).default({}),
});

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { workflowId, input } = parsed.data;

  const exists = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: { id: true },
  });
  if (!exists) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  const result = await startRun(workflowId, input);
  return NextResponse.json(result, { status: 202 });
}
