import { NextResponse } from "next/server";

import { prisma } from "@fuse/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * Paginated audit log read. All filters are optional and combinable.
 *
 * Query params:
 *   resourceType=workflow|run|integration|function
 *   resourceId=<id>            (optional, requires resourceType)
 *   action=run.started         (single exact match)
 *   since=2026-05-01T00:00:00Z (ISO; only entries strictly newer)
 *   cursor=<entryId>           (last entry seen; returns older than that)
 *   limit=1..200               (default 50)
 *
 * Returns { entries: AuditEntry[], nextCursor: string | null }.
 * `nextCursor` is the id of the last entry returned when there's likely
 * another page; null when fewer than `limit` entries came back.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  const resourceType = sp.get("resourceType") ?? undefined;
  const resourceId = sp.get("resourceId") ?? undefined;
  const action = sp.get("action") ?? undefined;
  const since = sp.get("since") ?? undefined;
  const cursor = sp.get("cursor") ?? undefined;
  const limitRaw = Number(sp.get("limit") ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(MAX_LIMIT, Math.max(1, Math.floor(limitRaw)))
    : DEFAULT_LIMIT;

  const where: Record<string, unknown> = {};
  if (resourceType) where.resourceType = resourceType;
  if (resourceId) where.resourceId = resourceId;
  if (action) where.action = action;
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

  // Cursor walks backward through createdAt-desc order. We use Prisma's
  // cursor with `skip: 1` so the cursor row itself isn't returned twice.
  const entries = await prisma.auditEntry.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  const nextCursor =
    entries.length === limit ? entries[entries.length - 1]!.id : null;

  return NextResponse.json({ entries, nextCursor });
}
