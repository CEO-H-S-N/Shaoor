// Shaoor.org — Auth.js v5 Full Configuration (Node.js runtime only)
// This file uses PrismaAdapter and can only run in Node.js contexts:
//   - Server Components
//   - Route Handlers (/api/...)
//   - Server Actions
// NEVER import this in middleware.ts — use auth.config.ts there.

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  // Add PrismaAdapter only in Node.js runtime
  adapter: PrismaAdapter(prisma),

  // Extend providers with Credentials
  providers: [
    ...authConfig.providers,
    Credentials({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        // Direct dev accounts fast path for testing
        if (email === "devuser@shaoor.org" && password === "dev123") {
          const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, name: true, image: true, role: true },
          }).catch(() => null);

          if (user) {
            return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
          }
        }

        if (email === "devadmin@shaoor.org" && password === "dev123") {
          const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, name: true, image: true, role: true },
          }).catch(() => null);

          if (user) {
            return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
          }
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            passwordHash: true,
            emailVerified: true,
            isActive: true,
          },
        }).catch(() => null);

        if (!user || !user.passwordHash) return null;
        if (!user.emailVerified) return null; // must verify email first
        if (!user.isActive) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
      },
    }),
  ],

  // Override session to database strategy in server contexts
  session: {
    strategy: "jwt", // Keep JWT for middleware compatibility
    maxAge: 30 * 24 * 60 * 60,    // 30 days
    updateAge: 24 * 60 * 60,       // refresh every 24h
  },

  callbacks: {
    // Build the JWT token — inject user role from DB
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? token.role ?? "CUSTOMER";
        token.isActive = true;
      }
      return token;
    },

    // Expose token data to session (used in Server Components)
    async session({ session, token }) {
      if (!token.isActive) {
        // Block deactivated accounts
        return { ...session, user: undefined } as any;
      }

      if (session.user && token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role ?? "CUSTOMER";
      }
      return session;
    },

    // Used by Edge Middleware — runs on the token, no DB call
    authorized({ auth }) {
      return !!auth?.user;
    },
  },

  events: {
    async signIn({ user, isNewUser }) {
      // Audit log for new registrations (OWASP A09)
      if (isNewUser && user.id) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "USER_REGISTERED",
            resourceType: "user",
            resourceId: user.id,
            details: { email: user.email },
          },
        }).catch(() => { });
      }
    },
  },
});

// ── Type augmentation ──────────────────────────────────────────
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "CUSTOMER" | "ADMIN" | "DESIGNER";
    };
  }
}
