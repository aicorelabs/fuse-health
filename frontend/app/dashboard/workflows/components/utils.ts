"use client";

import { Position } from "reactflow";
import type { FlowNode, FlowEdge, NodeConnector } from "./types";

/**
 * Determines the connector configuration for a node based on its category.
 * Zapier-style: most nodes have single input/output, except logic nodes which can branch.
 */
export function getDefaultConnectors(
  nodeId: string,
  category: "trigger" | "data" | "logic" | "ai" | "action",
  logicType?: "filter" | "loop"
): NodeConnector[] {
  // Trigger nodes only have output (they start the workflow)
  if (category === "trigger") {
    return [
      {
        id: `${nodeId}-out`,
        type: "source",
        position: Position.Right,
      },
    ];
  }

  // Logic nodes can have branching
  if (category === "logic") {
    // Filter/Branch nodes have one input and two outputs (true/false paths)
    if (logicType === "filter") {
      return [
        {
          id: `${nodeId}-in`,
          type: "target",
          position: Position.Left,
        },
        {
          id: `${nodeId}-true`,
          type: "source",
          position: Position.Right,
          label: "True",
          style: { top: "40%" },
        },
        {
          id: `${nodeId}-false`,
          type: "source",
          position: Position.Right,
          label: "False",
          style: { top: "60%" },
        },
      ];
    }

    // Loop nodes have one input and two outputs (iteration and completion)
    if (logicType === "loop") {
      return [
        {
          id: `${nodeId}-in`,
          type: "target",
          position: Position.Left,
        },
        {
          id: `${nodeId}-iterate`,
          type: "source",
          position: Position.Bottom,
          label: "Each",
          style: { left: "50%" },
        },
        {
          id: `${nodeId}-complete`,
          type: "source",
          position: Position.Right,
          label: "Done",
        },
      ];
    }
  }

  // Default: all other nodes (data, ai, action) have simple input/output
  return [
    {
      id: `${nodeId}-in`,
      type: "target",
      position: Position.Left,
    },
    {
      id: `${nodeId}-out`,
      type: "source",
      position: Position.Right,
    },
  ];
}

/**
 * Finds the last node in the workflow that should be connected to the next node.
 * Returns the node and the appropriate source handle to connect from.
 */
export function findLastConnectableNode(
  nodes: FlowNode[],
  edges: FlowEdge[]
): { node: FlowNode; sourceHandle: string } | null {
  if (nodes.length === 0) return null;

  // Find nodes that don't have any outgoing edges (terminal nodes)
  const nodesWithoutOutgoing = nodes.filter((node) => {
    const outgoingEdges = edges.filter((edge) => edge.source === node.id);
    const sourceConnectors = node.data.connectors?.filter(
      (c) => c.type === "source"
    ) || [];

    // If node has no source connectors, it can't be connected from
    if (sourceConnectors.length === 0) return false;

    // For nodes with multiple outputs (logic nodes), check if all are used
    if (sourceConnectors.length > 1) {
      // For filters and loops, we need to check specific handles
      const usedHandles = outgoingEdges.map((e) => e.sourceHandle);
      const unusedConnectors = sourceConnectors.filter(
        (c) => !usedHandles.includes(c.id)
      );
      return unusedConnectors.length > 0;
    }

    // For single-output nodes, check if the output is unused
    return outgoingEdges.length === 0;
  });

  if (nodesWithoutOutgoing.length === 0) return null;

  // Get the rightmost node (by x position)
  const lastNode = nodesWithoutOutgoing.reduce((max, node) =>
    node.position.x > max.position.x ? node : max
  );

  // Find the first unused source connector
  const outgoingEdges = edges.filter((edge) => edge.source === lastNode.id);
  const usedHandles = outgoingEdges.map((e) => e.sourceHandle);
  const sourceConnectors =
    lastNode.data.connectors?.filter((c) => c.type === "source") || [];
  const unusedConnector = sourceConnectors.find(
    (c) => !usedHandles.includes(c.id)
  );

  if (!unusedConnector) {
    // Fallback to the first source connector
    return sourceConnectors.length > 0
      ? { node: lastNode, sourceHandle: sourceConnectors[0].id }
      : null;
  }

  return { node: lastNode, sourceHandle: unusedConnector.id };
}

/**
 * Calculates the position for a new node based on the last node in the workflow.
 */
export function calculateNewNodePosition(
  lastNodeInfo: { node: FlowNode; sourceHandle: string } | null,
  defaultPosition = { x: 50, y: 250 }
): { x: number; y: number } {
  if (!lastNodeInfo) return defaultPosition;

  const { node, sourceHandle } = lastNodeInfo;
  const connector = node.data.connectors?.find((c) => c.id === sourceHandle);

  // If connecting from the bottom (loop iteration), place below
  if (connector?.position === Position.Bottom) {
    return {
      x: node.position.x,
      y: node.position.y + 200,
    };
  }

  // Default: place to the right
  return {
    x: node.position.x + 280,
    y: node.position.y,
  };
}
