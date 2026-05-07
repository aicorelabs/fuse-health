"use client";

import "reactflow/dist/style.css";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from "reactflow";

import type { GraphJSON, NodeKind } from "@fuse/core";

import {
  applyBranchCaseRename,
  removeBranchEdgesForCase,
} from "@/lib/editor/branchSync";
import {
  toGraphJSON,
  toReactFlow,
  type WorkflowFlowEdge,
  type WorkflowFlowNode,
  type WorkflowNodeData,
} from "@/lib/editor/graphConvert";
import { defaultNodeFor } from "@/lib/editor/nodeDefaults";
import { nextNodeId } from "@/lib/editor/nodeIds";
import { validateForSave } from "@/lib/editor/validateGraph";

import { Canvas } from "./Canvas";
import { isTriggerKind } from "./constants";
import { NodeConfigPanel } from "./NodeConfigPanel";
import { NodePalette } from "./NodePalette";
import type { LastRunSample } from "./ScopePanel";
import { Toolbar } from "./Toolbar";

export interface EditorWorkflow {
  id: string;
  name: string;
  description: string;
  graph: GraphJSON;
  maxConcurrent: number;
}

interface WorkflowEditorProps {
  mode: "create" | "update";
  workflow: EditorWorkflow;
}

export function WorkflowEditor(props: WorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <EditorInner {...props} />
    </ReactFlowProvider>
  );
}

function EditorInner({ mode, workflow }: WorkflowEditorProps) {
  const initial = useMemo(() => toReactFlow(workflow.graph), [workflow.graph]);

  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNodeData>(
    initial.nodes,
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [name, setName] = useState(workflow.name);
  const [description, setDescription] = useState(workflow.description);
  const [sample, setSample] = useState<LastRunSample | null>(null);
  const [sampleStatus, setSampleStatus] = useState<
    "idle" | "loading" | "ready" | "missing"
  >("idle");

  const { screenToFlowPosition } = useReactFlow();

  const hasTrigger = nodes.some((n) => isTriggerKind(n.data.kind));

  const liveGraph = useMemo(
    () =>
      toGraphJSON(nodes as WorkflowFlowNode[], edges as WorkflowFlowEdge[]),
    [nodes, edges],
  );

  const validation = useMemo(() => validateForSave(liveGraph), [liveGraph]);

  // Fetch last successful run's input + output once on mount (update mode only)
  // so the inspector can show real shapes for upstream node references.
  useEffect(() => {
    if (mode !== "update" || !workflow.id) return;
    let cancelled = false;
    setSampleStatus("loading");
    void (async () => {
      try {
        const res = await fetch(
          `/api/workflows/${workflow.id}/last-run-output`,
          { cache: "no-store" },
        );
        if (cancelled) return;
        if (res.status === 404) {
          setSampleStatus("missing");
          return;
        }
        if (!res.ok) {
          setSampleStatus("missing");
          return;
        }
        const body = (await res.json()) as {
          input: unknown;
          output: unknown;
        };
        setSample({
          triggerInput: body.input,
          nodeOutputs:
            (body.output as Record<string, unknown> | null) ?? {},
        });
        setSampleStatus("ready");
      } catch {
        if (!cancelled) setSampleStatus("missing");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, workflow.id]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const id = `e_${connection.source}_${connection.target}_${eds.length + 1}`;
        const next: Edge = {
          id,
          source: connection.source ?? "",
          target: connection.target ?? "",
          ...(typeof connection.sourceHandle === "string" && {
            sourceHandle: connection.sourceHandle,
            label: connection.sourceHandle,
          }),
        };
        return addEdge(next, eds);
      });
    },
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const kindRaw = event.dataTransfer.getData("application/fuse-kind");
      if (!kindRaw) return;
      const kind = kindRaw as NodeKind;

      // Block dropping a second trigger.
      if (isTriggerKind(kind) && hasTrigger) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const id = nextNodeId(
        nodes.map((n) => n.id),
        kind,
      );
      const defaults = defaultNodeFor(kind, id, position);

      const newRfNode: Node<WorkflowNodeData, "workflow"> = {
        id,
        type: "workflow",
        position,
        data: {
          kind,
          name: defaults.name,
          config: defaults.config,
        },
      };
      setNodes((ns) => [...ns, newRfNode]);
      setSelectedNodeId(id);
    },
    [hasTrigger, nodes, screenToFlowPosition, setNodes],
  );

  const onNodeClick = useCallback((_e: unknown, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const patchNode = useCallback(
    (id: string, patch: { name?: string; config?: unknown }) => {
      setNodes((ns) =>
        ns.map((n) =>
          n.id === id
            ? {
                ...n,
                data: {
                  ...n.data,
                  ...(patch.name !== undefined && { name: patch.name }),
                  ...(patch.config !== undefined && { config: patch.config }),
                },
              }
            : n,
        ),
      );
    },
    [setNodes],
  );

  const deleteNode = useCallback(
    (id: string) => {
      setNodes((ns) => ns.filter((n) => n.id !== id));
      setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
      setSelectedNodeId((prev) => (prev === id ? null : prev));
    },
    [setEdges, setNodes],
  );

  // Prune orphan edges when nodes are removed via keyboard (React Flow's
  // built-in delete handling) — otherwise the edge keeps a dangling source
  // or target id.
  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      const removedIds = new Set(deleted.map((n) => n.id));
      setEdges((es) =>
        es.filter(
          (e) => !removedIds.has(e.source) && !removedIds.has(e.target),
        ),
      );
      setSelectedNodeId((prev) =>
        prev !== null && removedIds.has(prev) ? null : prev,
      );
    },
    [setEdges],
  );

  const handleCaseRename = useCallback(
    (branchId: string, oldLabel: string, newLabel: string) => {
      setEdges((es) => applyBranchCaseRename(es, branchId, oldLabel, newLabel));
    },
    [setEdges],
  );

  const handleCaseRemove = useCallback(
    (branchId: string, label: string) => {
      setEdges((es) => removeBranchEdgesForCase(es, branchId, label));
    },
    [setEdges],
  );

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  return (
    <div className="flex h-screen flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <Toolbar
        mode={mode}
        workflowId={workflow.id}
        name={name}
        description={description}
        onNameChange={setName}
        onDescriptionChange={setDescription}
        graph={liveGraph}
        validation={validation}
        nodeCount={nodes.length}
        edgeCount={edges.length}
      />

      <div className="flex flex-1 overflow-hidden">
        <NodePalette hasTrigger={hasTrigger} />
        <div className="flex-1" onDrop={onDrop} onDragOver={onDragOver}>
          <Canvas
            nodes={nodes as WorkflowFlowNode[]}
            edges={edges as WorkflowFlowEdge[]}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onNodesDelete={onNodesDelete}
          />
        </div>
        <NodeConfigPanel
          selectedNode={selectedNode as WorkflowFlowNode | null}
          graph={liveGraph}
          sample={sample}
          sampleStatus={sampleStatus}
          onPatch={patchNode}
          onDelete={deleteNode}
          onCaseRename={handleCaseRename}
          onCaseRemove={handleCaseRemove}
        />
      </div>
    </div>
  );
}

