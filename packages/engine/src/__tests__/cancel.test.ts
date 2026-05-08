import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import { prisma } from "@fuse/db";

import {
  cancelRun,
  clearCancellationFlag,
  isCancelled,
} from "../cancel.js";
import { getRun, startRun } from "../run.js";

const TEST_WORKFLOW_ID = `wf_test_cancel_${randomUUID()}`;

const slowGraph = {
  nodes: [
    { id: "trigger", kind: "trigger.manual", name: "trigger", config: {} },
    { id: "wait1", kind: "wait", name: "wait1", config: { seconds: 1 } },
    { id: "wait2", kind: "wait", name: "wait2", config: { seconds: 1 } },
  ],
  edges: [
    { id: "e1", source: "trigger", target: "wait1" },
    { id: "e2", source: "wait1", target: "wait2" },
  ],
};

describe("cancelRun", () => {
  beforeAll(async () => {
    await prisma.workflow.create({
      data: {
        id: TEST_WORKFLOW_ID,
        name: "TEST cancel",
        graph: slowGraph as never,
        maxConcurrent: 5,
      },
    });
  });

  afterAll(async () => {
    await prisma.workflow.deleteMany({ where: { id: TEST_WORKFLOW_ID } });
  });

  it("throws when the run does not exist", async () => {
    await expect(cancelRun("run_does_not_exist_xyz")).rejects.toThrow();
  });

  it("returns already_terminal for SUCCEEDED runs without changing the row", async () => {
    const row = await prisma.workflowRun.create({
      data: {
        workflowId: TEST_WORKFLOW_ID,
        status: "SUCCEEDED",
        input: {} as never,
        finishedAt: new Date(),
      },
    });
    const result = await cancelRun(row.id);
    expect(result.status).toBe("already_terminal");

    const after = await prisma.workflowRun.findUnique({ where: { id: row.id } });
    expect(after?.status).toBe("SUCCEEDED");

    await prisma.workflowRun.deleteMany({ where: { id: row.id } });
  });

  it("marks a PENDING run as CANCELLED and writes an audit entry", async () => {
    const row = await prisma.workflowRun.create({
      data: {
        workflowId: TEST_WORKFLOW_ID,
        status: "PENDING",
        input: {} as never,
      },
    });

    const result = await cancelRun(row.id);
    expect(result.status).toBe("cancelled");
    expect(result.run.status).toBe("CANCELLED");
    expect(result.run.finishedAt).not.toBeNull();
    expect(isCancelled(row.id)).toBe(true);

    const audit = await prisma.auditEntry.findFirst({
      where: { resourceId: row.id, action: "run.cancelled" },
    });
    expect(audit).not.toBeNull();

    clearCancellationFlag(row.id);
    await prisma.auditEntry.deleteMany({ where: { resourceId: row.id } });
    await prisma.workflowRun.deleteMany({ where: { id: row.id } });
  });

  it("stops a running workflow mid-flight and persists status CANCELLED", async () => {
    const { runId } = await startRun(TEST_WORKFLOW_ID, {});
    // Let the run start its first wait node before we cancel.
    await new Promise((r) => setTimeout(r, 100));

    const result = await cancelRun(runId);
    expect(result.status).toBe("cancelled");

    // Wait for runInBackground to settle (in-flight wait1 finishes its 1s
    // setTimeout, then the executor sees isCancelled and throws). 2.5s is
    // generous; the wait nodes total 2s.
    await new Promise((r) => setTimeout(r, 2500));

    const final = await getRun(runId);
    expect(final?.status).toBe("CANCELLED");
    expect(final?.finishedAt).not.toBeNull();

    const audit = await prisma.auditEntry.findFirst({
      where: { resourceId: runId, action: "run.cancelled" },
    });
    expect(audit).not.toBeNull();

    await prisma.auditEntry.deleteMany({ where: { resourceId: runId } });
    await prisma.workflowRun.deleteMany({ where: { id: runId } });
  });
});
