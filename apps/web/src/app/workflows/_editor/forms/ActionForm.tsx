"use client";

import { useState } from "react";

import { findFunction, useIntegrations } from "@/lib/integrations";

import { FormField, inputClass } from "./_FormField";
import { JsonField } from "./_JsonField";

interface Config {
  integration: string;
  function: string;
  input?: Record<string, unknown>;
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
  const { data: listing, error, loading } = useIntegrations();
  const [showPicker, setShowPicker] = useState(false);

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

  if (loading || !listing) {
    return (
      <div className="space-y-3">
        <div className="text-[12px] text-stone-500">Loading integrations…</div>
      </div>
    );
  }

  const found = findFunction(listing, config.integration, config.function);
  const showAsPicker = !found || showPicker;

  return (
    <div className="space-y-3">
      {showAsPicker ? (
        <Picker
          listing={listing}
          config={config}
          onChange={onChange}
          onDone={() => {
            const ok = findFunction(
              listing,
              config.integration,
              config.function,
            );
            if (ok) setShowPicker(false);
          }}
        />
      ) : (
        <ReadOnlyChoice
          integrationLabel={found.integration.label}
          integrationCategory={found.integration.category}
          integrationName={found.integration.name}
          functionName={found.fn.name}
          functionDescription={found.fn.description}
          onChange={() => setShowPicker(true)}
        />
      )}

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

function ReadOnlyChoice({
  integrationLabel,
  integrationCategory,
  integrationName,
  functionName,
  functionDescription,
  onChange,
}: {
  integrationLabel: string;
  integrationCategory: string;
  integrationName: string;
  functionName: string;
  functionDescription: string;
  onChange: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Calls
        </span>
        <button
          type="button"
          onClick={onChange}
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400 transition-colors hover:text-stone-700 dark:hover:text-stone-200"
        >
          change
        </button>
      </div>

      <div className="space-y-1.5 rounded-sm border border-stone-200 bg-stone-50/40 px-2.5 py-2 dark:border-stone-800 dark:bg-stone-900/40">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[13px] font-medium tracking-tight text-stone-900 dark:text-stone-100">
            {integrationLabel}
          </span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-stone-400 dark:text-stone-500">
            {integrationCategory}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[11px] tabular text-stone-400 dark:text-stone-500">
            {integrationName}
          </span>
          <span className="font-mono text-[10.5px] text-stone-300 dark:text-stone-700">
            ·
          </span>
          <span className="font-mono text-[12px] text-stone-700 dark:text-stone-300">
            {functionName}
          </span>
        </div>
        <p className="text-[11.5px] leading-relaxed text-stone-500 dark:text-stone-500">
          {functionDescription}
        </p>
      </div>
    </div>
  );
}

interface PickerProps {
  listing: NonNullable<ReturnType<typeof useIntegrations>["data"]>;
  config: Config;
  onChange: (c: Config) => void;
  onDone: () => void;
}

function Picker({ listing, config, onChange, onDone }: PickerProps) {
  const selectedIntegration = listing.find((i) => i.name === config.integration);
  const selectedFunction = selectedIntegration?.functions.find(
    (f) => f.name === config.function,
  );

  function pickIntegration(name: string) {
    const integ = listing.find((i) => i.name === name);
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

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Pick a call
        </span>
        {selectedFunction && (
          <button
            type="button"
            onClick={onDone}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400 transition-colors hover:text-stone-700 dark:hover:text-stone-200"
          >
            done
          </button>
        )}
      </div>

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

      <FormField label="Function" hint={selectedFunction?.description}>
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
