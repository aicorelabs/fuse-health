"use client";

import { useEffect, useRef, useState } from "react";

import {
  applyCompletion,
  buildSuggestions,
  findTriggerSpan,
  parsePathQuery,
  type Suggestion,
} from "@/lib/editor/templateAutocomplete";

import { useTemplateScope } from "../TemplateScopeContext";

import { inputClass } from "./_FormField";

interface BaseProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  spellCheck?: boolean;
  /** When true, render as <textarea>. */
  multiline?: boolean;
  rows?: number;
}

/**
 * A drop-in replacement for plain inputs/textareas that adds template
 * autocomplete. Type `{{` and a popover opens with in-scope refs; deep paths
 * complete from the most recent SUCCEEDED run's sample data.
 *
 * Anchored below the field for v1 — caret-anchored positioning is a future
 * upgrade.
 */
export function TemplateInput({
  value,
  onChange,
  placeholder,
  className,
  spellCheck = false,
  multiline = false,
  rows = 3,
}: BaseProps) {
  const { scope, samples } = useTemplateScope();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [highlight, setHighlight] = useState(0);

  function recomputeFromCaret() {
    const el = inputRef.current;
    if (!el) return;
    const caret = el.selectionStart ?? value.length;
    const span = findTriggerSpan(value, caret);
    if (!span) {
      setOpen(false);
      return;
    }
    const parsed = parsePathQuery(span.query);
    const ss = buildSuggestions(scope, samples, parsed);
    setSuggestions(ss);
    setHighlight(0);
    setOpen(ss.length > 0);
  }

  function commit(suggestion: Suggestion) {
    const el = inputRef.current;
    if (!el) return;
    const caret = el.selectionStart ?? value.length;
    const span = findTriggerSpan(value, caret);
    if (!span) return;
    const r = applyCompletion(value, span, suggestion.full);
    onChange(r.value);
    setOpen(false);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(r.caret, r.caret);
      // Open again so chained typing (e.g. `.`) resumes naturally.
      recomputeFromCaret();
    });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const target = suggestions[highlight];
      if (target) commit(target);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  // Recompute when external value changes too (e.g. someone pastes).
  useEffect(() => {
    recomputeFromCaret();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, scope, samples]);

  const sharedProps = {
    ref: inputRef as React.Ref<never>,
    value,
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => onChange(e.target.value),
    onKeyDown,
    onKeyUp: recomputeFromCaret,
    onClick: recomputeFromCaret,
    onFocus: recomputeFromCaret,
    onBlur: () => {
      // Delay so a mousedown on a suggestion can fire commit() first.
      setTimeout(() => setOpen(false), 120);
    },
    placeholder,
    spellCheck,
    className: className ?? inputClass,
  };

  return (
    <div ref={containerRef} className="relative">
      {multiline ? (
        <textarea
          {...(sharedProps as React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
            ref: React.Ref<HTMLTextAreaElement>;
          })}
          rows={rows}
        />
      ) : (
        <input
          type="text"
          {...(sharedProps as React.InputHTMLAttributes<HTMLInputElement> & {
            ref: React.Ref<HTMLInputElement>;
          })}
        />
      )}
      {open && suggestions.length > 0 && (
        <SuggestionList
          suggestions={suggestions}
          highlight={highlight}
          onPick={commit}
          onHover={setHighlight}
        />
      )}
    </div>
  );
}

function SuggestionList({
  suggestions,
  highlight,
  onPick,
  onHover,
}: {
  suggestions: Suggestion[];
  highlight: number;
  onPick: (s: Suggestion) => void;
  onHover: (i: number) => void;
}) {
  return (
    <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-sm border border-stone-200 bg-white shadow-[0_4px_16px_rgba(28,25,23,0.08)] dark:border-stone-800 dark:bg-stone-900">
      {suggestions.map((s, i) => (
        <button
          key={s.full}
          type="button"
          onMouseEnter={() => onHover(i)}
          onMouseDown={(e) => {
            // Prevent input blur so commit can run with focus retained.
            e.preventDefault();
            onPick(s);
          }}
          className={`flex w-full items-baseline justify-between gap-3 px-2.5 py-1.5 text-left text-[12px] transition-colors ${
            i === highlight
              ? "bg-stone-100 dark:bg-stone-800"
              : "hover:bg-stone-50 dark:hover:bg-stone-900/80"
          }`}
        >
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="font-mono text-stone-900 dark:text-stone-100">
              {s.full}
            </span>
            {s.hint && (
              <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500">
                {s.hint}
              </span>
            )}
          </div>
          {s.valuePreview !== undefined && (
            <span className="ml-2 truncate font-mono text-[10.5px] text-stone-500 dark:text-stone-400">
              {previewText(s.valuePreview)}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function previewText(value: unknown): string {
  if (typeof value === "string") {
    if (value.length > 32) return `"${value.slice(0, 32)}…"`;
    return JSON.stringify(value);
  }
  try {
    const text = JSON.stringify(value);
    if (text.length > 32) return text.slice(0, 32) + "…";
    return text;
  } catch {
    return String(value);
  }
}
