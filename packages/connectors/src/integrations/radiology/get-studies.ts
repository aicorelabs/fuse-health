import { z } from "zod";

import { IntegrationFunction } from "../../function.js";

const inputSchema = z.object({
  patientId: z.string().min(1),
});

export type RadiologyGetStudiesInput = z.infer<typeof inputSchema>;

export interface RadiologyStudy {
  modality: string;
  bodyPart: string;
  impression: string;
  performedAt: string;
}

export interface RadiologyGetStudiesOutput {
  patientId: string;
  studies: RadiologyStudy[];
}

const SAMPLE_STUDIES: RadiologyStudy[] = [
  {
    modality: "CXR",
    bodyPart: "Chest",
    impression: "No acute cardiopulmonary process. Mild bibasilar atelectasis.",
    performedAt: "2026-04-22T14:02:00Z",
  },
  {
    modality: "MRI",
    bodyPart: "Lumbar spine",
    impression: "L4–L5 mild disc bulge without significant canal stenosis.",
    performedAt: "2026-03-30T10:45:00Z",
  },
];

export const getStudies = new IntegrationFunction<
  RadiologyGetStudiesInput,
  RadiologyGetStudiesOutput
>({
  name: "getStudies",
  description: "Fetch recent radiology studies and impressions for a patient.",
  inputSchema,
  sampleInput: { patientId: "p_001" },
  sampleOutput: { patientId: "p_001", studies: SAMPLE_STUDIES },
  async run({ patientId }) {
    return { patientId, studies: SAMPLE_STUDIES };
  },
});
