export * from "./function.js";
export * from "./integration.js";
export * from "./registry.js";

import { registerIntegration } from "./registry.js";
import { labsIntegration } from "./integrations/labs/index.js";
import { radiologyIntegration } from "./integrations/radiology/index.js";
import { ehrNotesIntegration } from "./integrations/ehr-notes/index.js";
import { epicIntegration } from "./integrations/epic/index.js";
import { twilioIntegration } from "./integrations/twilio/index.js";
import { slackIntegration } from "./integrations/slack/index.js";

let booted = false;

export function registerBuiltInIntegrations(): void {
  if (booted) return;
  registerIntegration(labsIntegration);
  registerIntegration(radiologyIntegration);
  registerIntegration(ehrNotesIntegration);
  registerIntegration(epicIntegration);
  registerIntegration(twilioIntegration);
  registerIntegration(slackIntegration);
  booted = true;
}
