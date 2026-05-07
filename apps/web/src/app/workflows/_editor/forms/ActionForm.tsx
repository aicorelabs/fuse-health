"use client";

import { useEffect, useState } from "react";

import { FormField, inputClass } from "./_FormField";
import { JsonField } from "./_JsonField";

interface Config {
  integration: string;
  function: string;
  input?: Record<string, unknown>;
}

interface IntegrationFn {
  name: string;
  description: string;
  sampleInput?: unknown;
  sampleOutput?: unknown;
}
interface IntegrationListing {
  name: string;
  label: string;
  description: string;
  category: string;
  functions: IntegrationFn[];
}

let cachedListing: IntegrationListing[] | null = null;
let inflight: Promise<IntegrationListing[]> | null = null;

async function loadIntegrations(): Promise<IntegrationListing[]> {
  if (cachedListing) return cachedListing;
  if (inflight) return inflight;
  inflight = (async () => {
    const res = await fetch("/api/integrations", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { integrations: IntegrationListing[] };
    cachedListing = body.integrations;
    return body.integrations;
  })();
  return inflight;
}

function isEmptyInput(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "object" && !Array.isArray(v)) {
    return Object.keys(v as Record<string, unknown>).length === 0;
  }
  return false;
}

export function ActionForm({
  config,
  onChange,
}: {
  config: Config;
  onChange: (c: Config) => void;
}) {
  const [listing, setListing] = useState<IntegrationListing[] | null>(
    cachedListing,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (listing) return;
    let cancelled = false;
    loadIntegrations()
      .then((l) => {
        if (!cancelled) setListing(l);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [listing]);

  const selectedIntegration = listing?.find(
    (i) => i.name === config.integration,
  );
  const selectedFunction = selectedIntegration?.functions.find(
    (f) => f.name === config.function,
  );

  function pickIntegration(name: string) {
    const integ = listing?.find((i) => i.name === name);
    const firstFn = integ?.functions[0];
    onChange({
      ...config,
      integration: name,
      function: firstFn?.name ?? "",
      input:
        firstFn?.sampleInput && isEmptyInput(config.input)
          ? (firstFn.sampleInput as Record<string, unknown>)
          : config.input,
    });
  }

  function pickFunction(name: string) {
    const fn = selectedIntegration?.functions.find((f) => f.name === name);
    onChange({
      ...config,
      function: name,
      input:
        fn?.sampleInput && isEmptyInput(config.input)
          ? (fn.sampleInput as Record<string, unknown>)
          : config.input,
    });
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="border-l-2 border-rose-500/70 bg-rose-50/40 px-3 py-2 text-[12px] text-rose-800 dark:bg-rose-950/20 dark:text-rose-200">
          Couldn&apos;t load integrations · {error}
        </div>
        <FallbackTextFields config={config} onChange={onChange} />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="space-y-3">
        <div className="text-[12px] text-stone-500">Loading integrations…</div>
        <FallbackTextFields config={config} onChange={onChange} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <FormField label="Integration">
        <select
          className={`${inputClass} appearance-none`}
          value={config.integration ?? ""}
          onChange={(e) => pickIntegration(e.target.value)}
        >
          {!selectedIntegration && config.integration !== "" && (
            <option value={config.integration}>
              {config.integration} (not found)
            </option>
          )}
          <option value="" disabled>
            Choose an integration…
          </option>
          {listing.map((i) => (
            <option key={i.name} value={i.name}>
              {i.label} · {i.category}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="Function"
        hint={selectedFunction?.description}
      >
        <select
          className={`${inputClass} appearance-none`}
          value={config.function ?? ""}
          disabled={!selectedIntegration}
          onChange={(e) => pickFunction(e.target.value)}
        >
          {!selectedFunction && config.function !== "" && (
            <option value={config.function}>
              {config.function} (not found)
            </option>
          )}
          <option value="" disabled>
            Choose a function…
          </option>
          {selectedIntegration?.functions.map((f) => (
            <option key={f.name} value={f.name}>
              {f.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="Input (JSON)"
        hint="Templates resolve at run time. Sample auto-fills when an integration is picked."
      >
        <JsonField
          value={config.input ?? {}}
          onChange={(v) =>
            onChange({
              ...config,
              input: (v ?? {}) as Record<string, unknown>,
            })
          }
        />
      </FormField>
    </div>
  );
}

/** Free-text fallback so the form keeps working even if /api/integrations fails. */
function FallbackTextFields({
  config,
  onChange,
}: {
  config: Config;
  onChange: (c: Config) => void;
}) {
  return (
    <div className="space-y-3">
      <FormField label="Integration">
        <input
          type="text"
          className={inputClass}
          value={config.integration ?? ""}
          onChange={(e) => onChange({ ...config, integration: e.target.value })}
          placeholder="labs"
        />
      </FormField>
      <FormField label="Function">
        <input
          type="text"
          className={inputClass}
          value={config.function ?? ""}
          onChange={(e) => onChange({ ...config, function: e.target.value })}
          placeholder="getResults"
        />
      </FormField>
      <FormField label="Input (JSON)">
        <JsonField
          value={config.input ?? {}}
          onChange={(v) =>
            onChange({
              ...config,
              input: (v ?? {}) as Record<string, unknown>,
            })
          }
        />
      </FormField>
    </div>
  );
}
