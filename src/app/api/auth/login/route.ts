import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  ensureOwnerSeeded,
  getUserByUsername,
  signSession,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE,
} from "@/lib/auth/auth";
import { logActivity } from "@/lib/db/activity";
import { rateLimit, clientKeyFromRequest } from "@/lib/security/rateLimit";

export async function POST(req: NextRequest) {
  const key = `login:${clientKeyFromRequest(req)}`;
  const { allowed } = rateLimit(key, 10, 10 * 60 * 1000); // 10 attempts / 10 min / IP
  if (!allowed) {
    return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
  }

  await ensureOwnerSeeded();

  const body = await req.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  const user = await getUserByUsername(username);
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !valid) {
    await logActivity("LOGIN", username, "FAILED");
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = signSession({ sub: user.id, username: user.username, role: user.role });
  await logActivity("LOGIN", username, "SUCCESS");

  const res = NextResponse.json({ ok: true, user: { username: user.username, role: user.role } });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
  return res;
}
