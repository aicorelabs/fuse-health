import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import { prisma } from "@fuse/db";
import { getRun, startRun } from "../run.js";

const TEST_WORKFLOW_ID = `wf_test_branch_${randomUUID()}`;

const graph = {
  nodes: [
    { id: "trigger", kind: "trigger.manual", name: "trigger", config: {} },
    {
      id: "router",
      kind: "branch",
      name: "Score router",
      config: {
        cases: [
          {
            when: { left: "{{ trigger.input.score }}", op: ">=", right: 80 },
            edge: "high",
          },
          {
            when: { left: "{{ trigger.input.score }}", op: "<", right: 50 },
            edge: "low",
          },
        ],
        default: "mid",
      },
    },
    {
      id: "highPath",
      kind: "set",
      name: "high path",
      config: { fields: { tag: "high" } },
    },
    {
      id: "lowPath",
      kind: "set",
      name: "low path",
      config: { fields: { tag: "low" } },
    },
    {
      id: "midPath",
      kind: "set",
      name: "mid path",
      config: { fields: { tag: "mid" } },
    },
  ],
  edges: [
    { id: "e_in", source: "trigger", target: "router" },
    { id: "e_high", source: "router", target: "highPath", condition: "high" },
    { id: "e_low", source: "router", target: "lowPath", condition: "low" },
    { id: "e_mid", source: "router", target: "midPath", condition: "mid" },
  ],
};

async function pollUntilTerminal(runId: string, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const run = await getRun(runId);
    if (!run) throw new Error(`run ${runId} vanished`);
    if (
      run.status === "SUCCEEDED" ||
      run.status === "FAILED" ||
      run.status === "CANCELLED"
    ) {
      return run;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`run ${runId} did not finish within ${timeoutMs}ms`);
}

async function runWith(score: number) {
  const { runId } = await startRun(TEST_WORKFLOW_ID, { score });
  const run = await pollUntilTerminal(runId);
  if (run.status === "FAILED") {
    throw new Error(
      `expected SUCCEEDED, got FAILED: ${run.error}\nsteps: ${JSON.stringify(
        run.steps,
        null,
        2,
      )}`,
    );
  }
  return run;
}

describe("branch node", () => {
  beforeAll(async () => {
    await prisma.workflow.create({
      data: {
        id: TEST_WORKFLOW_ID,
        name: "TEST: branch router",
        graph: graph as never,
        maxConcurrent: 5,
      },
    });
  });

  afterAll(async () => {
    await prisma.workflow.deleteMany({ where: { id: TEST_WORKFLOW_ID } });
  });

  it("matches the first case (high) and skips others", async () => {
    const run = await runWith(90);
    expect(run.status).toBe("SUCCEEDED");
    const byNodeId = Object.fromEntries(run.steps.map((s) => [s.nodeId, s]));
    expect(byNodeId["highPath"]?.status).toBe("SUCCEEDED");
    expect(byNodeId["lowPath"]?.status).toBe("SKIPPED");
    expect(byNodeId["midPath"]?.status).toBe("SKIPPED");
  });

  it("matches the second case (low) and skips others", async () => {
    const run = await runWith(30);
    expect(run.status).toBe("SUCCEEDED");
    const byNodeId = Object.fromEntries(run.steps.map((s) => [s.nodeId, s]));
    expect(byNodeId["highPath"]?.status).toBe("SKIPPED");
    expect(byNodeId["lowPath"]?.status).toBe("SUCCEEDED");
    expect(byNodeId["midPath"]?.status).toBe("SKIPPED");
  });

  it("falls through to default (mid) when no case matches", async () => {
    const run = await runWith(60);
    expect(run.status).toBe("SUCCEEDED");
    const byNodeId = Object.fromEntries(run.steps.map((s) => [s.nodeId, s]));
    expect(byNodeId["highPath"]?.status).toBe("SKIPPED");
    expect(byNodeId["lowPath"]?.status).toBe("SKIPPED");
    expect(byNodeId["midPath"]?.status).toBe("SUCCEEDED");
  });
});
