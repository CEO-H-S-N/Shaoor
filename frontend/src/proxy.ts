// Shaoor.org — Edge Middleware
// Runs on every request BEFORE it reaches the app.
// Responsibilities:
//   1. Authentication guard (protect dashboard routes)
//   2. Role-based route access (Admin/Designer only sections)
//   3. Bot & scraper detection
//   4. Security headers injection
//
// IMPORTANT: This file MUST NOT import from "@/lib/auth" (uses Prisma/Node.js).
// Instead, we use NextAuth's edge-compatible JWT session reading via auth.config.ts.

import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";

// ─── Create lightweight edge-only auth helper ──────────────────
const { auth } = NextAuth(authConfig);

// ─── Route Definitions ────────────────────────────────────────
const PUBLIC_ROUTES = ["/", "/papers", "/about", "/guidelines", "/contact", "/faq"];
const AUTH_ROUTES = ["/login"];
const PROTECTED_ROUTES = ["/submit", "/my-papers", "/settings", "/notifications"];
const ADMIN_ROUTES = ["/review"];
const DESIGNER_ROUTES = ["/manage"];

// ─── Bot Detection Signatures ─────────────────────────────────
const BOT_UA_PATTERNS = [
  /scrapy/i,
  /python-requests/i,
  /curl\//i,
  /wget\//i,
  /go-http-client/i,
  /java\/\d/i,
  /libwww-perl/i,
  /masscan/i,
  /zgrab/i,
  /dirbuster/i,
  /nikto/i,
  /sqlmap/i,
  /nmap/i,
];

function isBotRequest(request: NextRequest): boolean {
  const ua = request.headers.get("user-agent") || "";
  if (!ua || ua.length < 10) return true; // No UA = likely bot
  return BOT_UA_PATTERNS.some((pattern) => pattern.test(ua));
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRouteMatch(pathname: string, routes: string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

// ─── Security Headers ─────────────────────────────────────────
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires these in dev
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.shaoor.org https://*.amazonaws.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  // Strict Transport Security (HTTPS only)
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy — restrict browser features
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // Remove server fingerprinting
  response.headers.delete("X-Powered-By");

  return response;
}

// ─── Main Middleware ──────────────────────────────────────────
export default auth(async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and API auth routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") // static files (favicon, images, etc.)
  ) {
    return NextResponse.next();
  }

  // ── 1. Bot Detection ──────────────────────────────────────
  if (isBotRequest(request)) {
    const ip = getClientIp(request);
    console.warn(`[MIDDLEWARE] Bot detected: IP=${ip}, UA=${request.headers.get("user-agent")}`);

    // Allow legitimate search engine bots through for public pages
    const ua = request.headers.get("user-agent") || "";
    const isSearchBot = /googlebot|bingbot|slurp|duckduckbot/i.test(ua);
    const isPublic = isRouteMatch(pathname, PUBLIC_ROUTES);

    if (!isSearchBot || !isPublic) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // ── 2. Auth Guard ──────────────────────────────────────────
  // request.auth is set by the auth() wrapper (JWT token via authConfig)
  const session = (request as any).auth;
  const isLoggedIn = !!session?.user;
  const userRole = session?.user?.role ?? null;

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && isRouteMatch(pathname, AUTH_ROUTES)) {
    const dest = ["ADMIN", "DESIGNER"].includes(userRole) ? "/review" : "/my-papers";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Protect dashboard routes — redirect to login if not authenticated
  if (
    isRouteMatch(pathname, [...PROTECTED_ROUTES, ...ADMIN_ROUTES, ...DESIGNER_ROUTES]) &&
    !isLoggedIn
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 3. Role-Based Access ──────────────────────────────────
  if (isRouteMatch(pathname, ADMIN_ROUTES) && !["ADMIN", "DESIGNER"].includes(userRole)) {
    return NextResponse.redirect(new URL("/my-papers", request.url));
  }

  if (isRouteMatch(pathname, DESIGNER_ROUTES) && !["ADMIN", "DESIGNER"].includes(userRole)) {
    return NextResponse.redirect(new URL("/my-papers", request.url));
  }

  // ── 4. Add Security Headers to all responses ───────────────
  const response = NextResponse.next();
  return addSecurityHeaders(response);
});

// ─── Middleware Config ────────────────────────────────────────
export const config = {
  matcher: [
    /*
     * Run middleware on all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
