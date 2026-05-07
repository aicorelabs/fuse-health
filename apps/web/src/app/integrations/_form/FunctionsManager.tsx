"use client";

import { useState } from "react";

import { FunctionForm } from "./FunctionForm";

interface FunctionRow {
  id: string;
  name: string;
  description: string;
  method: string;
  pathTemplate: string;
  headers: unknown;
  query: unknown;
  bodyTemplate: unknown;
  timeoutMs: number;
  sampleInput: unknown;
  sampleOutput: unknown;
}

export function FunctionsManager({
  integrationName,
  functions,
}: {
  integrationName: string;
  functions: FunctionRow[];
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Functions
        </h2>
        {!adding && (
          <button
            type="button"
            onClick={() => {
              setAdding(true);
              setEditing(null);
            }}
            className="rounded-sm border border-stone-200 px-2.5 py-1 text-[11.5px] text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900 dark:border-stone-800 dark:text-stone-300 dark:hover:border-stone-100"
          >
            + Add function
          </button>
        )}
      </div>

      {adding && (
        <FunctionForm
          integrationName={integrationName}
          onClose={() => setAdding(false)}
        />
      )}

      <ul className="-mx-2">
        {functions.length === 0 && !adding && (
          <li className="px-2 py-3 text-[12.5px] text-stone-500">
            No functions yet. Add one to make this integration usable in
            workflows.
          </li>
        )}
        {functions.map((fn, i) => (
          <li
            key={fn.id}
            className={
              i > 0
                ? "border-t border-stone-100 dark:border-stone-800/60"
                : ""
            }
          >
            {editing === fn.name ? (
              <div className="px-2 py-3">
                <FunctionForm
                  integrationName={integrationName}
                  initial={{
                    name: fn.name,
                    description: fn.description,
                    method: fn.method as never,
                    pathTemplate: fn.pathTemplate,
                    headers: (fn.headers ?? {}) as Record<string, string>,
                    query: (fn.query ?? {}) as Record<string, string>,
                    bodyTemplate:
                      fn.bodyTemplate === null ? undefined : fn.bodyTemplate,
                    timeoutMs: fn.timeoutMs,
                    sampleInput:
                      fn.sampleInput === null ? undefined : fn.sampleInput,
                    sampleOutput:
                      fn.sampleOutput === null ? undefined : fn.sampleOutput,
                  }}
                  onClose={() => setEditing(null)}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditing(fn.name);
                  setAdding(false);
                }}
                className="flex w-full items-baseline justify-between gap-3 px-2 py-3 text-left transition-colors hover:bg-stone-100/50 dark:hover:bg-stone-900/50"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[12.5px] text-stone-900 dark:text-stone-100">
                      {fn.name}
                    </span>
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-stone-400 dark:text-stone-500">
                      {fn.method}
                    </span>
                  </div>
                  <div className="font-mono text-[11.5px] text-stone-500 dark:text-stone-400">
                    {fn.pathTemplate}
                  </div>
                  {fn.description && (
                    <div className="text-[12px] leading-relaxed text-stone-600 dark:text-stone-400">
                      {fn.description}
                    </div>
                  )}
                </div>
                <div className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400 dark:text-stone-500">
                  edit →
                </div>
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
