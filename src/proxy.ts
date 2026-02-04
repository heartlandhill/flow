import { NextRequest, NextResponse } from "next/server";

// Cookie name must match what's used in auth.ts
const COOKIE_NAME = "flow_session";

// Valid session token format: 64-character hex string
const SESSION_TOKEN_REGEX = /^[a-f0-9]{64}$/;

// Paths that should be accessible without authentication
const PUBLIC_PATHS = ["/login", "/api/push/subscribe"];

// Prefixes that should always be accessible (static assets, Next.js internals)
const PUBLIC_PREFIXES = [
  "/_next",
  "/favicon.ico",
  "/sw.js",
];

/**
 * Checks if a path should be accessible without authentication.
 */
function isPublicPath(pathname: string): boolean {
  // Check exact path matches
  if (PUBLIC_PATHS.includes(pathname)) {
    return true;
  }

  // Check prefix matches
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return true;
    }
  }

  return false;
}

/**
 * Validates the session token format.
 * Returns true if the token appears to be a valid format (64-char hex).
 * Note: This only checks format, not database validity.
 */
function isValidTokenFormat(token: string): boolean {
  return SESSION_TOKEN_REGEX.test(token);
}

/**
 * Proxy to protect routes by validating session cookies.
 * Redirects unauthenticated users to /login for protected routes.
 *
 * Note: Since Edge Runtime can't access Prisma, this proxy only checks
 * that the session cookie exists and has a valid format. Full session validation
 * against the database happens in server components and API routes.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Allow public paths through without authentication
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Get session token from cookie
  const sessionToken = request.cookies.get(COOKIE_NAME)?.value;

  // If no session cookie, redirect to login with return URL
  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if token has valid format (64-char hex)
  // This prevents obviously invalid tokens from reaching the app
  if (!isValidTokenFormat(sessionToken)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);

    // Clear the invalid session cookie
    response.cookies.delete(COOKIE_NAME);

    return response;
  }

  // Token exists and has valid format, allow request to proceed
  // Full database validation will happen in server components
  return NextResponse.next();
}

// Configure which routes the proxy should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sw.js (static files at root)
     *
     * Note: We still check PUBLIC_PATHS in the proxy function itself
     * for additional exclusions like /login and /api/push/subscribe
     */
    "/((?!_next/static|_next/image|favicon.ico|sw.js).*)",
  ],
};
