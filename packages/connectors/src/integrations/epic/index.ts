import { BaseIntegration } from "../../integration.js";

import { getPatient } from "./get-patient.js";
import { searchObservations } from "./search-observations.js";

class EpicIntegration extends BaseIntegration {
  constructor() {
    super({
      name: "epic",
      label: "Epic (FHIR)",
      description:
        "Epic-shaped FHIR R4 connector — Patient, Observation. Mocked in v1.",
      category: "ehr",
      functions: [getPatient, searchObservations],
    });
  }
}

export const epicIntegration = new EpicIntegration();
