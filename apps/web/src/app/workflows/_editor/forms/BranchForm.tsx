"use client";

import type { Condition } from "@fuse/core";

import { ConditionField } from "./_ConditionField";
import { FormField, inputClass } from "./_FormField";

interface Case {
  when: Condition;
  edge: string;
}

interface Config {
  cases: Case[];
  default?: string;
}

export interface BranchFormProps {
  nodeId: string;
  config: Config;
  onChange: (c: Config) => void;
  onCaseRename: (oldLabel: string, newLabel: string) => void;
  onCaseRemove: (label: string) => void;
}

export function BranchForm({
  config,
  onChange,
  onCaseRename,
  onCaseRemove,
}: BranchFormProps) {
  function updateCase(idx: number, patch: Partial<Case>) {
    const next = config.cases.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    onChange({ ...config, cases: next });
  }

  function renameCaseLabel(idx: number, newLabel: string) {
    const old = config.cases[idx]?.edge;
    if (old === undefined || old === newLabel) {
      updateCase(idx, { edge: newLabel });
      return;
    }
    updateCase(idx, { edge: newLabel });
    onCaseRename(old, newLabel);
  }

  function removeCase(idx: number) {
    const removed = config.cases[idx];
    const next = config.cases.filter((_, i) => i !== idx);
    onChange({ ...config, cases: next });
    if (removed?.edge) onCaseRemove(removed.edge);
  }

  function addCase() {
    const taken = new Set(config.cases.map((c) => c.edge));
    let label = "case";
    let i = 1;
    while (taken.has(label)) {
      i++;
      label = `case_${i}`;
    }
    onChange({
      ...config,
      cases: [
        ...config.cases,
        { when: { left: "", op: "truthy" }, edge: label },
      ],
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {config.cases.map((c, i) => (
          <div
            key={i}
            className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
          >
            <div className="flex items-center justify-between">
              <FormField label="Edge label">
                <input
                  type="text"
                  className={inputClass}
                  value={c.edge}
                  onChange={(e) => renameCaseLabel(i, e.target.value)}
                  placeholder="case"
                />
              </FormField>
              <button
                type="button"
                onClick={() => removeCase(i)}
                className="ml-3 mt-5 rounded-md border border-neutral-300 px-2 text-xs text-neutral-500 hover:border-rose-400 hover:text-rose-600 dark:border-neutral-700"
              >
                remove
              </button>
            </div>
            <ConditionField
              value={c.when}
              onChange={(when) => updateCase(i, { when })}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addCase}
          className="rounded-md border border-dashed border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-400"
        >
          + add case
        </button>
      </div>

      <FormField label="Default edge label" hint="Fires when no case matches; leave blank for none.">
        <input
          type="text"
          className={inputClass}
          value={config.default ?? ""}
          onChange={(e) =>
            onChange({ ...config, default: e.target.value || undefined })
          }
          placeholder="default"
        />
      </FormField>
    </div>
  );
}
