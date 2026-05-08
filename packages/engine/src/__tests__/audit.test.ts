import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@fuse/db";

import { writeAudit } from "../audit.js";

describe("writeAudit", () => {
  const ids: string[] = [];

  afterAll(async () => {
    if (ids.length > 0) {
      await prisma.auditEntry.deleteMany({ where: { id: { in: ids } } });
    }
  });

  it("persists a row with all required fields", async () => {
    const entry = await writeAudit({
      action: "workflow.created",
      resourceType: "workflow",
      resourceId: "wf_test_1",
      actorType: "admin",
      actorId: "admin@example.com",
      metadata: { name: "Smoke" },
    });
    ids.push(entry.id);

    const row = await prisma.auditEntry.findUnique({ where: { id: entry.id } });
    expect(row?.action).toBe("workflow.created");
    expect(row?.resourceType).toBe("workflow");
    expect(row?.resourceId).toBe("wf_test_1");
    expect(row?.actorType).toBe("admin");
    expect(row?.actorId).toBe("admin@example.com");
    expect(row?.metadata).toEqual({ name: "Smoke" });
  });

  it('defaults actorType to "system" when actor is omitted', async () => {
    const entry = await writeAudit({
      action: "run.started",
      resourceType: "run",
      resourceId: "run_test_1",
    });
    ids.push(entry.id);

    const row = await prisma.auditEntry.findUnique({ where: { id: entry.id } });
    expect(row?.actorType).toBe("system");
    expect(row?.actorId).toBeNull();
  });

  it("metadata is optional", async () => {
    const entry = await writeAudit({
      action: "workflow.deleted",
      resourceType: "workflow",
      resourceId: "wf_test_2",
    });
    ids.push(entry.id);

    const row = await prisma.auditEntry.findUnique({ where: { id: entry.id } });
    expect(row?.metadata).toBeNull();
  });

  it("returns the created row", async () => {
    const entry = await writeAudit({
      action: "integration.created",
      resourceType: "integration",
      resourceId: "int_test",
    });
    ids.push(entry.id);

    expect(entry.id).toBeTruthy();
    expect(entry.action).toBe("integration.created");
    expect(entry.createdAt).toBeInstanceOf(Date);
  });
});
