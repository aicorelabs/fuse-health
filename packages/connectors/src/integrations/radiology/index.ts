import { BaseIntegration } from "../../integration.js";

import { getStudies } from "./get-studies.js";

class RadiologyIntegration extends BaseIntegration {
  constructor() {
    super({
      name: "radiology",
      description: "Mocked PACS/radiology system. Hardcoded sample studies.",
      category: "diagnostics",
      functions: [getStudies],
    });
  }
}

export const radiologyIntegration = new RadiologyIntegration();
export { getStudies };
