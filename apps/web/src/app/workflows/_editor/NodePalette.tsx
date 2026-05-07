"use client";

import type { NodeKind } from "@fuse/core";

import { KIND_GROUPS, KIND_LABELS, isTriggerKind } from "./constants";
import { familyDotClass, kindFamily } from "./kindFamily";

interface NodePaletteProps {
  hasTrigger: boolean;
}

export function NodePalette({ hasTrigger }: NodePaletteProps) {
  return (
    <aside className="flex w-60 shrink-0 flex-col overflow-y-auto border-r border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      <div className="border-b border-stone-100 px-5 py-3 dark:border-stone-800/60">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Palette
        </div>
        <div className="mt-1 text-[11px] text-stone-500 dark:text-stone-500">
          Drag onto the canvas.
        </div>
      </div>

      <div className="flex-1 px-3 py-3 space-y-5">
        {KIND_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1.5">
            <div className="px-2 text-[9.5px] font-medium uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">
              {group.label}
            </div>
            <div className="space-y-1">
              {group.kinds.map((kind) => {
                const disabled = hasTrigger && isTriggerKind(kind);
                return (
                  <PaletteItem
                    key={kind}
                    kind={kind}
                    label={KIND_LABELS[kind]}
                    disabled={disabled}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

interface PaletteItemProps {
  kind: NodeKind;
  label: string;
  disabled: boolean;
}

function PaletteItem({ kind, label, disabled }: PaletteItemProps) {
  const family = kindFamily(kind);
  return (
    <div
      role="button"
      aria-disabled={disabled}
      draggable={!disabled}
      onDragStart={(e) => {
        if (disabled) return;
        e.dataTransfer.setData("application/fuse-kind", kind);
        e.dataTransfer.effectAllowed = "move";
      }}
      title={
        disabled
          ? "Only one trigger per workflow"
          : `Drag to add ${label}`
      }
      className={`group relative flex select-none items-center gap-2 rounded-sm border px-2.5 py-1.5 text-[13px] transition-colors ${
        disabled
          ? "cursor-not-allowed border-stone-100 bg-stone-50/60 text-stone-400 dark:border-stone-800/60 dark:bg-stone-900/40 dark:text-stone-600"
          : "cursor-grab border-stone-200 bg-white text-stone-700 hover:border-stone-900 hover:text-stone-900 active:cursor-grabbing dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-100 dark:hover:text-stone-100"
      }`}
    >
      <span
        aria-hidden
        className={`block h-1 w-1 shrink-0 ${
          disabled ? "bg-stone-300 dark:bg-stone-700" : familyDotClass[family]
        }`}
      />
      <span className="truncate">{label}</span>
    </div>
  );
}
