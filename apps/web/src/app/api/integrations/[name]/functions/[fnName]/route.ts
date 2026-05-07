import { NextResponse } from "next/server";
import { z } from "zod";

import { Prisma, prisma } from "@fuse/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = z
  .object({
    description: z.string().max(2000).optional(),
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional(),
    pathTemplate: z.string().min(1).max(2000).optional(),
    headers: z.record(z.string()).optional(),
    query: z.record(z.string()).optional(),
    bodyTemplate: z.unknown().optional().nullable(),
    timeoutMs: z.number().int().positive().max(120_000).optional(),
    sampleInput: z.unknown().optional(),
    sampleOutput: z.unknown().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field is required",
  });

interface RouteParams {
  params: Promise<{ name: string; fnName: string }>;
}

async function locate(name: string, fnName: string) {
  const integration = await prisma.customIntegration.findUnique({
    where: { name },
    select: { id: true },
  });
  if (!integration) return null;
  const fn = await prisma.customFunction.findUnique({
    where: {
      integrationId_name: { integrationId: integration.id, name: fnName },
    },
  });
  if (!fn) return null;
  return { integrationId: integration.id, fn };
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { name, fnName } = await params;
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
  const found = await locate(name, fnName);
  if (!found) {
    return NextResponse.json(
      { error: `Function "${name}.${fnName}" not found` },
      { status: 404 },
    );
  }

  const updates: Record<string, unknown> = {};
  for (const k of [
    "description",
    "method",
    "pathTemplate",
    "headers",
    "query",
    "timeoutMs",
  ] as const) {
    const v = parsed.data[k];
    if (v !== undefined) updates[k] = v;
  }
  for (const k of ["bodyTemplate", "sampleInput", "sampleOutput"] as const) {
    if (Object.prototype.hasOwnProperty.call(parsed.data, k)) {
      updates[k] =
        parsed.data[k] === undefined ? Prisma.JsonNull : parsed.data[k];
    }
  }

  const row = await prisma.customFunction.update({
    where: { id: found.fn.id },
    data: updates,
  });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { name, fnName } = await params;
  const found = await locate(name, fnName);
  if (!found) {
    return NextResponse.json(
      { error: `Function "${name}.${fnName}" not found` },
      { status: 404 },
    );
  }
  await prisma.customFunction.delete({ where: { id: found.fn.id } });
  return new NextResponse(null, { status: 204 });
}
