"use client";

import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  type Node,
  type ReactFlowProps,
} from "reactflow";

import { WorkflowNode } from "./nodes/WorkflowNode";

const nodeTypes = { workflow: WorkflowNode };

interface CanvasProps
  extends Pick<
    ReactFlowProps,
    | "onNodesChange"
    | "onEdgesChange"
    | "onConnect"
    | "onDrop"
    | "onDragOver"
    | "onNodeClick"
    | "onPaneClick"
    | "onNodesDelete"
    | "onEdgesDelete"
  > {
  nodes: Node[];
  edges: Edge[];
  readOnly?: boolean;
}

export function Canvas({ nodes, edges, readOnly, ...handlers }: CanvasProps) {
  return (
    <div className="relative h-full w-full canvas-grain">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        deleteKeyCode={readOnly ? null : ["Delete", "Backspace"]}
        fitView
        fitViewOptions={{ padding: 0.28, maxZoom: 1.05 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.4}
        maxZoom={1.6}
        defaultEdgeOptions={{
          type: "default",
          animated: false,
        }}
        {...handlers}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1}
          color="rgba(120, 113, 108, 0.18)"
          className="!bg-stone-50 dark:!bg-stone-950"
        />
        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>
    </div>
  );
}
