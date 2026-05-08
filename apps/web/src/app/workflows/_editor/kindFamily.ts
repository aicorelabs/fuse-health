import type { NodeKind } from "@fuse/core";

export type KindFamily = "trigger" | "call" | "control" | "data" | "time";

export function kindFamily(kind: NodeKind): KindFamily {
  if (kind.startsWith("trigger.")) return "trigger";
  if (kind === "action" || kind === "http" || kind === "llm") return "call";
  if (
    kind === "branch" ||
    kind === "filter" ||
    kind === "loop" ||
    kind === "stop"
  )
    return "control";
  if (kind === "merge" || kind === "set") return "data";
  return "time"; // wait
}

// 4px squares — restrained, single signal of family.
// Saturation kept low so the dot is a hint, not a brand element.
export const familyDotClass: Record<KindFamily, string> = {
  trigger: "bg-sky-500/70",
  call: "bg-amber-500/70",
  control: "bg-violet-500/70",
  data: "bg-rose-500/70",
  time: "bg-emerald-500/70",
};

export const familyLabel: Record<KindFamily, string> = {
  trigger: "Triggers",
  call: "Calls",
  control: "Control",
  data: "Data",
  time: "Time",
};
