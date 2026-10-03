// Shaoor.org — Auth.js Edge-safe Configuration
// This file ONLY exports the config needed by Next.js Edge Middleware.
// It must NOT import Prisma or any Node.js-only modules.
// The PrismaAdapter and DB callbacks live in auth.ts (Node.js runtime only).
//
// ── HTTP 494 Prevention ───────────────────────────────────────────────────────
// Safari on macOS/iOS enforces strict cookie header size limits (~8 KB total).
// NextAuth JWT cookies can balloon when they include image URLs, long names, and
// extra fields — causing chunked cookies (session-token.0, .1, .2 …) that push
// total request headers over the limit.
//
// Mitigations applied here:
//   1. Profile picture is NOT stored in the JWT. It adds 150-300 bytes per request
//      and is not needed by Edge Middleware for auth decisions.
//   2. Only the minimum required fields (id, role, isMaster) ride in the token.
//   3. Explicit cookie config forces a single-cookie session (no chunking).

import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  // Use JWT so middleware can read sessions without a DB call
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,    // 7 days — shorter token = smaller cookie
    updateAge: 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  // ── Explicit cookie settings to prevent multi-chunk sessions ───────────────
  // By keeping the JWT small enough to fit in one cookie we avoid the
  // authjs.session-token.0 / .1 / .2 … fragmentation that causes 494 errors.
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  callbacks: {
    jwt({ token, user, trigger, session }) {
      // ── On first sign-in, populate compact token payload ────────────────
      // NOTE: We deliberately do NOT store picture/image in the JWT.
      // The avatar URL (150-300 bytes) rides in every single HTTP request header
      // as part of the cookie — stripping it is the single biggest win for
      // preventing HTTP 494 on Safari/macOS/iOS devices.
      if (user) {
        token.id = user.id;
        // Truncate name to 60 chars max — display names can be long
        if (user.name) token.name = user.name.slice(0, 60);
        token.role = (user as any).role ?? token.role ?? "CUSTOMER";
        token.isMaster =
          !!(user as any).isMaster ||
          user.email === "shouket.tilwani@gmail.com";
        // Deliberately skip token.picture — see note above
        delete token.picture;
      }
      // ── Handle session.update() calls ───────────────────────────────────
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = (session.name as string).slice(0, 60);
        if (session.role !== undefined) token.role = session.role;
        // Explicitly refuse to store image updates in the JWT
        delete token.picture;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role ?? "CUSTOMER";
        (session.user as any).isMaster =
          !!(token as any).isMaster ||
          session.user.email === "shouket.tilwani@gmail.com";
        if (token.name) session.user.name = token.name;
        // image is intentionally not set from token — components should
        // fetch the avatar directly from the DB or Google if needed
      }
      return session;
    },
    // This callback runs in Edge — MUST remain lightweight (no DB calls)
    authorized({ auth }) {
      return !!auth?.user;
    },
  },

  trustHost: true,
};
