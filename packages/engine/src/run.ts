import { registerBuiltInIntegrations } from "@fuse/connectors";
import { WorkflowGraph } from "@fuse/core";
import { prisma, type RunStatus } from "@fuse/db";

import { writeAudit } from "./audit.js";
import { clearCancellationFlag, isCancelled } from "./cancel.js";
import { RunCancelledError } from "./errors.js";
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
      graphSnapshot: workflow.graph as never,
    },
  });

  await writeAudit({
    actorType: "engine",
    action: "run.started",
    resourceType: "run",
    resourceId: run.id,
    metadata: { workflowId: workflow.id, workflowName: workflow.name },
  });

  void runInBackground(run.id, workflow.id, workflow.maxConcurrent);

  return { runId: run.id, status: "PENDING" };
}

async function runInBackground(
  runId: string,
  workflowId: string,
  maxConcurrent: number,
): Promise<void> {
  await acquireSlot(workflowId, maxConcurrent);
  try {
    const run = await prisma.workflowRun.update({
      where: { id: runId },
      data: { status: "RUNNING", startedAt: new Date() },
      include: { workflow: { select: { graph: true } } },
    });

    const startedMs = run.startedAt?.getTime() ?? Date.now();
    try {
      // Prefer the run's graphSnapshot (taken at start) over the live workflow.graph,
      // so in-flight runs are unaffected by edits to the workflow.
      const graphJson = run.graphSnapshot ?? run.workflow.graph;
      const graph = WorkflowGraph.fromJSON(graphJson);
      const { output } = await executeRun({ run, graph });

      // If cancelRun marked the run after the executor finished but before
      // we get here, respect that — don't overwrite CANCELLED with SUCCEEDED.
      if (isCancelled(runId)) {
        return;
      }

      const finishedAt = new Date();
      await prisma.workflowRun.update({
        where: { id: runId },
        data: {
          status: "SUCCEEDED",
          output: output as never,
          finishedAt,
        },
      });
      await writeAudit({
        actorType: "engine",
        action: "run.succeeded",
        resourceType: "run",
        resourceId: runId,
        metadata: {
          workflowId,
          durationMs: finishedAt.getTime() - startedMs,
        },
      });
    } catch (err) {
      // Cancellation is signalled by RunCancelledError; cancelRun() already
      // wrote the CANCELLED row and the audit entry. Don't overwrite.
      if (err instanceof RunCancelledError) {
        // No-op: status was already set to CANCELLED.
      } else {
        const message = err instanceof Error ? err.message : String(err);
        const finishedAt = new Date();
        await prisma.workflowRun.update({
          where: { id: runId },
          data: {
            status: "FAILED",
            error: message,
            finishedAt,
          },
        });
        await writeAudit({
          actorType: "engine",
          action: "run.failed",
          resourceType: "run",
          resourceId: runId,
          metadata: {
            workflowId,
            durationMs: finishedAt.getTime() - startedMs,
            error: message,
          },
        });
      }
    }
  } finally {
    clearCancellationFlag(runId);
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
