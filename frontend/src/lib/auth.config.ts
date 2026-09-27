// Shaoor.org — Auth.js Edge-safe Configuration
// This file ONLY exports the config needed by Next.js Edge Middleware.
// It must NOT import Prisma or any Node.js-only modules.
// The PrismaAdapter and DB callbacks live in auth.ts (Node.js runtime only).

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
        if ((user as any).image) token.picture = (user as any).image;
        if (user.name) token.name = user.name;
      }
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.image !== undefined) token.picture = session.image;
        if (session.user) {
          if (session.user.name !== undefined) token.name = session.user.name;
          if (session.user.image !== undefined) token.picture = session.user.image;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role ?? "CUSTOMER";
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
