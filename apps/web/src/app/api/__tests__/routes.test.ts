import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

vi.mock("groq-sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create: vi.fn() } },
  })),
}));

import { prisma } from "@fuse/db";

import { GET as listWorkflows, POST as createWorkflow } from "../workflows/route.js";
import {
  DELETE as deleteWorkflowById,
  GET as getWorkflowById,
  PATCH as patchWorkflowById,
} from "../workflows/[id]/route.js";
import { GET as getRunById } from "../runs/[id]/route.js";
import { POST as postRun } from "../runs/route.js";
import { GET as getLastRunOutput } from "../workflows/[id]/last-run-output/route.js";
import { POST as previewRun } from "../workflows/[id]/preview/route.js";
import { GET as listIntegrationsRoute } from "../integrations/route.js";

const TEST_WORKFLOW_ID = `wf_test_routes_${randomUUID()}`;
let testRunId = "";

beforeAll(async () => {
  await prisma.workflow.create({
    data: {
      id: TEST_WORKFLOW_ID,
      name: "TEST routes workflow",
      description: "fixture for route handler tests",
      graph: { nodes: [], edges: [] } as never,
      maxConcurrent: 3,
    },
  });

  const run = await prisma.workflowRun.create({
    data: {
      workflowId: TEST_WORKFLOW_ID,
      status: "SUCCEEDED",
      input: { patientId: "p_abc" } as never,
      output: { hello: "world" } as never,
      startedAt: new Date(),
      finishedAt: new Date(),
    },
  });
  testRunId = run.id;
});

afterAll(async () => {
  await prisma.workflow.deleteMany({ where: { id: TEST_WORKFLOW_ID } });
});

describe("GET /api/workflows", () => {
  it("returns a list that includes the test workflow", async () => {
    const res = await listWorkflows();
    expect(res.status).toBe(200);
    const body = (await res.json()) as Array<{ id: string }>;
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((w) => w.id === TEST_WORKFLOW_ID)).toBe(true);
  });
});

