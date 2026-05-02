import type { z } from "zod";

export const DEFAULT_FUNCTION_TIMEOUT_MS = 50_000;

export interface IntegrationFunctionOptions<TIn, TOut> {
  name: string;
  description: string;
  inputSchema: z.ZodType<TIn>;
  timeoutMs?: number;
  run: (input: TIn) => Promise<TOut>;
}

export class IntegrationFunction<TIn = unknown, TOut = unknown> {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: z.ZodType<TIn>;
  readonly timeoutMs: number;
  private readonly handler: (input: TIn) => Promise<TOut>;

  constructor(opts: IntegrationFunctionOptions<TIn, TOut>) {
    this.name = opts.name;
    this.description = opts.description;
    this.inputSchema = opts.inputSchema;
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_FUNCTION_TIMEOUT_MS;
    this.handler = opts.run;
  }

  async invoke(rawInput: unknown): Promise<TOut> {
    const input = this.inputSchema.parse(rawInput);
    return await this.handler(input);
  }
}
