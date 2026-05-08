"use client";

import type { Condition, ConditionOp } from "@fuse/core";

import { inputClass } from "./_FormField";
import { TemplateInput } from "./_TemplateInput";

const OPS: ConditionOp[] = [
  "==",
  "!=",
  "===",
  "!==",
  ">",
  "<",
  ">=",
  "<=",
  "in",
  "truthy",
  "falsy",
];

const NEEDS_RIGHT = (op: ConditionOp): boolean =>
  op !== "truthy" && op !== "falsy";

const labelClass =
  "mb-1 block text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400";

interface Props {
  value: Condition;
  onChange: (c: Condition) => void;
}

export function ConditionField({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_92px_minmax(0,1fr)] gap-2">
      <div>
        <span className={labelClass}>Left</span>
        <TemplateInput
          value={String(value.left ?? "")}
          onChange={(v) => onChange({ ...value, left: v })}
          placeholder="{{ trigger.input.x }}"
          className={`${inputClass} font-mono text-[12px]`}
        />
      </div>

      <div>
        <span className={labelClass}>Op</span>
        <select
          className={`${inputClass} appearance-none font-mono text-[12px]`}
          value={value.op}
          onChange={(e) => {
            const op = e.target.value as ConditionOp;
            const next: Condition = { ...value, op };
            if (!NEEDS_RIGHT(op)) delete next.right;
            onChange(next);
          }}
        >
          {OPS.map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className={labelClass}>Right</span>
        {NEEDS_RIGHT(value.op) ? (
          <TemplateInput
            value={String(value.right ?? "")}
            onChange={(v) => onChange({ ...value, right: v })}
            placeholder="value or {{ ref }}"
            className={`${inputClass} font-mono text-[12px]`}
          />
        ) : (
          <div
            className={`${inputClass} flex h-[30px] items-center text-stone-400 dark:text-stone-600`}
          >
            n/a
          </div>
        )}
      </div>
    </div>
  );
}
