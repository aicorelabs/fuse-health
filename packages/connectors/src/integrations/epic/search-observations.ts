import { z } from "zod";

import { IntegrationFunction } from "../../function.js";

const inputSchema = z.object({
  patientId: z.string().min(1),
  category: z
    .enum(["laboratory", "vital-signs", "imaging", "social-history"])
    .optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export type EpicSearchObservationsInput = z.infer<typeof inputSchema>;

/** FHIR Observation (subset). Real Epic returns a Bundle; we flatten to entries. */
export interface EpicObservation {
  resourceType: "Observation";
  id: string;
  status: "final" | "amended" | "preliminary" | "registered";
  category: { coding: Array<{ system: string; code: string }> };
  code: { coding: Array<{ system: string; code: string; display: string }> };
  subject: { reference: string };
  effectiveDateTime: string;
  valueQuantity?: { value: number; unit: string; system: string };
  valueString?: string;
  interpretation?: Array<{ coding: Array<{ code: string; display: string }> }>;
}

const SAMPLE_OBSERVATIONS: EpicObservation[] = [
  {
    resourceType: "Observation",
    id: "obs-1",
    status: "final",
    category: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/observation-category",
          code: "laboratory",
        },
      ],
    },
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "718-7",
          display: "Hemoglobin [Mass/volume] in Blood",
        },
      ],
    },
    subject: { reference: "Patient/p_001" },
    effectiveDateTime: "2026-04-28T08:14:00Z",
    valueQuantity: { value: 11.2, unit: "g/dL", system: "http://unitsofmeasure.org" },
    interpretation: [{ coding: [{ code: "L", display: "Low" }] }],
  },
  {
    resourceType: "Observation",
    id: "obs-2",
    status: "final",
    category: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/observation-category",
          code: "laboratory",
        },
      ],
    },
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "1558-6",
          display: "Glucose [Mass/volume] in Serum, fasting",
        },
      ],
    },
    subject: { reference: "Patient/p_001" },
    effectiveDateTime: "2026-04-28T08:14:00Z",
    valueQuantity: { value: 142, unit: "mg/dL", system: "http://unitsofmeasure.org" },
    interpretation: [{ coding: [{ code: "H", display: "High" }] }],
  },
];

export interface EpicSearchObservationsOutput {
  patientId: string;
  total: number;
  observations: EpicObservation[];
}

export const searchObservations = new IntegrationFunction<
  EpicSearchObservationsInput,
  EpicSearchObservationsOutput
>({
  name: "searchObservations",
  description:
    "Search FHIR Observation resources for a patient. Mocked: returns laboratory observations regardless of category.",
  inputSchema,
  sampleInput: { patientId: "p_001", category: "laboratory", limit: 25 },
  sampleOutput: {
    patientId: "p_001",
    total: SAMPLE_OBSERVATIONS.length,
    observations: SAMPLE_OBSERVATIONS,
  },
  async run({ patientId, limit }) {
    const observations = SAMPLE_OBSERVATIONS.slice(0, limit ?? 25).map((o) => ({
      ...o,
      subject: { reference: `Patient/${patientId}` },
    }));
    return {
      patientId,
      total: observations.length,
      observations,
    };
  },
});
