import { WorkflowGraph } from "@fuse/core";

/**
 * Build the smallest sub-DAG that lets the executor produce an output for
 * `targetNodeId`. Walks ancestors backward from the target. When a `loop`
 * node ends up included, also pulls in its single body — `runLoop` requires
 * exactly one outgoing edge, so leaving the body out would corrupt
 * execution.
 *
 * Returns `null` if `targetNodeId` is not in the graph.
 *
 * Used for "Run up to here" preview from the editor; the result is fed
 * straight into `executeRun`.
 */
export function subgraphTo(
  graph: WorkflowGraph,
  targetNodeId: string,
): WorkflowGraph | null {
  if (!graph.nodeById(targetNodeId)) return null;

  const included = new Set<string>([targetNodeId]);
  const queue: string[] = [targetNodeId];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    // Walk back to ancestors.
    for (const e of graph.incoming(cur)) {
      if (!included.has(e.source)) {
        included.add(e.source);
        queue.push(e.source);
      }
    }
    // Loops drag their body in — even if the body is a descendant of the
    // target — because `runLoop` requires it.
    const node = graph.nodeById(cur);
    if (node?.kind === "loop") {
      for (const e of graph.outgoing(cur)) {
        if (!included.has(e.target)) {
          included.add(e.target);
          queue.push(e.target);
        }
      }
    }
  }

  const nodes = graph.nodes.filter((n) => included.has(n.id));
  const edges = graph.edges.filter(
    (e) => included.has(e.source) && included.has(e.target),
  );
  return new WorkflowGraph(nodes, edges);
}
