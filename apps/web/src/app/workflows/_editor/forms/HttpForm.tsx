"use client";

import { FormField, inputClass } from "./_FormField";
import { JsonField } from "./_JsonField";
import { KeyValueField } from "./_KeyValueField";

interface Config {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
}

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export function HttpForm({
  config,
  onChange,
}: {
  config: Config;
  onChange: (c: Config) => void;
}) {
  return (
    <div className="space-y-3">
      <FormField label="Method">
        <select
          className={inputClass}
          value={config.method ?? "GET"}
          onChange={(e) => onChange({ ...config, method: e.target.value as Config["method"] })}
        >
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="URL">
        <input
          type="text"
          className={inputClass}
          value={config.url ?? ""}
          onChange={(e) => onChange({ ...config, url: e.target.value })}
          placeholder="https://api.example.com/v1/x"
        />
      </FormField>
      <FormField label="Headers">
        <KeyValueField
          value={config.headers ?? {}}
          onChange={(headers) => onChange({ ...config, headers })}
        />
      </FormField>
      <FormField label="Query">
        <KeyValueField
          value={config.query ?? {}}
          onChange={(query) => onChange({ ...config, query })}
        />
      </FormField>
      <FormField label="Body (JSON)">
        <JsonField
          value={config.body}
          onChange={(body) => onChange({ ...config, body })}
        />
      </FormField>
      <FormField label="Timeout (ms)">
        <input
          type="number"
          min={0}
          className={inputClass}
          value={config.timeoutMs ?? ""}
          onChange={(e) =>
            onChange({
              ...config,
              timeoutMs: e.target.value === "" ? undefined : Number(e.target.value),
            })
          }
          placeholder="50000"
        />
      </FormField>
    </div>
  );
}
