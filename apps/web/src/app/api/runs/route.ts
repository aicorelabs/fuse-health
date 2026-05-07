import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@fuse/db";
import { startRun } from "@fuse/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
