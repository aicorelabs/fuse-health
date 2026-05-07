import { z } from "zod";

import { IntegrationFunction } from "../../function.js";

const inputSchema = z.object({
  patientId: z.string().min(1),
});

export type EpicGetPatientInput = z.infer<typeof inputSchema>;

/** FHIR-shaped patient record (mocked subset). */
export interface EpicPatient {
  resourceType: "Patient";
  id: string;
  identifier: Array<{ system: string; value: string }>;
  name: Array<{ family: string; given: string[]; use?: string }>;
  birthDate: string;
  gender: "male" | "female" | "other" | "unknown";
  active: boolean;
}

const SAMPLE_PATIENT: EpicPatient = {
  resourceType: "Patient",
  id: "p_001",
  identifier: [
    { system: "urn:oid:1.2.36.146.595.217.0.1", value: "MRN-882134" },
  ],
  name: [{ use: "official", family: "Adeyemi", given: ["Folake", "T."] }],
  birthDate: "1972-08-14",
  gender: "female",
  active: true,
};

export const getPatient = new IntegrationFunction<
  EpicGetPatientInput,
  EpicPatient
>({
  name: "getPatient",
  description:
    "Fetch a patient's demographics from the Epic FHIR Patient resource.",
  inputSchema,
  sampleInput: { patientId: "p_001" },
  sampleOutput: SAMPLE_PATIENT,
  async run({ patientId }) {
    return { ...SAMPLE_PATIENT, id: patientId };
  },
});
