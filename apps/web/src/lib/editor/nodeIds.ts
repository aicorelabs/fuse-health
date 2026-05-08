import type { NodeKind } from "@fuse/core";

const KIND_SLUGS: Record<NodeKind, string> = {
  "trigger.manual": "trigger",
  "trigger.webhook": "webhook",
  "trigger.schedule": "schedule",
  action: "action",
  http: "http",
  llm: "llm",
  branch: "branch",
  filter: "filter",
  loop: "loop",
  merge: "merge",
  set: "set",
  wait: "wait",
  stop: "stop",
};

export function nextNodeId(existing: readonly string[], kind: NodeKind): string {
  const base = KIND_SLUGS[kind];
  const taken = new Set(existing);
  if (!taken.has(base)) return base;
  for (let i = 2; i < 10_000; i++) {
    const candidate = `${base}_${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  throw new Error(`could not find a unique id for kind ${kind}`);
}
