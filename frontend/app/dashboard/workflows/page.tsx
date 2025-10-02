"use client";

import type { CSSProperties, MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Handle,
  Controls,
  MiniMap,
  Position,
  ReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type EdgeProps,
  type Node,
  type NodeChange,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  getBezierPath,
} from "reactflow";
import "reactflow/dist/style.css";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle,
  Clock3,
  Copy,
  Database,
  FileText,
  Filter,
  GitBranch,
  Repeat,
  Mail,
  MessageSquare,
  Play,
  Plus,
  Save,
  Settings,
  Sparkles,
  Table,
  Trash2,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { cn } from "@/lib/utils";

const flowStatusStyles: Record<string, string> = {
  published: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  draft: "bg-slate-500/20 text-slate-300 border-slate-500/20",
  paused: "bg-amber-500/15 text-amber-200 border-amber-500/20",
};

const accentStyles: Record<
  "violet" | "green" | "aqua" | "pink" | "red" | "blue",
  { chip: string; icon: string }
> = {
  violet: {
    chip: "bg-[#F1E9FF]/80 text-[#6D3BFF]",
    icon: "bg-[#6D3BFF]/15 text-[#C5B5FF]",
  },
  green: {
    chip: "bg-[#E7F7EF] text-[#17A673]",
    icon: "bg-[#17A673]/15 text-[#6BE0B5]",
  },
  aqua: {
    chip: "bg-[#E6F4FF] text-[#0A84FF]",
    icon: "bg-[#0A84FF]/15 text-[#6EC1FF]",
  },
  pink: {
    chip: "bg-[#FDE9F4] text-[#D34292]",
    icon: "bg-[#D34292]/15 text-[#F8A8D2]",
  },
  red: {
    chip: "bg-[#FDEBEC] text-[#E15765]",
    icon: "bg-[#E15765]/15 text-[#F9A5AC]",
  },
  blue: {
    chip: "bg-[#E9F0FF] text-[#3A6DFF]",
    icon: "bg-[#3A6DFF]/15 text-[#9BB6FF]",
  },
};

interface NodeConfigField {
  id: string;
  label: string;
  type: "text" | "email" | "multi" | "textarea";
  required?: boolean;
  placeholder?: string;
  helperText?: string;
}

interface NodeConnector {
  id: string;
  type: "source" | "target";
  position: Position;
  label?: string;
  labelPlacement?: "before" | "after";
  style?: CSSProperties;
}

interface StepNodeData {
  label: string;
  subtitle: string;
  accent: keyof typeof accentStyles;
  icon: LucideIcon;
  status?: "complete" | "pending" | "attention";
  helperText?: string;
  chipText?: string;
  config: Record<string, string>;
  configFields?: NodeConfigField[];
  connectors?: NodeConnector[];
}

type FlowNode = Node<StepNodeData>;
type FlowEdge = Edge;

type SimulationStatus = "idle" | "running" | "success";

interface SimulationLogEntry {
  step: number;
  nodeId: string;
  label: string;
  subtitle?: string;
  status: "executing" | "complete";
  downstream: number;
}