describe("GET /api/workflows/[id]", () => {
  it("returns 200 + the workflow on hit", async () => {
    const res = await getWorkflowById(new Request("http://localhost"), {
      params: Promise.resolve({ id: TEST_WORKFLOW_ID }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; name: string };
    expect(body.id).toBe(TEST_WORKFLOW_ID);
    expect(body.name).toBe("TEST routes workflow");
  });

  it("returns 404 on unknown id", async () => {
    const res = await getWorkflowById(new Request("http://localhost"), {
      params: Promise.resolve({ id: "wf_does_not_exist_xyz" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("GET /api/runs/[id]", () => {
  it("returns 200 + the run with steps on hit", async () => {
    const res = await getRunById(new Request("http://localhost"), {
      params: Promise.resolve({ id: testRunId }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      id: string;
      workflowId: string;
      steps: unknown[];
    };
    expect(body.id).toBe(testRunId);
    expect(body.workflowId).toBe(TEST_WORKFLOW_ID);
    expect(Array.isArray(body.steps)).toBe(true);
  });

  it("returns 404 on unknown id", async () => {
    const res = await getRunById(new Request("http://localhost"), {
      params: Promise.resolve({ id: "run_does_not_exist_xyz" }),
    });
    expect(res.status).toBe(404);
  });
});

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/runs", () => {
  it("returns 202 + {runId, status} on valid body", async () => {
    const res = await postRun(
      jsonRequest({ workflowId: TEST_WORKFLOW_ID, input: { patientId: "p_xyz" } }),
    );
    expect(res.status).toBe(202);
    const body = (await res.json()) as { runId: string; status: string };
    expect(body.runId).toBeTruthy();
    expect(body.status).toBe("PENDING");

    // verify the run row exists
    const row = await prisma.workflowRun.findUnique({ where: { id: body.runId } });
    expect(row?.workflowId).toBe(TEST_WORKFLOW_ID);
  });

  it("returns 400 when body is missing workflowId", async () => {
    const res = await postRun(jsonRequest({ input: { patientId: "p_xyz" } }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when body is not JSON", async () => {
    const res = await postRun(
      new Request("http://localhost/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when workflowId does not exist", async () => {
    const res = await postRun(
      jsonRequest({ workflowId: "wf_does_not_exist", input: {} }),
    );
    expect(res.status).toBe(404);
  });
});

function postWorkflowRequest(body: unknown) {
  return new Request("http://localhost/api/workflows", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function patchWorkflowRequest(body: unknown) {
  return new Request("http://localhost/api/workflows/x", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const MIN_GRAPH = {
  nodes: [{ id: "trigger", kind: "trigger.manual", name: "trigger", config: {} }],
  edges: [],
};

describe("POST /api/workflows", () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    if (createdIds.length > 0) {
      await prisma.workflow.deleteMany({ where: { id: { in: createdIds } } });
    }
  });

  it("returns 201 + the new workflow on valid body", async () => {
    const res = await createWorkflow(
      postWorkflowRequest({
        name: "Created in test",
        description: "test fixture",
        graph: MIN_GRAPH,
        maxConcurrent: 7,
      }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; name: string; maxConcurrent: number };
    expect(body.id).toBeTruthy();
    expect(body.name).toBe("Created in test");
    expect(body.maxConcurrent).toBe(7);
    createdIds.push(body.id);
  });

  it("400 on body missing name", async () => {
    const res = await createWorkflow(
      postWorkflowRequest({ graph: MIN_GRAPH }),
    );
    expect(res.status).toBe(400);
  });

  it("400 on graph that fails WorkflowGraph.fromJSON parse", async () => {
    const res = await createWorkflow(
      postWorkflowRequest({
        name: "bad graph",
        graph: {
          nodes: [{ id: "x", kind: "not_a_real_kind", name: "x", config: {} }],
          edges: [],
        },
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/workflows/[id]", () => {
  const updateId = `wf_test_patch_${randomUUID()}`;

  beforeAll(async () => {
    await prisma.workflow.create({
      data: {
        id: updateId,
        name: "before",
        graph: MIN_GRAPH as never,
        maxConcurrent: 5,
      },
    });
  });

  afterAll(async () => {
    await prisma.workflow.deleteMany({ where: { id: updateId } });
  });

  it("200 on valid patch and updates the row", async () => {
    const res = await patchWorkflowById(
      patchWorkflowRequest({ name: "after", description: "edited" }),
      { params: Promise.resolve({ id: updateId }) },
    );
    expect(res.status).toBe(200);
    const row = await prisma.workflow.findUnique({ where: { id: updateId } });
    expect(row?.name).toBe("after");
    expect(row?.description).toBe("edited");
  });

  it("400 on empty patch body", async () => {
    const res = await patchWorkflowById(
      patchWorkflowRequest({}),
      { params: Promise.resolve({ id: updateId }) },
    );
    expect(res.status).toBe(400);
  });

  it("400 when graph fails to parse", async () => {
    const res = await patchWorkflowById(
      patchWorkflowRequest({
        graph: {
          nodes: [{ id: "x", kind: "not_real", name: "x", config: {} }],
          edges: [],
        },
      }),
      { params: Promise.resolve({ id: updateId }) },
    );
    expect(res.status).toBe(400);
  });

  it("404 on unknown id", async () => {
    const res = await patchWorkflowById(
      patchWorkflowRequest({ name: "x" }),
      { params: Promise.resolve({ id: "wf_does_not_exist" }) },
    );
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/workflows/[id]", () => {
  it("204 on success", async () => {
    const id = `wf_test_del_${randomUUID()}`;
    await prisma.workflow.create({
      data: { id, name: "to-delete", graph: MIN_GRAPH as never, maxConcurrent: 5 },
    });

    const res = await deleteWorkflowById(new Request("http://localhost"), {
      params: Promise.resolve({ id }),
    });
    expect(res.status).toBe(204);

    const row = await prisma.workflow.findUnique({ where: { id } });
    expect(row).toBeNull();
  });

  it("404 on unknown id", async () => {
    const res = await deleteWorkflowById(new Request("http://localhost"), {
      params: Promise.resolve({ id: "wf_does_not_exist" }),
    });
    expect(res.status).toBe(404);
  });

  it("409 when there are PENDING or RUNNING runs", async () => {
    const id = `wf_test_del_active_${randomUUID()}`;
    await prisma.workflow.create({
      data: { id, name: "active", graph: MIN_GRAPH as never, maxConcurrent: 5 },
    });
    await prisma.workflowRun.create({
      data: { workflowId: id, status: "PENDING", input: {} as never },
    });

    const res = await deleteWorkflowById(new Request("http://localhost"), {
      params: Promise.resolve({ id }),
    });
    expect(res.status).toBe(409);

    // cleanup
    await prisma.workflowRun.deleteMany({ where: { workflowId: id } });
    await prisma.workflow.deleteMany({ where: { id } });
  });
});

describe("GET /api/workflows/[id]/last-run-output", () => {
  it("404 when no runs exist for the workflow", async () => {
    const id = `wf_test_lro_empty_${randomUUID()}`;
    await prisma.workflow.create({
      data: { id, name: "empty", graph: MIN_GRAPH as never, maxConcurrent: 5 },
    });
    try {
      const res = await getLastRunOutput(new Request("http://localhost"), {
        params: Promise.resolve({ id }),
      });
      expect(res.status).toBe(404);
    } finally {
      await prisma.workflow.deleteMany({ where: { id } });
    }
  });

  it("404 when only PENDING / RUNNING / FAILED runs exist", async () => {
    const id = `wf_test_lro_nope_${randomUUID()}`;
    await prisma.workflow.create({
      data: { id, name: "n", graph: MIN_GRAPH as never, maxConcurrent: 5 },
    });
    await prisma.workflowRun.create({
      data: { workflowId: id, status: "FAILED", input: {} as never },
    });
    try {
      const res = await getLastRunOutput(new Request("http://localhost"), {
        params: Promise.resolve({ id }),
      });
      expect(res.status).toBe(404);
    } finally {
      await prisma.workflowRun.deleteMany({ where: { workflowId: id } });
      await prisma.workflow.deleteMany({ where: { id } });
    }
  });

  it("returns the most recent SUCCEEDED run's input + output", async () => {
    const id = `wf_test_lro_ok_${randomUUID()}`;
    await prisma.workflow.create({
      data: { id, name: "ok", graph: MIN_GRAPH as never, maxConcurrent: 5 },
    });

    // older succeeded run
    await prisma.workflowRun.create({
      data: {
        workflowId: id,
        status: "SUCCEEDED",
        input: { patientId: "older" } as never,
        output: { tag: "older" } as never,
        finishedAt: new Date(Date.now() - 60_000),
      },
    });
    // newer succeeded run
    await prisma.workflowRun.create({
      data: {
        workflowId: id,
        status: "SUCCEEDED",
        input: { patientId: "newer" } as never,
        output: { tag: "newer", getLabs: { results: [] } } as never,
        finishedAt: new Date(),
      },
    });

    try {
      const res = await getLastRunOutput(new Request("http://localhost"), {
        params: Promise.resolve({ id }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        input: { patientId: string };
        output: Record<string, unknown>;
        status: string;
      };
      expect(body.status).toBe("SUCCEEDED");
      expect(body.input.patientId).toBe("newer");
      expect(body.output["tag"]).toBe("newer");
    } finally {
      await prisma.workflowRun.deleteMany({ where: { workflowId: id } });
      await prisma.workflow.deleteMany({ where: { id } });
    }
  });
});

function previewRequest(body: unknown) {
  return new Request("http://localhost/api/workflows/x/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/workflows/[id]/preview", () => {
  const previewWorkflowId = `wf_test_preview_${randomUUID()}`;

  beforeAll(async () => {
    await prisma.workflow.create({
      data: {
        id: previewWorkflowId,
        name: "TEST preview",
        graph: MIN_GRAPH as never,
        maxConcurrent: 5,
      },
    });
  });

  afterAll(async () => {
    await prisma.workflowRun.deleteMany({ where: { workflowId: previewWorkflowId } });
    await prisma.workflow.deleteMany({ where: { id: previewWorkflowId } });
  });

  const validGraph = {
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
    ],
    edges: [{ id: "e1", source: "trigger", target: "getLabs" }],
  };

  it("200 with run state on valid body", async () => {
    const res = await previewRun(
      previewRequest({
        input: { patientId: "p_777" },
        graph: validGraph,
        targetNodeId: "getLabs",
      }),
      { params: Promise.resolve({ id: previewWorkflowId }) },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      runId: string;
      status: string;
      output: Record<string, unknown>;
    };
    expect(body.status).toBe("SUCCEEDED");
    expect(body.runId).toBeTruthy();
    const labs = body.output["getLabs"] as { patientId: string };
    expect(labs.patientId).toBe("p_777");
  });

  it("400 on missing targetNodeId", async () => {
    const res = await previewRun(
      previewRequest({ input: {}, graph: validGraph }),
      { params: Promise.resolve({ id: previewWorkflowId }) },
    );
    expect(res.status).toBe(400);
  });

  it("400 on graph that fails fromJSON", async () => {
    const res = await previewRun(
      previewRequest({
        input: {},
        graph: { nodes: [{ id: "x", kind: "not_real", name: "x", config: {} }], edges: [] },
        targetNodeId: "x",
      }),
      { params: Promise.resolve({ id: previewWorkflowId }) },
    );
    expect(res.status).toBe(400);
  });

  it("404 on unknown workflowId", async () => {
    const res = await previewRun(
      previewRequest({
        input: {},
        graph: validGraph,
        targetNodeId: "getLabs",
      }),
      { params: Promise.resolve({ id: "wf_does_not_exist_preview" }) },
    );
    expect(res.status).toBe(404);
  });

  it("422 when targetNodeId is not in the graph", async () => {
    const res = await previewRun(
      previewRequest({
        input: {},
        graph: validGraph,
        targetNodeId: "not_in_graph",
      }),
      { params: Promise.resolve({ id: previewWorkflowId }) },
    );
    expect(res.status).toBe(422);
  });
});

describe("GET /api/integrations", () => {
  it("returns the registry with all built-in integrations", async () => {
    const res = await listIntegrationsRoute();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      integrations: Array<{
        name: string;
        label: string;
        description: string;
        category: string;
        functions: Array<{ name: string; description: string }>;
      }>;
    };
    expect(Array.isArray(body.integrations)).toBe(true);
    const names = body.integrations.map((i) => i.name).sort();
    // 6 built-ins after M2-P1: labs, radiology, ehr-notes, epic, twilio, slack
    expect(names).toContain("labs");
    expect(names).toContain("epic");
    expect(names).toContain("twilio");
    expect(names).toContain("slack");

    const epic = body.integrations.find((i) => i.name === "epic");
    expect(epic?.label).toBe("Epic (FHIR)");
    expect(epic?.functions.map((f) => f.name).sort()).toEqual([
      "getPatient",
      "searchObservations",
    ]);
  });

  it("includes sampleInput and sampleOutput on functions that declare them", async () => {
    const res = await listIntegrationsRoute();
    const body = (await res.json()) as {
      integrations: Array<{
        name: string;
        functions: Array<{
          name: string;
          sampleInput?: unknown;
          sampleOutput?: unknown;
        }>;
      }>;
    };
    const labs = body.integrations.find((i) => i.name === "labs");
    const getResults = labs?.functions.find((f) => f.name === "getResults");
    expect(getResults?.sampleInput).toEqual({ patientId: "p_001" });
    expect(getResults?.sampleOutput).toBeDefined();
  });
});
