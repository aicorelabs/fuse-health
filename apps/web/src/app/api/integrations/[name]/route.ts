import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@fuse/db";
import { decryptJson, encryptJson, writeAudit } from "@fuse/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = z
  .object({
    label: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    category: z.string().min(1).max(50).optional(),
    baseUrl: z.string().url().optional().nullable(),
    defaultHeaders: z.record(z.string()).optional(),
    /** Per-integration variables. Pass {} to clear; omit to leave unchanged. */
    vars: z.record(z.string()).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field is required",
  });

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const row = await prisma.customIntegration.findUnique({
    where: { name },
    include: { functions: true },
  });
  if (!row) {
    return NextResponse.json(
      { error: `Custom integration "${name}" not found` },
      { status: 404 },
    );
  }
  // Decrypt vars for the editor. The catalog list route never includes
  // vars; this detail endpoint does so the admin can re-edit them.
  const vars = row.varsCipher
    ? (decryptJson(row.varsCipher) as Record<string, string>)
    : {};
  // Strip the cipher from the response so plaintext vars travel only inside
  // the response body, not as both fields.
  const { varsCipher: _drop, ...rest } = row;
  return NextResponse.json({ ...rest, vars });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const existing = await prisma.customIntegration.findUnique({
    where: { name },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json(
      { error: `Custom integration "${name}" not found` },
      { status: 404 },
    );
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.label !== undefined) updates.label = parsed.data.label;
  if (parsed.data.description !== undefined)
    updates.description = parsed.data.description;
  if (parsed.data.category !== undefined)
    updates.category = parsed.data.category;
  if (parsed.data.baseUrl !== undefined) updates.baseUrl = parsed.data.baseUrl;
  if (parsed.data.defaultHeaders !== undefined)
    updates.defaultHeaders = parsed.data.defaultHeaders;
  if (parsed.data.vars !== undefined) {
    updates.varsCipher =
      Object.keys(parsed.data.vars).length === 0
        ? null
        : encryptJson(parsed.data.vars);
  }

  const row = await prisma.customIntegration.update({
    where: { name },
    data: updates,
  });
  await writeAudit({
    action: "integration.updated",
    resourceType: "integration",
    resourceId: row.id,
    metadata: { name, fields: Object.keys(updates) },
  });
  return NextResponse.json(row);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const existing = await prisma.customIntegration.findUnique({
    where: { name },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json(
      { error: `Custom integration "${name}" not found` },
      { status: 404 },
    );
  }
  await prisma.customIntegration.delete({ where: { name } });
  await writeAudit({
    action: "integration.deleted",
    resourceType: "integration",
    resourceId: existing.id,
    metadata: { name },
  });
  return new NextResponse(null, { status: 204 });
}
