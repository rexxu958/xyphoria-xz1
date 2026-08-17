import { NextRequest, NextResponse } from "next/server";
import { toolsRepo } from "@/lib/db/tools";
import { localFileStorage } from "@/lib/storage/localFileStorage";
import { logActivity } from "@/lib/db/activity";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tool = await toolsRepo.findById(id);
  if (!tool) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ tool });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patch = await req.json().catch(() => ({}));
  delete patch.id;
  delete patch.filepath; // filepath is never client-editable
  const updated = await toolsRepo.update(id, { ...patch, updatedAt: new Date().toISOString() });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await logActivity("UPDATE", `tool:${updated.slug}`, "SUCCESS");
  return NextResponse.json({ tool: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tool = await toolsRepo.findById(id);
  if (!tool) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await localFileStorage.delete(tool.filepath);
  await toolsRepo.delete(id);
  await logActivity("DELETE", `tool:${tool.slug}`, "SUCCESS");
  return NextResponse.json({ ok: true });
}
