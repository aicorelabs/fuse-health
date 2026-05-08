"use client";

import { FormField, inputClass } from "./_FormField";

interface Config {
  mode: "object" | "array" | "concat";
}

export function MergeForm({
  config,
  onChange,
}: {
  config: Config;
  onChange: (c: Config) => void;
}) {
  return (
    <FormField label="Mode" hint="object: shallow-merge. array: positional. concat: flatten arrays.">
      <select
        className={inputClass}
        value={config.mode}
        onChange={(e) =>
          onChange({ mode: e.target.value as Config["mode"] })
        }
      >
        <option value="object">object</option>
        <option value="array">array</option>
        <option value="concat">concat</option>
      </select>
    </FormField>
  );
}
