import { describe, expect, it } from "vitest";

import { patientSummaryGraph } from "@fuse/db";

import { toGraphJSON, toReactFlow } from "../graphConvert.js";

const branchGraph = {
  nodes: [
    { id: "trigger", kind: "trigger.manual", name: "trigger", config: {} },
    {
      id: "router",
      kind: "branch",
      name: "Router",
      config: {
        cases: [
          {
            when: { left: "{{ trigger.input.x }}", op: ">=", right: 10 },
            edge: "big",
          },
        ],
        default: "small",
      },
    },
    { id: "bigPath", kind: "set", name: "Big", config: { fields: { tag: "big" } } },
    { id: "smallPath", kind: "set", name: "Small", config: { fields: { tag: "small" } } },
  ],
  edges: [
    { id: "e_in", source: "trigger", target: "router" },
    { id: "e_big", source: "router", target: "bigPath", condition: "big" },
    { id: "e_small", source: "router", target: "smallPath", condition: "small" },
  ],
};

describe("toReactFlow", () => {
  it("converts every node with the 'workflow' type and id preserved", () => {
    const { nodes } = toReactFlow(patientSummaryGraph);
    expect(nodes).toHaveLength(patientSummaryGraph.nodes.length);
    for (const n of nodes) {
      expect(n.type).toBe("workflow");
    }
    const ids = nodes.map((n) => n.id).sort();
    const expected = patientSummaryGraph.nodes.map((n) => n.id).sort();
    expect(ids).toEqual(expected);
  });

  it("packs kind, name, config into the React Flow node `data` payload", () => {
    const { nodes } = toReactFlow(patientSummaryGraph);
    const trigger = nodes.find((n) => n.id === "trigger");
    expect(trigger?.data.kind).toBe("trigger.manual");
    expect(trigger?.data.name).toBe("Manual trigger");
    expect(trigger?.data.config).toEqual({});
  });

  it("auto-positions nodes that lack a position field", () => {
    const { nodes } = toReactFlow(patientSummaryGraph);
    for (const n of nodes) {
      expect(typeof n.position.x).toBe("number");
      expect(typeof n.position.y).toBe("number");
      expect(Number.isFinite(n.position.x)).toBe(true);
      expect(Number.isFinite(n.position.y)).toBe(true);
    }
    // Auto-layout is deterministic — same input → same positions
    const second = toReactFlow(patientSummaryGraph);
    for (let i = 0; i < nodes.length; i++) {
      expect(second.nodes[i]?.position).toEqual(nodes[i]?.position);
    }
  });

  it("preserves explicit position fields", () => {
    const graph = {
      nodes: [
        {
          id: "a",
          kind: "set",
          name: "A",
          position: { x: 123, y: 456 },
          config: { fields: {} },
        },
      ],
      edges: [],
    };
    const { nodes } = toReactFlow(graph);
    expect(nodes[0]?.position).toEqual({ x: 123, y: 456 });
  });

  it("maps edge.condition onto sourceHandle for branch outgoing edges", () => {
    const { edges } = toReactFlow(branchGraph);
    const eBig = edges.find((e) => e.id === "e_big");
    const eSmall = edges.find((e) => e.id === "e_small");
    expect(eBig?.sourceHandle).toBe("big");
    expect(eSmall?.sourceHandle).toBe("small");
    // edges without a condition have no sourceHandle
    const eIn = edges.find((e) => e.id === "e_in");
    expect(eIn?.sourceHandle).toBeUndefined();
  });

  it("renders a label on edges that carry a condition", () => {
    const { edges } = toReactFlow(branchGraph);
    const eBig = edges.find((e) => e.id === "e_big");
    expect(eBig?.label).toBe("big");
  });
});

describe("toGraphJSON", () => {
  it("round-trips patientSummaryGraph (modulo auto-assigned positions)", () => {
    const rf = toReactFlow(patientSummaryGraph);
    const back = toGraphJSON(rf.nodes, rf.edges);

    // Same node ids
    const ids = back.nodes.map((n) => n.id).sort();
    expect(ids).toEqual(patientSummaryGraph.nodes.map((n) => n.id).sort());

    // Same configs (kind / name / config preserved)
    for (const original of patientSummaryGraph.nodes) {
      const round = back.nodes.find((n) => n.id === original.id);
      expect(round?.kind).toBe(original.kind);
      expect(round?.name).toBe(original.name);
      expect(round?.config).toEqual(original.config);
    }

    // Same edges
    expect(back.edges).toEqual(patientSummaryGraph.edges);
  });

  it("round-trips branch edges with their condition labels", () => {
    const rf = toReactFlow(branchGraph);
    const back = toGraphJSON(rf.nodes, rf.edges);
    const eBig = back.edges.find((e) => e.id === "e_big");
    const eSmall = back.edges.find((e) => e.id === "e_small");
    expect(eBig?.condition).toBe("big");
    expect(eSmall?.condition).toBe("small");
    // Edges without sourceHandle get no condition
    const eIn = back.edges.find((e) => e.id === "e_in");
    expect(eIn?.condition).toBeUndefined();
  });

  it("emits position on each output node", () => {
    const rf = toReactFlow(patientSummaryGraph);
    const back = toGraphJSON(rf.nodes, rf.edges);
    for (const n of back.nodes) {
      expect(n.position).toBeDefined();
      expect(typeof n.position?.x).toBe("number");
    }
  });

  it("produces a graph that re-parses through WorkflowGraph.fromJSON", async () => {
    const { WorkflowGraph } = await import("@fuse/core");
    const rf = toReactFlow(patientSummaryGraph);
    const back = toGraphJSON(rf.nodes, rf.edges);
    expect(() => WorkflowGraph.fromJSON(back)).not.toThrow();
  });
});
