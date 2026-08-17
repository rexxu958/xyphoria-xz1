import { NextResponse } from "next/server";
import { listActivity } from "@/lib/db/activity";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") || 200);
  const activities = await listActivity(limit);
  return NextResponse.json({ activities });
}
