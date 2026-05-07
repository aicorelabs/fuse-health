import { describe, expect, it } from "vitest";

import { filterIntegrations } from "../integrations-filter.js";
import type { IntegrationListing } from "../integrations.js";

const FIXTURE: IntegrationListing[] = [
  {
    name: "labs",
    label: "Labs",
    description: "LabCorp / Quest aggregator (mocked).",
    category: "diagnostics",
    functions: [
      {
        name: "getResults",
        description: "Fetch the most recent lab panel results for a patient.",
        timeoutMs: 50000,
      },
    ],
  },
  {
    name: "epic",
    label: "Epic (FHIR)",
    description: "Epic-shaped FHIR R4 connector.",
    category: "ehr",
    functions: [
      {
        name: "getPatient",
        description: "Fetch a patient's demographics from FHIR.",
        timeoutMs: 50000,
      },
      {
        name: "searchObservations",
        description: "Search FHIR Observation resources for a patient.",
        timeoutMs: 50000,
      },
    ],
  },
  {
    name: "twilio",
    label: "Twilio",
    description: "SMS, voice, verification.",
    category: "messaging",
    functions: [
      {
        name: "sendSms",
        description: "Send an SMS via Twilio.",
        timeoutMs: 50000,
      },
    ],
  },
];

describe("filterIntegrations", () => {
  it("returns all integrations when the query is empty or whitespace", () => {
    expect(filterIntegrations(FIXTURE, "").map((i) => i.name)).toEqual([
      "labs",
      "epic",
      "twilio",
    ]);
    expect(filterIntegrations(FIXTURE, "   ").map((i) => i.name)).toEqual([
      "labs",
      "epic",
      "twilio",
    ]);
  });

  it("filters by integration label (case-insensitive substring)", () => {
    const out = filterIntegrations(FIXTURE, "TWIL");
    expect(out.map((i) => i.name)).toEqual(["twilio"]);
    expect(out[0]?.functions.map((f) => f.name)).toEqual(["sendSms"]);
  });

  it("filters by integration name slug too", () => {
    const out = filterIntegrations(FIXTURE, "epic");
    expect(out.map((i) => i.name)).toEqual(["epic"]);
  });

  it("filters by category", () => {
    const out = filterIntegrations(FIXTURE, "messaging");
    expect(out.map((i) => i.name)).toEqual(["twilio"]);
  });

  it("filters by function name across integrations", () => {
    const out = filterIntegrations(FIXTURE, "search");
    expect(out.map((i) => i.name)).toEqual(["epic"]);
    // when the integration matched ONLY because of function search,
    // narrow functions[] to the matches
    expect(out[0]?.functions.map((f) => f.name)).toEqual([
      "searchObservations",
    ]);
  });

  it("filters by function description", () => {
    const out = filterIntegrations(FIXTURE, "demograph");
    expect(out.map((i) => i.name)).toEqual(["epic"]);
    expect(out[0]?.functions.map((f) => f.name)).toEqual(["getPatient"]);
  });

  it("when the integration label matches, keeps ALL its functions", () => {
    // user typed "epic" — show every function under Epic, not just the
    // one whose name happens to also contain "epic"
    const out = filterIntegrations(FIXTURE, "epic");
    expect(out[0]?.functions.map((f) => f.name)).toEqual([
      "getPatient",
      "searchObservations",
    ]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterIntegrations(FIXTURE, "nopezzz")).toEqual([]);
  });

  it("preserves the original integration order (sorted upstream)", () => {
    const out = filterIntegrations(FIXTURE, "");
    expect(out.map((i) => i.name)).toEqual(["labs", "epic", "twilio"]);
  });
});
