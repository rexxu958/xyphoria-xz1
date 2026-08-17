import { NextRequest, NextResponse } from "next/server";
import { categoriesRepo } from "@/lib/db/categories";
import { listPublicTools } from "@/lib/db/tools";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await categoriesRepo.findBySlug(slug);
  if (!category || !category.enabled) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }
  const tools = (await listPublicTools()).filter((t) => t.category === category.slug);
  const safeTools = tools.map(({ filepath, ...rest }) => rest);
  return NextResponse.json({ category, tools: safeTools });
}
