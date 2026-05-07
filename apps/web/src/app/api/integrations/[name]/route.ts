import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@fuse/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = z
  .object({
    label: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    category: z.string().min(1).max(50).optional(),
    baseUrl: z.string().url().optional().nullable(),
    defaultHeaders: z.record(z.string()).optional(),
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
  return NextResponse.json(row);
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

  const row = await prisma.customIntegration.update({
    where: { name },
    data: updates,
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
  return new NextResponse(null, { status: 204 });
}
