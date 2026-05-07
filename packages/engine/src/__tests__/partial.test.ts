import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

vi.mock("groq-sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create: vi.fn() } },
  })),
}));

import { prisma } from "@fuse/db";

import { startPartialRun } from "../partial.js";

const TEST_WORKFLOW_ID = `wf_test_partial_${randomUUID()}`;

const graph = {
  nodes: [
    { id: "trigger", kind: "trigger.manual", name: "trigger", config: {} },
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
      id: "getRadiology",
      kind: "action",
      name: "Get radiology",
      config: {
        integration: "radiology",
        function: "getStudies",
        input: { patientId: "{{ trigger.input.patientId }}" },
      },
    },
  ],
  edges: [
    { id: "e_t_labs", source: "trigger", target: "getLabs" },
    { id: "e_t_rad", source: "trigger", target: "getRadiology" },
  ],
};

describe("startPartialRun", () => {
  beforeAll(async () => {
    await prisma.workflow.create({
      data: {
        id: TEST_WORKFLOW_ID,
        name: "TEST partial",
        graph: graph as never,
        maxConcurrent: 5,
      },
    });
  });

  afterAll(async () => {
    await prisma.workflow.deleteMany({ where: { id: TEST_WORKFLOW_ID } });
  });

  it("runs only ancestors of the target + the target itself", async () => {
    const result = await startPartialRun({
      workflowId: TEST_WORKFLOW_ID,
      input: { patientId: "p_001" },
      graphJson: graph,
      targetNodeId: "getLabs",
    });

    expect(result.status).toBe("SUCCEEDED");
    expect(result.output["getLabs"]).toBeDefined();
    // sibling not in subgraph — never ran
    expect(result.output["getRadiology"]).toBeUndefined();

    const labs = result.output["getLabs"] as { patientId: string };
    expect(labs.patientId).toBe("p_001");
  });

  it("persists the run row with isPartial=true", async () => {
    const result = await startPartialRun({
      workflowId: TEST_WORKFLOW_ID,
      input: { patientId: "p_002" },
      graphJson: graph,
      targetNodeId: "getLabs",
    });

    const row = await prisma.workflowRun.findUnique({
      where: { id: result.runId },
    });
    expect(row?.isPartial).toBe(true);
    expect(row?.status).toBe("SUCCEEDED");
    expect(row?.workflowId).toBe(TEST_WORKFLOW_ID);
  });

  it("returns FAILED with the error message when target node throws", async () => {
    const stopGraph = {
      nodes: [
        { id: "trigger", kind: "trigger.manual", name: "trigger", config: {} },
        {
          id: "halt",
          kind: "stop",
          name: "halt",
          config: { reason: "preview-stop" },
        },
      ],
      edges: [{ id: "e1", source: "trigger", target: "halt" }],
    };
    const result = await startPartialRun({
      workflowId: TEST_WORKFLOW_ID,
      input: {},
      graphJson: stopGraph,
      targetNodeId: "halt",
    });
    expect(result.status).toBe("FAILED");
    expect(result.error).toMatch(/preview-stop/);
  });

  it("throws when targetNodeId is not in the graph", async () => {
    await expect(
      startPartialRun({
        workflowId: TEST_WORKFLOW_ID,
        input: {},
        graphJson: graph,
        targetNodeId: "does_not_exist",
      }),
    ).rejects.toThrow();
  });
});
