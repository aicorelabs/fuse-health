export class StepFailedError extends Error {
  readonly nodeId: string;
  override readonly cause: unknown;
  constructor(nodeId: string, cause: unknown) {
    super(`Step ${nodeId} failed: ${formatCause(cause)}`);
    this.name = "StepFailedError";
    this.nodeId = nodeId;
    this.cause = cause;
  }
}

export class NotImplementedNodeError extends Error {
  constructor(kind: string, nodeId: string) {
    super(`Node kind "${kind}" (${nodeId}) is not implemented in engine v1`);
    this.name = "NotImplementedNodeError";
  }
}

export class IntegrationNotFoundError extends Error {
  constructor(integration: string, fn: string) {
    super(`Integration "${integration}.${fn}" is not registered`);
    this.name = "IntegrationNotFoundError";
  }
}

export class WorkflowStoppedError extends Error {
  constructor(nodeId: string, reason: string) {
    super(`Workflow stopped at ${nodeId}: ${reason}`);
    this.name = "WorkflowStoppedError";
  }
}

function formatCause(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  return String(cause);
}
