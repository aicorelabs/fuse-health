import Groq from "groq-sdk";

import { withTimeout } from "./timeout.js";

export const DEFAULT_LLM_MODEL = "llama-3.3-70b-versatile";
export const DEFAULT_LLM_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_TOKENS = 4096;

export interface RunLLMOptions {
  prompt: string;
  model?: string;
  timeoutMs?: number;
  maxTokens?: number;
}

export interface LLMOutput {
  text: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

let client: Groq | undefined;

function getClient(): Groq {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set");
    }
    client = new Groq({ apiKey });
  }
  return client;
}

export async function runLLM(opts: RunLLMOptions): Promise<LLMOutput> {
  const model = opts.model ?? DEFAULT_LLM_MODEL;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_LLM_TIMEOUT_MS;
  const maxTokens = opts.maxTokens ?? DEFAULT_MAX_TOKENS;

  const completion = await withTimeout(
    getClient().chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: opts.prompt }],
    }),
    timeoutMs,
    `llm:${model}`,
  );

  const choice = completion.choices[0];
  const text = choice?.message?.content ?? "";
  return {
    text,
    model: completion.model,
    usage: completion.usage
      ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        }
      : undefined,
  };
}
