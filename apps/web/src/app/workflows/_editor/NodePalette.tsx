"use client";

import type { NodeKind } from "@fuse/core";

import { useIntegrations, type IntegrationListing } from "@/lib/integrations";

import { KIND_GROUPS, KIND_LABELS, isTriggerKind } from "./constants";
import { familyDotClass, kindFamily } from "./kindFamily";

interface NodePaletteProps {
  hasTrigger: boolean;
}

export function NodePalette({ hasTrigger }: NodePaletteProps) {
  const integrations = useIntegrations();

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

      <div className="flex-1 space-y-5 px-3 py-3">
        {KIND_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1.5">
            <div className="px-2 text-[9.5px] font-medium uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">
              {group.label}
            </div>
            <div className="space-y-1">
              {group.kinds.map((kind) => {
                const disabled = hasTrigger && isTriggerKind(kind);
                return (
                  <KindPaletteItem
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

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between px-2">
            <div className="text-[9.5px] font-medium uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">
              Integrations
            </div>
            {integrations.data && (
              <span className="font-mono text-[9.5px] tabular text-stone-300 dark:text-stone-600">
                {integrations.data.reduce(
                  (n, i) => n + i.functions.length,
                  0,
                )}
              </span>
            )}
          </div>

          {integrations.loading && (
            <div className="px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400 dark:text-stone-600">
              loading…
            </div>
          )}
          {integrations.error && (
            <div className="px-2 text-[11px] text-stone-500">
              Couldn&apos;t load · use Action.
            </div>
          )}
          {integrations.data && (
            <IntegrationsList integrations={integrations.data} />
          )}
        </div>
      </div>
    </aside>
  );
}

function IntegrationsList({
  integrations,
}: {
  integrations: IntegrationListing[];
}) {
  return (
    <div className="space-y-3">
      {integrations.map((integ) => (
        <div key={integ.name} className="space-y-1">
          <div className="flex items-baseline justify-between px-2">
            <span className="text-[10px] font-medium tracking-tight text-stone-600 dark:text-stone-400">
              {integ.label}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-stone-300 dark:text-stone-600">
              {integ.category}
            </span>
          </div>
          <div className="space-y-1">
            {integ.functions.map((fn) => (
              <FunctionPaletteItem
                key={`${integ.name}.${fn.name}`}
                integrationName={integ.name}
                integrationLabel={integ.label}
                functionName={fn.name}
                functionDescription={fn.description}
                sampleInput={fn.sampleInput}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface KindPaletteItemProps {
  kind: NodeKind;
  label: string;
  disabled: boolean;
}

function KindPaletteItem({ kind, label, disabled }: KindPaletteItemProps) {
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

interface FunctionPaletteItemProps {
  integrationName: string;
  integrationLabel: string;
  functionName: string;
  functionDescription: string;
  sampleInput?: unknown;
}

function FunctionPaletteItem({
  integrationName,
  integrationLabel,
  functionName,
  functionDescription,
  sampleInput,
}: FunctionPaletteItemProps) {
  return (
    <div
      role="button"
      draggable
      onDragStart={(e) => {
        const payload = {
          integration: integrationName,
          function: functionName,
          label: `${integrationLabel}: ${functionName}`,
          sampleInput: sampleInput ?? {},
        };
        e.dataTransfer.setData(
          "application/fuse-integration",
          JSON.stringify(payload),
        );
        e.dataTransfer.effectAllowed = "move";
      }}
      title={functionDescription}
      className="group flex cursor-grab select-none items-center gap-2 rounded-sm border border-stone-200 bg-white px-2.5 py-1.5 text-[12.5px] text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900 active:cursor-grabbing dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-100 dark:hover:text-stone-100"
    >
      <span
        aria-hidden
        className="block h-1 w-1 shrink-0 bg-amber-500/70"
      />
      <span className="truncate font-mono text-[11.5px] tracking-tight">
        {functionName}
      </span>
    </div>
  );
}
