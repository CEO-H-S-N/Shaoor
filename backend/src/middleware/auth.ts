// Shaoor.org — JWT Authentication Middleware
// Verifies JWT tokens issued by Auth.js on the frontend.
// Extracts user info and role for downstream RBAC checks.

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  role: "CUSTOMER" | "ADMIN" | "DESIGNER";
  image: string | null;
}

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

/**
 * Middleware that verifies the JWT from the Authorization header.
 * Populates req.user with the decoded token payload.
 * Returns 401 if no token or invalid token.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Authentication required",
      code: "AUTH_MISSING_TOKEN",
    });
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  if (!JWT_SECRET) {
    console.error("JWT_SECRET is not configured");
    res.status(500).json({
      error: "Server configuration error",
      code: "AUTH_CONFIG_ERROR",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: "Token expired",
        code: "AUTH_TOKEN_EXPIRED",
      });
      return;
    }

    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: "Invalid token",
        code: "AUTH_INVALID_TOKEN",
      });
      return;
    }

    res.status(500).json({
      error: "Authentication failed",
      code: "AUTH_ERROR",
    });
  }
}

/**
 * Optional authentication — populates req.user if token present,
 * but doesn't reject unauthenticated requests.
 * Used for public routes that show extra content to logged-in users.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ") || !JWT_SECRET) {
    return next();
  }

  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
  } catch {
    // Silently ignore invalid tokens in optional auth
  }

  next();
}
