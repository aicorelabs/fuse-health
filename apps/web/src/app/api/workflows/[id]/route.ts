import { NextResponse } from "next/server";
import { z } from "zod";

import { WorkflowGraph } from "@fuse/core";
import { prisma } from "@fuse/db";
import { writeAudit } from "@fuse/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const workflow = await prisma.workflow.findUnique({ where: { id } });
  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }
  return NextResponse.json(workflow);
}

const patchSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    graph: z.unknown().optional(),
    maxConcurrent: z.number().int().min(1).max(50).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined ||
      data.graph !== undefined ||
      data.maxConcurrent !== undefined,
    { message: "At least one field is required" },
  );

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  if (parsed.data.graph !== undefined) {
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
  }

  const existing = await prisma.workflow.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.description !== undefined)
    data.description = parsed.data.description;
  if (parsed.data.graph !== undefined) data.graph = parsed.data.graph;
  if (parsed.data.maxConcurrent !== undefined)
    data.maxConcurrent = parsed.data.maxConcurrent;

  const workflow = await prisma.workflow.update({
    where: { id },
    data,
  });
  await writeAudit({
    action: "workflow.updated",
    resourceType: "workflow",
    resourceId: workflow.id,
    metadata: { fields: Object.keys(data) },
  });
  return NextResponse.json(workflow);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const existing = await prisma.workflow.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  const activeRun = await prisma.workflowRun.findFirst({
    where: { workflowId: id, status: { in: ["PENDING", "RUNNING"] } },
    select: { id: true },
  });
  if (activeRun) {
    return NextResponse.json(
      { error: "Cannot delete workflow with in-flight runs" },
      { status: 409 },
    );
  }

  await prisma.workflow.delete({ where: { id } });
  await writeAudit({
    action: "workflow.deleted",
    resourceType: "workflow",
    resourceId: id,
  });
  return new NextResponse(null, { status: 204 });
}
