import { prisma, type WorkflowRun } from "@fuse/db";

import { writeAudit } from "./audit.js";

// In-memory set of runs the operator has asked to cancel. Checked by the
// executor between batches; cleared in `runInBackground`'s finally block.
// Single-instance assumption: this matches every other piece of in-process
// engine state (slotter, etc.).
const cancelled = new Set<string>();

export function isCancelled(runId: string): boolean {
  return cancelled.has(runId);
}

export function clearCancellationFlag(runId: string): void {
  cancelled.delete(runId);
}

export interface CancelRunResult {
  /** "cancelled" if we marked the run; "already_terminal" if it had finished. */
  status: "cancelled" | "already_terminal";
  run: WorkflowRun;
}

/**
 * Mark a run as CANCELLED in the DB and signal the executor to stop. The
 * executor checks `isCancelled` between batches and throws a
 * `RunCancelledError` mid-flight; in-flight node Promises finish their
 * current work but no new batches start.
 *
 * No-op if the run is already in a terminal state.
 */
export async function cancelRun(runId: string): Promise<CancelRunResult> {
  const existing = await prisma.workflowRun.findUnique({
    where: { id: runId },
  });
  if (!existing) {
    throw new Error(`Run ${runId} not found`);
  }
  if (
    existing.status === "SUCCEEDED" ||
    existing.status === "FAILED" ||
    existing.status === "CANCELLED" ||
    existing.status === "SKIPPED"
  ) {
    return { status: "already_terminal", run: existing };
  }

  cancelled.add(runId);
  const run = await prisma.workflowRun.update({
    where: { id: runId },
    data: {
      status: "CANCELLED",
      finishedAt: new Date(),
    },
  });

  await writeAudit({
    actorType: "admin",
    action: "run.cancelled",
    resourceType: "run",
    resourceId: runId,
    metadata: { workflowId: run.workflowId },
  });

  return { status: "cancelled", run };
}
