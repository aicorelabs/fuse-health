import { BaseIntegration } from "../../integration.js";

import { postMessage } from "./post-message.js";

class SlackIntegration extends BaseIntegration {
  constructor() {
    super({
      name: "slack",
      label: "Slack",
      description:
        "Post messages and notifications to Slack channels. Mocked in v1.",
      category: "messaging",
      functions: [postMessage],
    });
  }
}

export const slackIntegration = new SlackIntegration();
