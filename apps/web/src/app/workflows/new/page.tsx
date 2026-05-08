import type { GraphJSON } from "@fuse/core";

import { WorkflowEditor } from "../_editor/WorkflowEditor";

export const dynamic = "force-dynamic";

const STARTER_GRAPH: GraphJSON = {
  nodes: [
    {
      id: "trigger",
      kind: "trigger.manual",
      name: "Manual trigger",
      config: {},
    },
  ],
  edges: [],
} as unknown as GraphJSON;

export default function NewWorkflowPage() {
  return (
    <WorkflowEditor
      mode="create"
      workflow={{
        id: "",
        name: "",
        description: "",
        graph: STARTER_GRAPH,
        maxConcurrent: 5,
      }}
    />
  );
}
