"use client";

import type { CSSProperties } from "react";
import { AlertTriangle, CheckCircle, Unplug } from "lucide-react";
import { Handle, Position } from "reactflow";

import { cn } from "@/lib/utils";

import {
  accentStyles,
  connectorBaseStyle,
  defaultConnectorLabelPlacement,
  type NodeConnector,
  type StepNodeData,
} from "./types";

export function StepNode(
  { id, data, selected }: {
    id: string;
    data: StepNodeData;
    selected?: boolean;
  },
) {
  const Icon = data.icon;
  const accent = accentStyles[data.accent];
  const connectors = data.connectors && data.connectors.length > 0
    ? data.connectors
    : ([
      { id: `${id}-in`, type: "target", position: Position.Left },
      { id: `${id}-out`, type: "source", position: Position.Right },
    ] satisfies NodeConnector[]);

  return (
    <div
      className={cn(
        "relative group rounded-2xl border px-4 py-3 shadow-lg shadow-black/30 transition-all duration-300",
        selected
          ? "border-emerald-500 ring-2 ring-emerald-500/30"
          : "border-white/12",
      )}
    >
      {connectors.map((connector) => {
        const placement = connector.labelPlacement ??
          defaultConnectorLabelPlacement[connector.position];
        const isHorizontal = connector.position === Position.Left ||
          connector.position === Position.Right;
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
              isHorizontal ? "gap-2" : "flex-col items-center gap-1",
            )}
          >
            {placement === "before" && connector.label
              ? (
                <span className="pointer-events-none rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                  {connector.label}
                </span>
              )
              : null}
            <Handle
              id={connector.id}
              type={connector.type}
              position={connector.position}
              style={{ position: "static" }}
              className="h-3 w-3 rounded-full border border-[#7C8DB5] bg-white shadow-[0_0_0_2px_rgba(12,16,28,0.95)]"
            />
            {placement === "after" && connector.label
              ? (
                <span className="pointer-events-none rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                  {connector.label}
                </span>
              )
              : null}
          </div>
        );
      })}

      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            accent.icon,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-[160px] flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">{data.label}</p>
            {data.chipText
              ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    accent.chip,
                  )}
                >
                  {data.chipText}
                </span>
              )
              : null}
          </div>
          <p className="text-xs text-white/60">{data.subtitle}</p>
          {data.helperText
            ? <p className="mt-2 text-xs text-white/40">{data.helperText}</p>
            : null}
          {data.status === "attention"
            ? (
              <div className="mt-2 flex items-center gap-1 text-xs text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5" />
                Requires configuration
              </div>
            )
            : null}
          {data.status === "complete"
            ? (
              <div className="mt-2 flex items-center gap-1 text-xs text-emerald-300">
                <CheckCircle className="h-3.5 w-3.5" />
                Ready for publish
              </div>
            )
            : null}
        </div>
      </div>
    </div>
  );
}

export default StepNode;
