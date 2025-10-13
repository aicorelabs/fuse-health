"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  type Connection,
  Controls,
  type EdgeChange,
  MiniMap,
  type NodeChange,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Clock3,
  Filter,
  Mail,
  Repeat,
  Save,
  Settings,
  Sparkles,
  Table,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import { cn } from "@/lib/utils";
import StepNode from "./components/StepNode";
import ConfigEdge, { EDGE_MARKER_ID } from "./components/ConfigEdge";
import { ConnectorActionSelector } from "./components/ConnectorActionSelector";
import { getConnectorAction } from "@/lib/api/connectors";
import type {
  FlowEdge,
  FlowNode,
  NodeConfigField,
  NodeConnector,
  StepNodeData,
} from "./components/types";
import {
  accentStyles,
  connectorBaseStyle,
  defaultConnectorLabelPlacement,
} from "./components/types";
import {
  calculateNewNodePosition,
  findLastConnectableNode,
  getDefaultConnectors,
} from "./components/utils";
import { FlowValidation, useFlowValidation } from "./components/FlowValidation";
import { initialFlows, nodeTemplates } from "./components/constants";
import {
  useCreateWorkflow,
  useNodeTypes,
  usePublishWorkflow,
  useUpdateWorkflow,
  useWorkflow,
} from "@/lib/api/workflow-queries";
import type {
  NodeType,
  NodeTypeDefinition,
  Workflow,
  WorkflowNode,
} from "@/lib/api/workflows";

// Helper functions to map API node types to UI properties
function getNodeCategory(
  apiType: string,
): "trigger" | "data" | "logic" | "ai" | "action" {
  const typeMap: Record<
    string,
    "trigger" | "data" | "logic" | "ai" | "action"
  > = {
    trigger: "trigger",
    action: "action",
    condition: "logic",
    transform: "logic",
    delay: "logic",
    loop: "logic",
    ai: "ai",
  };
  return typeMap[apiType] || "action";
}

function getAccentForNodeType(apiType: string): keyof typeof accentStyles {
  const accentMap: Record<string, keyof typeof accentStyles> = {
    trigger: "violet",
    action: "blue",
    condition: "aqua",
    transform: "green",
    delay: "pink",
    loop: "green",
    ai: "violet",
  };
  return accentMap[apiType] || "blue";
}

function getIconForNodeType(apiType: string): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
    trigger: Clock3,
    action: Mail,
    condition: Filter,
    transform: Settings,
    delay: Clock3,
    loop: Repeat,
    ai: Sparkles,
  };
  return iconMap[apiType] || Settings;
}

function getChipTextForNodeType(apiType: string): string {
  const chipMap: Record<string, string> = {
    trigger: "Trigger",
    action: "Action",
    condition: "Logic",
    transform: "Logic",
    delay: "Logic",
    loop: "Logic",
    ai: "AI",
  };
  return chipMap[apiType] || "Action";
}

function getApiNodeType(chipText: string): string {
  const reverseMap: Record<string, string> = {
    Trigger: "trigger",
    Action: "action",
    Logic: "condition",
    AI: "ai",
    Data: "action",
  };
  return reverseMap[chipText] || "action";
}

function getAccentForCategory(category: string): keyof typeof accentStyles {
  const accentMap: Record<string, keyof typeof accentStyles> = {
    trigger: "violet",
    action: "blue",
    data: "green",
    logic: "aqua",
    ai: "pink",
  };
  return accentMap[category] || "blue";
}

function getIconForCategory(category: string): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
    trigger: Clock3,
    action: Mail,
    data: Table,
    logic: Filter,
    ai: Sparkles,
  };
  return iconMap[category] || Settings;
}

function getChipTextForCategory(category: string): string {
  const chipMap: Record<string, string> = {
    trigger: "Trigger",
    action: "Action",
    data: "Data",
    logic: "Logic",
    ai: "AI",
  };
  return chipMap[category] || "Action";
}

const flowStatusStyles: Record<string, string> = {
  published: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  draft: "bg-slate-500/20 text-slate-300 border-slate-500/20",
  paused: "bg-amber-500/15 text-amber-200 border-amber-500/20",
};

// accentStyles now imported from components/types

// Types moved to components/types

type SimulationStatus = "idle" | "running" | "success";

export interface SimulationLogEntry {
  step: number;
  nodeId: string;
  label: string;
  subtitle?: string;
  status: "executing" | "complete";
  downstream: number;
}

