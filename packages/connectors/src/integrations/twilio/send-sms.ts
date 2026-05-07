import { z } from "zod";

import { IntegrationFunction } from "../../function.js";

const inputSchema = z.object({
  to: z.string().min(1),
  body: z.string().min(1).max(1600),
  from: z.string().optional(),
});

export type TwilioSendSmsInput = z.infer<typeof inputSchema>;

export interface TwilioSendSmsOutput {
  sid: string;
  to: string;
  from: string;
  status: "queued" | "sending" | "sent" | "failed";
  bodyLength: number;
  segments: number;
  sentAt: string;
}

const SAMPLE_OUTPUT: TwilioSendSmsOutput = {
  sid: "SM_mocked_4f1a8c20",
  to: "+15551234567",
  from: "+15557654321",
  status: "sent",
  bodyLength: 56,
  segments: 1,
  sentAt: "2026-05-07T07:24:11Z",
};

export const sendSms = new IntegrationFunction<
  TwilioSendSmsInput,
  TwilioSendSmsOutput
>({
  name: "sendSms",
  description:
    "Send an SMS via Twilio. Mocked: returns a fake message SID without making a real API call.",
  inputSchema,
  sampleInput: {
    to: "+15551234567",
    body: "Reminder: your appointment is tomorrow at 9am.",
    from: "+15557654321",
  },
  sampleOutput: SAMPLE_OUTPUT,
  async run({ to, from, body }) {
    return {
      sid: `SM_mocked_${Math.random().toString(16).slice(2, 10)}`,
      to,
      from: from ?? "+15557654321",
      status: "sent",
      bodyLength: body.length,
      segments: Math.max(1, Math.ceil(body.length / 160)),
      sentAt: new Date().toISOString(),
    };
  },
});
