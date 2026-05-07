"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { findLLMSummary, isTerminal } from "@/lib/run-utils";

interface Step {
  id: string;
  nodeId: string;
  status: string;
  input: unknown;
  output: unknown;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

interface Run {
  id: string;
  workflowId: string;
  status: string;
  input: unknown;
  output: unknown;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  steps: Step[];
}

export function RunView({ runId }: { runId: string }) {
  const [run, setRun] = useState<Run | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      try {
        const res = await fetch(`/api/runs/${runId}`, { cache: "no-store" });
        if (!res.ok) {
          setFetchError(`HTTP ${res.status}`);
          return;
        }
        const body = (await res.json()) as Run;
        if (cancelled) return;
        setRun(body);
        setFetchError(null);
        if (!isTerminal(body.status)) {
          timer = setTimeout(tick, 1500);
        }
      } catch (err) {
        if (!cancelled) setFetchError((err as Error).message);
      }
    }

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [runId]);

  if (fetchError && !run) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 px-6 py-12">
        <div className="border-l-2 border-rose-500/70 bg-rose-50/40 px-4 py-3 text-[13px] text-rose-800 dark:bg-rose-950/20 dark:text-rose-200">
          Failed to load run · {fetchError}
        </div>
      </main>
    );
  }

  if (!run) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 px-6 py-12">
        <div className="font-mono text-[12px] text-stone-500">Loading run…</div>
      </main>
    );
  }

  const summary = findLLMSummary(run.steps);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-6 py-12">
      <nav>
        <Link
          href={`/workflows/${run.workflowId}`}
          className="inline-flex items-center gap-1.5 text-[12px] text-stone-500 transition-colors hover:text-stone-900 dark:hover:text-stone-100"
        >
          <span aria-hidden>←</span> Workflow
        </Link>
      </nav>

      <header className="space-y-3 border-b border-stone-200 pb-7 dark:border-stone-800">
        <div className="flex items-baseline gap-4">
          <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">
            Run
          </div>
          <StatusTag status={run.status} large />
        </div>
        <div className="flex items-baseline gap-4 font-mono text-[11px] tabular text-stone-400 dark:text-stone-500">
          <span>{run.id}</span>
          {run.startedAt && (
            <span>started {formatTime(run.startedAt)}</span>
          )}
          {run.finishedAt && run.startedAt && (
            <span>· {durationMs(run.startedAt, run.finishedAt)}</span>
          )}
        </div>
      </header>

      {run.error && (
        <section className="border-l-2 border-rose-500/70 bg-rose-50/40 px-4 py-3 dark:bg-rose-950/20">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">
            Run failed
          </div>
          <div className="mt-1 text-[13px] leading-relaxed text-rose-800 dark:text-rose-200">
            {run.error}
          </div>
        </section>
      )}

      {summary && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
              Summary
            </h2>
            <span className="font-mono text-[10.5px] tabular text-stone-400 dark:text-stone-500">
              llm
            </span>
          </div>
          <div className="whitespace-pre-wrap border-l-2 border-stone-300 pl-5 text-[14px] leading-[1.65] text-stone-800 dark:border-stone-700 dark:text-stone-200">
            {summary}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            Steps
          </h2>
          <span className="font-mono text-[10.5px] tabular text-stone-400 dark:text-stone-500">
            {run.steps.length}
          </span>
        </div>
        <ul className="-mx-2">
          {run.steps.length === 0 ? (
            <li className="px-2 py-3 font-mono text-[12px] text-stone-500">
              No steps yet…
            </li>
          ) : (
            run.steps.map((step) => <StepRow key={step.id} step={step} />)
          )}
          <li className="border-t border-stone-100 dark:border-stone-800/60" />
        </ul>
      </section>

      <details className="group rounded-sm border border-stone-200 dark:border-stone-800">
        <summary className="flex cursor-pointer items-center gap-3 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 transition-colors hover:bg-stone-50 dark:hover:bg-stone-900/60">
          <span className="font-mono text-[10px] text-stone-400 group-open:hidden">
            +
          </span>
          <span className="hidden font-mono text-[10px] text-stone-400 group-open:inline">
            −
          </span>
          Raw run JSON
        </summary>
        <pre className="overflow-auto border-t border-stone-100 bg-stone-50 px-3 py-3 font-mono text-[11px] leading-relaxed dark:border-stone-800/60 dark:bg-stone-950/40">
          {JSON.stringify(run, null, 2)}
        </pre>
      </details>
    </main>
  );
}

function StepRow({ step }: { step: Step }) {
  return (
    <li>
      <details className="group border-t border-stone-100 dark:border-stone-800/60">
        <summary className="flex cursor-pointer items-center justify-between gap-3 px-2 py-2.5 transition-colors hover:bg-stone-100/50 dark:hover:bg-stone-900/50">
          <div className="flex min-w-0 items-baseline gap-3">
            <span className="font-mono text-[10px] text-stone-400 group-open:hidden">
              +
            </span>
            <span className="hidden font-mono text-[10px] text-stone-400 group-open:inline">
              −
            </span>
            <span className="font-mono text-[12px] tracking-tight text-stone-900 dark:text-stone-100">
              {step.nodeId}
            </span>
          </div>
          <StatusTag status={step.status} />
        </summary>
        <div className="space-y-3 border-t border-stone-100 px-2 py-3 dark:border-stone-800/60">
          {step.error && (
            <div className="border-l-2 border-rose-500/70 bg-rose-50/40 px-3 py-2 text-[12px] text-rose-800 dark:bg-rose-950/20 dark:text-rose-200">
              {step.error}
            </div>
          )}
          <div className="space-y-1">
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
              Input
            </div>
            <pre className="overflow-auto border-l border-stone-200 bg-stone-50 px-3 py-2 font-mono text-[11px] leading-relaxed dark:border-stone-800 dark:bg-stone-950/40">
              {JSON.stringify(step.input, null, 2)}
            </pre>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
              Output
            </div>
            <pre className="overflow-auto border-l border-stone-200 bg-stone-50 px-3 py-2 font-mono text-[11px] leading-relaxed dark:border-stone-800 dark:bg-stone-950/40">
              {JSON.stringify(step.output, null, 2)}
            </pre>
          </div>
        </div>
      </details>
    </li>
  );
}

function StatusTag({
  status,
  large = false,
}: {
  status: string;
  large?: boolean;
}) {
  const dotClass =
    status === "SUCCEEDED"
      ? "bg-emerald-500"
      : status === "FAILED"
        ? "bg-rose-500"
        : status === "RUNNING"
          ? "bg-amber-500 animate-pulse"
          : status === "PENDING"
            ? "bg-stone-300 dark:bg-stone-600"
            : status === "SKIPPED"
              ? "bg-stone-400"
              : "bg-stone-400";
  const textClass =
    status === "SUCCEEDED"
      ? "text-emerald-700 dark:text-emerald-300"
      : status === "FAILED"
        ? "text-rose-700 dark:text-rose-300"
        : status === "RUNNING"
          ? "text-amber-700 dark:text-amber-300"
          : "text-stone-500 dark:text-stone-400";
  const sizeClass = large ? "text-[12px]" : "text-[10.5px]";
  const dotSize = large ? "h-1.5 w-1.5" : "h-1 w-1";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.12em] ${sizeClass} ${textClass}`}
    >
      <span className={`block ${dotSize} ${dotClass}`} aria-hidden />
      {status.toLowerCase()}
    </span>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString();
}

function durationMs(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
