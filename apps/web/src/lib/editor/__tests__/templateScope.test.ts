import { describe, expect, it } from "vitest";

import {
  buildSampleContext,
  extractTemplateRefs,
  extractTemplateRefsDeep,
  resolveRefAgainstSample,
  scopeForNode,
  validateRefAgainstScope,
} from "../templateScope.js";

describe("scopeForNode", () => {
  it("always includes trigger", () => {
    const graph = {
      nodes: [
        { id: "t", kind: "trigger.manual", name: "t", config: {} },
        { id: "a", kind: "set", name: "a", config: { fields: {} } },
      ],
      edges: [{ id: "e1", source: "t", target: "a" }],
    };
    const scope = scopeForNode(graph, "a");
    expect(scope.find((s) => s.name === "trigger")).toBeDefined();
  });

  it("does not duplicate the trigger node id when its kind is trigger.*", () => {
    // trigger node id "t" is reachable but should only show as `trigger`, not as `t`
    const graph = {
      nodes: [
        { id: "t", kind: "trigger.manual", name: "t", config: {} },
        { id: "a", kind: "set", name: "a", config: { fields: {} } },
      ],
      edges: [{ id: "e1", source: "t", target: "a" }],
    };
    const scope = scopeForNode(graph, "a");
    const names = scope.map((s) => s.name);
    expect(names).toContain("trigger");
    // The trigger's literal node id is not exposed as a separate scope entry
    expect(names.filter((n) => n === "t")).toHaveLength(0);
  });

  it("includes every transitive ancestor", () => {
    const graph = {
      nodes: [
        { id: "t", kind: "trigger.manual", name: "t", config: {} },
        { id: "a", kind: "set", name: "a", config: { fields: {} } },
        { id: "b", kind: "set", name: "b", config: { fields: {} } },
        { id: "c", kind: "set", name: "c", config: { fields: {} } },
      ],
      edges: [
        { id: "e1", source: "t", target: "a" },
        { id: "e2", source: "a", target: "b" },
        { id: "e3", source: "b", target: "c" },
      ],
    };
    const scope = scopeForNode(graph, "c");
    const names = scope.map((s) => s.name).sort();
    expect(names).toEqual(["a", "b", "trigger"]);
  });

  it("excludes the node itself", () => {
    const graph = {
      nodes: [
        { id: "t", kind: "trigger.manual", name: "t", config: {} },
        { id: "a", kind: "set", name: "a", config: { fields: {} } },
      ],
      edges: [{ id: "e1", source: "t", target: "a" }],
    };
    const scope = scopeForNode(graph, "a");
    expect(scope.find((s) => s.name === "a")).toBeUndefined();
  });

  it("excludes nodes that aren't ancestors", () => {
    const graph = {
      nodes: [
        { id: "t", kind: "trigger.manual", name: "t", config: {} },
        { id: "a", kind: "set", name: "a", config: { fields: {} } },
        { id: "sibling", kind: "set", name: "sibling", config: { fields: {} } },
      ],
      edges: [
        { id: "e1", source: "t", target: "a" },
        { id: "e2", source: "t", target: "sibling" },
      ],
    };
    const scope = scopeForNode(graph, "a");
    expect(scope.find((s) => s.name === "sibling")).toBeUndefined();
  });

  it("includes the loop's itemVar when the node is the loop body", () => {
    const graph = {
      nodes: [
        { id: "t", kind: "trigger.manual", name: "t", config: {} },
        {
          id: "lp",
          kind: "loop",
          name: "lp",
          config: { over: "{{ trigger.input.patients }}", itemVar: "patient" },
        },
        {
          id: "body",
          kind: "action",
          name: "body",
          config: { integration: "labs", function: "getResults", input: {} },
        },
      ],
      edges: [
        { id: "e1", source: "t", target: "lp" },
        { id: "e2", source: "lp", target: "body" },
      ],
    };
    const scope = scopeForNode(graph, "body");
    const item = scope.find((s) => s.source === "itemVar");
    expect(item).toBeDefined();
    expect(item?.name).toBe("patient");
  });

  it("falls back to itemVar='item' when not specified", () => {
    const graph = {
      nodes: [
        { id: "t", kind: "trigger.manual", name: "t", config: {} },
        { id: "lp", kind: "loop", name: "lp", config: { over: "x" } },
        { id: "body", kind: "set", name: "body", config: { fields: {} } },
      ],
      edges: [
        { id: "e1", source: "t", target: "lp" },
        { id: "e2", source: "lp", target: "body" },
      ],
    };
    const scope = scopeForNode(graph, "body");
    expect(scope.find((s) => s.name === "item")).toBeDefined();
  });

  it("does not include itemVar for nodes downstream of the loop body", () => {
    // after the loop, ctx[itemVar] is unset; sibling/post nodes shouldn't see it
    const graph = {
      nodes: [
        { id: "t", kind: "trigger.manual", name: "t", config: {} },
        {
          id: "lp",
          kind: "loop",
          name: "lp",
          config: { over: "x", itemVar: "patient" },
        },
        { id: "body", kind: "set", name: "body", config: { fields: {} } },
        { id: "after", kind: "set", name: "after", config: { fields: {} } },
      ],
      edges: [
        { id: "e1", source: "t", target: "lp" },
        { id: "e2", source: "lp", target: "body" },
        { id: "e3", source: "body", target: "after" },
      ],
    };
    const scope = scopeForNode(graph, "after");
    expect(scope.find((s) => s.name === "patient")).toBeUndefined();
  });
});

