import { NextRequest, NextResponse } from "next/server";
import { readSettings, writeSettings } from "@/lib/db/settings";
import { logActivity } from "@/lib/db/activity";

export async function GET() {
  const settings = await readSettings();
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const current = await readSettings();
  const next = { ...current, ...body };
  await writeSettings(next);
  await logActivity("SETTINGS_CHANGED", "settings", "SUCCESS");
  return NextResponse.json({ settings: next });
}
