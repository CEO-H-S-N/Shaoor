// Shaoor.org — Auth.js Edge-safe Configuration
// This file ONLY exports the config needed by Next.js Edge Middleware.
// It must NOT import Prisma or any Node.js-only modules.
// The PrismaAdapter and DB callbacks live in auth.ts (Node.js runtime only).

import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

function sanitizeImageUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  // Reject base64 data URIs or any URL > 500 chars to prevent Cookie bloat / HTTP 494 on iOS / mobile
  if (!trimmed || trimmed.startsWith("data:") || trimmed.length > 500) {
    return null;
  }
  return trimmed;
}

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  // Use JWT so middleware can read sessions without a DB call
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? token.role ?? "CUSTOMER";
        token.isMaster = (user as any).isMaster ?? (user.email === "shouket.tilwani@gmail.com");
        const cleanImg = sanitizeImageUrl((user as any).image);
        if (cleanImg) {
          token.picture = cleanImg;
        } else {
          delete token.picture;
        }
        if (user.name) token.name = user.name;
      }
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name;
        const newImg = session.image !== undefined ? session.image : session.user?.image;
        if (newImg !== undefined) {
          const cleanImg = sanitizeImageUrl(newImg);
          if (cleanImg) {
            token.picture = cleanImg;
          } else {
            delete token.picture;
          }
        }
        if (session.user?.name !== undefined) token.name = session.user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role ?? "CUSTOMER";
        (session.user as any).isMaster = !!(token as any).isMaster || (session.user.email === "shouket.tilwani@gmail.com");
        if (token.name) session.user.name = token.name;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
    // This callback runs in Edge — MUST remain lightweight (no DB calls)
    authorized({ auth, request: { nextUrl } }) {
      return !!auth?.user;
    },
  },

  trustHost: true,
};
