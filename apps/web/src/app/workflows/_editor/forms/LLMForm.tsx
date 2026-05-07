"use client";

import { FormField, inputClass } from "./_FormField";

interface Config {
  prompt: string;
  model?: string;
}

export function LLMForm({
  config,
  onChange,
}: {
  config: Config;
  onChange: (c: Config) => void;
}) {
  return (
    <div className="space-y-3">
      <FormField label="Prompt" hint="Templates resolve at run time.">
        <textarea
          className={`${inputClass} font-mono text-xs`}
          rows={8}
          spellCheck={false}
          value={config.prompt ?? ""}
          onChange={(e) => onChange({ ...config, prompt: e.target.value })}
          placeholder="Summarize the patient chart for the attending..."
        />
      </FormField>
      <FormField label="Model" hint="Defaults to llama-3.3-70b-versatile.">
        <input
          type="text"
          className={inputClass}
          value={config.model ?? ""}
          onChange={(e) =>
            onChange({ ...config, model: e.target.value || undefined })
          }
          placeholder="llama-3.3-70b-versatile"
        />
      </FormField>
    </div>
  );
}
