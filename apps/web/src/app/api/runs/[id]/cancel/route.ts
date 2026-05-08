import { NextResponse } from "next/server";

import { cancelRun } from "@fuse/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cancel an in-flight run. Cooperative — in-flight node Promises finish
 * their current work but no new batch starts.
 *
 * Returns 200 with the cancelled run, 409 if already terminal, 404 if
 * missing.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let result;
  try {
    result = await cancelRun(id);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (result.status === "already_terminal") {
    return NextResponse.json(
      {
        error: `Run is already ${result.run.status.toLowerCase()}`,
        run: result.run,
      },
      { status: 409 },
    );
  }

  return NextResponse.json(result.run);
}
