import { NextResponse } from "next/server";
import { listEnabledCategories } from "@/lib/db/categories";

export async function GET() {
  const categories = await listEnabledCategories();
  return NextResponse.json({ categories });
}
