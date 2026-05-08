import { z } from "zod";

import { Edge, EdgeSchema, type EdgeJSON } from "./edge.js";
import {
  type AnyNode,
  isTriggerKind,
  NodeSchema,
  type NodeJSON,
  nodeFromJSON,
} from "./node.js";

export const GraphSchema = z.object({
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
});

export type GraphJSON = z.infer<typeof GraphSchema>;

export class WorkflowGraph {
  readonly nodes: AnyNode[];
  readonly edges: Edge[];

  constructor(nodes: AnyNode[], edges: Edge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  static fromJSON(data: unknown): WorkflowGraph {
    const parsed = GraphSchema.parse(data);
    return new WorkflowGraph(
      parsed.nodes.map((n: NodeJSON) => nodeFromJSON(n)),
      parsed.edges.map((e: EdgeJSON) => new Edge(e)),
    );
  }

  toJSON(): GraphJSON {
    return {
      nodes: this.nodes.map((n) => n.toJSON()),
      edges: this.edges.map((e) => e.toJSON()),
    };
  }

  nodeById(id: string): AnyNode | undefined {
    return this.nodes.find((n) => n.id === id);
  }

  outgoing(nodeId: string): Edge[] {
    return this.edges.filter((e) => e.source === nodeId);
  }

  incoming(nodeId: string): Edge[] {
    return this.edges.filter((e) => e.target === nodeId);
  }

  triggerNodes(): AnyNode[] {
    return this.nodes.filter((n) => isTriggerKind(n.kind));
  }
}
