import { BaseIntegration } from "../../integration.js";

import { getRecentNotes } from "./get-recent-notes.js";

class EhrNotesIntegration extends BaseIntegration {
  constructor() {
    super({
      name: "ehr-notes",
      description: "Mocked EHR encounter-notes system. Hardcoded sample notes.",
      category: "ehr",
      functions: [getRecentNotes],
    });
  }
}

export const ehrNotesIntegration = new EhrNotesIntegration();
export { getRecentNotes };
