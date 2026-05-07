import { describe, expect, it } from "vitest";

import { patientSummaryGraph } from "@fuse/db";

import { validateForSave } from "../validateGraph.js";

const minimalValid = {
  nodes: [
    { id: "trigger", kind: "trigger.manual", name: "trigger", config: {} },
    { id: "out", kind: "set", name: "set", config: { fields: { x: 1 } } },
  ],
  edges: [{ id: "e1", source: "trigger", target: "out" }],
};

describe("validateForSave", () => {
  it("accepts the seed patientSummaryGraph", () => {
    const result = validateForSave(patientSummaryGraph);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("accepts a minimal valid graph", () => {
    const result = validateForSave(minimalValid);
    expect(result.ok).toBe(true);
  });

  it("blocks when there is no trigger", () => {
    const result = validateForSave({
      nodes: [{ id: "out", kind: "set", name: "set", config: { fields: {} } }],
      edges: [],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "NO_TRIGGER")).toBe(true);
  });

  it("blocks when there is more than one trigger", () => {
    const result = validateForSave({
      nodes: [
        { id: "t1", kind: "trigger.manual", name: "t1", config: {} },
        { id: "t2", kind: "trigger.manual", name: "t2", config: {} },
      ],
      edges: [],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "MULTIPLE_TRIGGERS")).toBe(true);
  });

  it("blocks on a cycle", () => {
    const result = validateForSave({
      nodes: [
        { id: "t", kind: "trigger.manual", name: "t", config: {} },
        { id: "a", kind: "set", name: "a", config: { fields: {} } },
        { id: "b", kind: "set", name: "b", config: { fields: {} } },
      ],
      edges: [
        { id: "et", source: "t", target: "a" },
        { id: "e1", source: "a", target: "b" },
        { id: "e2", source: "b", target: "a" },
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "CYCLE")).toBe(true);
  });

  it("blocks loop with not exactly one outgoing edge", () => {
    const tooMany = validateForSave({
      nodes: [
        { id: "t", kind: "trigger.manual", name: "t", config: {} },
        { id: "lp", kind: "loop", name: "lp", config: { over: "x", itemVar: "i" } },
        { id: "a", kind: "set", name: "a", config: { fields: {} } },
        { id: "b", kind: "set", name: "b", config: { fields: {} } },
      ],
      edges: [
        { id: "et", source: "t", target: "lp" },
        { id: "e1", source: "lp", target: "a" },
        { id: "e2", source: "lp", target: "b" },
      ],
    });
    expect(tooMany.ok).toBe(false);
    expect(tooMany.errors.some((e) => e.code === "LOOP_OUTGOING_COUNT")).toBe(true);

    const none = validateForSave({
      nodes: [
        { id: "t", kind: "trigger.manual", name: "t", config: {} },
        { id: "lp", kind: "loop", name: "lp", config: { over: "x", itemVar: "i" } },
      ],
      edges: [{ id: "et", source: "t", target: "lp" }],
    });
    expect(none.errors.some((e) => e.code === "LOOP_OUTGOING_COUNT")).toBe(true);
  });

  it("blocks when the loop body is itself a loop", () => {
    const result = validateForSave({
      nodes: [
        { id: "t", kind: "trigger.manual", name: "t", config: {} },
        { id: "outer", kind: "loop", name: "outer", config: { over: "x", itemVar: "i" } },
        { id: "inner", kind: "loop", name: "inner", config: { over: "y", itemVar: "j" } },
        { id: "x", kind: "set", name: "x", config: { fields: {} } },
      ],
      edges: [
        { id: "et", source: "t", target: "outer" },
        { id: "eo", source: "outer", target: "inner" },
        { id: "ei", source: "inner", target: "x" },
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "LOOP_BODY_IS_LOOP")).toBe(true);
  });

  it("blocks branch outgoing edge whose condition matches no case or default", () => {
    const result = validateForSave({
      nodes: [
        { id: "t", kind: "trigger.manual", name: "t", config: {} },
        {
          id: "br",
          kind: "branch",
          name: "br",
          config: {
            cases: [
              { when: { left: "x", op: "truthy" }, edge: "yes" },
            ],
          },
        },
        { id: "y", kind: "set", name: "y", config: { fields: {} } },
        { id: "n", kind: "set", name: "n", config: { fields: {} } },
      ],
      edges: [
        { id: "et", source: "t", target: "br" },
        { id: "ey", source: "br", target: "y", condition: "yes" },
        { id: "en", source: "br", target: "n", condition: "no" },
      ],
    });
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.code === "BRANCH_EDGE_NO_CASE" && e.edgeId === "en"),
    ).toBe(true);
  });

  it("blocks branch with zero cases and no default", () => {
    const result = validateForSave({
      nodes: [
        { id: "t", kind: "trigger.manual", name: "t", config: {} },
        { id: "br", kind: "branch", name: "br", config: { cases: [] } },
      ],
      edges: [{ id: "et", source: "t", target: "br" }],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "BRANCH_NO_CASES")).toBe(true);
  });

  it("warns on orphan nodes (unreachable from any trigger)", () => {
    const result = validateForSave({
      nodes: [
        { id: "t", kind: "trigger.manual", name: "t", config: {} },
        { id: "reached", kind: "set", name: "reached", config: { fields: {} } },
        { id: "orphan", kind: "set", name: "orphan", config: { fields: {} } },
      ],
      edges: [{ id: "e1", source: "t", target: "reached" }],
    });
    expect(result.warnings.some((w) => w.code === "ORPHAN" && w.nodeId === "orphan")).toBe(true);
    expect(
      result.warnings.some((w) => w.code === "ORPHAN" && w.nodeId === "reached"),
    ).toBe(false);
  });

  it("blocks on a config that fails the engine zod schema", () => {
    const result = validateForSave({
      nodes: [
        { id: "t", kind: "trigger.manual", name: "t", config: {} },
        // wait.seconds must be nonnegative; -5 fails
        { id: "w", kind: "wait", name: "w", config: { seconds: -5 } },
      ],
      edges: [{ id: "e1", source: "t", target: "w" }],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "SCHEMA")).toBe(true);
  });
});