describe("extractTemplateRefs", () => {
  it("extracts a single ref", () => {
    expect(extractTemplateRefs("hello {{ trigger.input.x }} world")).toEqual([
      "trigger.input.x",
    ]);
  });

  it("extracts multiple refs from one string", () => {
    expect(
      extractTemplateRefs(
        "{{ a.b }} and {{ c }} and {{ d.e.f }}",
      ),
    ).toEqual(["a.b", "c", "d.e.f"]);
  });

  it("returns [] when no refs", () => {
    expect(extractTemplateRefs("plain text")).toEqual([]);
    expect(extractTemplateRefs("")).toEqual([]);
  });

  it("trims whitespace inside braces", () => {
    expect(extractTemplateRefs("{{    trigger.input    }}")).toEqual([
      "trigger.input",
    ]);
  });
});

describe("extractTemplateRefsDeep", () => {
  it("walks nested objects, arrays, and strings", () => {
    const value = {
      input: { patientId: "{{ trigger.input.patientId }}" },
      tags: ["{{ a }}", "static"],
      nested: { deep: "{{ b.c }}" },
      number: 42,
      bool: true,
      nullish: null,
    };
    const refs = extractTemplateRefsDeep(value).sort();
    expect(refs).toEqual(["a", "b.c", "trigger.input.patientId"]);
  });

  it("returns [] for primitives that aren't strings", () => {
    expect(extractTemplateRefsDeep(42)).toEqual([]);
    expect(extractTemplateRefsDeep(null)).toEqual([]);
    expect(extractTemplateRefsDeep(true)).toEqual([]);
  });
});

describe("validateRefAgainstScope", () => {
  const scope = [
    { name: "trigger", source: "trigger" as const },
    { name: "getLabs", source: "node" as const, nodeId: "getLabs" },
    { name: "patient", source: "itemVar" as const, nodeId: "loop" },
  ];

  it("matches when the first segment is in scope", () => {
    expect(validateRefAgainstScope("trigger.input.x", scope).valid).toBe(true);
    expect(validateRefAgainstScope("getLabs.results", scope).valid).toBe(true);
    expect(validateRefAgainstScope("patient", scope).valid).toBe(true);
  });

  it("rejects when the first segment is not in scope", () => {
    expect(validateRefAgainstScope("getLebs.results", scope).valid).toBe(false);
    expect(validateRefAgainstScope("unknown", scope).valid).toBe(false);
  });

  it("returns the first segment in the result", () => {
    expect(validateRefAgainstScope("trigger.input.x", scope).firstSegment).toBe(
      "trigger",
    );
    expect(validateRefAgainstScope("getLabs", scope).firstSegment).toBe(
      "getLabs",
    );
  });
});

describe("buildSampleContext", () => {
  it("wraps the trigger input under .input", () => {
    const ctx = buildSampleContext({
      triggerInput: { patientId: "p_001" },
      nodeOutputs: {},
    });
    expect(ctx.trigger).toEqual({ input: { patientId: "p_001" } });
  });

  it("never lets a nodeOutputs.trigger entry clobber the reserved trigger key", () => {
    // Engine writes nodeOutputs[trigger.id] = run.input — when trigger.id is
    // literally "trigger", a naive spread would shadow `{ input: ... }`.
    const ctx = buildSampleContext({
      triggerInput: { patientId: "p_001" },
      nodeOutputs: {
        trigger: { patientId: "p_001" }, // engine's nodeOutputs.trigger
        getLabs: { results: [] },
      },
    });
    expect(ctx.trigger).toEqual({ input: { patientId: "p_001" } });
    expect(ctx.getLabs).toEqual({ results: [] });
  });

  it("preserves other node outputs verbatim", () => {
    const ctx = buildSampleContext({
      triggerInput: {},
      nodeOutputs: { a: 1, b: { c: 2 } },
    });
    expect(ctx.a).toBe(1);
    expect(ctx.b).toEqual({ c: 2 });
  });

  it("produces a context where {{ trigger.input.<x> }} resolves via resolveRefAgainstSample", () => {
    const ctx = buildSampleContext({
      triggerInput: { patientId: "p_001" },
      nodeOutputs: { trigger: { patientId: "p_001" } },
    });
    const scope = [{ name: "trigger", source: "trigger" as const }];
    const result = resolveRefAgainstSample(
      "trigger.input.patientId",
      scope,
      ctx,
    );
    expect(result.valid).toBe(true);
    expect(result.resolved).toBe("p_001");
  });
});

describe("resolveRefAgainstSample", () => {
  const scope = [
    { name: "trigger", source: "trigger" as const },
    { name: "getLabs", source: "node" as const, nodeId: "getLabs" },
  ];
  const samples = {
    trigger: { input: { patientId: "p_001" } },
    getLabs: {
      patientId: "p_001",
      results: [{ flag: "low", value: 11.2 }],
    },
  };

  it("resolves a deep ref to its value", () => {
    const result = resolveRefAgainstSample(
      "trigger.input.patientId",
      scope,
      samples,
    );
    expect(result.valid).toBe(true);
    expect(result.resolved).toBe("p_001");
  });

  it("resolves array index access", () => {
    const result = resolveRefAgainstSample(
      "getLabs.results.0.flag",
      scope,
      samples,
    );
    expect(result.valid).toBe(true);
    expect(result.resolved).toBe("low");
  });

  it("returns valid=false when the path is wrong", () => {
    const result = resolveRefAgainstSample(
      "trigger.input.missingField",
      scope,
      samples,
    );
    expect(result.valid).toBe(false);
    expect(result.resolved).toBeUndefined();
  });

  it("returns valid=false when the first segment is not in scope", () => {
    expect(
      resolveRefAgainstSample("unknown.x", scope, samples).valid,
    ).toBe(false);
  });

  it("returns valid=true with no further path when the ref is just the name", () => {
    const result = resolveRefAgainstSample("getLabs", scope, samples);
    expect(result.valid).toBe(true);
    expect(result.resolved).toEqual(samples.getLabs);
  });
});
