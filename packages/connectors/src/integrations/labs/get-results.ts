import { z } from "zod";

import { IntegrationFunction } from "../../function.js";

const inputSchema = z.object({
  patientId: z.string().min(1),
});

export type LabsGetResultsInput = z.infer<typeof inputSchema>;

export interface LabResult {
  test: string;
  value: number;
  unit: string;
  referenceRange: string;
  flag: "normal" | "low" | "high" | "critical";
  takenAt: string;
}

export interface LabsGetResultsOutput {
  patientId: string;
  results: LabResult[];
}

const SAMPLE_RESULTS: LabResult[] = [
  {
    test: "Hemoglobin",
    value: 11.2,
    unit: "g/dL",
    referenceRange: "12.0–15.5",
    flag: "low",
    takenAt: "2026-04-28T08:14:00Z",
  },
  {
    test: "WBC",
    value: 7.4,
    unit: "10^3/µL",
    referenceRange: "4.0–11.0",
    flag: "normal",
    takenAt: "2026-04-28T08:14:00Z",
  },
  {
    test: "Glucose (fasting)",
    value: 142,
    unit: "mg/dL",
    referenceRange: "70–99",
    flag: "high",
    takenAt: "2026-04-28T08:14:00Z",
  },
];

export const getResults = new IntegrationFunction<
  LabsGetResultsInput,
  LabsGetResultsOutput
>({
  name: "getResults",
  description: "Fetch the most recent lab panel results for a patient.",
  inputSchema,
  sampleInput: { patientId: "p_001" },
  sampleOutput: { patientId: "p_001", results: SAMPLE_RESULTS },
  async run({ patientId }) {
    return { patientId, results: SAMPLE_RESULTS };
  },
});
