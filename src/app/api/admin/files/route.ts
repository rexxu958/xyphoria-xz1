import { NextRequest, NextResponse } from "next/server";
import { toolsRepo } from "@/lib/db/tools";
import { localFileStorage } from "@/lib/storage/localFileStorage";
import { logActivity } from "@/lib/db/activity";

// List every stored file, derived from tool metadata (single source of truth).
export async function GET() {
  const tools = await toolsRepo.read();
  const files = tools.map((t) => ({
    id: t.id,
    toolSlug: t.slug,
    filename: t.filename,
    size: t.size,
    mimeType: t.mimeType,
    createdAt: t.createdAt,
    downloadCount: t.downloadCount,
  }));
  return NextResponse.json({ files });
}

// Delete a file (and detach it from its tool) without deleting the whole tool record.
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const toolId = searchParams.get("toolId");
  if (!toolId) return NextResponse.json({ error: "toolId is required" }, { status: 400 });

  const tool = await toolsRepo.findById(toolId);
  if (!tool) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await localFileStorage.delete(tool.filepath);
  await toolsRepo.update(toolId, { filepath: "", filename: "", size: 0, status: "DRAFT" });
  await logActivity("FILE_DELETED", `tool:${tool.slug}`, "SUCCESS");
  return NextResponse.json({ ok: true });
}
