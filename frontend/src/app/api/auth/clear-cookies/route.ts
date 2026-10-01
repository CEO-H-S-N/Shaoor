// Shaoor.org — Session Cookie Purge Route
// Emits Set-Cookie deletion directives for all legacy chunked and session cookies.
// Used to recover mobile / iOS Safari browsers stuck with bloated cookie headers.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const loginUrl = new URL("/login?cleared=1", request.url);
  const response = NextResponse.redirect(loginUrl);

  const cookieNames = [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "authjs.csrf-token",
    "__Host-authjs.csrf-token",
    "authjs.callback-url",
    "__Secure-authjs.callback-url",
  ];

  // Delete base cookies
  for (const name of cookieNames) {
    response.cookies.delete(name);
  }

  // Delete all numbered chunk cookies (.0 through .20)
  for (let i = 0; i <= 20; i++) {
    response.cookies.delete(`authjs.session-token.${i}`);
    response.cookies.delete(`__Secure-authjs.session-token.${i}`);
    response.cookies.delete(`next-auth.session-token.${i}`);
    response.cookies.delete(`__Secure-next-auth.session-token.${i}`);
  }

  return response;
}
