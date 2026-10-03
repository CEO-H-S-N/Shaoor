// Shaoor.org — Emergency Session Cookie Fixer
// Route: GET /api/fix-session
//
// Purpose: Users who signed in before the HTTP 494 JWT-cookie fix was deployed
// may have gigantic bloated cookies cached in their browser. Every request they
// make gets rejected by Vercel BEFORE our middleware can run, so the automatic
// cleanup in proxy.ts never fires for them.
//
// This endpoint is EXCLUDED from the auth() middleware wrapper (see proxy.ts
// matcher config) so Vercel does NOT attempt to read/parse cookies for auth —
// meaning the request will always succeed even with a 10 KB cookie jar.
//
// It responds with:
//   1. Set-Cookie headers to delete every known session cookie variant
//   2. An HTML page that confirms success and auto-redirects to /login
//
// Usage: tell affected users to visit https://shaoor.org/api/fix-session
// They will be signed out and their cookie bloat will be cleared instantly.

import { NextResponse } from "next/server";

// All known cookie name variants used by NextAuth / Auth.js across versions
const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "next-auth.callback-url",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
];

// Generate chunked cookie names (NextAuth splits large JWTs into .0 .1 .2 ...)
const CHUNKED_NAMES: string[] = [];
for (let i = 0; i <= 19; i++) {
  CHUNKED_NAMES.push(
    `authjs.session-token.${i}`,
    `__Secure-authjs.session-token.${i}`,
    `next-auth.session-token.${i}`,
    `__Secure-next-auth.session-token.${i}`
  );
}

const ALL_COOKIES = [...SESSION_COOKIE_NAMES, ...CHUNKED_NAMES];

// Cookie deletion attributes — must match the original Set attributes exactly
// so the browser recognises them as the same cookie to delete
const DELETE_OPTIONS = [
  // Production (Secure flag set)
  { path: "/", secure: true, httpOnly: true },
  // Local dev (no Secure flag)
  { path: "/", secure: false, httpOnly: true },
  // Fallback without httpOnly (some older auth.js versions)
  { path: "/", secure: true, httpOnly: false },
  { path: "/", secure: false, httpOnly: false },
];

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Clearing session… — Shaoor</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: #1e3a5f;
    }
    .card {
      background: #fff;
      border-radius: 16px;
      padding: 48px 40px;
      text-align: center;
      box-shadow: 0 4px 32px rgba(0,0,0,0.08);
      max-width: 420px;
      width: 90%;
    }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
    p { font-size: 15px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
    .progress {
      height: 4px;
      background: #e2e8f0;
      border-radius: 2px;
      overflow: hidden;
    }
    .bar {
      height: 100%;
      background: linear-gradient(90deg, #1e3a8a, #3b82f6);
      animation: fill 2.5s ease forwards;
    }
    @keyframes fill { from { width: 0 } to { width: 100% } }
    .note { margin-top: 20px; font-size: 13px; color: #94a3b8; }
  </style>
  <meta http-equiv="refresh" content="3; url=${origin}/login" />
</head>
<body>
  <div class="card">
    <div class="icon">🧹</div>
    <h1>Session cleared</h1>
    <p>
      Your browser session cookies have been reset.<br />
      Redirecting you to the login page…
    </p>
    <div class="progress"><div class="bar"></div></div>
    <p class="note">
      If you are not redirected automatically,
      <a href="/login" style="color:#1e3a8a">click here</a>.
    </p>
  </div>
</body>
</html>`;

  const response = new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Prevent caching so this always runs fresh
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });

  // Delete every possible cookie variant with every possible attribute combo
  for (const name of ALL_COOKIES) {
    for (const opts of DELETE_OPTIONS) {
      response.cookies.set({
        name,
        value: "",
        maxAge: 0,
        expires: new Date(0),
        path: opts.path,
        secure: opts.secure,
        httpOnly: opts.httpOnly,
        sameSite: "lax",
      });
    }
  }

  return response;
}
