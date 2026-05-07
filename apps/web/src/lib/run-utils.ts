export type RunStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED";

export function isTerminal(status: string): boolean {
  return status === "SUCCEEDED" || status === "FAILED" || status === "CANCELLED";
}

interface StepLike {
  nodeId: string;
  output?: unknown;
}

export function findLLMSummary(steps: StepLike[]): string | null {
  for (const step of steps) {
    const out = step.output;
    if (out && typeof out === "object" && "text" in out) {
      const text = (out as { text: unknown }).text;
      if (typeof text === "string") return text;
    }
  }
  return null;
}
