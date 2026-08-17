import { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySession, SessionPayload } from "./session";

/** Reads and verifies the session cookie from an API route request. Returns null if unauthenticated. */
export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}
