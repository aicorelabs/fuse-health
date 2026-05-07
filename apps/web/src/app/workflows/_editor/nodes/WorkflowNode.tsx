"use client";

import { Handle, Position, type NodeProps } from "reactflow";

import type { WorkflowNodeData } from "@/lib/editor/graphConvert";

import { KIND_LABELS, isTriggerKind } from "../constants";
import { familyDotClass, kindFamily } from "../kindFamily";

export function WorkflowNode({ data, selected }: NodeProps<WorkflowNodeData>) {
  const isTrigger = isTriggerKind(data.kind);
  const isBranch = data.kind === "branch";
  const cases = isBranch ? branchCases(data.config) : null;
  const family = kindFamily(data.kind);

  return (
    <div
      className={`group min-w-[184px] max-w-[260px] rounded-[3px] border bg-white shadow-[0_1px_0_0_rgba(28,25,23,0.04)] transition-colors dark:bg-stone-900 ${
        selected
          ? "border-stone-900 dark:border-stone-100"
          : "border-stone-200 dark:border-stone-800"
      }`}
    >
      <div className="flex items-center gap-2 px-3 pt-2.5">
        <span
          aria-hidden
          className={`block h-1 w-1 shrink-0 ${familyDotClass[family]}`}
        />
        <span className="text-[9.5px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          {KIND_LABELS[data.kind] ?? data.kind}
        </span>
      </div>
      <div className="px-3 pb-3 pt-1">
        <div className="truncate text-[13px] font-medium tracking-tight text-stone-900 dark:text-stone-50">
          {data.name}
        </div>
      </div>

      {!isTrigger && <Handle type="target" position={Position.Left} />}

      {isBranch && cases ? (
        <div className="border-t border-stone-100 dark:border-stone-800/60">
          {cases.length === 0 ? (
            <div className="px-3 py-1.5 text-[10px] italic text-stone-400 dark:text-stone-600">
              add cases →
            </div>
          ) : (
            cases.map((label, i) => (
              <div
                key={label}
                className={`relative flex items-center justify-end px-3 py-1.5 font-mono text-[10px] tracking-tight text-stone-500 dark:text-stone-400 ${
                  i > 0 ? "border-t border-stone-100 dark:border-stone-800/60" : ""
                }`}
              >
                <span className="truncate">{label}</span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={label}
                  style={{ top: "50%" }}
                />
              </div>
            ))
          )}
        </div>
      ) : (
        <Handle type="source" position={Position.Right} />
      )}
    </div>
  );
}

interface BranchConfigShape {
  cases?: Array<{ edge: string }>;
  default?: string;
}

function branchCases(config: unknown): string[] {
  const cfg = (config ?? {}) as BranchConfigShape;
  const labels: string[] = (cfg.cases ?? []).map((c) => c.edge);
  if (cfg.default) labels.push(cfg.default);
  return labels;
}
