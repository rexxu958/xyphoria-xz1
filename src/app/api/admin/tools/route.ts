import { NextRequest, NextResponse } from "next/server";
import { toolsRepo } from "@/lib/db/tools";
import { logActivity } from "@/lib/db/activity";
import { getSessionFromRequest } from "@/lib/auth/requireAuth";

// List ALL tools regardless of status (owner view).
export async function GET() {
  const tools = await toolsRepo.read();
  return NextResponse.json({ tools });
}

// Update metadata-only fields on a tool set (bulk not supported here; see [id] route for single updates).
export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const updated = await toolsRepo.update(body.id, {
    ...body.patch,
    updatedAt: new Date().toISOString(),
  });
  if (!updated) return NextResponse.json({ error: "Tool not found" }, { status: 404 });

  await logActivity("UPDATE", `tool:${updated.slug}`, "SUCCESS");
  return NextResponse.json({ tool: updated });
}
