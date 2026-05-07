import { NextResponse } from "next/server";

import {
  listIntegrations,
  registerBuiltInIntegrations,
} from "@fuse/connectors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Builtins are registered when the engine module loads. The catalog route
// might be hit before any engine import in this request lifecycle, so call
// the (idempotent) registration eagerly here too.
registerBuiltInIntegrations();

/**
 * Return the integrations registry as JSON. Powers the editor's ActionForm
 * pickers and the /integrations catalog page.
 */
export async function GET() {
  const integrations = listIntegrations()
    .map((i) => i.toJSON())
    .sort((a, b) => a.label.localeCompare(b.label));
  return NextResponse.json({ integrations });
}
