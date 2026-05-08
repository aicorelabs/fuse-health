import { describe, expect, it } from "vitest";

import {
  applyBranchCaseRename,
  removeBranchEdgesForCase,
} from "../branchSync.js";

const baseEdges = [
  { id: "e1", source: "br", target: "a", sourceHandle: "high", label: "high" },
  { id: "e2", source: "br", target: "b", sourceHandle: "low", label: "low" },
  { id: "e3", source: "br", target: "c", sourceHandle: "mid", label: "mid" },
  // edge from a different branch — must not be touched
  { id: "e4", source: "other", target: "d", sourceHandle: "high", label: "high" },
  // edge from our branch with no sourceHandle — must not be touched
  { id: "e5", source: "br", target: "e" },
];

describe("applyBranchCaseRename", () => {
  it("rewrites sourceHandle and label on matching edges from the named branch", () => {
    const result = applyBranchCaseRename(baseEdges, "br", "high", "veryHigh");
    const e1 = result.find((e) => e.id === "e1");
    expect(e1?.sourceHandle).toBe("veryHigh");
    expect(e1?.label).toBe("veryHigh");
  });

  it("leaves non-matching edges alone", () => {
    const result = applyBranchCaseRename(baseEdges, "br", "high", "veryHigh");
    const e2 = result.find((e) => e.id === "e2");
    const e4 = result.find((e) => e.id === "e4");
    const e5 = result.find((e) => e.id === "e5");
    expect(e2?.sourceHandle).toBe("low");
    expect(e4?.sourceHandle).toBe("high");
    expect(e5?.sourceHandle).toBeUndefined();
  });

  it("is a no-op when no edges match", () => {
    const result = applyBranchCaseRename(baseEdges, "br", "nonexistent", "x");
    expect(result).toEqual(baseEdges);
  });

  it("returns a new array (does not mutate the input)", () => {
    const result = applyBranchCaseRename(baseEdges, "br", "high", "x");
    expect(result).not.toBe(baseEdges);
  });
});

describe("removeBranchEdgesForCase", () => {
  it("removes outgoing edges with matching sourceHandle from the named branch", () => {
    const result = removeBranchEdgesForCase(baseEdges, "br", "high");
    expect(result.map((e) => e.id)).toEqual(["e2", "e3", "e4", "e5"]);
  });

  it("does not remove edges from other sources even if sourceHandle matches", () => {
    const result = removeBranchEdgesForCase(baseEdges, "br", "high");
    expect(result.find((e) => e.id === "e4")).toBeDefined();
  });

  it("is a no-op when no edges match", () => {
    const result = removeBranchEdgesForCase(baseEdges, "br", "nonexistent");
    expect(result.length).toBe(baseEdges.length);
  });
});
