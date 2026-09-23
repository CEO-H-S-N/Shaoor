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
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? token.role ?? "CUSTOMER";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role ?? "CUSTOMER";
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
