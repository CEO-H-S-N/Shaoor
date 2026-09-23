// Shaoor.org — User Routes & Handlers
// User profile management, role assignment (Designer only), user listing.

import { Router, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validate } from "../middleware/validation";
import { audit } from "../middleware/audit";
import { updateProfileSchema, updateUserRoleSchema } from "../utils/validators";

export const userRoutes = Router();

// ─── GET /api/users/me — Get current user profile ───────────
userRoutes.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        orcidId: true,
        affiliation: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            papers: true,
            reviews: true,
            notifications: { where: { read: false } },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ data: user });
  } catch (err) {
    console.error("Failed to get user profile:", err);
    res.status(500).json({ error: "Failed to retrieve profile" });
  }
});

// ─── PUT /api/users/me — Update current user profile ────────
userRoutes.put(
  "/me",
  authenticate,
  validate(updateProfileSchema, "body"),
  audit("UPDATE_PROFILE", "user"),
  async (req: Request, res: Response) => {
    try {
      const updated = await prisma.user.update({
        where: { id: req.user!.id },
        data: req.body,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          affiliation: true,
          bio: true,
        },
      });

      res.json({ data: updated });
    } catch (err) {
      console.error("Failed to update profile:", err);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
);

// ─── GET /api/users — List all users (Admin+) ───────────────
userRoutes.get(
  "/",
  authenticate,
  requireRole("ADMIN", "DESIGNER"),
  async (req: Request, res: Response) => {
    try {
      const { role, search, page = "1", limit = "20" } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {};
      if (role) where.role = role;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { affiliation: { contains: search, mode: "insensitive" } },
        ];
      }

      // Non-designer admins can't see other admins/designers
      if (req.user!.role === "ADMIN") {
        where.role = "CUSTOMER";
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: parseInt(limit as string),
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            affiliation: true,
            isActive: true,
            createdAt: true,
            _count: { select: { papers: true, reviews: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        data: users,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (err) {
      console.error("Failed to list users:", err);
      res.status(500).json({ error: "Failed to retrieve users" });
    }
  }
);

// ─── PUT /api/users/:id/role — Change user role (Designer only) ──
userRoutes.put(
  "/:id/role",
  authenticate,
  requireRole("DESIGNER"),
  validate(updateUserRoleSchema, "body"),
  audit("CHANGE_ROLE", "user"),
  async (req: Request, res: Response) => {
    try {
      const { userId, role } = req.body;

      // Can't change a designer's role via API
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, email: true },
      });

      if (!targetUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (targetUser.role === "DESIGNER") {
        res.status(403).json({
          error: "Designer roles can only be changed directly in the database",
          code: "DESIGNER_ROLE_PROTECTED",
        });
        return;
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: { id: true, name: true, email: true, role: true },
      });

      // Notify the user about their role change
      await prisma.notification.create({
        data: {
          userId: userId,
          type: "GENERAL",
          title: "Role Updated",
          message: `Your account role has been updated to ${role}.`,
          metadata: { newRole: role },
        },
      });

      res.json({ data: updated, message: `User role updated to ${role}` });
    } catch (err) {
      console.error("Failed to update user role:", err);
      res.status(500).json({ error: "Failed to update user role" });
    }
  }
);

// ─── PUT /api/users/:id/status — Activate/deactivate user (Designer only) ──
userRoutes.put(
  "/:id/status",
  authenticate,
  requireRole("DESIGNER"),
  audit("CHANGE_STATUS", "user"),
  async (req: Request, res: Response) => {
    try {
      const { isActive } = req.body;
      const targetUser = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: { role: true },
      });

      if (!targetUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (targetUser.role === "DESIGNER") {
        res.status(403).json({
          error: "Cannot deactivate a designer account",
          code: "DESIGNER_PROTECTED",
        });
        return;
      }

      const updated = await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive: !!isActive },
        select: { id: true, name: true, email: true, isActive: true },
      });

      res.json({ data: updated });
    } catch (err) {
      console.error("Failed to update user status:", err);
      res.status(500).json({ error: "Failed to update user status" });
    }
  }
);
