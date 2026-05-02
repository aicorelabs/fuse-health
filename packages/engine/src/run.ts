import { registerBuiltInIntegrations } from "@fuse/connectors";
import { WorkflowGraph } from "@fuse/core";
import { prisma, type RunStatus } from "@fuse/db";

import { executeRun } from "./executor.js";
import { acquireSlot, releaseSlot } from "./scheduler.js";

registerBuiltInIntegrations();

export interface StartRunResult {
  runId: string;
  status: RunStatus;
}

export async function startRun(
  workflowId: string,
  input: Record<string, unknown>,
): Promise<StartRunResult> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
  });
  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`);
  }

  const run = await prisma.workflowRun.create({
    data: {
      workflowId: workflow.id,
      status: "PENDING",
      input: input as never,
    },
  });

  void runInBackground(run.id, workflow.id, workflow.maxConcurrent, workflow.graph);

  return { runId: run.id, status: "PENDING" };
}

async function runInBackground(
  runId: string,
  workflowId: string,
  maxConcurrent: number,
  graphJson: unknown,
): Promise<void> {
  await acquireSlot(workflowId, maxConcurrent);
  try {
    const run = await prisma.workflowRun.update({
      where: { id: runId },
      data: { status: "RUNNING", startedAt: new Date() },
    });

    try {
      const graph = WorkflowGraph.fromJSON(graphJson);
      const { output } = await executeRun({ run, graph });

      await prisma.workflowRun.update({
        where: { id: runId },
        data: {
          status: "SUCCEEDED",
          output: output as never,
          finishedAt: new Date(),
        },
      });
    } catch (err) {
      await prisma.workflowRun.update({
        where: { id: runId },
        data: {
          status: "FAILED",
          error: err instanceof Error ? err.message : String(err),
          finishedAt: new Date(),
        },
      });
    }
  } finally {
    releaseSlot(workflowId);
  }
}

export async function getRun(runId: string) {
  return prisma.workflowRun.findUnique({
    where: { id: runId },
    include: {
      steps: {
        orderBy: { startedAt: "asc" },
      },
    },
  });
}
