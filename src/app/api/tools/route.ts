import { NextResponse } from "next/server";
import { listPublicTools } from "@/lib/db/tools";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");

  let tools = await listPublicTools();
  if (category) tools = tools.filter((t) => t.category === category);
  if (featured === "true") tools = tools.filter((t) => t.featured);

  // Never leak the raw filesystem path to the client.
  const safeTools = tools.map(({ filepath, ...rest }) => rest);
  return NextResponse.json({ tools: safeTools });
}
