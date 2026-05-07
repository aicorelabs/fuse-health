import type { NodeKind } from "@fuse/core";

export const KIND_LABELS: Record<NodeKind, string> = {
  "trigger.manual": "Manual trigger",
  "trigger.webhook": "Webhook trigger",
  "trigger.schedule": "Schedule trigger",
  action: "Action",
  http: "HTTP",
  llm: "LLM",
  branch: "Branch",
  filter: "Filter",
  loop: "Loop",
  merge: "Merge",
  set: "Set",
  wait: "Wait",
  stop: "Stop",
};

export const KIND_GROUPS: Array<{ label: string; kinds: NodeKind[] }> = [
  {
    label: "Triggers",
    kinds: ["trigger.manual", "trigger.webhook", "trigger.schedule"],
  },
  { label: "Calls", kinds: ["action", "http", "llm"] },
  { label: "Control flow", kinds: ["branch", "filter", "loop", "stop"] },
  { label: "Data", kinds: ["merge", "set"] },
  { label: "Time", kinds: ["wait"] },
];

export function isTriggerKind(kind: string): boolean {
  return kind.startsWith("trigger.");
}
