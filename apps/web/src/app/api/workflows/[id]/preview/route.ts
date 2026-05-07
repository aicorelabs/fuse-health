import { NextResponse } from "next/server";
import { z } from "zod";

import { WorkflowGraph } from "@fuse/core";
import { prisma } from "@fuse/db";
import { startPartialRun } from "@fuse/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  input: z.record(z.unknown()).default({}),
  graph: z.unknown(),
  targetNodeId: z.string().min(1),
});

/**
 * Run the prefix of a (possibly unsaved) graph up to and including
 * `targetNodeId`. Powers the editor's "Run up to here" preview button.
 *
 * The graph is taken from the body so the editor's in-flight (unsaved)
 * edits work without saving first. Persists a WorkflowRun row marked
 * isPartial=true so the inspector's sample data picks it up via
 * /api/workflows/[id]/last-run-output.
 */
export async function POST(
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

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // Validate the supplied graph through the engine schema before running.
  let graph: WorkflowGraph;
  try {
    graph = WorkflowGraph.fromJSON(parsed.data.graph);
  } catch (err) {
    return NextResponse.json(
      {
        error: "Invalid graph",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 400 },
    );
  }

  // Confirm the workflow exists (we'll attach the partial run to it).
  const exists = await prisma.workflow.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  // Confirm targetNodeId is in the supplied graph.
  if (!graph.nodeById(parsed.data.targetNodeId)) {
    return NextResponse.json(
      {
        error: `Target node "${parsed.data.targetNodeId}" is not in the supplied graph`,
      },
      { status: 422 },
    );
  }

  const result = await startPartialRun({
    workflowId: id,
    input: parsed.data.input,
    graphJson: parsed.data.graph,
    targetNodeId: parsed.data.targetNodeId,
  });

  return NextResponse.json(result, { status: 200 });
}
