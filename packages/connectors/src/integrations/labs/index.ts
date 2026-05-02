import { BaseIntegration } from "../../integration.js";

import { getResults } from "./get-results.js";

class LabsIntegration extends BaseIntegration {
  constructor() {
    super({
      name: "labs",
      description: "Mocked lab information system. Hardcoded sample panels.",
      category: "diagnostics",
      functions: [getResults],
    });
  }
}

export const labsIntegration = new LabsIntegration();
export { getResults };
