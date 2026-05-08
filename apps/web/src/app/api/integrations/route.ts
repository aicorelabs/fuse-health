import { NextResponse } from "next/server";
import { z } from "zod";

import {
  listIntegrations,
  registerBuiltInIntegrations,
} from "@fuse/connectors";
import { prisma } from "@fuse/db";
import { encryptJson, writeAudit } from "@fuse/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

registerBuiltInIntegrations();

interface IntegrationFunctionPayload {
  name: string;
  description: string;
  timeoutMs: number;
  sampleInput?: unknown;
  sampleOutput?: unknown;
}

interface IntegrationPayload {
  name: string;
  label: string;
  description: string;
  category: string;
  builtin: boolean;
  functions: IntegrationFunctionPayload[];
}

/**
 * Returns built-in + custom integrations in one list. Each carries a
 * `builtin: boolean` flag so the catalog can render edit/delete affordances
 * for custom only. Sorted by label alphabetically (case-insensitive).
 */
export async function GET() {
  const builtin: IntegrationPayload[] = listIntegrations().map((i) => {
    const json = i.toJSON();
    return {
      name: json.name,
      label: json.label,
      description: json.description,
      category: json.category,
      builtin: true,
      functions: json.functions.map((f) => ({
        name: f.name,
        description: f.description,
        timeoutMs: f.timeoutMs,
        ...(f.sampleInput !== undefined && { sampleInput: f.sampleInput }),
        ...(f.sampleOutput !== undefined && { sampleOutput: f.sampleOutput }),
      })),
    };
  });

  const custom = await prisma.customIntegration.findMany({
    include: { functions: true },
    orderBy: { label: "asc" },
  });
  const customPayload: IntegrationPayload[] = custom.map((c) => ({
    name: c.name,
    label: c.label,
    description: c.description,
    category: c.category,
    builtin: false,
    functions: c.functions.map((f) => ({
      name: f.name,
      description: f.description,
      timeoutMs: f.timeoutMs,
      ...(f.sampleInput !== null && { sampleInput: f.sampleInput }),
      ...(f.sampleOutput !== null && { sampleOutput: f.sampleOutput }),
    })),
  }));

  const merged = [...builtin, ...customPayload].sort((a, b) =>
    a.label.toLowerCase().localeCompare(b.label.toLowerCase()),
  );
  return NextResponse.json({ integrations: merged });
}

const createSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9][a-z0-9_-]*$/,
      "use lowercase letters, digits, hyphens, or underscores",
    ),
  label: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
  category: z.string().min(1).max(50).default("custom"),
  baseUrl: z.string().url().optional().nullable(),
  defaultHeaders: z.record(z.string()).optional().default({}),
  /** Per-integration variables. Encrypted at rest; resolve as `{{ vars.X }}`. */
  vars: z.record(z.string()).optional(),
});

export async function POST(req: Request) {
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

  // Reject names that collide with built-ins so the registry is unambiguous.
  const reserved = new Set(listIntegrations().map((i) => i.name));
  if (reserved.has(parsed.data.name)) {
    return NextResponse.json(
      { error: `"${parsed.data.name}" is reserved by a built-in integration` },
      { status: 409 },
    );
  }

  const existing = await prisma.customIntegration.findUnique({
    where: { name: parsed.data.name },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: `Integration "${parsed.data.name}" already exists` },
      { status: 409 },
    );
  }

  const created = await prisma.customIntegration.create({
    data: {
      name: parsed.data.name,
      label: parsed.data.label,
      description: parsed.data.description,
      category: parsed.data.category,
      baseUrl: parsed.data.baseUrl ?? null,
      defaultHeaders: parsed.data.defaultHeaders as never,
      varsCipher:
        parsed.data.vars && Object.keys(parsed.data.vars).length > 0
          ? encryptJson(parsed.data.vars)
          : null,
    },
  });
  await writeAudit({
    action: "integration.created",
    resourceType: "integration",
    resourceId: created.id,
    metadata: { name: created.name, label: created.label },
  });
  return NextResponse.json(created, { status: 201 });
}
