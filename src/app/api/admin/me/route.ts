import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/requireAuth";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ user: { username: session.username, role: session.role } });
}
