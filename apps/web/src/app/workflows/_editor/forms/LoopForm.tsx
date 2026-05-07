"use client";

import { FormField, inputClass } from "./_FormField";
import { TemplateInput } from "./_TemplateInput";

interface Config {
  over: string;
  itemVar?: string;
}

export function LoopForm({
  config,
  onChange,
}: {
  config: Config;
  onChange: (c: Config) => void;
}) {
  return (
    <div className="space-y-3">
      <FormField label="Over" hint="Template ref that resolves to an array.">
        <TemplateInput
          value={config.over ?? ""}
          onChange={(over) => onChange({ ...config, over })}
          placeholder="{{ trigger.input.patients }}"
          className={`${inputClass} font-mono text-[12px]`}
        />
      </FormField>
      <FormField
        label="Item var"
        hint='Bound per iteration. Reference inside the body as `{{ <var>.<field> }}`.'
      >
        <input
          type="text"
          className={inputClass}
          value={config.itemVar ?? "item"}
          onChange={(e) =>
            onChange({ ...config, itemVar: e.target.value || undefined })
          }
          placeholder="item"
        />
      </FormField>
      <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
        v1: connect <em>exactly one</em> outgoing edge — the loop body. Multi-step bodies are not supported.
      </p>
    </div>
  );
}
