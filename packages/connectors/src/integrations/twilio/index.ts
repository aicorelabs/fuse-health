import { BaseIntegration } from "../../integration.js";

import { sendSms } from "./send-sms.js";

class TwilioIntegration extends BaseIntegration {
  constructor() {
    super({
      name: "twilio",
      label: "Twilio",
      description: "SMS, voice, and verification via Twilio. Mocked in v1.",
      category: "messaging",
      functions: [sendSms],
    });
  }
}

export const twilioIntegration = new TwilioIntegration();
