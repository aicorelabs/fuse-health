"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { parseCurl } from "@/lib/editor/curlParser";

import { FormField, inputClass } from "@/app/workflows/_editor/forms/_FormField";
import { JsonField } from "@/app/workflows/_editor/forms/_JsonField";
import { KeyValueField } from "@/app/workflows/_editor/forms/_KeyValueField";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

interface FunctionValue {
  name: string;
  description: string;
  method: (typeof METHODS)[number];
  pathTemplate: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  bodyTemplate: unknown;
  timeoutMs: number;
  sampleInput: unknown;
  sampleOutput: unknown;
}

const EMPTY: FunctionValue = {
  name: "",
  description: "",
  method: "GET",
  pathTemplate: "",
  headers: {},
  query: {},
  bodyTemplate: undefined,
  timeoutMs: 50000,
  sampleInput: undefined,
  sampleOutput: undefined,
};

export function FunctionForm({
  integrationName,
  initial,
  onClose,
}: {
  integrationName: string;
  initial?: Partial<FunctionValue> & { name: string };
  onClose: () => void;
}) {
  const router = useRouter();
  const isEdit = !!initial;
  const [v, setV] = useState<FunctionValue>({
    ...EMPTY,
    ...initial,
  } as FunctionValue);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [showCurl, setShowCurl] = useState(false);
  const [curlText, setCurlText] = useState("");
  const [curlError, setCurlError] = useState<string | null>(null);

  function patch(part: Partial<FunctionValue>) {
    setV((prev) => ({ ...prev, ...part }));
  }

  function applyCurl() {
    const parsed = parseCurl(curlText);
    if (!parsed) {
      setCurlError(
        "Couldn't parse — paste a `curl ...` command (with -X, -H, -d, etc.).",
      );
      return;
    }
    setCurlError(null);
    let pathTemplate = parsed.url;
    // If the URL starts with the integration's baseUrl (we don't know it
    // here — pass through verbatim; user can split later).
    let bodyTemplate: unknown = v.bodyTemplate;
    if (parsed.body) {
      try {
        bodyTemplate = JSON.parse(parsed.body);
      } catch {
        bodyTemplate = parsed.body;
      }
    }
    patch({
      method: METHODS.includes(parsed.method as (typeof METHODS)[number])
        ? (parsed.method as (typeof METHODS)[number])
        : "GET",
      pathTemplate,
      headers: { ...v.headers, ...parsed.headers },
      bodyTemplate,
    });
    setShowCurl(false);
    setCurlText("");
  }

  async function persist() {
    setError(null);
    const payload: Record<string, unknown> = {
      description: v.description,
      method: v.method,
      pathTemplate: v.pathTemplate.trim(),
      headers: v.headers,
      query: v.query,
      timeoutMs: v.timeoutMs,
    };
    if (v.bodyTemplate !== undefined) payload.bodyTemplate = v.bodyTemplate;
    if (v.sampleInput !== undefined) payload.sampleInput = v.sampleInput;
    if (v.sampleOutput !== undefined) payload.sampleOutput = v.sampleOutput;

    if (isEdit) {
      const res = await fetch(
        `/api/integrations/${integrationName}/functions/${initial!.name}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const body = (await safeJson(res)) ?? {};
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
    } else {
      payload.name = v.name.trim();
      const res = await fetch(
        `/api/integrations/${integrationName}/functions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const body = (await safeJson(res)) ?? {};
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
    }
    router.refresh();
    onClose();
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
    if (!isEdit) return;
    const ok = window.confirm(`Delete function "${initial!.name}"?`);
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(
        `/api/integrations/${integrationName}/functions/${initial!.name}`,
        { method: "DELETE" },
      );
      if (res.status === 204) {
        router.refresh();
        onClose();
        return;
      }
      const body = (await safeJson(res)) ?? {};
      setError(body.error ?? `HTTP ${res.status}`);
    });
  }

  return (
    <div className="space-y-4 rounded-sm border border-stone-200 bg-stone-50/40 p-4 dark:border-stone-800 dark:bg-stone-900/40">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          {isEdit ? `Edit · ${initial!.name}` : "New function"}
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCurl((s) => !s)}
            className="rounded-sm border border-stone-200 px-2.5 py-1 text-[11.5px] text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900 dark:border-stone-800 dark:text-stone-300 dark:hover:border-stone-100"
          >
            {showCurl ? "× cancel" : "Import from curl"}
          </button>
          {isEdit && (
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
            onClick={onClose}
            disabled={pending}
            className="rounded-sm border border-stone-200 px-2.5 py-1 text-[11.5px] text-stone-600 transition-colors hover:border-stone-400 hover:text-stone-900 disabled:opacity-50 dark:border-stone-800 dark:text-stone-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={pending || v.pathTemplate.trim() === "" || (!isEdit && v.name.trim() === "")}
            className="rounded-sm bg-stone-900 px-3 py-1 text-[12px] font-medium text-stone-50 transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200"
          >
            {pending ? "Saving…" : isEdit ? "Save" : "Create"}
          </button>
        </div>
      </div>

      {error && (
        <div className="border-l-2 border-rose-500/70 bg-rose-50/40 px-3 py-2 text-[12px] text-rose-800 dark:bg-rose-950/20 dark:text-rose-200">
          {error}
        </div>
      )}

      {showCurl && (
        <div className="space-y-2 rounded-sm border border-dashed border-stone-300 bg-white p-3 dark:border-stone-700 dark:bg-stone-900">
          <div className="flex items-baseline justify-between">
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
              Paste a curl command
            </div>
            <button
              type="button"
              onClick={applyCurl}
              className="rounded-sm bg-stone-900 px-2.5 py-0.5 text-[11px] font-medium text-stone-50 hover:bg-stone-700 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200"
            >
              Apply
            </button>
          </div>
          <textarea
            className={`${inputClass} font-mono text-[11.5px]`}
            value={curlText}
            onChange={(e) => setCurlText(e.target.value)}
            rows={5}
            spellCheck={false}
            placeholder={`curl -X POST 'https://api.example.com/v1/users' \\\n  -H 'Authorization: Bearer X' \\\n  -d '{"name":"Joe"}'`}
          />
          {curlError && (
            <div className="text-[11.5px] text-rose-700 dark:text-rose-400">
              {curlError}
            </div>
          )}
          <div className="text-[10.5px] text-stone-500">
            We&apos;ll fill method, URL, headers, and body. Wrap dynamic
            values in <code className="font-mono">{"{{ field }}"}</code> after
            applying.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="Name (function id)">
          <input
            type="text"
            className={`${inputClass} font-mono ${
              isEdit ? "cursor-not-allowed opacity-60" : ""
            }`}
            value={v.name}
            disabled={isEdit}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="getUser"
          />
        </FormField>
        <FormField label="Method">
          <select
            className={`${inputClass} appearance-none`}
            value={v.method}
            onChange={(e) => patch({ method: e.target.value as FunctionValue["method"] })}
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <FormField label="Description">
        <input
          type="text"
          className={inputClass}
          value={v.description}
          onChange={(e) => patch({ description: e.target.value })}
        />
      </FormField>
      <FormField
        label="Path / URL"
        hint="Absolute, or relative to integration's base URL. Templates resolve at run time."
      >
        <input
          type="text"
          className={`${inputClass} font-mono text-[12px]`}
          value={v.pathTemplate}
          onChange={(e) => patch({ pathTemplate: e.target.value })}
          placeholder="/v1/users/{{ id }}"
        />
      </FormField>
      <FormField label="Headers (per function — merged with integration defaults)">
        <KeyValueField
          value={v.headers}
          onChange={(headers) => patch({ headers })}
        />
      </FormField>
      <FormField label="Query params">
        <KeyValueField
          value={v.query}
          onChange={(query) => patch({ query })}
        />
      </FormField>
      <FormField label="Body template (JSON, sent as-is on POST/PUT/PATCH)">
        <JsonField
          value={v.bodyTemplate}
          onChange={(bodyTemplate) => patch({ bodyTemplate })}
        />
      </FormField>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="Timeout (ms)">
          <input
            type="number"
            min={1}
            max={120000}
            className={inputClass}
            value={v.timeoutMs}
            onChange={(e) => patch({ timeoutMs: Number(e.target.value) || 50000 })}
          />
        </FormField>
      </div>
      <FormField
        label="Sample input"
        hint="Surfaced in the action node picker and pre-fills the input field."
      >
        <JsonField
          value={v.sampleInput}
          onChange={(sampleInput) => patch({ sampleInput })}
        />
      </FormField>
      <FormField label="Sample output (for the catalog)">
        <JsonField
          value={v.sampleOutput}
          onChange={(sampleOutput) => patch({ sampleOutput })}
        />
      </FormField>
    </div>
  );
}

async function safeJson(res: Response): Promise<{ error?: string } | null> {
  try {
    return (await res.json()) as { error?: string };
  } catch {
    return null;
  }
}
