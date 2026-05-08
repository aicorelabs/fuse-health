import { Prisma, prisma, type AuditEntry } from "@fuse/db";

export type AuditActorType = "admin" | "system" | "engine";

export interface WriteAuditArgs {
  action: string;
  resourceType: string;
  resourceId: string;
  actorType?: AuditActorType;
  actorId?: string | null;
  metadata?: unknown;
}

/**
 * Append a single audit log entry. Helper used by:
 *   - the engine's `runInBackground` for run.* lifecycle events
 *   - API route handlers for workflow.* and integration.* CRUD events
 *
 * Defaults `actorType` to `"system"` when omitted (engine-driven events).
 * `metadata` is stored verbatim as JSON; pass anything serializable.
 */
export async function writeAudit(args: WriteAuditArgs): Promise<AuditEntry> {
  return prisma.auditEntry.create({
    data: {
      action: args.action,
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      actorType: args.actorType ?? "system",
      actorId: args.actorId ?? null,
      metadata:
        args.metadata === undefined
          ? Prisma.JsonNull
          : (args.metadata as never),
    },
  });
}
