"use client";

import { type ReactNode } from "react";

export function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-[11px] leading-relaxed text-stone-500 dark:text-stone-500">
          {hint}
        </span>
      )}
    </label>
  );
}

// Hairline-bordered input. 2px corners, single ink focus state, no ring.
export const inputClass =
  "block w-full rounded-sm border border-stone-200 bg-white px-2.5 py-1.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors focus:border-stone-900 focus:outline-none dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-600 dark:focus:border-stone-100";
