"use client";

import { useMemo, useState } from "react";

import type { GraphLike } from "@/lib/editor/graphConvert";
import {
  extractTemplateRefsDeep,
  resolveRefAgainstSample,
  scopeForNode,
  validateRefAgainstScope,
  type ScopeRef,
} from "@/lib/editor/templateScope";

export interface LastRunSample {
  /** From the run's trigger.input — exposed under the reserved `trigger` key. */
  triggerInput: unknown;
  /** Node-keyed outputs from the most recent SUCCEEDED run. */
  nodeOutputs: Record<string, unknown>;
}

export interface ScopePanelProps {
  graph: GraphLike;
  nodeId: string;
  config: unknown;
  sample: LastRunSample | null;
  sampleStatus: "idle" | "loading" | "ready" | "missing";
}

export function ScopePanel({
  graph,
  nodeId,
  config,
  sample,
  sampleStatus,
}: ScopePanelProps) {
  const scope = useMemo(() => scopeForNode(graph, nodeId), [graph, nodeId]);
  const refs = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const r of extractTemplateRefsDeep(config)) {
      if (!seen.has(r)) {
        seen.add(r);
        out.push(r);
      }
    }
    return out;
  }, [config]);

  const samples: Record<string, unknown> | null = sample
    ? {
        trigger: { input: sample.triggerInput },
        ...sample.nodeOutputs,
      }
    : null;

  return (
    <div className="space-y-5">
      <ScopeList
        scope={scope}
        samples={samples}
        sampleStatus={sampleStatus}
      />
      {refs.length > 0 && (
        <RefList refs={refs} scope={scope} samples={samples} />
      )}
    </div>
  );
}

function ScopeList({
  scope,
  samples,
  sampleStatus,
}: {
  scope: ScopeRef[];
  samples: Record<string, unknown> | null;
  sampleStatus: ScopePanelProps["sampleStatus"];
}) {
  return (
    <section className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Variables in scope
        </h3>
        <SampleStatus status={sampleStatus} />
      </div>
      <ul className="-mx-1 divide-y divide-stone-100 dark:divide-stone-800/60">
        {scope.map((ref) => (
          <ScopeRow
            key={`${ref.source}:${ref.name}`}
            ref={ref}
            sample={samples?.[ref.name]}
          />
        ))}
      </ul>
    </section>
  );
}

function ScopeRow({ ref, sample }: { ref: ScopeRef; sample: unknown }) {
  const [open, setOpen] = useState(false);
  const hasSample = sample !== undefined;

  async function copy() {
    await navigator.clipboard?.writeText(`{{ ${ref.name} }}`);
  }

  return (
    <li className="px-1 py-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <button
          type="button"
          onClick={copy}
          title="Copy {{ ref }} to clipboard"
          className="font-mono text-[12px] tracking-tight text-stone-900 hover:text-stone-700 dark:text-stone-100 dark:hover:text-stone-300"
        >
          {ref.name}
        </button>
        <SourceBadge source={ref.source} />
      </div>
      {ref.hint && (
        <div className="mt-0.5 pl-0.5 text-[11px] leading-snug text-stone-500 dark:text-stone-500">
          {ref.hint}
        </div>
      )}
      {hasSample && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
        >
          {open ? "− sample" : "+ sample"}
        </button>
      )}
      {open && hasSample && (
        <pre className="mt-1.5 max-h-48 overflow-auto border-l border-stone-200 bg-stone-50 px-2 py-1.5 font-mono text-[10.5px] leading-relaxed dark:border-stone-800 dark:bg-stone-950/40">
          {jsonPreview(sample)}
        </pre>
      )}
    </li>
  );
}

function SourceBadge({ source }: { source: ScopeRef["source"] }) {
  const text =
    source === "trigger"
      ? "trigger"
      : source === "itemVar"
        ? "loop"
        : "upstream";
  return (
    <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-stone-400 dark:text-stone-600">
      {text}
    </span>
  );
}

function SampleStatus({
  status,
}: {
  status: ScopePanelProps["sampleStatus"];
}) {
  if (status === "loading") {
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400 dark:text-stone-600">
        loading sample…
      </span>
    );
  }
  if (status === "missing") {
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400 dark:text-stone-600">
        no run yet
      </span>
    );
  }
  if (status === "ready") {
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
        sample ready
      </span>
    );
  }
  return null;
}

function RefList({
  refs,
  scope,
  samples,
}: {
  refs: string[];
  scope: ScopeRef[];
  samples: Record<string, unknown> | null;
}) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
        Refs in this node
      </h3>
      <ul className="space-y-0.5">
        {refs.map((ref) => {
          const cheap = validateRefAgainstScope(ref, scope);
          // When sample data is loaded, prefer the deeper resolution.
          let valid = cheap.valid;
          let detail: string | null = null;
          if (samples) {
            const r = resolveRefAgainstSample(ref, scope, samples);
            valid = r.valid;
            if (cheap.valid && !r.valid) {
              detail = "first segment in scope but path doesn't resolve";
            }
          }
          if (!cheap.valid) {
            detail = `"${cheap.firstSegment}" is not in scope`;
          }
          return (
            <li key={ref} className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span
                  className={
                    valid
                      ? "block h-1 w-1 bg-emerald-500"
                      : "block h-1 w-1 bg-rose-500"
                  }
                  aria-hidden
                />
                <code className="font-mono text-[11.5px] tracking-tight text-stone-700 dark:text-stone-300">
                  {`{{ ${ref} }}`}
                </code>
              </div>
              {detail && (
                <div className="ml-3 pl-0.5 text-[10.5px] leading-snug text-stone-500 dark:text-stone-500">
                  {detail}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function jsonPreview(value: unknown): string {
  try {
    const text = JSON.stringify(value, null, 2);
    if (text.length > 1200) return text.slice(0, 1200) + "\n… (truncated)";
    return text;
  } catch {
    return String(value);
  }
}
