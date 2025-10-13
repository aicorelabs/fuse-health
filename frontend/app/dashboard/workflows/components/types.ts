"use client";

import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import type { Edge, Node } from "reactflow";
import { Position } from "reactflow";

export const CONNECTOR_OFFSET = 14;

export const connectorBaseStyle: Record<Position, CSSProperties> = {
    [Position.Top]: {
        top: -CONNECTOR_OFFSET,
        left: "50%",
        transform: "translate(-50%, 0)",
    },
    [Position.Bottom]: {
        bottom: -CONNECTOR_OFFSET,
        left: "50%",
        transform: "translate(-50%, 0)",
    },
    [Position.Left]: {
        left: -CONNECTOR_OFFSET,
        top: "50%",
        transform: "translate(0, -50%)",
    },
    [Position.Right]: {
        right: -CONNECTOR_OFFSET,
        top: "50%",
        transform: "translate(0, -50%)",
    },
};

export const defaultConnectorLabelPlacement: Record<
    Position,
    "before" | "after"
> = {
    [Position.Top]: "before",
    [Position.Bottom]: "after",
    [Position.Left]: "before",
    [Position.Right]: "after",
};

export interface NodeConfigField {
    id: string;
    label: string;
    type: "text" | "email" | "multi" | "textarea";
    required?: boolean;
    placeholder?: string;
    helperText?: string;
}

export interface NodeConnector {
    id: string;
    type: "source" | "target";
    position: Position;
    label?: string;
    labelPlacement?: "before" | "after";
    style?: CSSProperties;
}

export interface StepNodeData {
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
    requiresConnectorSelection?: boolean;
    serviceType?: string; // Maps to connector ID (e.g., "gmail", "pubmed")
}

export type FlowNode = Node<StepNodeData>;
export type FlowEdge = Edge;

export const accentStyles: Record<
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
