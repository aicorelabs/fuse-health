import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import { prisma } from "@fuse/db";
import { getRun, startRun } from "../run.js";

const TEST_WORKFLOW_ID = `wf_test_filter_${randomUUID()}`;

const graph = {
  nodes: [
    { id: "trigger", kind: "trigger.manual", name: "trigger", config: {} },
    {
      id: "gate",
      kind: "filter",
      name: "Proceed?",
      config: {
        condition: {
          left: "{{ trigger.input.proceed }}",
          op: "truthy",
        },
      },
    },
    {
      id: "getLabs",
      kind: "action",
      name: "Get labs",
      config: {
        integration: "labs",
        function: "getResults",
        input: { patientId: "{{ trigger.input.patientId }}" },
      },
    },
    {
      id: "after",
      kind: "set",
      name: "after",
      config: {
        fields: { tag: "downstream-of-labs", labs: "{{ getLabs.results }}" },
      },
    },
  ],
  edges: [
    { id: "e1", source: "trigger", target: "gate" },
    { id: "e2", source: "gate", target: "getLabs" },
    { id: "e3", source: "getLabs", target: "after" },
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

describe("filter node", () => {
  beforeAll(async () => {
    await prisma.workflow.create({
      data: {
        id: TEST_WORKFLOW_ID,
        name: "TEST: filter gate",
        graph: graph as never,
        maxConcurrent: 5,
      },
    });
  });

  afterAll(async () => {
    await prisma.workflow.deleteMany({ where: { id: TEST_WORKFLOW_ID } });
  });

  it("passes downstream when condition is truthy", async () => {
    const { runId } = await startRun(TEST_WORKFLOW_ID, {
      patientId: "p_001",
      proceed: true,
    });
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
    expect(run.status).toBe("SUCCEEDED");

    const output = run.output as Record<string, unknown>;
    expect(output["gate"]).toBeDefined();
    expect(output["getLabs"]).toBeDefined();
    expect(output["after"]).toBeDefined();
    expect((output["after"] as { tag: string }).tag).toBe("downstream-of-labs");

    const byNodeId = Object.fromEntries(run.steps.map((s) => [s.nodeId, s]));
    expect(byNodeId["gate"]?.status).toBe("SUCCEEDED");
    expect(byNodeId["getLabs"]?.status).toBe("SUCCEEDED");
    expect(byNodeId["after"]?.status).toBe("SUCCEEDED");
  });

  it("skips downstream when condition is falsy", async () => {
    const { runId } = await startRun(TEST_WORKFLOW_ID, {
      patientId: "p_001",
      proceed: false,
    });
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
    expect(run.status).toBe("SUCCEEDED");

    const output = run.output as Record<string, unknown>;
    expect(output["gate"]).toBeDefined();
    // downstream should NOT have run
    expect(output["getLabs"]).toBeUndefined();
    expect(output["after"]).toBeUndefined();

    const byNodeId = Object.fromEntries(run.steps.map((s) => [s.nodeId, s]));
    expect(byNodeId["gate"]?.status).toBe("SUCCEEDED");
    expect(byNodeId["getLabs"]?.status).toBe("SKIPPED");
    expect(byNodeId["after"]?.status).toBe("SKIPPED");
  });
});