export interface FlowDefinition {
  id: string;
  name: string;
  category: string;
  summary: string;
  cadence: string;
  status: "published" | "draft" | "paused";
  lastDeployed?: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface NodeTemplate {
  id: string;
  label: string;
  subtitle: string;
  category: "trigger" | "data" | "logic" | "ai" | "action";
  accent: keyof typeof accentStyles;
  icon: LucideIcon;
  chipText: string;
  description: string;
  defaultConfig: Record<string, string>;
  configFields: NodeConfigField[];
  requiresConnectorSelection?: boolean;
}

export interface FlowStateValue {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

function cloneFlow(flow: FlowDefinition): FlowStateValue {
  return {
    nodes: flow.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        config: { ...node.data.config },
        configFields: node.data.configFields?.map((field) => ({ ...field })),
        connectors: node.data.connectors?.map((connector) => ({
          ...connector,
          style: connector.style ? { ...connector.style } : undefined,
        })),
      },
      position: { ...node.position },
    })),
    edges: flow.edges.map((edge) => ({ ...edge })),
  };
}

// connector styles moved to components/types

const defaultEdgeStyle: CSSProperties = {
  stroke: "#7F8BFF",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};
// ConfigEdge moved to components/ConfigEdge

const nodeTypes = { step: StepNode };

const minimapNodeColor = (node: FlowNode) => {
  switch (node.data.accent) {
    case "violet":
      return "#7B4DFF";
    case "green":
      return "#17A673";
    case "aqua":
      return "#0A84FF";
    case "pink":
      return "#D34292";
    case "red":
      return "#E15765";
    case "blue":
      return "#3A6DFF";
    default:
      return "#64748B";
  }
};

export default function WorkflowsPage() {
  return (
    <ReactFlowProvider>
      <WorkflowsPageContent />
    </ReactFlowProvider>
  );
}

function WorkflowsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowId = searchParams.get("id");
  const { setCenter } = useReactFlow();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // TODO: Get user_id from auth context
  const userId = "user_demo_001";

  // Load node types from backend with user_id to get activation status
  const { data: nodeTypesData, isLoading: isLoadingNodeTypes } = useNodeTypes(
    userId,
  );

  // Load workflow from API if ID is provided
  const { data: loadedWorkflow, isLoading: isLoadingWorkflow } = useWorkflow(
    workflowId || "",
  );

  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();
  const publishWorkflow = usePublishWorkflow();

  // Flow state
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edgesRaw, setEdgesRaw] = useState<FlowEdge[]>([]);

  // Load workflow data when available
  useEffect(() => {
    if (loadedWorkflow) {
      setWorkflowName(loadedWorkflow.name);
      setWorkflowDescription(loadedWorkflow.description || "");

      const findNodeDefinition = (
        node: WorkflowNode,
      ): NodeTypeDefinition | undefined => {
        if (!nodeTypesData) return undefined;

        const allBackendNodes = [
          ...nodeTypesData.trigger,
          ...nodeTypesData.action,
          ...nodeTypesData.data,
          ...nodeTypesData.logic,
          ...nodeTypesData.ai,
        ];

        let nodeDef = allBackendNodes.find(
          (n) => n.service_type && n.service_type === node.data.serviceType,
        );

        if (!nodeDef) {
          const category = getNodeCategory(node.type);
          nodeDef = allBackendNodes.find(
            (n) => n.category === category && n.label === node.data.label,
          );
        }

        if (!nodeDef) {
          const category = getNodeCategory(node.type);
          const categoryNodes = allBackendNodes.filter((n) =>
            n.category === category
          );

          if (node.type === "condition") {
            nodeDef = categoryNodes.find((n) => n.id === "condition");
          } else if (node.type === "transform") {
            nodeDef = categoryNodes.find((n) => n.id === "transform");
          } else if (node.type === "loop") {
            nodeDef = categoryNodes.find((n) => n.id === "loop");
          } else if (node.type === "delay") {
            nodeDef = categoryNodes.find((n) => n.id === "delay");
          } else if (node.type === "ai") {
            nodeDef = categoryNodes.find((n) => n.label === node.data.label);
          }
        }

        return nodeDef;
      };

      const getConfigFieldsForNode = (
        node: WorkflowNode,
        nodeDef?: NodeTypeDefinition,
      ): NodeConfigField[] => {
        const definition = nodeDef ?? findNodeDefinition(node);
        if (!definition) return [];

        return definition.fields.map((field) => ({
          id: field.id,
          label: field.label,
          type: field.type === "number"
            ? "text"
            : field.type as "text" | "email" | "textarea" | "multi",
          required: field.required,
          placeholder: field.placeholder,
        }));
      };

      // Convert API nodes to FlowNodes
      const flowNodes: FlowNode[] = loadedWorkflow.nodes.map((node) => {
        const nodeDef = findNodeDefinition(node);
        return {
          id: node.id,
          type: "step",
          position: node.position,
          data: {
            label: node.data.label,
            subtitle: node.data.serviceType || "Configure this step",
            accent: getAccentForNodeType(node.type),
            icon: getIconForNodeType(node.type),
            chipText: getChipTextForNodeType(node.type),
            helperText: "Select to configure",
            config: node.data.config || {},
            configFields: getConfigFieldsForNode(node, nodeDef),
            connectors: getDefaultConnectors(
              node.id,
              getNodeCategory(node.type),
            ),
            requiresConnectorSelection: Boolean(nodeDef?.service_type),
            serviceType: nodeDef?.service_type, // Preserve service type for connector filtering
          },
        };
      });

      const flowEdges: FlowEdge[] = loadedWorkflow.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.source + "-out",
        targetHandle: edge.target + "-in",
        type: "smoothstep",
      }));

      setNodes(flowNodes);
      setEdgesRaw(flowEdges);
    }
  }, [loadedWorkflow, nodeTypesData]);

  const [simulationState, setSimulationState] = useState<{
    status: SimulationStatus;
    logs: SimulationLogEntry[];
    completedAt?: string;
  }>({ status: "idle", logs: [] });
  const [showConnectorWarning, setShowConnectorWarning] = useState(false);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedNodeAccent = selectedNode
    ? accentStyles[selectedNode.data.accent]
    : null;

  const edgeTypes = useMemo(() => ({ configEdge: ConfigEdge }), []);

  // Handle node deletion
  const handleDeleteNode = useCallback((nodeId: string) => {
    // Remove the node
    setNodes((prevNodes) => prevNodes.filter((n) => n.id !== nodeId));

    // Remove all edges connected to this node
    setEdgesRaw((prevEdges) =>
      prevEdges.filter((edge) =>
        edge.source !== nodeId && edge.target !== nodeId
      )
    );

    // Clear selection
    setSelectedNodeId(null);
  }, []);

  // Get validation results
  const validation = useFlowValidation(nodes, edgesRaw);

  useEffect(() => {
    setSelectedNodeId((prev) => prev ?? nodes[0]?.id ?? null);
  }, [nodes]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Delete or Backspace key
      if (
        (event.key === "Delete" || event.key === "Backspace") && selectedNodeId
      ) {
        // Check if we're not in an input field
        const target = event.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          event.preventDefault();
          handleDeleteNode(selectedNodeId);
        }
      }
      // Escape key to deselect
      if (event.key === "Escape" && selectedNodeId) {
        setSelectedNodeId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeId, handleDeleteNode]);

  // Clear selection if selected node no longer exists
  useEffect(() => {
    if (selectedNodeId && !nodes.find((n) => n.id === selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [nodes, selectedNodeId]);

  // Helper function to convert FlowNodes back to API format
  const convertToApiFormat = useCallback(() => {
    const apiNodes: WorkflowNode[] = nodes.map((node) => ({
      id: node.id,
      type: getApiNodeType(node.data.chipText || "Action") as NodeType,
      position: node.position,
      data: {
        label: node.data.label,
        serviceType: node.data.subtitle !== "Configure this step"
          ? node.data.subtitle
          : undefined,
        config: node.data.config,
      },
    }));

    const apiEdges = edgesRaw.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      condition: edge.data?.condition,
    }));

    return { apiNodes, apiEdges };
  }, [nodes, edgesRaw]);

  // Save workflow
  const handleSave = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const { apiNodes, apiEdges } = convertToApiFormat();

      if (workflowId) {
        // Update existing workflow
        await updateWorkflow.mutateAsync({
          workflowId,
          payload: {
            name: workflowName,
            description: workflowDescription,
            nodes: apiNodes,
            edges: apiEdges,
          },
        });
        alert("Workflow saved successfully!");
      } else {
        // Create new workflow
        const newWorkflow = await createWorkflow.mutateAsync({
          user_id: "user_demo_001", // TODO: Get from auth context
          name: workflowName,
          description: workflowDescription,
          nodes: apiNodes,
          edges: apiEdges,
        });

        // Redirect to edit the new workflow
        router.push(`/dashboard/workflows?id=${newWorkflow.id}`);
        alert("Workflow created successfully!");
      }
    } catch (error) {
      console.error("Failed to save workflow:", error);
      alert("Failed to save workflow");
    } finally {
      setIsSaving(false);
    }
  }, [
    workflowId,
    workflowName,
    workflowDescription,
    convertToApiFormat,
    updateWorkflow,
    createWorkflow,
    router,
    isSaving,
  ]);

  // Publish workflow
  const handlePublish = useCallback(async () => {
    if (!workflowId) {
      alert("Please save the workflow first");
      return;
    }

    if (!validation.isValid) {
      alert(`Cannot publish: ${validation.errors.join(", ")}`);
      return;
    }

    try {
      await handleSave(); // Save first
      await publishWorkflow.mutateAsync(workflowId);
      alert("Workflow published successfully!");
    } catch (error) {
      console.error("Failed to publish workflow:", error);
      alert("Failed to publish workflow");
    }
  }, [workflowId, validation, handleSave, publishWorkflow]);

  const handleInsertNode = useCallback(
    (edgeId: string) => {
      let createdNodeId: string | null = null;

      setEdgesRaw((prevEdges) => {
        const edge = prevEdges.find((item) => item.id === edgeId);
        if (!edge) return prevEdges;

        const sourceNode = nodes.find((node) => node.id === edge.source);
        const targetNode = nodes.find((node) => node.id === edge.target);
        if (!sourceNode || !targetNode) return prevEdges;

        const midpointX = sourceNode.position.x +
          (targetNode.position.x - sourceNode.position.x) / 2;
        const midpointY = sourceNode.position.y +
          (targetNode.position.y - sourceNode.position.y) / 2;

        const timestamp = Date.now();
        const newNodeId = `step-${timestamp}`;
        createdNodeId = newNodeId;

        // Create standard input/output connectors for inserted nodes
        const connectors = getDefaultConnectors(newNodeId, "data");

        const newNode: FlowNode = {
          id: newNodeId,
          type: "step",
          position: { x: midpointX, y: midpointY },
          data: {
            label: "New step",
            subtitle: "Describe this connector",
            accent: "blue",
            icon: Sparkles,
            chipText: "Inserted",
            status: "attention",
            helperText: "Select to configure this step.",
            config: {},
            configFields: [],
            connectors,
          },
        };

        // Update nodes
        setNodes((prevNodes) => [...prevNodes, newNode]);

        const remainingEdges = prevEdges.filter((item) => item.id !== edgeId);

        const firstEdge: FlowEdge = {
          id: `${edge.source}-${newNodeId}-${timestamp}`,
          source: edge.source,
          sourceHandle: edge.sourceHandle,
          target: newNodeId,
          targetHandle: `${newNodeId}-in`,
          type: "smoothstep",
        };

        const secondEdge: FlowEdge = {
          id: `${newNodeId}-${edge.target}-${timestamp + 1}`,
          source: newNodeId,
          sourceHandle: `${newNodeId}-out`,
          target: edge.target,
          targetHandle: edge.targetHandle,
          type: "smoothstep",
        };

        return [...remainingEdges, firstEdge, secondEdge];
      });

      if (createdNodeId) {
        setSelectedNodeId(createdNodeId);
      }
    },
    [nodes, setSelectedNodeId],
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((prevNodes) => applyNodeChanges(changes, prevNodes));
    },
    [],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdgesRaw((prevEdges) => applyEdgeChanges(changes, prevEdges));
    },
    [],
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdgesRaw((prevEdges) => addEdge(connection, prevEdges));
    },
    [],
  );

  const handleNodeClick = useCallback((_: unknown, node: FlowNode) => {
    setSelectedNodeId(node.id);
  }, []);

  const simulateExecution = useCallback(async () => {
    if (simulationState.status === "running") {
      return;
    }

    const flowNodes = nodes;
    const flowEdges = edgesRaw;

    if (flowNodes.length === 0) {
      setSimulationState({
        status: "success",
        logs: [],
        completedAt: new Date().toISOString(),
      });
      return;
    }

    setSimulationState({ status: "running", logs: [], completedAt: undefined });

    for (let index = 0; index < flowNodes.length; index += 1) {
      const node = flowNodes[index];
      const downstream = flowEdges.filter((edge) =>
        edge.source === node.id
      ).length;

      setSimulationState((prev) => ({
        status: "running",
        logs: [
          ...prev.logs,
          {
            step: index + 1,
            nodeId: node.id,
            label: node.data.label,
            subtitle: node.data.subtitle,
            status: "executing",
            downstream,
          },
        ],
      }));

      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 220));

      setSimulationState((prev) => ({
        status: "running",
        logs: prev.logs.map((entry, entryIndex) =>
          entryIndex === index ? { ...entry, status: "complete" } : entry
        ),
      }));
    }

    setSimulationState((prev) => ({
      ...prev,
      status: "success",
      completedAt: new Date().toISOString(),
    }));
  }, [nodes, edgesRaw, simulationState.status]);

  const decoratedEdges = useMemo(
    () =>
      edgesRaw.map((edge) => ({
        ...edge,
        type: "configEdge",
        data: {
          ...edge.data,
          onInsert: handleInsertNode,
        },
        markerEnd: `url(#${EDGE_MARKER_ID})`,
        style: {
          ...defaultEdgeStyle,
          ...edge.style,
        },
      })),
    [edgesRaw, handleInsertNode],
  );

  const simulationCompletedLabel = useMemo(() => {
    if (!simulationState.completedAt) {
      return null;
    }

    return new Date(simulationState.completedAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [simulationState.completedAt]);

  const updateNodeConfig = useCallback(
    (nodeId: string, fieldId: string, value: string) => {
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === nodeId
            ? {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  [fieldId]: value,
                },
              },
            }
            : node
        )
      );
    },
    [],
  );

  const handleConnectorActionSelect = useCallback(
    async (nodeId: string, data: {
      connectorId: string;
      actionId: string;
      integrationId: string;
      connectorName: string;
      actionName: string;
      integrationName: string;
    }) => {
      // Fetch the action details to get parameters
      try {
        const actionDetails = await getConnectorAction(
          data.connectorId,
          data.actionId,
        );

        // Convert action parameters to config fields
        const actionConfigFields: NodeConfigField[] =
          actionDetails.parameters?.map((param) => ({
            id: param.name,
            label: param.name.split("_").map((w) =>
              w.charAt(0).toUpperCase() + w.slice(1)
            ).join(" "),
            type: param.type === "integer"
              ? "text"
              : param.type === "string"
              ? "text"
              : "textarea",
            required: param.required,
            placeholder: param.description,
            helperText: param.description,
          })) || [];

        setNodes((prevNodes) =>
          prevNodes.map((node) =>
            node.id === nodeId
              ? {
                ...node,
                data: {
                  ...node.data,
                  subtitle: `${data.connectorName} - ${data.actionName}`,
                  status: node.data.status === "attention"
                    ? "pending"
                    : node.data.status,
                  config: {
                    ...node.data.config,
                    connectorId: data.connectorId,
                    actionId: data.actionId,
                    integrationId: data.integrationId,
                    connectorName: data.connectorName,
                    actionName: data.actionName,
                    integrationName: data.integrationName,
                  },
                  configFields: actionConfigFields,
                },
              }
              : node
          )
        );
        setShowConnectorWarning(false);
      } catch (error) {
        console.error("Failed to fetch action details:", error);
        // Still update with basic info even if action fetch fails
        setNodes((prevNodes) =>
          prevNodes.map((node) =>
            node.id === nodeId
              ? {
                ...node,
                data: {
                  ...node.data,
                  subtitle: `${data.connectorName} - ${data.actionName}`,
                  status: node.data.status === "attention"
                    ? "pending"
                    : node.data.status,
                  config: {
                    ...node.data.config,
                    connectorId: data.connectorId,
                    actionId: data.actionId,
                    integrationId: data.integrationId,
                    connectorName: data.connectorName,
                    actionName: data.actionName,
                    integrationName: data.integrationName,
                  },
                },
              }
              : node
          )
        );
        setShowConnectorWarning(false);
      }
    },
    [setShowConnectorWarning],
  );

  const addNodeFromTemplate = useCallback(
    (templateId: string) => {
      // Find template from backend node types or fallback to local templates
      let template: NodeTemplate | undefined;
      let backendNodeDef: NodeTypeDefinition | undefined;

      if (nodeTypesData) {
        // Search in all backend node type categories
        const allBackendNodes = [
          ...nodeTypesData.trigger,
          ...nodeTypesData.action,
          ...nodeTypesData.data,
          ...nodeTypesData.logic,
          ...nodeTypesData.ai,
        ];
        backendNodeDef = allBackendNodes.find((n) => n.id === templateId);
      }

      // If found in backend, convert to NodeTemplate format
      if (backendNodeDef) {
        template = {
          id: backendNodeDef.id,
          label: backendNodeDef.label,
          subtitle: backendNodeDef.service_type || backendNodeDef.description,
          category: backendNodeDef.category,
          accent: getAccentForCategory(backendNodeDef.category),
          icon: getIconForCategory(backendNodeDef.category),
          chipText: getChipTextForCategory(backendNodeDef.category),
          description: backendNodeDef.description,
          defaultConfig: {},
          configFields: backendNodeDef.fields.map((field) => ({
            id: field.id,
            label: field.label,
            type: field.type === "number"
              ? "text"
              : field.type as "text" | "email" | "textarea" | "multi",
            required: field.required,
            placeholder: field.placeholder,
            helperText: field.helperText,
          })),
          requiresConnectorSelection: Boolean(backendNodeDef.service_type),
        };
      } else {
        // Fallback to local template
        template = nodeTemplates.find((t) => t.id === templateId);
      }

      if (!template) return;

      let createdNodeId: string | null = null;
      let newPosition = { x: 50, y: 250 };

      // Find the last node to connect to (Zapier-style sequential linking)
      const lastNodeInfo = findLastConnectableNode(nodes, edgesRaw);

      // Calculate position based on last node
      newPosition = calculateNewNodePosition(lastNodeInfo);

      const timestamp = Date.now();
      const newNodeId = `${template.id}-${timestamp}`;
      createdNodeId = newNodeId;

      // Determine appropriate connectors for this node type
      const logicType = template.id === "filter"
        ? "filter"
        : template.id === "loop"
        ? "loop"
        : undefined;
      const connectors = getDefaultConnectors(
        newNodeId,
        template.category,
        logicType,
      );

      const newNode: FlowNode = {
        id: newNodeId,
        type: "step",
        position: newPosition,
        data: {
          label: template.label,
          subtitle: template.subtitle,
          accent: template.accent,
          icon: template.icon,
          chipText: template.chipText,
          helperText: template.description,
          config: { ...template.defaultConfig },
          configFields: template.configFields.map((field) => ({ ...field })),
          connectors,
          requiresConnectorSelection: template.requiresConnectorSelection ??
            false,
          serviceType: backendNodeDef?.service_type, // Add service type for connector filtering
        },
      };

      // Add the new node
      setNodes((prevNodes) => [...prevNodes, newNode]);

      // Auto-connect to the last node (Zapier-style)
      if (lastNodeInfo) {
        const targetConnector = connectors.find((c) => c.type === "target");
        if (targetConnector) {
          const newEdge: FlowEdge = {
            id: `${lastNodeInfo.node.id}-${newNodeId}-${timestamp}`,
            source: lastNodeInfo.node.id,
            sourceHandle: lastNodeInfo.sourceHandle,
            target: newNodeId,
            targetHandle: targetConnector.id,
            type: "smoothstep",
          };
          setEdgesRaw((prevEdges) => [...prevEdges, newEdge]);
        }
      }

      if (createdNodeId) {
        setSelectedNodeId(createdNodeId);
        // Pan to the new node with smooth animation
        setTimeout(() => {
          setCenter(newPosition.x, newPosition.y, {
            zoom: 1,
            duration: 800,
          });
        }, 100);
      }
    },
    [nodes, edgesRaw, nodeTypesData, setCenter],
  );

  return (
    <div className="min-h-screen bg-[#0A0B14] text-white">
      <div className="mx-auto flex max-full flex-col gap-6 px-6 py-8">
        {/* Header with navigation and actions */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Link href="/dashboard/workflows/list">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <Input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="text-2xl font-bold tracking-tight bg-transparent border-none px-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Workflow name"
              />
              <Input
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                className="mt-1 text-sm text-white/60 bg-transparent border-none px-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Add a description..."
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleSave}
              disabled={isSaving || isLoadingWorkflow}
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : workflowId ? "Save" : "Create"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={simulateExecution}
              disabled={simulationState.status === "running"}
            >
              <Sparkles className="h-4 w-4" />
              {simulationState.status === "running"
                ? "Simulating…"
                : "Simulate"}
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={handlePublish}
              disabled={!validation.isValid || !workflowId || isSaving}
              title={!validation.isValid
                ? `Cannot publish: ${validation.errors.length} error(s) must be fixed`
                : "Publish workflow"}
            >
              <Save className="h-4 w-4" />
              Publish
              {validation.errors.length > 0 && (
                <Badge className="ml-1 h-4 rounded-full bg-red-500/20 px-1.5 text-[10px] text-red-300">
                  {validation.errors.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {isLoadingWorkflow && workflowId && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-4 text-sm text-white/60">Loading workflow...</p>
            </div>
          </div>
        )}

        {/* Main content */}
        {(!isLoadingWorkflow || !workflowId) && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <FlowValidation nodes={nodes} edges={decoratedEdges} />

              <Card className="border-white/10 bg-[#101322]">
                <CardContent className="h-[76vh] overflow-hidden rounded-2xl border border-white/5 bg-[#0C0F1C]">
                  <div className="relative h-full">
                    <svg width="0" height="0" className="absolute">
                      <defs>
                        <marker
                          id={EDGE_MARKER_ID}
                          markerWidth="20"
                          markerHeight="20"
                          viewBox="0 0 20 20"
                          refX="18"
                          refY="10"
                          orient="auto"
                          markerUnits="strokeWidth"
                        >
                          <path
                            d="M4 4 L4 16 L16 10 Z"
                            fill="#7F8BFF"
                            stroke="#7F8BFF"
                            strokeWidth="1"
                            strokeLinejoin="round"
                          />
                        </marker>
                      </defs>
                    </svg>
                    <ReactFlow
                      nodes={nodes}
                      edges={decoratedEdges}
                      edgeTypes={edgeTypes}
                      nodeTypes={nodeTypes}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      onConnect={onConnect}
                      onNodeClick={handleNodeClick}
                      fitView
                      className="react-flow-dark"
                    >
                      <Background gap={20} size={1} color="#1E2236" />
                      <MiniMap
                        className="!bg-[#0F1324]"
                        pannable
                        zoomable
                        nodeColor={minimapNodeColor}
                      />
                      <Controls className="border-white/10 bg-[#11152A]/80 text-white" />
                    </ReactFlow>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-white/10 bg-[#101322]">
              <CardHeader className="pb-4">
                <div>
                  <CardTitle className="text-base">
                    {selectedNode &&
                        selectedNode.data.requiresConnectorSelection &&
                        !selectedNode.data.config.actionId
                      ? `Configure ${selectedNode.data.label}`
                      : "Node Library"}
                  </CardTitle>
                  <CardDescription>
                    {selectedNode &&
                        selectedNode.data.requiresConnectorSelection &&
                        !selectedNode.data.config.actionId
                      ? "Select an integration and action"
                      : "Click to add connectors to your workflow"}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="max-h-[68vh] space-y-3 overflow-y-auto pr-2">
                {selectedNode && selectedNode.data.requiresConnectorSelection &&
                    !selectedNode.data.config.actionId
                  ? (
                    /* Show Connector Action Selector when node needs configuration */
                    <ConnectorActionSelector
                      nodeId={selectedNode.id}
                      serviceType={selectedNode.data.serviceType}
                      nodeDefinition={nodeTypesData
                        ? [
                          ...nodeTypesData.trigger,
                          ...nodeTypesData.action,
                          ...nodeTypesData.data,
                          ...nodeTypesData.logic,
                          ...nodeTypesData.ai,
                        ].find((n) => n.id === selectedNode.data.serviceType)
                        : undefined}
                      currentSelection={{
                        connectorId: selectedNode.data.config.connectorId,
                        actionId: selectedNode.data.config.actionId,
                        integrationId: selectedNode.data.config.integrationId,
                      }}
                      onSelect={(data) =>
                        handleConnectorActionSelect(selectedNode.id, data)}
                    />
                  )
                  : isLoadingNodeTypes
                  ? (
                    /* Loading state */
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-3 border-solid border-current border-r-transparent" />
                        <p className="mt-2 text-xs text-white/40">
                          Loading node types...
                        </p>
                      </div>
                    </div>
                  )
                  : nodeTypesData
                  ? (
                    /* Node Library */
                    ["trigger", "data", "logic", "ai", "action"].map(
                      (category) => {
                        const categoryKey =
                          category as keyof typeof nodeTypesData;
                        const categoryNodes = nodeTypesData[categoryKey] || [];

                        if (categoryNodes.length === 0) return null;

                        return (
                          <div key={category}>
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">
                              {category}
                            </h3>
                            <div className="space-y-2">
                              {categoryNodes.map((nodeDef) => {
                                const Icon = getIconForCategory(
                                  nodeDef.category,
                                );
                                const accent = accentStyles[
                                  getAccentForCategory(nodeDef.category)
                                ];

                                return (
                                  <button
                                    key={nodeDef.id}
                                    onClick={() =>
                                      addNodeFromTemplate(nodeDef.id)}
                                    className={cn(
                                      "group w-full rounded-xl border p-3 text-left transition-all",
                                      nodeDef.activated
                                        ? "border-white/10 bg-[#0C0F1C] hover:border-white/20 hover:bg-[#121527]"
                                        : "border-white/5 bg-[#0C0F1C]/50 hover:border-white/10 hover:bg-[#0C0F1C]",
                                    )}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div
                                        className={cn(
                                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                                          accent.icon,
                                          !nodeDef.activated && "opacity-50",
                                        )}
                                      >
                                        {nodeDef.icon
                                          ? (
                                            <span className="text-lg">
                                              {nodeDef.icon}
                                            </span>
                                          )
                                          : <Icon className="h-4 w-4" />}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p
                                            className={cn(
                                              "text-sm font-semibold",
                                              nodeDef.activated
                                                ? "text-white"
                                                : "text-white/50",
                                            )}
                                          >
                                            {nodeDef.label}
                                          </p>
                                          <Badge
                                            className={cn(
                                              "h-5 rounded-md px-2 text-[10px] font-medium",
                                              accent.chip,
                                              !nodeDef.activated &&
                                                "opacity-50",
                                            )}
                                          >
                                            {getChipTextForCategory(
                                              nodeDef.category,
                                            )}
                                          </Badge>
                                          {nodeDef.activated === false && (
                                            <Badge className="h-5 rounded-md px-2 text-[10px] font-medium bg-amber-500/15 text-amber-300 border-amber-500/20">
                                              No Integration
                                            </Badge>
                                          )}
                                        </div>
                                        {nodeDef.service_type && (
                                          <p
                                            className={cn(
                                              "mt-0.5 text-xs",
                                              nodeDef.activated
                                                ? "text-white/50"
                                                : "text-white/30",
                                            )}
                                          >
                                            {nodeDef.service_type}
                                          </p>
                                        )}
                                        <p
                                          className={cn(
                                            "mt-1 text-xs",
                                            nodeDef.activated
                                              ? "text-white/40"
                                              : "text-white/25",
                                          )}
                                        >
                                          {nodeDef.description}
                                        </p>
                                        {nodeDef.activated === false && (
                                          <p className="mt-2 text-xs text-amber-300/70">
                                            → Create integration first
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      },
                    )
                  )
                  : (
                    ["trigger", "data", "logic", "ai", "action"].map(
                      (category) => {
                        const categoryNodes = nodeTemplates.filter(
                          (template) => template.category === category,
                        );

                        if (categoryNodes.length === 0) return null;

                        return (
                          <div key={category}>
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">
                              {category}
                            </h3>
                            <div className="space-y-2">
                              {categoryNodes.map((template) => {
                                const Icon = template.icon;
                                const accent = accentStyles[template.accent];

                                return (
                                  <button
                                    key={template.id}
                                    onClick={() =>
                                      addNodeFromTemplate(template.id)}
                                    className="group w-full rounded-xl border border-white/10 bg-[#0C0F1C] p-3 text-left transition-all hover:border-white/20 hover:bg-[#121527]"
                                  >
                                    <div className="flex items-start gap-3">
                                      <div
                                        className={cn(
                                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                                          accent.icon,
                                        )}
                                      >
                                        <Icon className="h-4 w-4" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p className="text-sm font-semibold text-white">
                                            {template.label}
                                          </p>
                                          <Badge
                                            className={cn(
                                              "h-5 rounded-md px-2 text-[10px] font-medium",
                                              accent.chip,
                                            )}
                                          >
                                            {template.chipText}
                                          </Badge>
                                        </div>
                                        <p className="mt-0.5 text-xs text-white/50">
                                          {template.subtitle}
                                        </p>
                                        <p className="mt-1 text-xs text-white/40">
                                          {template.description}
                                        </p>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      },
                    )
                  )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
