// Shaoor.org — Category Routes & Handlers
// CRUD for paper categories (Designer-configurable).

import { Router, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { authenticate, optionalAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validate } from "../middleware/validation";
import { audit } from "../middleware/audit";
import { createCategorySchema, updateCategorySchema, idParamSchema } from "../utils/validators";

export const categoryRoutes = Router();

// ─── GET /api/categories — List all active categories (public) ──
categoryRoutes.get("/", optionalAuth, async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { papers: { where: { status: "PUBLISHED" } } },
        },
      },
    });

    res.json({ data: categories });
  } catch (err) {
    console.error("Failed to list categories:", err);
    res.status(500).json({ error: "Failed to retrieve categories" });
  }
});

// ─── POST /api/categories — Create category (Designer only) ──
categoryRoutes.post(
  "/",
  authenticate,
  requireRole("DESIGNER"),
  validate(createCategorySchema, "body"),
  audit("CREATE", "category"),
  async (req: Request, res: Response) => {
    try {
      const slug = req.body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const category = await prisma.category.create({
        data: { ...req.body, slug },
      });

      res.status(201).json({ data: category });
    } catch (err: any) {
      if (err.code === "P2002") {
        res.status(409).json({
          error: "A category with this name already exists",
          code: "DUPLICATE_CATEGORY",
        });
        return;
      }
      console.error("Failed to create category:", err);
      res.status(500).json({ error: "Failed to create category" });
    }
  }
);

// ─── PUT /api/categories/:id — Update category (Designer only) ──
categoryRoutes.put(
  "/:id",
  authenticate,
  requireRole("DESIGNER"),
  validate(idParamSchema, "params"),
  validate(updateCategorySchema, "body"),
  audit("UPDATE", "category"),
  async (req: Request, res: Response) => {
    try {
      const data: any = { ...req.body };
      if (data.name) {
        data.slug = data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }

      const category = await prisma.category.update({
        where: { id: req.params.id },
        data,
      });

      res.json({ data: category });
    } catch (err: any) {
      if (err.code === "P2025") {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      console.error("Failed to update category:", err);
      res.status(500).json({ error: "Failed to update category" });
    }
  }
);

// ─── DELETE /api/categories/:id — Soft delete category (Designer only) ──
categoryRoutes.delete(
  "/:id",
  authenticate,
  requireRole("DESIGNER"),
  validate(idParamSchema, "params"),
  audit("DELETE", "category"),
  async (req: Request, res: Response) => {
    try {
      // Soft delete: deactivate instead of removing
      const category = await prisma.category.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });

      res.json({ data: category, message: "Category deactivated" });
    } catch (err: any) {
      if (err.code === "P2025") {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      console.error("Failed to delete category:", err);
      res.status(500).json({ error: "Failed to delete category" });
    }
  }
);
