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

        // Master Account Hardcoded fast path
        if (email === "shouket.tilwani@gmail.com" && password === "Tilwani#Shaoor2026!MasterKey") {
          let user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, name: true, image: true, role: true, isActive: true },
          }).catch(() => null);

          if (!user) {
            const hash = await bcrypt.hash("Tilwani#Shaoor2026!MasterKey", 12);
            user = await prisma.user.create({
              data: {
                email,
                name: "Dr. Shoukat Tilwani",
                role: "ADMIN",
                emailVerified: new Date(),
                isActive: true,
                passwordHash: hash,
              },
              select: { id: true, email: true, name: true, image: true, role: true, isActive: true },
            }).catch(() => null);
          } else if (user.role !== "ADMIN" || !user.isActive) {
            user = await prisma.user.update({
              where: { email },
              data: { role: "ADMIN", isActive: true },
              select: { id: true, email: true, name: true, image: true, role: true, isActive: true },
            }).catch(() => user);
          }

          if (user) {
            return {
              id: user.id,
              email: user.email,
              name: user.name ?? "Dr. Shoukat Tilwani",
              // image intentionally omitted — not stored in JWT cookie
              role: "ADMIN",
              isMaster: true,
            };
          }
        }

        // Direct dev accounts fast path for testing
        if (email === "devuser@shaoor.org" && password === "dev123") {
          const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, name: true, image: true, role: true },
          }).catch(() => null);

          if (user) {
            return { id: user.id, email: user.email, name: user.name, role: user.role };
          }
        }

        if (email === "devadmin@shaoor.org" && password === "dev123") {
          const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, name: true, image: true, role: true },
          }).catch(() => null);

          if (user) {
            return { id: user.id, email: user.email, name: user.name, role: user.role };
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

        const isMaster = user.email === "shouket.tilwani@gmail.com";
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          // image intentionally omitted — not stored in JWT cookie
          role: user.role,
          isMaster,
        };
      },
    }),
  ],

  // Keep JWT for middleware compatibility — maxAge capped at 7 days
  // so the token expiry field (exp) stays small and cookie stays compact.
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,      // 7 days (matches auth.config.ts)
    updateAge: 24 * 60 * 60,
  },

  callbacks: {
    // Build the JWT token — keep payload minimal to prevent HTTP 494
    // cookie-too-large errors on Safari / macOS / iOS.
    // Fields stored: id, name (≤60 chars), role, isMaster, isActive.
    // Fields NOT stored: picture/image (adds 150-300 bytes per request).
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        if (user.name) token.name = user.name.slice(0, 60);
        token.role = (user as any).role ?? token.role ?? "CUSTOMER";
        token.isMaster =
          !!(user as any).isMaster ||
          token.email === "shouket.tilwani@gmail.com";
        token.isActive = true;
        // Deliberately omit token.picture — see file header for rationale
        delete token.picture;
      }
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = (session.name as string).slice(0, 60);
        if (session.role !== undefined) token.role = session.role;
        // Refuse to store image updates in the JWT
        delete token.picture;
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
        (session.user as any).isMaster =
          !!(token as any).isMaster ||
          session.user.email === "shouket.tilwani@gmail.com";
        if (token.name) session.user.name = token.name;
        // session.user.image intentionally not set from token —
        // components should load avatar via useSession() or from DB
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
