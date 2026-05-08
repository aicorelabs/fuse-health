import { NextResponse } from "next/server";
import { z } from "zod";

import { Prisma, prisma } from "@fuse/db";
import { writeAudit } from "@fuse/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-zA-Z][a-zA-Z0-9_]*$/,
      "alphanumeric, starting with a letter or underscore",
    ),
  description: z.string().max(2000).optional().default(""),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("GET"),
  pathTemplate: z.string().min(1).max(2000),
  headers: z.record(z.string()).optional().default({}),
  query: z.record(z.string()).optional().default({}),
  bodyTemplate: z.unknown().optional().nullable(),
  timeoutMs: z.number().int().positive().max(120_000).default(50_000),
  sampleInput: z.unknown().optional(),
  sampleOutput: z.unknown().optional(),
});

export async function POST(
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
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const integration = await prisma.customIntegration.findUnique({
    where: { name },
    select: { id: true },
  });
  if (!integration) {
    return NextResponse.json(
      { error: `Custom integration "${name}" not found` },
      { status: 404 },
    );
  }

  const existing = await prisma.customFunction.findUnique({
    where: {
      integrationId_name: {
        integrationId: integration.id,
        name: parsed.data.name,
      },
    },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: `Function "${parsed.data.name}" already exists` },
      { status: 409 },
    );
  }

  const created = await prisma.customFunction.create({
    data: {
      integrationId: integration.id,
      name: parsed.data.name,
      description: parsed.data.description,
      method: parsed.data.method,
      pathTemplate: parsed.data.pathTemplate,
      headers: parsed.data.headers as never,
      query: parsed.data.query as never,
      bodyTemplate:
        parsed.data.bodyTemplate === undefined
          ? Prisma.JsonNull
          : (parsed.data.bodyTemplate as never),
      timeoutMs: parsed.data.timeoutMs,
      sampleInput:
        parsed.data.sampleInput === undefined
          ? Prisma.JsonNull
          : (parsed.data.sampleInput as never),
      sampleOutput:
        parsed.data.sampleOutput === undefined
          ? Prisma.JsonNull
          : (parsed.data.sampleOutput as never),
    },
  });
  await writeAudit({
    action: "integration.function.created",
    resourceType: "function",
    resourceId: created.id,
    metadata: {
      integration: name,
      function: created.name,
      method: created.method,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
