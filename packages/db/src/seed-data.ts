// Demo workflow used by both the seed script and the engine integration tests.
// Shape is plain JSON so the engine's WorkflowGraph.fromJSON validates it on load.

export const DEMO_WORKFLOW_ID = "wf_demo_patient_summary";

export const patientSummaryGraph = {
  nodes: [
    {
      id: "trigger",
      kind: "trigger.manual",
      name: "Manual trigger",
      config: {},
    },
    {
      id: "getLabs",
      kind: "action",
      name: "Get labs",
      config: {
        integration: "labs",
        function: "getResults",
        input: { patientId: "{{ trigger.input.patientId }}" },
      },
    },
    {
      id: "getRadiology",
      kind: "action",
      name: "Get radiology",
      config: {
        integration: "radiology",
        function: "getStudies",
        input: { patientId: "{{ trigger.input.patientId }}" },
      },
    },
    {
      id: "getNotes",
      kind: "action",
      name: "Get recent notes",
      config: {
        integration: "ehr-notes",
        function: "getRecentNotes",
        input: { patientId: "{{ trigger.input.patientId }}", limit: 5 },
      },
    },
    {
      id: "summarize",
      kind: "llm",
      name: "Summarize for attending",
      config: {
        prompt: [
          "You are summarizing a patient chart for the attending physician.",
          "Be concise (under 200 words), structured (Labs / Imaging / Recent encounters / Assessment), and flag anything abnormal.",
          "",
          "Patient ID: {{ trigger.input.patientId }}",
          "",
          "Labs:",
          "{{ getLabs.results }}",
          "",
          "Radiology studies:",
          "{{ getRadiology.studies }}",
          "",
          "Recent encounter notes:",
          "{{ getNotes.notes }}",
        ].join("\n"),
        model: "llama-3.3-70b-versatile",
      },
    },
  ],
  edges: [
    { id: "e_trigger_labs", source: "trigger", target: "getLabs" },
    { id: "e_trigger_radiology", source: "trigger", target: "getRadiology" },
    { id: "e_trigger_notes", source: "trigger", target: "getNotes" },
    { id: "e_labs_summarize", source: "getLabs", target: "summarize" },
    { id: "e_radiology_summarize", source: "getRadiology", target: "summarize" },
    { id: "e_notes_summarize", source: "getNotes", target: "summarize" },
  ],
} as const;

export const demoWorkflow = {
  id: DEMO_WORKFLOW_ID,
  name: "Patient summary",
  description:
    "Pulls labs, radiology, and recent notes in parallel; an LLM summarizes them for the attending.",
  graph: patientSummaryGraph,
  maxConcurrent: 5,
};
