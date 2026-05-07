import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

vi.mock("groq-sdk", () => {
  const create = vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content:
            "MOCK_SUMMARY: Hemoglobin low, glucose elevated; chest CT reviewed; recent encounter notes summarized.",
        },
      },
    ],
    model: "llama-3.3-70b-versatile",
    usage: { prompt_tokens: 10, completion_tokens: 25, total_tokens: 35 },
  });
  const Groq = vi.fn().mockImplementation(() => ({
    chat: { completions: { create } },
  }));
  return { default: Groq };
});

import { patientSummaryGraph, prisma } from "@fuse/db";
import { getRun, startRun } from "../run.js";

const TEST_WORKFLOW_ID = `wf_test_${randomUUID()}`;

async function pollUntilTerminal(runId: string, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const run = await getRun(runId);
    if (!run) throw new Error(`Run ${runId} vanished mid-poll`);
    if (
      run.status === "SUCCEEDED" ||
      run.status === "FAILED" ||
      run.status === "CANCELLED"
    ) {
      return run;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Run ${runId} did not reach terminal status within ${timeoutMs}ms`);
}

describe("engine end-to-end: patient-summary workflow", () => {
  beforeAll(async () => {
    await prisma.workflow.create({
      data: {
        id: TEST_WORKFLOW_ID,
        name: "TEST: patient summary",
        description: "Integration test fixture",
        graph: patientSummaryGraph as never,
        maxConcurrent: 5,
      },
    });
  });

  afterAll(async () => {
    await prisma.workflow.deleteMany({ where: { id: TEST_WORKFLOW_ID } });
  });

  it("starts a run, fans out three actions in parallel, joins into the LLM, and persists outputs", async () => {
    const { runId, status } = await startRun(TEST_WORKFLOW_ID, {
      patientId: "p_001",
    });
    expect(status).toBe("PENDING");
    expect(runId).toBeTruthy();

    const finalRun = await pollUntilTerminal(runId);

    if (finalRun.status === "FAILED") {
      throw new Error(
        `Run failed: ${finalRun.error}\nSteps: ${JSON.stringify(finalRun.steps, null, 2)}`,
      );
    }

    expect(finalRun.status).toBe("SUCCEEDED");
    expect(finalRun.error).toBeNull();
    expect(finalRun.startedAt).not.toBeNull();
    expect(finalRun.finishedAt).not.toBeNull();

    const output = finalRun.output as Record<string, unknown>;
    expect(output).toBeTruthy();

    const summarize = output["summarize"] as { text: string; model: string };
    expect(summarize).toBeTruthy();
    expect(summarize.text).toMatch(/mock_summary/i);
    expect(summarize.model).toBe("llama-3.3-70b-versatile");

    const labs = output["getLabs"] as { patientId: string; results: unknown[] };
    expect(labs.patientId).toBe("p_001");
    expect(Array.isArray(labs.results)).toBe(true);

    expect(finalRun.steps).toHaveLength(5);
    const byNodeId = Object.fromEntries(
      finalRun.steps.map((s) => [s.nodeId, s]),
    );
    for (const id of ["trigger", "getLabs", "getRadiology", "getNotes", "summarize"]) {
      expect(byNodeId[id]?.status, `step ${id}`).toBe("SUCCEEDED");
    }
  });
});
