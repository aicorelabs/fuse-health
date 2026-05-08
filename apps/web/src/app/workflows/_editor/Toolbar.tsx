"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { GraphJSON } from "@fuse/core";

import type { ValidationResult } from "@/lib/editor/validateGraph";

export interface ToolbarProps {
  mode: "create" | "update";
  workflowId: string;
  name: string;
  description: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  graph: GraphJSON;
  validation: ValidationResult;
  nodeCount: number;
  edgeCount: number;
}

export function Toolbar({
  mode,
  workflowId,
  name,
  description,
  onNameChange,
  onDescriptionChange,
  graph,
  validation,
  nodeCount,
  edgeCount,
}: ToolbarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const errorCount = validation.errors.length;
  const warningCount = validation.warnings.length;
  const canSave = validation.ok && name.trim().length > 0 && !pending;

  async function deleteWorkflow() {
    if (mode !== "update") return;
    const ok = window.confirm(
      "Delete this workflow? Run history will be lost. This cannot be undone.",
    );
    if (!ok) return;
    setSaveError(null);
    startTransition(async () => {
      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: "DELETE",
      });
      if (res.status === 204) {
        router.replace("/");
        return;
      }
      const body = await safeJson(res);
      setSaveError(body?.error ?? `HTTP ${res.status}`);
    });
  }

  async function persist() {
    setSaveError(null);
    if (mode === "create") {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          graph,
        }),
      });
      if (!res.ok) {
        const body = await safeJson(res);
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const body = (await res.json()) as { id: string };
      router.replace(`/workflows/${body.id}/edit`);
      return;
    }

    const res = await fetch(`/api/workflows/${workflowId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim(),
        graph,
      }),
    });
    if (!res.ok) {
      const body = await safeJson(res);
      throw new Error(body?.error ?? `HTTP ${res.status}`);
    }
    setSavedAt(new Date());
    router.refresh();
  }

  function onSave() {
    startTransition(async () => {
      try {
        await persist();
      } catch (err) {
        setSaveError((err as Error).message);
      }
    });
  }

  return (
    <header className="border-b border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-stone-800 dark:bg-stone-900/95 dark:supports-[backdrop-filter]:bg-stone-900/80">
      <div className="flex items-center gap-3 px-5 py-2.5">
        <Link
          href={mode === "create" ? "/" : `/workflows/${workflowId}`}
          className="flex h-7 w-7 items-center justify-center rounded-sm text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          aria-label="Back"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="square"
            />
          </svg>
        </Link>

        <span className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500 sm:inline">
          {mode === "create" ? "New" : "Edit"}
        </span>

        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Untitled workflow"
          className="min-w-0 flex-1 border-none bg-transparent px-1 text-[15px] font-medium tracking-tight text-stone-900 outline-none placeholder:text-stone-400 dark:text-stone-100 dark:placeholder:text-stone-600"
        />

        <ValidationBadge
          errorCount={errorCount}
          warningCount={warningCount}
        />

        <span className="hidden font-mono text-[11px] tabular text-stone-400 md:inline dark:text-stone-500">
          {nodeCount}n · {edgeCount}e
        </span>

        {mode === "update" && (
          <button
            type="button"
            onClick={deleteWorkflow}
            disabled={pending}
            className="rounded-sm border border-stone-200 px-2.5 py-1 text-[12px] text-stone-600 transition-colors hover:border-rose-400 hover:text-rose-600 disabled:opacity-50 dark:border-stone-800 dark:text-stone-400"
          >
            Delete
          </button>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="rounded-sm bg-stone-900 px-3 py-1 text-[12.5px] font-medium text-stone-50 transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200"
        >
          {pending ? "Saving…" : mode === "create" ? "Create" : "Save"}
        </button>
      </div>

      <div className="flex items-center gap-3 border-t border-stone-100 px-5 py-1.5 dark:border-stone-800/60">
        {workflowId && (
          <span className="font-mono text-[10.5px] tracking-tight text-stone-400 dark:text-stone-500">
            {workflowId}
          </span>
        )}
        <input
          type="text"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Add a description…"
          className="min-w-0 flex-1 border-none bg-transparent text-[12px] text-stone-600 outline-none placeholder:text-stone-400 dark:text-stone-400 dark:placeholder:text-stone-600"
        />
      </div>

      {(errorCount > 0 || saveError) && (
        <ul className="border-y border-rose-200/70 bg-rose-50/50 px-5 py-2 dark:border-rose-900/40 dark:bg-rose-950/20">
          {saveError && (
            <li className="flex items-baseline gap-3 text-[12px] text-rose-800 dark:text-rose-200">
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-rose-600 dark:text-rose-300">
                Save failed
              </span>
              <span>{saveError}</span>
            </li>
          )}
          {validation.errors.map((e, i) => (
            <li
              key={i}
              className="flex items-baseline gap-3 py-0.5 text-[12px] text-rose-800 dark:text-rose-200"
            >
              <span className="font-mono text-[10px] uppercase tracking-tight text-rose-600 dark:text-rose-300">
                {e.code.toLowerCase()}
              </span>
              <span className="leading-snug">{e.message}</span>
            </li>
          ))}
        </ul>
      )}

      {errorCount === 0 && warningCount > 0 && (
        <ul className="border-y border-amber-200/70 bg-amber-50/50 px-5 py-2 dark:border-amber-900/40 dark:bg-amber-950/20">
          {validation.warnings.map((w, i) => (
            <li
              key={i}
              className="flex items-baseline gap-3 py-0.5 text-[12px] text-amber-900 dark:text-amber-200"
            >
              <span className="font-mono text-[10px] uppercase tracking-tight text-amber-700 dark:text-amber-300">
                {w.code.toLowerCase()}
              </span>
              <span className="leading-snug">{w.message}</span>
            </li>
          ))}
        </ul>
      )}

      {savedAt && errorCount === 0 && !saveError && (
        <div className="flex items-center gap-2 border-y border-emerald-200/60 bg-emerald-50/50 px-5 py-1 text-[11px] text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
          <span className="block h-1 w-1 bg-emerald-500" aria-hidden />
          <span>Saved · {savedAt.toLocaleTimeString()}</span>
        </div>
      )}
    </header>
  );
}

function ValidationBadge({
  errorCount,
  warningCount,
}: {
  errorCount: number;
  warningCount: number;
}) {
  if (errorCount > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-700 dark:text-rose-300">
        <span className="block h-1.5 w-1.5 bg-rose-500" aria-hidden />
        <span className="tabular">
          {errorCount} {errorCount === 1 ? "error" : "errors"}
        </span>
      </span>
    );
  }
  if (warningCount > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
        <span className="block h-1.5 w-1.5 bg-amber-500" aria-hidden />
        <span className="tabular">
          {warningCount} {warningCount === 1 ? "warning" : "warnings"}
        </span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
      <span className="block h-1.5 w-1.5 bg-emerald-500" aria-hidden />
      <span>Valid</span>
    </span>
  );
}

async function safeJson(res: Response): Promise<{ error?: string } | null> {
  try {
    return (await res.json()) as { error?: string };
  } catch {
    return null;
  }
}
