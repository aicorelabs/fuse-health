import { z } from "zod";

export const NodeKindSchema = z.enum([
  "trigger",
  "action",
  "llm",
  "mcp",
  "branch",
  "loop",
]);
export type NodeKind = z.infer<typeof NodeKindSchema>;

export const WorkflowNodeSchema = z.object({
  id: z.string(),
  kind: NodeKindSchema,
  name: z.string(),
  config: z.record(z.unknown()).default({}),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});
export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>;

export const WorkflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  condition: z.string().optional(),
});
export type WorkflowEdge = z.infer<typeof WorkflowEdgeSchema>;

export const WorkflowGraphSchema = z.object({
  nodes: z.array(WorkflowNodeSchema),
  edges: z.array(WorkflowEdgeSchema),
});
export type WorkflowGraph = z.infer<typeof WorkflowGraphSchema>;
