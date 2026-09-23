// Shaoor.org — Notification Routes & Handlers
// In-app notification system for paper status updates, review assignments, etc.

import { Router, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { markNotificationsReadSchema } from "../utils/validators";

export const notificationRoutes = Router();

// ─── GET /api/notifications — Get current user's notifications ──
notificationRoutes.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "20", unreadOnly = "false" } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { userId: req.user!.id };
    if (unreadOnly === "true") where.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: req.user!.id, read: false },
      }),
    ]);

    res.json({
      data: notifications,
      unreadCount,
      pagination: {
        page: parseInt(page as string),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    console.error("Failed to list notifications:", err);
    res.status(500).json({ error: "Failed to retrieve notifications" });
  }
});

// ─── PUT /api/notifications/read — Mark notifications as read ──
notificationRoutes.put(
  "/read",
  authenticate,
  validate(markNotificationsReadSchema, "body"),
  async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;

      // Only mark the user's own notifications
      await prisma.notification.updateMany({
        where: {
          id: { in: ids },
          userId: req.user!.id,
        },
        data: { read: true },
      });

      res.json({ message: "Notifications marked as read" });
    } catch (err) {
      console.error("Failed to mark notifications:", err);
      res.status(500).json({ error: "Failed to update notifications" });
    }
  }
);

// ─── PUT /api/notifications/read-all — Mark all as read ──
notificationRoutes.put(
  "/read-all",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user!.id, read: false },
        data: { read: true },
      });

      res.json({ message: "All notifications marked as read" });
    } catch (err) {
      console.error("Failed to mark all notifications:", err);
      res.status(500).json({ error: "Failed to update notifications" });
    }
  }
);
