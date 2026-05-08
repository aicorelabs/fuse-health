"use client";

import { FormField, inputClass } from "./_FormField";

interface Config {
  seconds: number;
}

export function WaitForm({
  config,
  onChange,
}: {
  config: Config;
  onChange: (c: Config) => void;
}) {
  return (
    <FormField
      label="Seconds"
      hint="In-process setTimeout — server restart kills the run."
    >
      <input
        type="number"
        min={0}
        className={inputClass}
        value={config.seconds ?? 0}
        onChange={(e) => onChange({ seconds: Number(e.target.value) })}
      />
    </FormField>
  );
}
