import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import { prisma } from "@fuse/db";
import { getRun, startRun } from "../run.js";

const TEST_WORKFLOW_ID = `wf_test_loop_${randomUUID()}`;

const graph = {
  nodes: [
    { id: "trigger", kind: "trigger.manual", name: "trigger", config: {} },
    {
      id: "perPatient",
      kind: "loop",
      name: "Per patient",
      config: {
        over: "{{ trigger.input.patients }}",
        itemVar: "patient",
      },
    },
    {
      id: "fetchLabs",
      kind: "action",
      name: "Fetch labs",
      config: {
        integration: "labs",
        function: "getResults",
        input: { patientId: "{{ patient.patientId }}" },
      },
    },
    {
      id: "after",
      kind: "set",
      name: "after",
      config: {
        fields: { totalRuns: "{{ fetchLabs }}" },
      },
    },
  ],
  edges: [
    { id: "e_trigger_loop", source: "trigger", target: "perPatient" },
    { id: "e_loop_body", source: "perPatient", target: "fetchLabs" },
    { id: "e_body_after", source: "fetchLabs", target: "after" },
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

describe("loop node (single-node body)", () => {
  beforeAll(async () => {
    await prisma.workflow.create({
      data: {
        id: TEST_WORKFLOW_ID,
        name: "TEST: per-patient loop",
        graph: graph as never,
        maxConcurrent: 5,
      },
    });
  });

  afterAll(async () => {
    await prisma.workflow.deleteMany({ where: { id: TEST_WORKFLOW_ID } });
  });

  it("runs the body node once per item, with itemVar bound, and aggregates outputs", async () => {
    const { runId } = await startRun(TEST_WORKFLOW_ID, {
      patients: [
        { patientId: "p_001" },
        { patientId: "p_002" },
        { patientId: "p_003" },
      ],
    });
    const run = await pollUntilTerminal(runId);

    if (run.status === "FAILED") {
      throw new Error(
        `run failed: ${run.error}\nsteps: ${JSON.stringify(run.steps, null, 2)}`,
      );
    }
    expect(run.status).toBe("SUCCEEDED");

    const output = run.output as Record<string, unknown>;
    const bodyOut = output["fetchLabs"] as Array<{ patientId: string }>;
    expect(Array.isArray(bodyOut)).toBe(true);
    expect(bodyOut).toHaveLength(3);
    expect(bodyOut[0]?.patientId).toBe("p_001");
    expect(bodyOut[1]?.patientId).toBe("p_002");
    expect(bodyOut[2]?.patientId).toBe("p_003");

    // loop output mirrors the body output
    expect(output["perPatient"]).toEqual(bodyOut);

    // node downstream of body fires once with ctx[bodyId] = the array
    const after = output["after"] as { totalRuns: unknown };
    expect(Array.isArray(after.totalRuns)).toBe(true);
    expect((after.totalRuns as unknown[]).length).toBe(3);

    const byNodeId = Object.fromEntries(run.steps.map((s) => [s.nodeId, s]));
    expect(byNodeId["perPatient"]?.status).toBe("SUCCEEDED");
    expect(byNodeId["fetchLabs"]?.status).toBe("SUCCEEDED");
    expect(byNodeId["after"]?.status).toBe("SUCCEEDED");
  });

  it("handles an empty array (body never runs, output is [])", async () => {
    const { runId } = await startRun(TEST_WORKFLOW_ID, { patients: [] });
    const run = await pollUntilTerminal(runId);

    if (run.status === "FAILED") {
      throw new Error(
        `run failed: ${run.error}\nsteps: ${JSON.stringify(run.steps, null, 2)}`,
      );
    }
    expect(run.status).toBe("SUCCEEDED");

    const output = run.output as Record<string, unknown>;
    expect(output["perPatient"]).toEqual([]);
    expect(output["fetchLabs"]).toEqual([]);
  });
});
