import type { ScopeRef } from "./templateScope.js";

export interface TriggerSpan {
  /** Index in the input value where `{{` starts. */
  start: number;
  /** Index where the path query ends (= caret position when active). */
  end: number;
  /** Text between `{{` (post-leading-space) and the caret. */
  query: string;
}

/**
 * Find an open `{{` template span the caret is currently inside. Returns null
 * if the caret is outside any template, or inside an already-closed one.
 *
 * "Inside an already-closed one" means: between the most recent `{{` and a
 * subsequent `}}` that lies entirely before the caret. Those templates are
 * complete; we don't autocomplete them.
 *
 * "Open" means the most recent `{{` does NOT have a `}}` strictly before the
 * caret. The user is mid-typing, possibly in a balanced `{{ ... }}` pair
 * where the caret sits between the braces.
 */
export function findTriggerSpan(
  value: string,
  caret: number,
): TriggerSpan | null {
  if (caret < 0) return null;
  const before = value.slice(0, caret);
  const open = before.lastIndexOf("{{");
  if (open === -1) return null;
  // Reject templates that have closed before the caret.
  const close = before.indexOf("}}", open);
  if (close !== -1 && close <= caret) return null;

  // Strip a single leading space inside `{{ `, like the engine's template regex.
  let queryStart = open + 2;
  if (value[queryStart] === " ") queryStart += 1;
  const query = value.slice(queryStart, caret);

  return { start: open, end: caret, query };
}

export interface ParsedQuery {
  /** Resolved path segments (everything before the last dot). */
  path: string[];
  /** Partial last segment (text after the last dot). */
  partial: string;
}

/**
 * Split a query string like `"trigger.input.pat"` into a resolved path and a
 * partial last segment. The partial drives substring-filtering of suggestions.
 */
export function parsePathQuery(query: string): ParsedQuery {
  if (query === "") return { path: [], partial: "" };
  const segments = query.split(".");
  const partial = segments[segments.length - 1] ?? "";
  const path = segments.slice(0, -1);
  return { path, partial };
}

export interface Suggestion {
  /** Display name (just the segment being completed). */
  name: string;
  /** Full path that will be inserted, e.g. `trigger.input.patientId`. */
  full: string;
  /** Optional source / hint string. */
  hint?: string;
  /** Optional preview of the resolved value at this path (if a leaf). */
  valuePreview?: unknown;
}

/**
 * Compute autocomplete suggestions for the current parsed query against the
 * editor's scope and (optionally) the last-run sample data.
 *
 * - `path: []` → top-level scope refs, filtered by `partial`.
 * - `path: [scopeName, ...rest]` → keys of `samples[scopeName].rest...`,
 *   filtered by `partial`. Returns [] if sample data is missing or the path
 *   doesn't resolve to an object.
 */
export function buildSuggestions(
  scope: readonly ScopeRef[],
  samples: Record<string, unknown> | null,
  parsed: ParsedQuery,
): Suggestion[] {
  if (parsed.path.length === 0) {
    return scope
      .filter((s) =>
        s.name.toLowerCase().includes(parsed.partial.toLowerCase()),
      )
      .map((s) => ({
        name: s.name,
        full: s.name,
        ...(s.hint && { hint: s.hint }),
      }));
  }

  if (!samples) return [];
  const root = samples[parsed.path[0]!];
  if (root === undefined) return [];

  const rest = parsed.path.slice(1);
  const value = rest.length === 0 ? root : walkPath(root, rest);
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  const obj = value as Record<string, unknown>;
  return Object.keys(obj)
    .filter((k) => k.toLowerCase().includes(parsed.partial.toLowerCase()))
    .map((k) => {
      const child = obj[k];
      const isLeaf =
        child === null ||
        typeof child !== "object" ||
        Array.isArray(child);
      const result: Suggestion = {
        name: k,
        full: [...parsed.path, k].join("."),
      };
      result.hint = describeType(child);
      if (isLeaf) result.valuePreview = child;
      return result;
    });
}

function walkPath(value: unknown, segments: string[]): unknown {
  let cur: unknown = value;
  for (const key of segments) {
    if (cur === null || cur === undefined) return undefined;
    if (typeof cur === "object" && key in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return cur;
}

function describeType(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return `array[${v.length}]`;
  return typeof v;
}

export interface CompletionResult {
  value: string;
  caret: number;
}

/**
 * Replace the open template span with `{{ <pathToInsert> }}`. Caret lands
 * between the path and the closing `}}` so the user can keep typing `.foo`
 * to extend the path; the autocomplete reopens against the new partial.
 *
 * If the input already had a closing `}}` after the caret, we don't add a
 * second one — we just rewrite the path text.
 */
export function applyCompletion(
  value: string,
  span: TriggerSpan,
  pathToInsert: string,
): CompletionResult {
  // Anything after the caret. If it starts with `}}` (possibly with a leading
  // space inside the closer like ` }}`), keep it; otherwise we add ` }}`.
  const after = value.slice(span.end);
  const alreadyClosed = /^\s*}}/.test(after);

  // Build the new template body. Preserve the leading space convention.
  const head = value.slice(0, span.start) + "{{ " + pathToInsert;
  const newCaret = head.length;
  const tail = alreadyClosed ? after : " }}" + after;

  return { value: head + tail, caret: newCaret };
}
