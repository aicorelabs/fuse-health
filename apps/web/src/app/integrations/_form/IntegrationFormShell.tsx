"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { FormField, inputClass } from "@/app/workflows/_editor/forms/_FormField";
import { KeyValueField } from "@/app/workflows/_editor/forms/_KeyValueField";

interface ShellValue {
  name: string;
  label: string;
  description: string;
  category: string;
  baseUrl: string;
  defaultHeaders: Record<string, string>;
  /** Per-integration variables. Encrypted server-side. Reference as `{{ vars.X }}`. */
  vars: Record<string, string>;
}

const EMPTY: ShellValue = {
  name: "",
  label: "",
  description: "",
  category: "custom",
  baseUrl: "",
  defaultHeaders: {},
  vars: {},
};

export function IntegrationFormShell({
  mode,
  initial,
}: {
  mode: "create" | "update";
  initial?: Partial<ShellValue>;
}) {
  const router = useRouter();
  const [v, setV] = useState<ShellValue>({ ...EMPTY, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  function patch(part: Partial<ShellValue>) {
    setV((prev) => ({ ...prev, ...part }));
  }

  async function persist() {
    setError(null);
    if (mode === "create") {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: v.name.trim(),
          label: v.label.trim(),
          description: v.description.trim(),
          category: v.category.trim() || "custom",
          baseUrl: v.baseUrl.trim() || null,
          defaultHeaders: v.defaultHeaders,
          vars: v.vars,
        }),
      });
      const body = (await safeJson(res)) ?? {};
      if (!res.ok) {
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      router.replace(`/integrations/${v.name.trim()}/edit`);
      return;
    }
    const res = await fetch(`/api/integrations/${initial?.name}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: v.label.trim(),
        description: v.description.trim(),
        category: v.category.trim() || "custom",
        baseUrl: v.baseUrl.trim() || null,
        defaultHeaders: v.defaultHeaders,
        vars: v.vars,
      }),
    });
    if (!res.ok) {
      const body = (await safeJson(res)) ?? {};
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    setSavedAt(new Date());
    router.refresh();
  }

  function onSave() {
    startTransition(async () => {
      try {
        await persist();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  async function onDelete() {
    if (!initial?.name) return;
    const ok = window.confirm(
      `Delete "${initial.name}"? Functions are deleted too. This cannot be undone.`,
    );
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/integrations/${initial.name}`, {
        method: "DELETE",
      });
      if (res.status === 204) {
        router.replace("/integrations");
        return;
      }
      const body = (await safeJson(res)) ?? {};
      setError(body.error ?? `HTTP ${res.status}`);
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Integration
        </h2>
        <div className="flex items-center gap-2">
          {mode === "update" && initial?.name && (
            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="rounded-sm border border-stone-200 px-2.5 py-1 text-[11.5px] text-stone-600 transition-colors hover:border-rose-400 hover:text-rose-600 disabled:opacity-50 dark:border-stone-800 dark:text-stone-400"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={
              pending ||
              v.label.trim() === "" ||
              (mode === "create" && v.name.trim() === "")
            }
            className="rounded-sm bg-stone-900 px-3 py-1 text-[12px] font-medium text-stone-50 transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200"
          >
            {pending ? "Saving…" : mode === "create" ? "Create" : "Save"}
          </button>
        </div>
      </div>

      {error && (
        <div className="border-l-2 border-rose-500/70 bg-rose-50/40 px-3 py-2 text-[12px] text-rose-800 dark:bg-rose-950/20 dark:text-rose-200">
          {error}
        </div>
      )}
      {savedAt && !error && (
        <div className="flex items-center gap-2 border-l-2 border-emerald-500/60 bg-emerald-50/40 px-3 py-1.5 text-[11px] text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-200">
          <span className="block h-1 w-1 bg-emerald-500" aria-hidden />
          Saved · {savedAt.toLocaleTimeString()}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="Name (slug)" hint="lowercase, digits, hyphens, underscores">
          <input
            type="text"
            className={`${inputClass} font-mono ${
              mode === "update"
                ? "cursor-not-allowed opacity-60"
                : ""
            }`}
            value={v.name}
            disabled={mode === "update"}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="my-api"
          />
        </FormField>
        <FormField label="Label" hint="Display name shown in the catalog and editor.">
          <input
            type="text"
            className={inputClass}
            value={v.label}
            onChange={(e) => patch({ label: e.target.value })}
            placeholder="My API"
          />
        </FormField>
      </div>
      <FormField label="Description">
        <textarea
          className={inputClass}
          value={v.description}
          onChange={(e) => patch({ description: e.target.value })}
          rows={2}
          placeholder="What this integration does, for the catalog."
        />
      </FormField>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="Category">
          <input
            type="text"
            className={inputClass}
            value={v.category}
            onChange={(e) => patch({ category: e.target.value })}
            placeholder="custom"
          />
        </FormField>
        <FormField
          label="Base URL"
          hint="Optional. Function paths can be absolute or relative to this."
        >
          <input
            type="text"
            className={`${inputClass} font-mono`}
            value={v.baseUrl}
            onChange={(e) => patch({ baseUrl: e.target.value })}
            placeholder="https://api.example.com"
          />
        </FormField>
      </div>
      <FormField
        label="Default headers"
        hint="Applied to every function. Reference {{ vars.X }} (encrypted) or {{ env.X }} (process env)."
      >
        <KeyValueField
          value={v.defaultHeaders}
          onChange={(defaultHeaders) => patch({ defaultHeaders })}
        />
      </FormField>

      <div className="space-y-2 rounded-sm border border-stone-200 bg-stone-50/40 p-3 dark:border-stone-800 dark:bg-stone-900/40">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            Variables · encrypted at rest
          </span>
          <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500">
            ref as {"{{ vars.NAME }}"}
          </span>
        </div>
        <p className="text-[11.5px] leading-relaxed text-stone-500 dark:text-stone-500">
          Per-integration secrets — API keys, tokens, account ids. Stored
          AES-256-GCM-encrypted in Postgres; resolved into headers, paths,
          and bodies at call time. Visible to admins on this page only;
          excluded from the public catalog response.
        </p>
        <KeyValueField
          value={v.vars}
          onChange={(vars) => patch({ vars })}
        />
      </div>
    </section>
  );
}

async function safeJson(res: Response): Promise<{ error?: string } | null> {
  try {
    return (await res.json()) as { error?: string };
  } catch {
    return null;
  }
}
