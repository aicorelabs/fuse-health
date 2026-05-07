"use client";

import { useEffect, useState } from "react";

import { inputClass } from "./_FormField";

interface Props {
  value: unknown;
  onChange: (next: unknown) => void;
  rows?: number;
}

// Tracks the textarea text locally; commits via onChange only when the JSON
// parses cleanly. Surfaces the parse error inline.
export function JsonField({ value, onChange, rows = 6 }: Props) {
  const [text, setText] = useState(() =>
    value === undefined ? "" : JSON.stringify(value, null, 2),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // External value changed (e.g. another node selected) — re-stringify.
    setText(value === undefined ? "" : JSON.stringify(value, null, 2));
    setError(null);
  }, [value]);

  function handleChange(next: string) {
    setText(next);
    if (next.trim() === "") {
      onChange(undefined);
      setError(null);
      return;
    }
    try {
      const parsed: unknown = JSON.parse(next);
      onChange(parsed);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-1">
      <textarea
        className={`${inputClass} font-mono text-xs`}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        rows={rows}
        spellCheck={false}
      />
      {error && (
        <div className="text-xs text-rose-600 dark:text-rose-400">{error}</div>
      )}
    </div>
  );
}
