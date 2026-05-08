"use client";

import { FormField, inputClass } from "./_FormField";

interface Config {
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  secret?: string;
}

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export function TriggerWebhookForm({
  config,
  onChange,
}: {
  config: Config;
  onChange: (c: Config) => void;
}) {
  return (
    <div className="space-y-3">
      <FormField label="Path" hint="POST /api/triggers/<path>">
        <input
          type="text"
          className={inputClass}
          value={config.path ?? ""}
          onChange={(e) => onChange({ ...config, path: e.target.value })}
          placeholder="/webhook"
        />
      </FormField>
      <FormField label="Method">
        <select
          className={inputClass}
          value={config.method ?? "POST"}
          onChange={(e) => onChange({ ...config, method: e.target.value as Config["method"] })}
        >
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Shared secret (optional)">
        <input
          type="text"
          className={inputClass}
          value={config.secret ?? ""}
          onChange={(e) => onChange({ ...config, secret: e.target.value || undefined })}
          placeholder="optional"
        />
      </FormField>
    </div>
  );
}
