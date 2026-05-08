"use client";

import { useMemo, useState } from "react";

import type { NodeKind } from "@fuse/core";

import { useIntegrations, type IntegrationListing } from "@/lib/integrations";
import { filterIntegrations } from "@/lib/integrations-filter";

import { KIND_GROUPS, KIND_LABELS, isTriggerKind } from "./constants";
import { familyDotClass, kindFamily } from "./kindFamily";

interface NodePaletteProps {
  hasTrigger: boolean;
}

export function NodePalette({ hasTrigger }: NodePaletteProps) {
  const integrations = useIntegrations();
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const filtered = useMemo(
    () => filterIntegrations(integrations.data ?? [], query),
    [integrations.data, query],
  );

  const isQuerying = query.trim() !== "";
  // While searching, force-expand every match so functions are visible.
  const isExpanded = (name: string) =>
    isQuerying ? true : !collapsed.has(name);

  function toggle(name: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col overflow-y-auto border-r border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
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

        <div className="space-y-2">
          <div className="flex items-baseline justify-between px-2">
            <div className="text-[9.5px] font-medium uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">
              Integrations
            </div>
            {integrations.data && (
              <span className="font-mono text-[9.5px] tabular text-stone-300 dark:text-stone-600">
                {filtered.reduce((n, i) => n + i.functions.length, 0)}
                {isQuerying && (
                  <span className="text-stone-300 dark:text-stone-700">
                    {" / "}
                    {integrations.data.reduce(
                      (n, i) => n + i.functions.length,
                      0,
                    )}
                  </span>
                )}
              </span>
            )}
          </div>

          <SearchInput
            value={query}
            onChange={setQuery}
            disabled={!integrations.data}
          />

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
          {integrations.data && !integrations.loading && filtered.length === 0 && (
            <div className="px-2 text-[11px] text-stone-500">
              No matches for &ldquo;{query}&rdquo;.
            </div>
          )}
          {integrations.data && (
            <IntegrationsList
              integrations={filtered}
              isExpanded={isExpanded}
              onToggle={toggle}
            />
          )}
        </div>
      </div>
    </aside>
  );
}

function SearchInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Search integrations…"
        className="block w-full rounded-sm border border-stone-200 bg-white px-2.5 py-1 pr-7 text-[12px] text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none disabled:opacity-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-600 dark:focus:border-stone-100"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-1 font-mono text-[10px] text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
        >
          ×
        </button>
      )}
    </div>
  );
}

function IntegrationsList({
  integrations,
  isExpanded,
  onToggle,
}: {
  integrations: IntegrationListing[];
  isExpanded: (name: string) => boolean;
  onToggle: (name: string) => void;
}) {
  return (
    <div className="space-y-2">
      {integrations.map((integ) => (
        <div key={integ.name} className="space-y-1">
          <button
            type="button"
            onClick={() => onToggle(integ.name)}
            className="flex w-full items-baseline justify-between gap-2 px-2 text-left transition-colors hover:text-stone-900 dark:hover:text-stone-100"
          >
            <span className="flex min-w-0 items-baseline gap-1.5">
              <span
                aria-hidden
                className="font-mono text-[8px] text-stone-400 dark:text-stone-600"
              >
                {isExpanded(integ.name) ? "▾" : "▸"}
              </span>
              <span className="truncate text-[11.5px] font-medium tracking-tight text-stone-700 dark:text-stone-300">
                {integ.label}
              </span>
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-stone-300 dark:text-stone-600">
              {integ.category}
            </span>
          </button>
          {isExpanded(integ.name) && (
            <div className="space-y-1 pl-3">
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
          )}
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
      className="group flex cursor-grab select-none items-center gap-2 rounded-sm border border-stone-200 bg-white px-2.5 py-1.5 text-[12px] text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900 active:cursor-grabbing dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-100 dark:hover:text-stone-100"
    >
      <span aria-hidden className="block h-1 w-1 shrink-0 bg-amber-500/70" />
      <span className="truncate font-mono text-[11px] tracking-tight">
        {functionName}
      </span>
    </div>
  );
}
