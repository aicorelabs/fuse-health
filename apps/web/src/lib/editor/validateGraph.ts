import { WorkflowGraph } from "@fuse/core";

import type { GraphLike } from "./graphConvert.js";

export interface ValidationIssue {
  code:
    | "SCHEMA"
    | "NO_TRIGGER"
    | "MULTIPLE_TRIGGERS"
    | "CYCLE"
    | "LOOP_OUTGOING_COUNT"
    | "LOOP_BODY_IS_LOOP"
    | "BRANCH_EDGE_NO_CASE"
    | "BRANCH_NO_CASES"
    | "ORPHAN";
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export function validateForSave(graph: GraphLike): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // 1. zod parse via the engine schema
  try {
    WorkflowGraph.fromJSON(graph);
  } catch (err) {
    errors.push({
      code: "SCHEMA",
      message: err instanceof Error ? err.message : String(err),
    });
    // Topology checks below still run on the raw graph — they rely on shape,
    // not zod validity, so the user can see *all* problems at once.
  }

  // 2. trigger count
  const triggerNodes = graph.nodes.filter((n) => n.kind.startsWith("trigger."));
  if (triggerNodes.length === 0) {
    errors.push({ code: "NO_TRIGGER", message: "Workflow must have a trigger." });
  } else if (triggerNodes.length > 1) {
    errors.push({
      code: "MULTIPLE_TRIGGERS",
      message: `Workflow has ${triggerNodes.length} triggers; only one is allowed.`,
    });
  }

  // 3. cycle detection
  if (hasCycle(graph)) {
    errors.push({ code: "CYCLE", message: "Graph contains a cycle." });
  }

  // 4. loop checks
  for (const node of graph.nodes) {
    if (node.kind !== "loop") continue;
    const outgoing = graph.edges.filter((e) => e.source === node.id);
    if (outgoing.length !== 1) {
      errors.push({
        code: "LOOP_OUTGOING_COUNT",
        nodeId: node.id,
        message: `Loop "${node.id}" must have exactly one outgoing edge (has ${outgoing.length}).`,
      });
      continue;
    }
    const bodyTarget = outgoing[0]!.target;
    const body = graph.nodes.find((n) => n.id === bodyTarget);
    if (body && body.kind === "loop") {
      errors.push({
        code: "LOOP_BODY_IS_LOOP",
        nodeId: node.id,
        message: `Loop "${node.id}" body cannot itself be a loop.`,
      });
    }
  }

  // 5. branch checks
  for (const node of graph.nodes) {
    if (node.kind !== "branch") continue;
    const cfg = (node.config ?? {}) as {
      cases?: Array<{ edge: string }>;
      default?: string;
    };
    const labels = new Set<string>((cfg.cases ?? []).map((c) => c.edge));
    if (cfg.default !== undefined) labels.add(cfg.default);
    if (labels.size === 0) {
      errors.push({
        code: "BRANCH_NO_CASES",
        nodeId: node.id,
        message: `Branch "${node.id}" has no cases and no default; no outgoing edge can fire.`,
      });
      continue;
    }
    for (const edge of graph.edges.filter((e) => e.source === node.id)) {
      const cond = edge.condition;
      if (cond === undefined || !labels.has(cond)) {
        errors.push({
          code: "BRANCH_EDGE_NO_CASE",
          nodeId: node.id,
          edgeId: edge.id,
          message: `Branch "${node.id}" outgoing edge "${edge.id}" has no matching case (got ${
            cond === undefined ? "no label" : `"${cond}"`
          }).`,
        });
      }
    }
  }

  // 6. orphan warning — node not reachable from any trigger
  if (triggerNodes.length > 0) {
    const reachable = reachableFrom(
      graph,
      triggerNodes.map((n) => n.id),
    );
    for (const node of graph.nodes) {
      if (!reachable.has(node.id)) {
        warnings.push({
          code: "ORPHAN",
          nodeId: node.id,
          message: `Node "${node.id}" is not reachable from any trigger.`,
        });
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

function hasCycle(graph: GraphLike): boolean {
  const adj = new Map<string, string[]>();
  for (const n of graph.nodes) adj.set(n.id, []);
  for (const e of graph.edges) {
    adj.get(e.source)?.push(e.target);
  }

  const WHITE = 0,
    GRAY = 1,
    BLACK = 2;
  const color = new Map<string, number>();
  for (const n of graph.nodes) color.set(n.id, WHITE);

  function visit(id: string): boolean {
    const c = color.get(id);
    if (c === GRAY) return true;
    if (c === BLACK) return false;
    color.set(id, GRAY);
    for (const next of adj.get(id) ?? []) {
      if (visit(next)) return true;
    }
    color.set(id, BLACK);
    return false;
  }

  for (const n of graph.nodes) {
    if (color.get(n.id) === WHITE && visit(n.id)) return true;
  }
  return false;
}

function reachableFrom(graph: GraphLike, starts: string[]): Set<string> {
  const adj = new Map<string, string[]>();
  for (const n of graph.nodes) adj.set(n.id, []);
  for (const e of graph.edges) {
    adj.get(e.source)?.push(e.target);
  }
  const reached = new Set<string>(starts);
  const stack = [...starts];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    for (const next of adj.get(cur) ?? []) {
      if (!reached.has(next)) {
        reached.add(next);
        stack.push(next);
      }
    }
  }
  return reached;
}
