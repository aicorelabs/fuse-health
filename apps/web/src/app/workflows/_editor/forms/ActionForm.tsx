"use client";

import { FormField, inputClass } from "./_FormField";
import { JsonField } from "./_JsonField";

interface Config {
  integration: string;
  function: string;
  input?: Record<string, unknown>;
}

export function ActionForm({
  config,
  onChange,
}: {
  config: Config;
  onChange: (c: Config) => void;
}) {
  return (
    <div className="space-y-3">
      <FormField label="Integration" hint="e.g. labs, radiology, ehr-notes">
        <input
          type="text"
          className={inputClass}
          value={config.integration ?? ""}
          onChange={(e) => onChange({ ...config, integration: e.target.value })}
          placeholder="labs"
        />
      </FormField>
      <FormField label="Function" hint="e.g. getResults">
        <input
          type="text"
          className={inputClass}
          value={config.function ?? ""}
          onChange={(e) => onChange({ ...config, function: e.target.value })}
          placeholder="getResults"
        />
      </FormField>
      <FormField label="Input (JSON)" hint="Templates resolve at run time.">
        <JsonField
          value={config.input ?? {}}
          onChange={(v) => onChange({ ...config, input: (v ?? {}) as Record<string, unknown> })}
        />
      </FormField>
    </div>
  );
}
