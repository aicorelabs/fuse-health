import { NextResponse } from "next/server";
import { z } from "zod";

import { WorkflowGraph } from "@fuse/core";
import { prisma } from "@fuse/db";
import { writeAudit } from "@fuse/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const workflows = await prisma.workflow.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      maxConcurrent: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(workflows);
}

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  graph: z.unknown(),
  maxConcurrent: z.number().int().min(1).max(50).default(5),
});

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    WorkflowGraph.fromJSON(parsed.data.graph);
  } catch (err) {
    return NextResponse.json(
      {
        error: "Invalid graph",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 400 },
    );
  }

  const workflow = await prisma.workflow.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      graph: parsed.data.graph as never,
      maxConcurrent: parsed.data.maxConcurrent,
    },
  });

  await writeAudit({
    action: "workflow.created",
    resourceType: "workflow",
    resourceId: workflow.id,
    metadata: { name: workflow.name },
  });

  return NextResponse.json(workflow, { status: 201 });
}
