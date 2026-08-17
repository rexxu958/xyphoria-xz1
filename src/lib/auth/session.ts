import jwt from "jsonwebtoken";

/**
 * Pure JWT session helpers with NO database/filesystem imports.
 * This keeps middleware (which may run on a restricted runtime) lightweight —
 * it only ever needs to verify a signed token, never touch the JSON database.
 */
const SESSION_SECRET = process.env.SESSION_SECRET || "";
export const SESSION_COOKIE_NAME = "xyphoria_session";
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

if (!SESSION_SECRET && process.env.NODE_ENV === "production") {
  console.error("FATAL: SESSION_SECRET is not set. Set it in your environment before deploying.");
}

export interface SessionPayload {
  sub: string;
  username: string;
  role: "owner" | "admin";
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, SESSION_SECRET || "dev-only-insecure-secret", {
    expiresIn: SESSION_COOKIE_MAX_AGE,
  });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, SESSION_SECRET || "dev-only-insecure-secret") as SessionPayload;
  } catch {
    return null;
  }
}
