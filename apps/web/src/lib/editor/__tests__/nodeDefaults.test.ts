import { describe, expect, it } from "vitest";

import { type NodeKind, NodeSchema } from "@fuse/core";

import { defaultNodeFor } from "../nodeDefaults.js";

const ALL_KINDS: NodeKind[] = [
  "trigger.manual",
  "trigger.webhook",
  "trigger.schedule",
  "action",
  "http",
  "llm",
  "branch",
  "filter",
  "loop",
  "merge",
  "set",
  "wait",
  "stop",
];

describe("defaultNodeFor", () => {
  for (const kind of ALL_KINDS) {
    it(`produces a ${kind} node that parses through NodeSchema`, () => {
      const node = defaultNodeFor(kind, "n_1", { x: 0, y: 0 });
      expect(node.kind).toBe(kind);
      expect(node.id).toBe("n_1");
      expect(node.position).toEqual({ x: 0, y: 0 });
      const result = NodeSchema.safeParse(node);
      if (!result.success) {
        throw new Error(
          `${kind} default failed schema: ${JSON.stringify(result.error.issues, null, 2)}`,
        );
      }
    });
  }

  it("uses the provided id and position verbatim", () => {
    const node = defaultNodeFor("set", "abc", { x: 50, y: 100 });
    expect(node.id).toBe("abc");
    expect(node.position).toEqual({ x: 50, y: 100 });
  });
});
