import { NextResponse } from "next/server";
import { searchPublicTools } from "@/lib/db/tools";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const results = await searchPublicTools(q);
  const safeResults = results.map(({ filepath, ...rest }) => rest);
  return NextResponse.json({ results: safeResults });
}
