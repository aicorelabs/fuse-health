"use client";

import { useState } from "react";

import type { GraphJSON } from "@fuse/core";

import type { LastRunSample } from "./ScopePanel";
import { inputClass } from "./forms/_FormField";

interface PreviewResult {
  runId: string;
  status: "SUCCEEDED" | "FAILED" | string;
  output: Record<string, unknown>;
  error: string | null;
}

export interface PreviewSectionProps {
  workflowId: string | undefined;
  graph: GraphJSON;
  targetNodeId: string;
  inputText: string;
  onInputTextChange: (text: string) => void;
  onSampleUpdate: (sample: LastRunSample) => void;
}

export function PreviewSection({
  workflowId,
  graph,
  targetNodeId,
  inputText,
  onInputTextChange,
  onSampleUpdate,
}: PreviewSectionProps) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!workflowId) {
    return (
      <section className="space-y-2">
        <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Preview
        </h3>
        <p className="text-[11.5px] leading-relaxed text-stone-500 dark:text-stone-500">
          Save the workflow first, then preview to see real outputs.
        </p>
      </section>
    );
  }

  async function run() {
    setError(null);
    setResult(null);

    let parsedInput: unknown;
    try {
      parsedInput = inputText.trim() === "" ? {} : JSON.parse(inputText);
    } catch (err) {
      setError(`Invalid JSON · ${(err as Error).message}`);
      return;
    }

    setPending(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: parsedInput,
          graph,
          targetNodeId,
        }),
      });
      const body = (await res.json()) as PreviewResult & { error?: string };
      if (!res.ok) {
        setError(body.error ?? `HTTP ${res.status}`);
        setPending(false);
        return;
      }
      setResult(body);
      if (body.status === "SUCCEEDED") {
        onSampleUpdate({
          triggerInput: parsedInput,
          nodeOutputs: body.output ?? {},
        });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-2.5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Preview
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400 dark:text-stone-500">
          run up to here
        </span>
      </div>

      <label className="block space-y-1.5">
        <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Trigger input
        </span>
        <textarea
          className={`${inputClass} font-mono text-[11.5px] leading-relaxed`}
          value={inputText}
          onChange={(e) => onInputTextChange(e.target.value)}
          rows={4}
          spellCheck={false}
          placeholder='{ "patientId": "p_001" }'
        />
      </label>

      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="w-full rounded-sm bg-stone-900 px-3 py-1.5 text-[12px] font-medium text-stone-50 transition-colors hover:bg-stone-700 disabled:opacity-50 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200"
      >
        {pending ? "Running…" : "Run up to here"}
      </button>

      {error && (
        <div className="border-l-2 border-rose-500/70 bg-rose-50/40 px-2.5 py-1.5 text-[11.5px] text-rose-800 dark:bg-rose-950/20 dark:text-rose-200">
          {error}
        </div>
      )}

      {result && <ResultBlock targetNodeId={targetNodeId} result={result} />}
    </section>
  );
}

function ResultBlock({
  targetNodeId,
  result,
}: {
  targetNodeId: string;
  result: PreviewResult;
}) {
  const targetOutput = result.output[targetNodeId];
  const failed = result.status !== "SUCCEEDED";

  return (
    <div
      className={`space-y-1.5 border-l-2 px-2.5 py-1.5 ${
        failed
          ? "border-rose-500/70 bg-rose-50/40 dark:bg-rose-950/20"
          : "border-emerald-500/60 bg-emerald-50/40 dark:bg-emerald-950/20"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
            failed
              ? "text-rose-700 dark:text-rose-300"
              : "text-emerald-700 dark:text-emerald-300"
          }`}
        >
          {result.status.toLowerCase()}
        </span>
        <span className="font-mono text-[10px] tabular text-stone-400">
          {result.runId.slice(0, 12)}…
        </span>
      </div>
      {failed && result.error && (
        <div className="text-[11.5px] leading-snug text-rose-800 dark:text-rose-200">
          {result.error}
        </div>
      )}
      {!failed && (
        <>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            Output of {targetNodeId}
          </div>
          <pre className="max-h-64 overflow-auto bg-white/60 px-2 py-1 font-mono text-[10.5px] leading-relaxed dark:bg-stone-900/60">
            {jsonPreview(targetOutput)}
          </pre>
          <div className="text-[10.5px] text-stone-500 dark:text-stone-500">
            Sample data refreshed — refs above now resolve against this run.
          </div>
        </>
      )}
    </div>
  );
}

function jsonPreview(value: unknown): string {
  try {
    const text = JSON.stringify(value, null, 2);
    if (text.length > 4000) return text.slice(0, 4000) + "\n… (truncated)";
    return text;
  } catch {
    return String(value);
  }
}
