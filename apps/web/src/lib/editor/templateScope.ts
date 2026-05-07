import type { GraphLike } from "./graphConvert.js";

export interface ScopeRef {
  /** First-segment name a template may reference, e.g. "trigger" or "getLabs". */
  name: string;
  source: "trigger" | "node" | "itemVar";
  /** For node-sourced and itemVar-sourced refs, the originating node id. */
  nodeId?: string;
  /** Human-readable hint shown next to the ref in the inspector. */
  hint?: string;
}

/**
 * Compute every reference path available to a node's templates:
 *
 *   1. `trigger` — always, with `.input` payload
 *   2. Every transitive ancestor in the DAG, by node id
 *   3. The enclosing loop's `itemVar` if this node is the body of a loop
 *
 * Trigger nodes never appear by their literal id — only via the reserved
 * `trigger` key (matches the engine's executor invariant).
 */
export function scopeForNode(graph: GraphLike, nodeId: string): ScopeRef[] {
  const refs: ScopeRef[] = [
    {
      name: "trigger",
      source: "trigger",
      hint: "Run input — { input: <payload> }",
    },
  ];

  const nodeById = new Map<string, GraphLike["nodes"][number]>();
  for (const n of graph.nodes) nodeById.set(n.id, n);

  const incoming = new Map<string, string[]>();
  for (const n of graph.nodes) incoming.set(n.id, []);
  for (const e of graph.edges) {
    incoming.get(e.target)?.push(e.source);
  }

  const visited = new Set<string>();
  const queue: string[] = [...(incoming.get(nodeId) ?? [])];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (visited.has(cur) || cur === nodeId) continue;
    visited.add(cur);

    const node = nodeById.get(cur);
    if (!node) continue;

    if (!node.kind.startsWith("trigger.")) {
      refs.push({
        name: cur,
        source: "node",
        nodeId: cur,
        hint: `output of ${node.name} (${node.kind})`,
      });
    }

    for (const upstream of incoming.get(cur) ?? []) {
      if (!visited.has(upstream)) queue.push(upstream);
    }
  }

  // Loop body detection: this node is the body if a loop's outgoing edge
  // points directly at it.
  for (const e of graph.edges) {
    if (e.target !== nodeId) continue;
    const source = nodeById.get(e.source);
    if (source?.kind !== "loop") continue;
    const cfg = (source.config ?? {}) as { itemVar?: string; over?: string };
    const itemVar =
      typeof cfg.itemVar === "string" && cfg.itemVar.length > 0
        ? cfg.itemVar
        : "item";
    refs.push({
      name: itemVar,
      source: "itemVar",
      nodeId: source.id,
      hint:
        cfg.over && cfg.over.length > 0
          ? `loop iteration item from ${cfg.over}`
          : "loop iteration item",
    });
    break;
  }

  return refs;
}

const TEMPLATE_RE = /\{\{\s*([^}]+?)\s*\}\}/g;

/** Pull `{{ a.b.c }}` references out of a single string. */
export function extractTemplateRefs(input: string): string[] {
  const out: string[] = [];
  // Reset regex state since we use the global flag.
  TEMPLATE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TEMPLATE_RE.exec(input)) !== null) {
    if (m[1] !== undefined) out.push(m[1].trim());
  }
  return out;
}

/** Walk objects, arrays, and strings recursively; collect every template ref. */
export function extractTemplateRefsDeep(value: unknown): string[] {
  if (typeof value === "string") return extractTemplateRefs(value);
  if (Array.isArray(value)) return value.flatMap(extractTemplateRefsDeep);
  if (value !== null && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(
      extractTemplateRefsDeep,
    );
  }
  return [];
}

export function firstSegment(ref: string): string {
  const idx = ref.indexOf(".");
  return idx === -1 ? ref : ref.slice(0, idx);
}

export interface RefValidation {
  valid: boolean;
  firstSegment: string;
}

/** Cheap validation — does the ref's first segment match a known scope name? */
export function validateRefAgainstScope(
  ref: string,
  scope: readonly ScopeRef[],
): RefValidation {
  const first = firstSegment(ref);
  const valid = scope.some((s) => s.name === first);
  return { valid, firstSegment: first };
}

export interface RefResolution {
  valid: boolean;
  resolved: unknown;
}

/**
 * Stronger validation — when sample data is available, walk the path against
 * it. Mirrors the engine's resolvePath semantics so behavior matches at run
 * time.
 */
export function resolveRefAgainstSample(
  ref: string,
  scope: readonly ScopeRef[],
  samples: Record<string, unknown>,
): RefResolution {
  const first = firstSegment(ref);
  if (!scope.some((s) => s.name === first)) {
    return { valid: false, resolved: undefined };
  }
  const root = samples[first];
  if (root === undefined) return { valid: false, resolved: undefined };

  const rest = ref.slice(first.length + (ref.includes(".") ? 1 : 0));
  if (rest.length === 0) return { valid: true, resolved: root };

  const resolved = walkPath(root, rest);
  return { valid: resolved !== undefined, resolved };
}

function walkPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined) return undefined;
    if (typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    if (Array.isArray(acc)) {
      const idx = Number(key);
      if (Number.isFinite(idx)) return acc[idx];
    }
    return undefined;
  }, value);
}
