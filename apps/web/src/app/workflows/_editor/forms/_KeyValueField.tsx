"use client";

import { useMemo } from "react";

import { inputClass } from "./_FormField";

interface Props {
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}

export function KeyValueField({ value, onChange }: Props) {
  const entries = useMemo(() => Object.entries(value), [value]);

  function setEntry(index: number, k: string, v: string) {
    const next: Record<string, string> = {};
    entries.forEach(([key, val], i) => {
      if (i === index) next[k] = v;
      else next[key] = val;
    });
    onChange(next);
  }

  function add() {
    const taken = new Set(Object.keys(value));
    let key = "key";
    let i = 1;
    while (taken.has(key)) {
      i++;
      key = `key_${i}`;
    }
    onChange({ ...value, [key]: "" });
  }

  function remove(index: number) {
    const next = { ...value };
    const targetKey = entries[index]?.[0];
    if (targetKey !== undefined) delete next[targetKey];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      {entries.length === 0 && (
        <div className="rounded-md border border-dashed border-neutral-300 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-700">
          No entries.
        </div>
      )}
      {entries.map(([k, v], i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <input
            type="text"
            className={inputClass}
            value={k}
            placeholder="key"
            onChange={(e) => setEntry(i, e.target.value, v)}
          />
          <input
            type="text"
            className={inputClass}
            value={v}
            placeholder="value"
            onChange={(e) => setEntry(i, k, e.target.value)}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="rounded-md border border-neutral-300 px-2 text-xs text-neutral-500 hover:border-rose-400 hover:text-rose-600 dark:border-neutral-700"
            aria-label="remove"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="rounded-md border border-dashed border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-400"
      >
        + add
      </button>
    </div>
  );
}
