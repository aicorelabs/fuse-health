import type { z } from "zod";

export const DEFAULT_FUNCTION_TIMEOUT_MS = 50_000;

export interface IntegrationFunctionOptions<TIn, TOut> {
  name: string;
  description: string;
  inputSchema: z.ZodType<TIn>;
  timeoutMs?: number;
  /**
   * Example input that satisfies the schema. Surfaced in the integrations
   * catalog and pre-filled into the action node's `input` field when an
   * author picks this function in the editor.
   */
  sampleInput?: TIn;
  /** Example output. Useful for the catalog and as sample data before any run. */
  sampleOutput?: TOut;
  run: (input: TIn) => Promise<TOut>;
}

export interface IntegrationFunctionJSON {
  name: string;
  description: string;
  timeoutMs: number;
  sampleInput?: unknown;
  sampleOutput?: unknown;
}

export class IntegrationFunction<TIn = unknown, TOut = unknown> {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: z.ZodType<TIn>;
  readonly timeoutMs: number;
  readonly sampleInput?: TIn;
  readonly sampleOutput?: TOut;
  private readonly handler: (input: TIn) => Promise<TOut>;

  constructor(opts: IntegrationFunctionOptions<TIn, TOut>) {
    this.name = opts.name;
    this.description = opts.description;
    this.inputSchema = opts.inputSchema;
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_FUNCTION_TIMEOUT_MS;
    if (opts.sampleInput !== undefined) this.sampleInput = opts.sampleInput;
    if (opts.sampleOutput !== undefined) this.sampleOutput = opts.sampleOutput;
    this.handler = opts.run;
  }

  async invoke(rawInput: unknown): Promise<TOut> {
    const input = this.inputSchema.parse(rawInput);
    return await this.handler(input);
  }

  toJSON(): IntegrationFunctionJSON {
    const out: IntegrationFunctionJSON = {
      name: this.name,
      description: this.description,
      timeoutMs: this.timeoutMs,
    };
    if (this.sampleInput !== undefined) out.sampleInput = this.sampleInput;
    if (this.sampleOutput !== undefined) out.sampleOutput = this.sampleOutput;
    return out;
  }
}
