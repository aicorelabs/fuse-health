import { NextResponse } from "next/server";

import { prisma } from "@fuse/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Returns the most recent SUCCEEDED run for a workflow so the editor can
 * inspect actual output shapes when authoring templates. 404 when no such
 * run exists. Powers the inspector "Sample" panels.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const run = await prisma.workflowRun.findFirst({
    where: { workflowId: id, status: "SUCCEEDED" },
    orderBy: { finishedAt: "desc" },
    select: {
      id: true,
      status: true,
      input: true,
      output: true,
      finishedAt: true,
    },
  });
  if (!run) {
    return NextResponse.json({ error: "No succeeded run yet" }, { status: 404 });
  }
  return NextResponse.json(run);
}
