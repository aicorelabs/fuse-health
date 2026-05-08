"use client";

import { FormField, inputClass } from "./_FormField";

interface Config {
  cron: string;
  timezone?: string;
}

export function TriggerScheduleForm({
  config,
  onChange,
}: {
  config: Config;
  onChange: (c: Config) => void;
}) {
  return (
    <div className="space-y-3">
      <FormField label="Cron" hint="5-field cron syntax. Daemon ships post-M1.">
        <input
          type="text"
          className={inputClass}
          value={config.cron ?? ""}
          onChange={(e) => onChange({ ...config, cron: e.target.value })}
          placeholder="0 0 * * *"
        />
      </FormField>
      <FormField label="Timezone (optional)">
        <input
          type="text"
          className={inputClass}
          value={config.timezone ?? ""}
          onChange={(e) =>
            onChange({ ...config, timezone: e.target.value || undefined })
          }
          placeholder="UTC"
        />
      </FormField>
    </div>
  );
}
