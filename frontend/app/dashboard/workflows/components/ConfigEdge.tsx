"use client";

import type { MouseEvent } from "react";
import { Plus } from "lucide-react";
import { EdgeProps, getBezierPath } from "reactflow";

export const EDGE_MARKER_ID = "edge-arrow";

const defaultEdgeStyle: React.CSSProperties = {
    stroke: "#7F8BFF",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
};

export function ConfigEdge({
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
}: EdgeProps) {
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
        if (data && typeof (data as any).onInsert === "function") {
            (data as any).onInsert(id);
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
}

export default ConfigEdge;
