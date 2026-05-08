import { z } from "zod";

import { IntegrationFunction } from "../../function.js";

const inputSchema = z.object({
  channel: z.string().min(1),
  text: z.string().min(1),
  threadTs: z.string().optional(),
});

export type SlackPostMessageInput = z.infer<typeof inputSchema>;

export interface SlackPostMessageOutput {
  ok: boolean;
  channel: string;
  ts: string;
  permalink: string;
}

const SAMPLE_OUTPUT: SlackPostMessageOutput = {
  ok: true,
  channel: "#oncology-rounds",
  ts: "1730976851.000200",
  permalink: "https://your-team.slack.com/archives/C123/p1730976851000200",
};

export const postMessage = new IntegrationFunction<
  SlackPostMessageInput,
  SlackPostMessageOutput
>({
  name: "postMessage",
  description:
    "Post a message to a Slack channel or thread. Mocked: returns a fake ts without calling Slack.",
  inputSchema,
  sampleInput: {
    channel: "#oncology-rounds",
    text: "Daily summary for patient p_001 is ready — see {{ summarize.text }}",
  },
  sampleOutput: SAMPLE_OUTPUT,
  async run({ channel }) {
    return {
      ok: true,
      channel,
      ts: `${Date.now() / 1000}`,
      permalink: `https://your-team.slack.com/archives/MOCK/p${Date.now()}`,
    };
  },
});
