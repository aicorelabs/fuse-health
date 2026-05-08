-- AlterTable
ALTER TABLE "WorkflowRun" ADD COLUMN     "isPartial" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "WorkflowRun_workflowId_isPartial_createdAt_idx" ON "WorkflowRun"("workflowId", "isPartial", "createdAt");
