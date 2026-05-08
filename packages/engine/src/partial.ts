import { registerBuiltInIntegrations } from "@fuse/connectors";
import { WorkflowGraph } from "@fuse/core";
import { prisma, type RunStatus } from "@fuse/db";

import { executeRun } from "./executor.js";
import { subgraphTo } from "./subgraph.js";

// Idempotent — same call as run.ts, so importing either module bootstraps
// the integration registry.
registerBuiltInIntegrations();

export interface StartPartialRunArgs {
  workflowId: string;
  input: Record<string, unknown>;
  graphJson: unknown;
  targetNodeId: string;
}

export interface PartialRunResult {
  runId: string;
  status: RunStatus;
  output: Record<string, unknown>;
  error: string | null;
}

/**
 * Run a workflow's prefix synchronously — used by the editor's "Run up to
 * here" preview. The graph is passed by value so unsaved edits work.
 *
 * Persists a `WorkflowRun` row with `isPartial = true` (filtered out of
 * regular run-history views, but eligible as sample data for the editor's
 * inspector).
 *
 * No concurrency slot is acquired — previews don't queue against
 * `Workflow.maxConcurrent`.
 */
export async function startPartialRun(
  args: StartPartialRunArgs,
): Promise<PartialRunResult> {
  const fullGraph = WorkflowGraph.fromJSON(args.graphJson);
  const sub = subgraphTo(fullGraph, args.targetNodeId);
  if (!sub) {
    throw new Error(
      `Target node "${args.targetNodeId}" is not in the supplied graph`,
    );
  }

  const run = await prisma.workflowRun.create({
    data: {
      workflowId: args.workflowId,
      status: "RUNNING",
      input: args.input as never,
      graphSnapshot: sub.toJSON() as never,
      isPartial: true,
      startedAt: new Date(),
    },
  });

  try {
    const { output } = await executeRun({ run, graph: sub });
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCEEDED",
        output: output as never,
        finishedAt: new Date(),
      },
    });
    return {
      runId: run.id,
      status: "SUCCEEDED",
      output,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        error: message,
        finishedAt: new Date(),
      },
    });
    return {
      runId: run.id,
      status: "FAILED",
      output: {},
      error: message,
    };
  }
}
