"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface RunFormProps {
  workflowId: string;
}

const DEFAULT_INPUT = `{\n  "patientId": "p_001"\n}`;

export function RunForm({ workflowId }: RunFormProps) {
  const router = useRouter();
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(input);
    } catch (err) {
      setError(`Invalid JSON · ${(err as Error).message}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId, input: parsed }),
      });
      const body = (await res.json()) as { runId?: string; error?: string };
      if (!res.ok || !body.runId) {
        setError(body.error ?? `HTTP ${res.status}`);
        setSubmitting(false);
        return;
      }
      router.push(`/runs/${body.runId}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Input · JSON
        </span>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          spellCheck={false}
          className="block w-full rounded-sm border border-stone-200 bg-white px-3 py-2 font-mono text-[12px] leading-relaxed text-stone-900 transition-colors focus:border-stone-900 focus:outline-none dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-stone-100"
        />
      </label>
      {error && (
        <div className="border-l-2 border-rose-500/70 bg-rose-50/40 px-3 py-2 text-[12px] text-rose-800 dark:border-rose-700 dark:bg-rose-950/20 dark:text-rose-200">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center rounded-sm bg-stone-900 px-3.5 py-1.5 text-[12.5px] font-medium text-stone-50 transition-colors hover:bg-stone-700 disabled:opacity-50 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200"
      >
        {submitting ? "Starting…" : "Run"}
      </button>
    </form>
  );
}
