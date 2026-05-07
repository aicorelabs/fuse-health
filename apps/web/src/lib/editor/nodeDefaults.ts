import type { NodeJSON, NodeKind } from "@fuse/core";

interface Position {
  x: number;
  y: number;
}

// One per NodeKind; each must satisfy the kind's zod schema. zod-min(1) string
// fields get placeholder values so a freshly-dropped node is valid until the
// user fills in real config.
const DEFAULT_CONFIG: Record<NodeKind, () => Record<string, unknown>> = {
  "trigger.manual": () => ({}),
  "trigger.webhook": () => ({ path: "/webhook", method: "POST" }),
  "trigger.schedule": () => ({ cron: "0 0 * * *" }),
  action: () => ({ integration: "labs", function: "getResults", input: {} }),
  http: () => ({ method: "GET", url: "https://example.com" }),
  llm: () => ({ prompt: "" }),
  branch: () => ({ cases: [] }),
  filter: () => ({ condition: { left: "", op: "truthy" } }),
  loop: () => ({ over: "{{ trigger.input.items }}", itemVar: "item" }),
  merge: () => ({ mode: "object" }),
  set: () => ({ fields: {} }),
  wait: () => ({ seconds: 1 }),
  stop: () => ({}),
};

const DEFAULT_NAMES: Record<NodeKind, string> = {
  "trigger.manual": "Manual trigger",
  "trigger.webhook": "Webhook trigger",
  "trigger.schedule": "Schedule trigger",
  action: "Action",
  http: "HTTP request",
  llm: "LLM",
  branch: "Branch",
  filter: "Filter",
  loop: "Loop",
  merge: "Merge",
  set: "Set",
  wait: "Wait",
  stop: "Stop",
};

export function defaultNodeFor(
  kind: NodeKind,
  id: string,
  position: Position,
): NodeJSON {
  return {
    id,
    kind,
    name: DEFAULT_NAMES[kind],
    position,
    config: DEFAULT_CONFIG[kind](),
  } as unknown as NodeJSON;
}
