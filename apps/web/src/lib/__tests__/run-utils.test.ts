import { describe, expect, it } from "vitest";

import { findLLMSummary, isTerminal } from "../run-utils.js";

describe("isTerminal", () => {
  it("returns true for terminal statuses", () => {
    expect(isTerminal("SUCCEEDED")).toBe(true);
    expect(isTerminal("FAILED")).toBe(true);
    expect(isTerminal("CANCELLED")).toBe(true);
  });

  it("returns false for in-flight statuses", () => {
    expect(isTerminal("PENDING")).toBe(false);
    expect(isTerminal("RUNNING")).toBe(false);
  });
});

describe("findLLMSummary", () => {
  it("returns the text from the first step whose output has a string `text` field", () => {
    const steps = [
      { nodeId: "trigger", output: { patientId: "p_001" } },
      { nodeId: "getLabs", output: { results: [] } },
      { nodeId: "summarize", output: { text: "Patient is stable.", model: "x" } },
    ];
    expect(findLLMSummary(steps)).toBe("Patient is stable.");
  });

  it("returns null when no step has a text field", () => {
    const steps = [
      { nodeId: "a", output: { foo: 1 } },
      { nodeId: "b", output: null },
    ];
    expect(findLLMSummary(steps)).toBeNull();
  });

  it("returns null on empty steps", () => {
    expect(findLLMSummary([])).toBeNull();
  });

  it("ignores non-string text fields", () => {
    const steps = [{ nodeId: "summarize", output: { text: 42 } }];
    expect(findLLMSummary(steps)).toBeNull();
  });
});
