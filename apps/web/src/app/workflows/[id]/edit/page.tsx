import { notFound } from "next/navigation";

import type { GraphJSON } from "@fuse/core";
import { prisma } from "@fuse/db";

import { WorkflowEditor } from "../../_editor/WorkflowEditor";

export const dynamic = "force-dynamic";

export default async function EditWorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workflow = await prisma.workflow.findUnique({ where: { id } });
  if (!workflow) notFound();

  return (
    <WorkflowEditor
      mode="update"
      workflow={{
        id: workflow.id,
        name: workflow.name,
        description: workflow.description ?? "",
        graph: workflow.graph as unknown as GraphJSON,
        maxConcurrent: workflow.maxConcurrent,
      }}
    />
  );
}
