import { describe, expect, it } from "vitest";

import { WorkflowGraph } from "@fuse/core";

import { subgraphTo } from "../subgraph.js";

function buildGraph(json: unknown) {
  return WorkflowGraph.fromJSON(json);
}

describe("subgraphTo", () => {
  it("returns null when targetNodeId is not in the graph", () => {
    const g = buildGraph({
      nodes: [
        { id: "t", kind: "trigger.manual", name: "t", config: {} },
      ],
      edges: [],
    });
    expect(subgraphTo(g, "missing")).toBeNull();
  });

  it("returns just the trigger when target is the trigger", () => {
    const g = buildGraph({
      nodes: [
        { id: "t", kind: "trigger.manual", name: "t", config: {} },
        { id: "a", kind: "set", name: "a", config: { fields: {} } },
      ],
      edges: [{ id: "e1", source: "t", target: "a" }],
    });
    const sub = subgraphTo(g, "t")!;
    expect(sub.nodes.map((n) => n.id)).toEqual(["t"]);
    expect(sub.edges).toEqual([]);
  });

  it("collects every transitive ancestor", () => {
    const g = buildGraph({
      nodes: [
        { id: "t", kind: "trigger.manual", name: "t", config: {} },
        { id: "a", kind: "set", name: "a", config: { fields: {} } },
        { id: "b", kind: "set", name: "b", config: { fields: {} } },
        { id: "c", kind: "set", name: "c", config: { fields: {} } },
      ],
      edges: [
        { id: "e1", source: "t", target: "a" },
        { id: "e2", source: "a", target: "b" },
        { id: "e3", source: "b", target: "c" },
      ],
    });
    const sub = subgraphTo(g, "c")!;
    const ids = sub.nodes.map((n) => n.id).sort();
    expect(ids).toEqual(["a", "b", "c", "t"]);
    expect(sub.edges).toHaveLength(3);
  });

  it("excludes branches that don't lead to the target", () => {
    const g = buildGraph({
      nodes: [
        { id: "t", kind: "trigger.manual", name: "t", config: {} },
        { id: "a", kind: "set", name: "a", config: { fields: {} } },
        { id: "sibling", kind: "set", name: "sibling", config: { fields: {} } },
        { id: "downstream", kind: "set", name: "downstream", config: { fields: {} } },
      ],
      edges: [
        { id: "e1", source: "t", target: "a" },
        { id: "e2", source: "t", target: "sibling" },
        { id: "e3", source: "a", target: "downstream" },
      ],
    });
    const sub = subgraphTo(g, "a")!;
    const ids = sub.nodes.map((n) => n.id).sort();
    expect(ids).toEqual(["a", "t"]);
    expect(sub.nodes.find((n) => n.id === "sibling")).toBeUndefined();
    expect(sub.nodes.find((n) => n.id === "downstream")).toBeUndefined();
  });

  it("includes the loop's body when the target is the loop node itself", () => {
    const g = buildGraph({
      nodes: [
        { id: "t", kind: "trigger.manual", name: "t", config: {} },
        {
          id: "lp",
          kind: "loop",
          name: "lp",
          config: { over: "x", itemVar: "i" },
        },
        { id: "body", kind: "set", name: "body", config: { fields: {} } },
        { id: "after", kind: "set", name: "after", config: { fields: {} } },
      ],
      edges: [
        { id: "e1", source: "t", target: "lp" },
        { id: "e2", source: "lp", target: "body" },
        { id: "e3", source: "body", target: "after" },
      ],
    });
    const sub = subgraphTo(g, "lp")!;
    const ids = sub.nodes.map((n) => n.id).sort();
    expect(ids).toEqual(["body", "lp", "t"]);
    expect(sub.nodes.find((n) => n.id === "after")).toBeUndefined();
  });

  it("includes the loop body when the target IS the body", () => {
    const g = buildGraph({
      nodes: [
        { id: "t", kind: "trigger.manual", name: "t", config: {} },
        { id: "lp", kind: "loop", name: "lp", config: { over: "x" } },
        { id: "body", kind: "set", name: "body", config: { fields: {} } },
      ],
      edges: [
        { id: "e1", source: "t", target: "lp" },
        { id: "e2", source: "lp", target: "body" },
      ],
    });
    const sub = subgraphTo(g, "body")!;
    const ids = sub.nodes.map((n) => n.id).sort();
    expect(ids).toEqual(["body", "lp", "t"]);
    expect(sub.edges.map((e) => e.id).sort()).toEqual(["e1", "e2"]);
  });

  it("preserves edge condition labels for branch outgoing edges", () => {
    const g = buildGraph({
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
      ],
      edges: [
        { id: "e_in", source: "t", target: "br" },
        { id: "e_yes", source: "br", target: "y", condition: "yes" },
      ],
    });
    const sub = subgraphTo(g, "y")!;
    const yEdge = sub.edges.find((e) => e.id === "e_yes");
    expect(yEdge?.condition).toBe("yes");
  });
});
