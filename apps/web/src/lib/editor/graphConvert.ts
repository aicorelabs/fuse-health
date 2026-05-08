import type { Edge as RFEdge, Node as RFNode } from "reactflow";

import type { EdgeJSON, GraphJSON, NodeKind } from "@fuse/core";

export interface WorkflowNodeData {
  kind: NodeKind;
  name: string;
  config: unknown;
}

export type WorkflowFlowNode = RFNode<WorkflowNodeData, "workflow">;
export type WorkflowFlowEdge = RFEdge;

// Loose input shape so `as const` seed fixtures and zod-inferred GraphJSON
// both fit without casting at the callsite.
export interface GraphLike {
  nodes: ReadonlyArray<{
    id: string;
    kind: string;
    name: string;
    position?: { x: number; y: number };
    config: unknown;
  }>;
  edges: ReadonlyArray<{
    id: string;
    source: string;
    target: string;
    condition?: string;
  }>;
}

// Deterministic auto-layout for nodes that arrive without a `position`.
// Linear left-to-right; replaced when the user drags or auto-layout ships.
const AUTO_X_BASE = 100;
const AUTO_X_STEP = 260;
const AUTO_Y_BASE = 120;

export function toReactFlow(graph: GraphLike): {
  nodes: WorkflowFlowNode[];
  edges: WorkflowFlowEdge[];
} {
  const nodes: WorkflowFlowNode[] = graph.nodes.map((n, i) => ({
    id: n.id,
    type: "workflow" as const,
    position: n.position ?? {
      x: AUTO_X_BASE + i * AUTO_X_STEP,
      y: AUTO_Y_BASE,
    },
    data: {
      kind: n.kind as NodeKind,
      name: n.name,
      config: n.config,
    },
  }));

  const edges: WorkflowFlowEdge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    ...(e.condition !== undefined && {
      sourceHandle: e.condition,
      label: e.condition,
    }),
  }));

  return { nodes, edges };
}

export function toGraphJSON(
  rfNodes: WorkflowFlowNode[],
  rfEdges: WorkflowFlowEdge[],
): GraphJSON {
  const nodes = rfNodes.map((n) => ({
    id: n.id,
    kind: n.data.kind,
    name: n.data.name,
    position: { x: n.position.x, y: n.position.y },
    config: n.data.config,
  })) as unknown as GraphJSON["nodes"];

  const edges = rfEdges.map((e) => {
    const out: EdgeJSON = {
      id: e.id,
      source: e.source,
      target: e.target,
    };
    if (typeof e.sourceHandle === "string" && e.sourceHandle.length > 0) {
      out.condition = e.sourceHandle;
    }
    return out;
  });

  return { nodes, edges };
}
