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
