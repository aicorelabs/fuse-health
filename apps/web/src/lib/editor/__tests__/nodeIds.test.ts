import { describe, expect, it } from "vitest";

import { nextNodeId } from "../nodeIds.js";

describe("nextNodeId", () => {
  it("returns the kind slug when no nodes exist", () => {
    expect(nextNodeId([], "set")).toBe("set");
    expect(nextNodeId([], "trigger.manual")).toBe("trigger");
    expect(nextNodeId([], "trigger.webhook")).toBe("webhook");
  });

  it("appends _2 when the base slug is taken", () => {
    expect(nextNodeId(["set"], "set")).toBe("set_2");
  });

  it("walks up to the smallest unused suffix", () => {
    expect(nextNodeId(["set", "set_2"], "set")).toBe("set_3");
    expect(nextNodeId(["http", "http_2", "http_3", "http_4"], "http")).toBe("http_5");
  });

  it("ignores other kinds when picking a slug", () => {
    expect(nextNodeId(["set", "set_2", "http"], "http")).toBe("http_2");
    expect(nextNodeId(["set", "wait", "wait_2"], "set")).toBe("set_2");
  });

  it("returns deterministic results for the same input", () => {
    const existing = ["set", "set_2"];
    expect(nextNodeId(existing, "set")).toBe(nextNodeId(existing, "set"));
  });
});
