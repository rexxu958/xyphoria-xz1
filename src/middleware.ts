import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth/session";

// Session verification is pure JWT (no filesystem/DB access), so middleware
// can safely run on the Node.js runtime without pulling in the JSON database.
export const runtime = "nodejs";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtectedPage = pathname.startsWith("/dashboard");
  const isProtectedApi = pathname.startsWith("/api/admin");

  if (isProtectedPage || isProtectedApi) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? verifySession(token) : null;

    if (!session) {
      if (isProtectedApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const res = NextResponse.next();
  // Secure headers on every response.
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-XSS-Protection", "0");
  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/admin/:path*"],
};
