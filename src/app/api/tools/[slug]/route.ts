import { NextRequest, NextResponse } from "next/server";
import { getPublicToolBySlug } from "@/lib/db/tools";
import { recordView } from "@/lib/db/statistics";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = await getPublicToolBySlug(slug);
  if (!tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }
  await recordView(tool.id, tool.slug);
  const { filepath, ...safeTool } = tool;
  return NextResponse.json({ tool: safeTool });
}
