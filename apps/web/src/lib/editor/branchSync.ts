import type { Edge } from "reactflow";

// When a branch case label is renamed, every outgoing edge from that branch
// whose sourceHandle equals the old label is rewritten to the new label.
// `label` (the visual edge label) is also kept in sync.
export function applyBranchCaseRename<E extends Edge>(
  edges: readonly E[],
  branchNodeId: string,
  oldLabel: string,
  newLabel: string,
): E[] {
  return edges.map((e) => {
    if (e.source !== branchNodeId) return e;
    if (e.sourceHandle !== oldLabel) return e;
    return { ...e, sourceHandle: newLabel, label: newLabel };
  });
}

// When a branch case is removed, every outgoing edge from that branch with the
// matching sourceHandle is dropped — the visual handle is gone too.
export function removeBranchEdgesForCase<E extends Edge>(
  edges: readonly E[],
  branchNodeId: string,
  label: string,
): E[] {
  return edges.filter(
    (e) => !(e.source === branchNodeId && e.sourceHandle === label),
  );
}