interface FlowDefinition {
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

const initialFlows: FlowDefinition[] = [
  {
    id: "flow-upsell",
    name: "Automate Sending Upsell Offers",
    category: "Care navigation",
    summary: "Review weekly patient cohorts, craft contextual upsell messaging, and deliver through Gmail.",
    cadence: "Every week on Monday 08:00",
    status: "draft",
    lastDeployed: "Never",
    nodes: [
      {
        id: "schedule",
        type: "step",
        position: { x: 420, y: 80 },
        data: {
          label: "Every Week",
          subtitle: "Schedule",
          accent: "violet",
          icon: Clock3,
          chipText: "Trigger",
          connectors: [
            {
              id: "schedule-out",
              type: "source",
              position: Position.Bottom,
              label: "Next step",
            },
          ],
          config: {
            cadence: "Weekly",
            day: "Monday",
            time: "08:00 AM",
          },
          configFields: [
            { id: "cadence", label: "Cadence", type: "text", required: true, placeholder: "Weekly" },
            { id: "day", label: "Day", type: "text", placeholder: "Monday" },
            { id: "time", label: "Time", type: "text", placeholder: "08:00 AM" },
          ],
        },
      },
      {
        id: "sheet",
        type: "step",
        position: { x: 420, y: 200 },
        data: {
          label: "Get next row(s)",
          subtitle: "Google Sheets",
          accent: "green",
          icon: Table,
          chipText: "Data",
          helperText: "Use filter to fetch only new opportunities",
          connectors: [
            {
              id: "sheet-in",
              type: "target",
              position: Position.Top,
              label: "Schedule",
            },
            {
              id: "sheet-out",
              type: "source",
              position: Position.Bottom,
              label: "Rows",
            },
          ],
          config: {
            sheetUrl: "https://docs.google.com/spreadsheets/...",
            worksheet: "Upsell Opportunities",
            range: "A:E",
          },
          configFields: [
            {
              id: "sheetUrl",
              label: "Sheet URL",
              type: "text",
              required: true,
              placeholder: "https://docs.google.com/...",
            },
            {
              id: "worksheet",
              label: "Worksheet",
              type: "text",
              placeholder: "Upsell Opportunities",
            },
            {
              id: "range",
              label: "Range",
              type: "text",
              placeholder: "A:E",
            },
          ],
        },
      },
      {
        id: "loop",
        type: "step",
        position: { x: 420, y: 320 },
        data: {
          label: "Loop on Items",
          subtitle: "For each patient",
          accent: "aqua",
          icon: Repeat,
          chipText: "Logic",
          connectors: [
            {
              id: "loop-in",
              type: "target",
              position: Position.Top,
              label: "Rows",
            },
            {
              id: "loop-iterate",
              type: "source",
              position: Position.Right,
              label: "Each item",
              style: { top: "38%" },
              labelPlacement: "after",
            },
            {
              id: "loop-complete",
              type: "source",
              position: Position.Bottom,
              label: "After loop",
            },
          ],
          config: {
            iterator: "rows",
            concurrency: "Sequential",
          },
          configFields: [
            {
              id: "iterator",
              label: "Iterator",
              type: "text",
              placeholder: "rows",
            },
            {
              id: "concurrency",
              label: "Concurrency",
              type: "text",
              placeholder: "Sequential",
            },
          ],
        },
      },
      {
        id: "ai",
        type: "step",
        position: { x: 640, y: 420 },
        data: {
          label: "Ask AI",
          subtitle: "Text AI",
          accent: "pink",
          icon: Sparkles,
          chipText: "Agent",
          helperText: "Use clinical tone guidelines for messaging",
          connectors: [
            {
              id: "ai-in",
              type: "target",
              position: Position.Left,
              label: "Item",
              style: { top: "45%" },
            },
            {
              id: "ai-out",
              type: "source",
              position: Position.Bottom,
              label: "Draft",
            },
          ],
          config: {
            prompt:
              "Craft an upsell email for the patient using the supplied fields and follow the tone guide.",
            temperature: "0.4",
          },
          configFields: [
            {
              id: "prompt",
              label: "Prompt",
              type: "textarea",
              required: true,
              placeholder: "Write an email explaining...",
            },
            {
              id: "temperature",
              label: "Creativity",
              type: "text",
              placeholder: "0.4",
            },
          ],
        },
      },
      {
        id: "email",
        type: "step",
        position: { x: 420, y: 500 },
        data: {
          label: "Send Email",
          subtitle: "Gmail",
          accent: "red",
          icon: Mail,
          status: "attention",
          helperText: "Connect Gmail and map fields before publishing",
          chipText: "Action",
          connectors: [
            {
              id: "email-in-loop",
              type: "target",
              position: Position.Left,
              label: "Recipient",
              style: { top: "62%" },
            },
            {
              id: "email-in-content",
              type: "target",
              position: Position.Top,
              label: "Content",
            },
            {
              id: "email-out",
              type: "source",
              position: Position.Bottom,
              label: "Send",
            },
          ],
          config: {
            connection: "",
            to: "",
            cc: "",
            bcc: "",
            subject: "",
          },
          configFields: [
            {
              id: "connection",
              label: "Connection",
              type: "text",
              required: true,
              placeholder: "Select Gmail connection",
            },
            { id: "to", label: "Receiver Email (To)", type: "email", required: true },
            { id: "cc", label: "CC Email", type: "multi" },
            { id: "bcc", label: "BCC Email", type: "multi" },
            { id: "subject", label: "Subject", type: "text", required: true },
          ],
        },
      },
    ],
    edges: [
      {
        id: "schedule-sheet",
        source: "schedule",
        sourceHandle: "schedule-out",
        target: "sheet",
        targetHandle: "sheet-in",
        type: "smoothstep",
      },
      {
        id: "sheet-loop",
        source: "sheet",
        sourceHandle: "sheet-out",
        target: "loop",
        targetHandle: "loop-in",
        type: "smoothstep",
      },
      {
        id: "loop-ai",
        source: "loop",
        sourceHandle: "loop-iterate",
        target: "ai",
        targetHandle: "ai-in",
        type: "smoothstep",
      },
      {
        id: "loop-email",
        source: "loop",
        sourceHandle: "loop-complete",
        target: "email",
        targetHandle: "email-in-loop",
        type: "smoothstep",
      },
      {
        id: "ai-email",
        source: "ai",
        sourceHandle: "ai-out",
        target: "email",
        targetHandle: "email-in-content",
        type: "smoothstep",
      },
    ],
  },
  {
    id: "flow-critical-labs",
    name: "Escalate Critical Lab Results",
    category: "Clinical safety",
    summary: "Detect critical lab values, alert the covering provider, and document the intervention.",
    cadence: "Runs continuously on lab events",
    status: "published",
    lastDeployed: "2025-08-24 11:14",
    nodes: [
      {
        id: "trigger-lab",
        type: "step",
        position: { x: 420, y: 80 },
        data: {
          label: "On Lab Result",
          subtitle: "Epic event",
          accent: "blue",
          icon: Database,
          chipText: "Trigger",
          connectors: [
            {
              id: "trigger-lab-out",
              type: "source",
              position: Position.Bottom,
              label: "Result",
            },
          ],
          config: {
            event: "Observation.create",
            facility: "Emergency",
          },
          configFields: [
            { id: "event", label: "Event", type: "text", required: true },
            { id: "facility", label: "Facility", type: "text" },
          ],
        },
      },
      {
        id: "filter-critical",
        type: "step",
        position: { x: 420, y: 200 },
        data: {
          label: "Filter critical values",
          subtitle: "Threshold > limit",
          accent: "aqua",
          icon: Filter,
          chipText: "Logic",
          connectors: [
            {
              id: "filter-in",
              type: "target",
              position: Position.Top,
              label: "Lab result",
            },
            {
              id: "filter-true",
              type: "source",
              position: Position.Right,
              label: "Critical",
              style: { top: "42%" },
            },
            {
              id: "filter-false",
              type: "source",
              position: Position.Left,
              label: "Else",
              style: { top: "62%" },
            },
          ],
          config: {
            expression: "result.flag === 'critical'",
          },
          configFields: [
            {
              id: "expression",
              label: "Filter expression",
              type: "text",
              placeholder: "result.flag === 'critical'",
            },
          ],
        },
      },
      {
        id: "notify",
        type: "step",
        position: { x: 420, y: 320 },
        data: {
          label: "Notify covering provider",
          subtitle: "PagerDuty + SMS",
          accent: "pink",
          icon: MessageSquare,
          chipText: "Action",
          connectors: [
            {
              id: "notify-in",
              type: "target",
              position: Position.Top,
              label: "Critical",
            },
            {
              id: "notify-out",
              type: "source",
              position: Position.Bottom,
              label: "Alert",
            },
          ],
          config: {
            channel: "On-call SMS",
            fallback: "PagerDuty escalation",
          },
          configFields: [
            { id: "channel", label: "Primary Channel", type: "text" },
            { id: "fallback", label: "Fallback", type: "text" },
          ],
        },
      },
      {
        id: "ai-note",
        type: "step",
        position: { x: 420, y: 440 },
        data: {
          label: "Draft clinical note",
          subtitle: "AI summarization",
          accent: "violet",
          icon: Bot,
          chipText: "Agent",
          connectors: [
            {
              id: "ai-note-in",
              type: "target",
              position: Position.Top,
              label: "Alert",
            },
            {
              id: "ai-note-out",
              type: "source",
              position: Position.Bottom,
              label: "Draft",
            },
          ],
          config: {
            template: "Document alert, response, and patient outreach",
          },
          configFields: [
            { id: "template", label: "Template", type: "textarea" },
          ],
        },
      },
      {
        id: "file",
        type: "step",
        position: { x: 420, y: 560 },
        data: {
          label: "Attach to chart",
          subtitle: "Epic SmartDoc",
          accent: "green",
          icon: FileText,
          status: "complete",
          chipText: "Action",
          connectors: [
            {
              id: "file-in",
              type: "target",
              position: Position.Top,
              label: "Summary",
            },
            {
              id: "file-out",
              type: "source",
              position: Position.Bottom,
              label: "Chart",
            },
          ],
          config: {
            encounterType: "ED Follow-up",
          },
          configFields: [
            { id: "encounterType", label: "Encounter Type", type: "text" },
          ],
        },
      },
    ],
    edges: [
      {
        id: "lab-filter",
        source: "trigger-lab",
        sourceHandle: "trigger-lab-out",
        target: "filter-critical",
        targetHandle: "filter-in",
        type: "smoothstep",
      },
      {
        id: "filter-notify",
        source: "filter-critical",
        sourceHandle: "filter-true",
        target: "notify",
        targetHandle: "notify-in",
        type: "smoothstep",
      },
      {
        id: "notify-note",
        source: "notify",
        sourceHandle: "notify-out",
        target: "ai-note",
        targetHandle: "ai-note-in",
        type: "smoothstep",
      },
      {
        id: "note-file",
        source: "ai-note",
        sourceHandle: "ai-note-out",
        target: "file",
        targetHandle: "file-in",
        type: "smoothstep",
      },
    ],
  },
];

interface FlowStateValue {
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

const CONNECTOR_OFFSET = 14;

const connectorBaseStyle: Record<Position, CSSProperties> = {
  [Position.Top]: { top: -CONNECTOR_OFFSET, left: "50%", transform: "translate(-50%, 0)" },
  [Position.Bottom]: { bottom: -CONNECTOR_OFFSET, left: "50%", transform: "translate(-50%, 0)" },
  [Position.Left]: { left: -CONNECTOR_OFFSET, top: "50%", transform: "translate(0, -50%)" },
  [Position.Right]: { right: -CONNECTOR_OFFSET, top: "50%", transform: "translate(0, -50%)" },
};

const defaultConnectorLabelPlacement: Record<Position, "before" | "after"> = {
  [Position.Top]: "before",
  [Position.Bottom]: "after",
  [Position.Left]: "before",
  [Position.Right]: "after",
};

const StepNode = ({ id, data }: { id: string; data: StepNodeData }) => {
  const Icon = data.icon;
  const accent = accentStyles[data.accent];
  const connectors = data.connectors && data.connectors.length > 0
    ? data.connectors
    : ([
        { id: `${id}-in`, type: "target", position: Position.Top },
        { id: `${id}-out`, type: "source", position: Position.Bottom },
      ] satisfies NodeConnector[]);

  return (
    <div className="relative group rounded-2xl border border-white/12 bg-[#121527] px-4 py-3 shadow-lg shadow-black/30 transition-all duration-300">
      {connectors.map((connector) => {
        const placement = connector.labelPlacement ?? defaultConnectorLabelPlacement[connector.position];
        const isHorizontal = connector.position === Position.Left || connector.position === Position.Right;
        const wrapperStyle: CSSProperties = {
          ...connectorBaseStyle[connector.position],
          ...(connector.style ?? {}),
        };

        return (
          <div
            key={connector.id}
            style={wrapperStyle}
            className={cn(
              "absolute z-10 flex items-center",
              isHorizontal ? "gap-2" : "flex-col items-center gap-1"
            )}
          >
            {placement === "before" && connector.label ? (
              <span className="pointer-events-none rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                {connector.label}
              </span>
            ) : null}
            <Handle
              id={connector.id}
              type={connector.type}
              position={connector.position}
              style={{ position: "static" }}
              className="h-3 w-3 rounded-full border border-[#7C8DB5] bg-white shadow-[0_0_0_2px_rgba(12,16,28,0.95)]"
            />
            {placement === "after" && connector.label ? (
              <span className="pointer-events-none rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                {connector.label}
              </span>
            ) : null}
          </div>
        );
      })}

      <div className="flex items-start gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", accent.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-[160px] flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">{data.label}</p>
            {data.chipText ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  accent.chip
                )}
              >
                {data.chipText}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-white/60">{data.subtitle}</p>
          {data.helperText ? (
            <p className="mt-2 text-xs text-white/40">{data.helperText}</p>
          ) : null}
          {data.status === "attention" ? (
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              Requires configuration
            </div>
          ) : null}
          {data.status === "complete" ? (
            <div className="mt-2 flex items-center gap-1 text-xs text-emerald-300">
              <CheckCircle className="h-3.5 w-3.5" />
              Ready for publish
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const EDGE_MARKER_ID = "edge-arrow";
const defaultEdgeStyle: CSSProperties = {
  stroke: "#7F8BFF",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const ConfigEdge = ({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  style,
  markerEnd,
  data,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (data && typeof data.onInsert === "function") {
      data.onInsert(id);
    }
  };

  return (
    <>
      <path
        className="react-flow__edge-path"
        d={edgePath}
        style={{ ...defaultEdgeStyle, ...style }}
        markerEnd={markerEnd ?? `url(#${EDGE_MARKER_ID})`}
        fill="none"
      />
      <foreignObject
        width={28}
        height={28}
        x={labelX - 14}
        y={labelY - 14}
        className="overflow-visible"
      >
        <button
          type="button"
          onClick={handleClick}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-[#151A2D] text-white/70 shadow-md transition-colors hover:border-white/40 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </foreignObject>
    </>
  );
};

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
  const [activeFlowId, setActiveFlowId] = useState(initialFlows[0]?.id ?? "");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [flowState, setFlowState] = useState<Record<string, FlowStateValue>>(() =>
    initialFlows.reduce((memo, flow) => {
      memo[flow.id] = cloneFlow(flow);
      return memo;
    }, {} as Record<string, FlowStateValue>)
  );

  const [simulationState, setSimulationState] = useState<{
    status: SimulationStatus;
    logs: SimulationLogEntry[];
    completedAt?: string;
  }>({ status: "idle", logs: [] });

  const activeFlowDefinition = useMemo(
    () => initialFlows.find((flow) => flow.id === activeFlowId),
    [activeFlowId]
  );

  const activeState = flowState[activeFlowId];
  const nodes = activeState?.nodes ?? [];
  const edgesRaw = activeState?.edges ?? [];
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const edgeTypes = useMemo(() => ({ configEdge: ConfigEdge }), []);

  useEffect(() => {
    setSelectedNodeId((prev) => prev ?? nodes[0]?.id ?? null);
  }, [activeFlowId, flowState, nodes]);

  const handleInsertNode = useCallback(
    (edgeId: string) => {
      let createdNodeId: string | null = null;

      setFlowState((prev) => {
        const current = prev[activeFlowId];
        if (!current) return prev;

        const edge = current.edges.find((item) => item.id === edgeId);
        if (!edge) return prev;

        const sourceNode = current.nodes.find((node) => node.id === edge.source);
        const targetNode = current.nodes.find((node) => node.id === edge.target);
        if (!sourceNode || !targetNode) return prev;

        const midpointX = sourceNode.position.x + (targetNode.position.x - sourceNode.position.x) / 2;
        const midpointY = sourceNode.position.y + (targetNode.position.y - sourceNode.position.y) / 2;

        const timestamp = Date.now();
        const newNodeId = `step-${timestamp}`;
        createdNodeId = newNodeId;

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
          },
        };

        const remainingEdges = current.edges.filter((item) => item.id !== edgeId);

        const firstEdge: FlowEdge = {
          id: `${edge.source}-${newNodeId}-${timestamp}`,
          source: edge.source,
          sourceHandle: edge.sourceHandle,
          target: newNodeId,
          targetHandle: `${newNodeId}-in`,
        };

        const secondEdge: FlowEdge = {
          id: `${newNodeId}-${edge.target}-${timestamp + 1}`,
          source: newNodeId,
          sourceHandle: `${newNodeId}-out`,
          target: edge.target,
          targetHandle: edge.targetHandle,
        };

        return {
          ...prev,
          [activeFlowId]: {
            ...current,
            nodes: [...current.nodes, newNode],
            edges: [...remainingEdges, firstEdge, secondEdge],
          },
        };
      });

      if (createdNodeId) {
        setSelectedNodeId(createdNodeId);
      }
    },
    [activeFlowId, setSelectedNodeId]
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setFlowState((prev) => {
        const current = prev[activeFlowId];
        if (!current) return prev;
        return {
          ...prev,
          [activeFlowId]: {
            ...current,
            nodes: applyNodeChanges(changes, current.nodes),
          },
        };
      });
    },
    [activeFlowId]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setFlowState((prev) => {
        const current = prev[activeFlowId];
        if (!current) return prev;
        return {
          ...prev,
          [activeFlowId]: {
            ...current,
            edges: applyEdgeChanges(changes, current.edges),
          },
        };
      });
    },
    [activeFlowId]
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setFlowState((prev) => {
        const current = prev[activeFlowId];
        if (!current) return prev;
        return {
          ...prev,
          [activeFlowId]: {
            ...current,
            edges: addEdge(connection, current.edges),
          },
        };
      });
    },
    [activeFlowId]
  );

