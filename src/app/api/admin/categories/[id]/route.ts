import { NextRequest, NextResponse } from "next/server";
import { categoriesRepo } from "@/lib/db/categories";
import { toolsRepo } from "@/lib/db/tools";
import { logActivity } from "@/lib/db/activity";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patch = await req.json().catch(() => ({}));
  delete patch.id;
  const updated = await categoriesRepo.update(id, { ...patch, updatedAt: new Date().toISOString() });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await logActivity("CATEGORY_UPDATED", `category:${updated.slug}`, "SUCCESS");
  return NextResponse.json({ category: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await categoriesRepo.findById(id);
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const inUse = await toolsRepo.find((t) => t.category === category.slug);
  if (inUse.length > 0) {
    return NextResponse.json(
      { error: `Category is used by ${inUse.length} tool(s). Reassign them first.` },
      { status: 409 }
    );
  }

  await categoriesRepo.delete(id);
  await logActivity("CATEGORY_DELETED", `category:${category.slug}`, "SUCCESS");
  return NextResponse.json({ ok: true });
}
