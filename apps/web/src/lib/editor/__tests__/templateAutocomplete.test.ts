import { describe, expect, it } from "vitest";

import {
  applyCompletion,
  buildSuggestions,
  findTriggerSpan,
  parsePathQuery,
} from "../templateAutocomplete.js";
import type { ScopeRef } from "../templateScope.js";

describe("findTriggerSpan", () => {
  it("returns null when there is no open {{ before caret", () => {
    expect(findTriggerSpan("plain text", 5)).toBeNull();
    expect(findTriggerSpan("", 0)).toBeNull();
  });

  it("returns null when {{ is followed by }} before caret (already-closed template)", () => {
    expect(findTriggerSpan("hello {{ x }} world", 18)).toBeNull();
  });

  it("finds a span when caret is inside {{ }} (not yet closed)", () => {
    const v = "x = {{ trigge";
    const span = findTriggerSpan(v, v.length);
    expect(span).not.toBeNull();
    expect(span?.start).toBe(4);
    expect(span?.query).toBe("trigge");
  });

  it("finds a span when caret is inside an already-balanced {{ }} pair", () => {
    // user is mid-edit between {{ and }}
    const v = "{{ trigger.input.x }}";
    // caret right after "input."
    const caret = "{{ trigger.input.".length;
    const span = findTriggerSpan(v, caret);
    expect(span).not.toBeNull();
    expect(span?.start).toBe(0);
    expect(span?.query).toBe("trigger.input.");
    expect(span?.end).toBe(caret);
  });

  it("trims a leading space inside the open template (`{{ ` style)", () => {
    const v = "{{ ";
    const span = findTriggerSpan(v, v.length);
    expect(span?.query).toBe("");
  });
});

describe("parsePathQuery", () => {
  it("returns empty path + empty partial for empty query", () => {
    expect(parsePathQuery("")).toEqual({ path: [], partial: "" });
  });

  it("treats no-dot query as a partial at the top level", () => {
    expect(parsePathQuery("trig")).toEqual({ path: [], partial: "trig" });
  });

  it("splits on dots, last segment is the partial", () => {
    expect(parsePathQuery("trigger.input.")).toEqual({
      path: ["trigger", "input"],
      partial: "",
    });
    expect(parsePathQuery("trigger.input.pat")).toEqual({
      path: ["trigger", "input"],
      partial: "pat",
    });
  });
});

describe("buildSuggestions", () => {
  const scope: ScopeRef[] = [
    {
      name: "trigger",
      source: "trigger",
      hint: "Run input — { input: <payload> }",
    },
    { name: "getLabs", source: "node", nodeId: "getLabs", hint: "labs" },
  ];

  const samples = {
    trigger: { input: { patientId: "p_001" } },
    getLabs: { results: [{ flag: "low" }] },
  };

  it("suggests in-scope refs at the top level, filtered by partial", () => {
    const out = buildSuggestions(scope, samples, parsePathQuery(""));
    expect(out.map((s) => s.full).sort()).toEqual(["getLabs", "trigger"]);
  });

  it("filters by case-insensitive substring of the partial", () => {
    const out = buildSuggestions(scope, samples, parsePathQuery("LAB"));
    expect(out.map((s) => s.full)).toEqual(["getLabs"]);
  });

  it("suggests keys of a deeper path when sample data is available", () => {
    const out = buildSuggestions(scope, samples, parsePathQuery("trigger."));
    expect(out.map((s) => s.full)).toEqual(["trigger.input"]);
  });

  it("suggests keys two levels deep", () => {
    const out = buildSuggestions(
      scope,
      samples,
      parsePathQuery("trigger.input."),
    );
    expect(out.map((s) => s.full)).toEqual(["trigger.input.patientId"]);
  });

  it("returns [] when path resolves to a primitive (no children to suggest)", () => {
    const out = buildSuggestions(
      scope,
      samples,
      parsePathQuery("trigger.input.patientId."),
    );
    expect(out).toEqual([]);
  });

  it("returns [] when sample is missing for a deep path", () => {
    const out = buildSuggestions(scope, null, parsePathQuery("trigger."));
    expect(out).toEqual([]);
  });

  it("returns [] when first segment is not in scope at all", () => {
    const out = buildSuggestions(
      scope,
      samples,
      parsePathQuery("unknownNode."),
    );
    expect(out).toEqual([]);
  });

  it("attaches a value preview for leaf-level suggestions when sample is present", () => {
    const out = buildSuggestions(
      scope,
      samples,
      parsePathQuery("trigger.input."),
    );
    expect(out[0]?.valuePreview).toBe("p_001");
  });
});

describe("applyCompletion", () => {
  it("replaces the open span and inserts a balanced template", () => {
    const v = "{{ trig";
    const span = findTriggerSpan(v, v.length)!;
    const r = applyCompletion(v, span, "trigger");
    expect(r.value).toBe("{{ trigger }}");
    // caret lands between `trigger` and ` }}`, so further typing extends the path
    expect(r.value.slice(0, r.caret)).toBe("{{ trigger");
  });

  it("does not double-close when there is already a closing }}", () => {
    const v = "{{ trig }}";
    const caret = "{{ trig".length;
    const span = findTriggerSpan(v, caret)!;
    const r = applyCompletion(v, span, "trigger");
    // expect just the path replaced; existing }} preserved
    expect(r.value).toBe("{{ trigger }}");
    expect(r.value.slice(0, r.caret)).toBe("{{ trigger");
  });

  it("works for an empty span (user just typed `{{ `)", () => {
    const v = "{{ ";
    const span = findTriggerSpan(v, v.length)!;
    const r = applyCompletion(v, span, "trigger");
    expect(r.value).toBe("{{ trigger }}");
  });

  it("preserves text before and after the span", () => {
    const v = "Hello {{ trig world";
    const caret = "Hello {{ trig".length;
    const span = findTriggerSpan(v, caret)!;
    const r = applyCompletion(v, span, "trigger");
    expect(r.value).toBe("Hello {{ trigger }} world");
  });
});