  const handleNodeClick = useCallback((_: unknown, node: FlowNode) => {
    setSelectedNodeId(node.id);
  }, []);

  const simulateExecution = useCallback(async () => {
    if (simulationState.status === "running") {
      return;
    }

    const current = flowState[activeFlowId];
    if (!current) {
      return;
    }

    const flowNodes = current.nodes;
    const flowEdges = current.edges;

    if (flowNodes.length === 0) {
      setSimulationState({ status: "success", logs: [], completedAt: new Date().toISOString() });
      return;
    }

    setSimulationState({ status: "running", logs: [], completedAt: undefined });

    for (let index = 0; index < flowNodes.length; index += 1) {
      const node = flowNodes[index];
      const downstream = flowEdges.filter((edge) => edge.source === node.id).length;

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
  }, [activeFlowId, flowState, simulationState.status]);

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
    [edgesRaw, handleInsertNode]
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
      setFlowState((prev) => {
        const current = prev[activeFlowId];
        if (!current) return prev;
        return {
          ...prev,
          [activeFlowId]: {
            ...current,
            nodes: current.nodes.map((node) =>
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
            ),
          },
        };
      });
    },
    [activeFlowId]
  );

  return (
    <div className="min-h-screen bg-[#0A0B14] text-white">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workflow Studio</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Compose hospital-grade automations by sequencing MCP servers, agentic AI, clinical systems,
              and communication channels.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <GitBranch className="h-4 w-4" />
              Version history
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Play className="h-4 w-4" />
              Test run
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={simulateExecution}
              disabled={simulationState.status === "running"}
            >
              <Sparkles className="h-4 w-4" />
              {simulationState.status === "running" ? "Simulating…" : "Simulate execute"}
            </Button>
            <Button size="sm" className="gap-2">
              <Save className="h-4 w-4" />
              Publish
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[260px_1fr_320px]">
          <Card className="border-white/10 bg-[#101322]">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Flows</CardTitle>
              <CardDescription>Switch between saved automations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full gap-2"
                onClick={() => {
                  const draftId = `draft-${Date.now()}`;
                  setFlowState((prev) => ({
                    ...prev,
                    [draftId]: cloneFlow(initialFlows[0]),
                  }));
                  initialFlows.push({ ...initialFlows[0], id: draftId, name: "Untitled workflow" });
                  setActiveFlowId(draftId);
                  setSelectedNodeId(null);
                }}
              >
                <Plus className="h-4 w-4" />
                New Workflow
              </Button>

              <Separator className="bg-white/10" />

              <div className="space-y-3">
                {initialFlows.map((flow) => (
                  <button
                    key={flow.id}
                    onClick={() => {
                      setActiveFlowId(flow.id);
                      setSelectedNodeId(null);
                    }}
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                      activeFlowId === flow.id
                        ? "border-white/25 bg-white/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">{flow.name}</p>
                      <Badge
                        className={cn(
                          "border px-2 py-0.5 text-[10px] uppercase tracking-wider",
                          flowStatusStyles[flow.status]
                        )}
                      >
                        {flow.status}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-white/50">{flow.summary}</p>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-white/35">
                      <span>{flow.cadence}</span>
                      <span>{flow.lastDeployed ?? "Never deployed"}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#101322]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    {activeFlowDefinition?.name ?? "Untitled workflow"}
                  </CardTitle>
                  <CardDescription>{activeFlowDefinition?.summary}</CardDescription>
                </div>
                <div className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                  Complete {nodes.filter((node) => node.data.status === "attention").length} step(s)
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/40">
                <span className="flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5" /> {activeFlowDefinition?.cadence ?? "Not scheduled"}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> Care team automation
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Draft not yet published
                </span>
              </div>
            </CardHeader>
            <CardContent className="h-[640px] overflow-hidden rounded-2xl border border-white/5 bg-[#0C0F1C]">
              <div className="relative h-full">
                <svg width="0" height="0" className="absolute">
                  <defs>
                    <marker
                      id={EDGE_MARKER_ID}
                      markerWidth="16"
                      markerHeight="16"
                      viewBox="0 0 16 16"
                      refX="13"
                      refY="8"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path
                        d="M2 2 L2 14 L14 8 Z"
                        fill="#7F8BFF"
                        stroke="#7F8BFF"
                        strokeWidth="1.5"
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

          <Card className="border-white/10 bg-[#101322]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Configuration</CardTitle>
                  <CardDescription>
                    {selectedNode ? selectedNode.data.label : "Select a node to edit"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 gap-2 px-2 text-xs">
                    <Copy className="h-3.5 w-3.5" /> Duplicate
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 gap-2 px-2 text-xs text-red-300">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedNode ? (
                <>
                  <div className="rounded-2xl border border-white/10 bg-[#0C0F1C] px-4 py-3">
                    <p className="text-sm font-semibold text-white">
                      {selectedNode.data.label}
                    </p>
                    <p className="text-xs text-white/50">
                      {selectedNode.data.subtitle}
                    </p>
                    {selectedNode.data.helperText ? (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/60">
                        <Sparkles className="h-3.5 w-3.5 text-white/50" />
                        {selectedNode.data.helperText}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    {selectedNode.data.configFields?.map((field) => {
                      const value = selectedNode.data.config[field.id] ?? "";
                      return (
                        <div key={field.id}>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-white/50">
                            {field.label}
                            {field.required ? <span className="text-rose-300"> *</span> : null}
                          </label>
                          {field.helperText ? (
                            <p className="mt-0.5 text-[11px] text-white/35">{field.helperText}</p>
                          ) : null}
                          {field.type === "textarea" ? (
                            <textarea
                              value={value}
                              onChange={(event) =>
                                updateNodeConfig(selectedNode.id, field.id, event.target.value)
                              }
                              placeholder={field.placeholder}
                              className="mt-2 min-h-[120px] w-full rounded-xl border border-white/12 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                            />
                          ) : (
                            <Input
                              type={field.type === "multi" ? "text" : field.type}
                              value={value}
                              placeholder={field.placeholder}
                              onChange={(event) =>
                                updateNodeConfig(selectedNode.id, field.id, event.target.value)
                              }
                              className="mt-2"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0C0F1C] p-4 text-xs text-white/50">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-3.5 w-3.5 text-white/40" />
                      Generate sample data
                    </div>
                    <p className="text-white/35">
                      Use recent runs to populate this step with a representative payload for rapid testing.
                    </p>
                    <Button variant="outline" size="sm" className="gap-1 text-xs">
                      Generate sample
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 text-center">
                  <Sparkles className="mb-3 h-10 w-10 text-white/30" />
                  <p className="text-sm font-semibold text-white">No node selected</p>
                  <p className="mt-1 max-w-[220px] text-xs text-white/45">
                    Click any step in the canvas to configure MCP connectors, AI prompts, and actions.
                  </p>
                </div>
              )}

              <Separator className="bg-white/10" />

              <div className="space-y-2 rounded-2xl border border-white/10 bg-[#0C0F1C] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Run history</p>
                <div className="space-y-2 text-xs text-white/40">
                  <p>
                    Last run <ArrowRight className="inline h-3 w-3" />
                    {" "}
                    {activeFlowDefinition?.lastDeployed ?? "No runs"}
                  </p>
                  <p>Next scheduled • {activeFlowDefinition?.cadence ?? "Not scheduled"}</p>
                </div>
              </div>

              <div className="space-y-2 rounded-2xl border border-white/10 bg-[#0C0F1C] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                    Simulated execution
                  </p>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider",
                      simulationState.status === "running"
                        ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
                        : simulationState.status === "success"
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                          : "border-white/15 bg-white/5 text-white/50"
                    )}
                  >
                    {simulationState.status === "running"
                      ? "Running"
                      : simulationState.status === "success"
                        ? "Complete"
                        : "Idle"}
                  </span>
                </div>

                {simulationState.status === "idle" && simulationState.logs.length === 0 ? (
                  <p className="text-xs text-white/40">
                    Click “Simulate execute” to preview how this workflow would traverse each step.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {simulationState.logs.map((entry) => (
                      <div
                        key={entry.nodeId}
                        className="flex items-center justify-between rounded-xl border border-white/5 bg-[#11152A] px-3 py-2"
                      >
                        <div>
                          <p className="text-xs font-semibold text-white">
                            {entry.step}. {entry.label}
                          </p>
                          <p className="text-[11px] text-white/40">
                            {entry.subtitle ?? "Workflow step"} • {entry.downstream} downstream
                            {entry.downstream === 1 ? " path" : " paths"}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "flex items-center gap-1 text-xs font-semibold uppercase tracking-wide",
                            entry.status === "complete" ? "text-emerald-300" : "text-amber-200"
                          )}
                        >
                          {entry.status === "complete" ? (
                            <CheckCircle className="h-3.5 w-3.5" />
                          ) : (
                            <Clock3 className="h-3.5 w-3.5 animate-pulse" />
                          )}
                          <span>{entry.status === "complete" ? "Done" : "Running"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {simulationCompletedLabel ? (
                  <p className="text-[11px] text-white/35">Completed at {simulationCompletedLabel}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
