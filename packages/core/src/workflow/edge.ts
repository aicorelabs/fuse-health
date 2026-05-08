import { z } from "zod";

export const EdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  condition: z.string().optional(),
});

export type EdgeJSON = z.infer<typeof EdgeSchema>;

export class Edge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly condition?: string;

  constructor(data: EdgeJSON) {
    this.id = data.id;
    this.source = data.source;
    this.target = data.target;
    this.condition = data.condition;
  }

  toJSON(): EdgeJSON {
    return {
      id: this.id,
      source: this.source,
      target: this.target,
      ...(this.condition !== undefined && { condition: this.condition }),
    };
  }
}
