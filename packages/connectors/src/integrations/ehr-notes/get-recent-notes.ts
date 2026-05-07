import { z } from "zod";

import { IntegrationFunction } from "../../function.js";

const inputSchema = z.object({
  patientId: z.string().min(1),
  limit: z.number().int().positive().max(50).optional(),
});

export type EhrNotesGetRecentInput = z.infer<typeof inputSchema>;

const DEFAULT_LIMIT = 5;

export interface EncounterNote {
  author: string;
  encounterType: string;
  note: string;
  date: string;
}

export interface EhrNotesGetRecentOutput {
  patientId: string;
  notes: EncounterNote[];
}

const SAMPLE_NOTES: EncounterNote[] = [
  {
    author: "Dr. Park",
    encounterType: "Primary care follow-up",
    note: "Patient reports persistent fatigue and mild dyspnea on exertion. Reviewing recent labs.",
    date: "2026-04-29T09:30:00Z",
  },
  {
    author: "Dr. Okafor",
    encounterType: "Endocrinology consult",
    note: "Considering pre-diabetes given fasting glucose trend. Discussed lifestyle interventions.",
    date: "2026-04-15T11:00:00Z",
  },
  {
    author: "Dr. Park",
    encounterType: "Annual physical",
    note: "Routine exam. No acute concerns. Ordered CBC, CMP, A1c.",
    date: "2026-03-18T08:15:00Z",
  },
];

export const getRecentNotes = new IntegrationFunction<
  EhrNotesGetRecentInput,
  EhrNotesGetRecentOutput
>({
  name: "getRecentNotes",
  description: "Fetch the patient's most recent encounter notes from the EHR.",
  inputSchema,
  sampleInput: { patientId: "p_001", limit: 5 },
  sampleOutput: { patientId: "p_001", notes: SAMPLE_NOTES },
  async run({ patientId, limit }) {
    return { patientId, notes: SAMPLE_NOTES.slice(0, limit ?? DEFAULT_LIMIT) };
  },
});
