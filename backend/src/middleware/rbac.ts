// Shaoor.org — Role-Based Access Control (RBAC) Middleware
// Enforces permission hierarchy: CUSTOMER < ADMIN < DESIGNER
// Must be used AFTER the authenticate middleware.

import { Request, Response, NextFunction } from "express";
import type { AuthenticatedUser } from "./auth";

type Role = "CUSTOMER" | "ADMIN" | "DESIGNER";

// Permission hierarchy — higher index = more permissions
const ROLE_HIERARCHY: Record<Role, number> = {
  CUSTOMER: 0,
  ADMIN: 1,
  DESIGNER: 2,
};

/**
 * Creates middleware that requires the user to have at least the specified role.
 * DESIGNER > ADMIN > CUSTOMER
 *
 * Usage:
 *   router.get("/admin-only", authenticate, requireRole("ADMIN"), handler);
 *   router.get("/designer-only", authenticate, requireRole("DESIGNER"), handler);
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as AuthenticatedUser | undefined;

    if (!user) {
      res.status(401).json({
        error: "Authentication required",
        code: "RBAC_NOT_AUTHENTICATED",
      });
      return;
    }

    // Check if user's role meets the minimum requirement
    const userLevel = ROLE_HIERARCHY[user.role] ?? -1;
    const hasPermission = allowedRoles.some(
      (role) => userLevel >= ROLE_HIERARCHY[role]
    );

    if (!hasPermission) {
      res.status(403).json({
        error: "Insufficient permissions",
        code: "RBAC_FORBIDDEN",
        required: allowedRoles,
        current: user.role,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware that requires the user to be the resource owner OR have admin+ role.
 * Used for routes like "edit my paper" where admins can also edit.
 *
 * @param getResourceOwnerId - Function to extract the owner ID from the request
 */
export function requireOwnerOrRole(
  getResourceOwnerId: (req: Request) => string | Promise<string>,
  ...fallbackRoles: Role[]
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user as AuthenticatedUser | undefined;

    if (!user) {
      res.status(401).json({
        error: "Authentication required",
        code: "RBAC_NOT_AUTHENTICATED",
      });
      return;
    }

    try {
      const ownerId = await getResourceOwnerId(req);

      // User is the owner
      if (user.id === ownerId) {
        return next();
      }

      // User has a fallback role (admin/designer)
      const userLevel = ROLE_HIERARCHY[user.role] ?? -1;
      const hasRoleFallback = fallbackRoles.some(
        (role) => userLevel >= ROLE_HIERARCHY[role]
      );

      if (hasRoleFallback) {
        return next();
      }

      res.status(403).json({
        error: "You do not have permission to access this resource",
        code: "RBAC_NOT_OWNER",
      });
    } catch {
      res.status(500).json({
        error: "Failed to verify resource ownership",
        code: "RBAC_OWNERSHIP_ERROR",
      });
    }
  };
}
