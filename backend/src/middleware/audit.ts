// Shaoor.org — Audit Logging Middleware
// Records all significant API actions for security compliance and traceability.

import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface AuditEntry {
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}

/**
 * Creates middleware that logs an audit entry for the action.
 * Place AFTER authenticate middleware so req.user is available.
 *
 * Usage:
 *   router.post("/papers", authenticate, audit("CREATE", "paper"), handler);
 */
export function audit(action: string, resourceType: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // Log the audit entry asynchronously — don't block the request
    const entry: AuditEntry = {
      action,
      resourceType,
      resourceId: req.params.id,
      details: {
        method: req.method,
        path: req.path,
        query: req.query,
      },
    };

    // Fire-and-forget — audit logging should never block requests
    logAuditEntry(req, entry).catch((err) => {
      console.error("Audit log failed:", err);
    });

    next();
  };
}

async function logAuditEntry(req: Request, entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || null,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId || null,
        details: entry.details || {},
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"] || null,
      },
    });
  } catch (err) {
    // If DB is down, log to stdout (picked up by CloudWatch)
    console.error("Audit DB write failed:", JSON.stringify({
      ...entry,
      userId: req.user?.id,
      ip: getClientIp(req),
      timestamp: new Date().toISOString(),
    }));
  }
}

/**
 * Extracts the real client IP, considering proxies (API Gateway, Vercel).
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || "unknown";
}
