"use client";

import { FormField, inputClass } from "./_FormField";

interface Config {
  reason?: string;
}

export function StopForm({
  config,
  onChange,
}: {
  config: Config;
  onChange: (c: Config) => void;
}) {
  return (
    <FormField label="Reason" hint="Recorded as the run's error message.">
      <input
        type="text"
        className={inputClass}
        value={config.reason ?? ""}
        onChange={(e) =>
          onChange({ reason: e.target.value || undefined })
        }
        placeholder="optional"
      />
    </FormField>
  );
}
