// Shaoor.org — Paper Routes & Handlers
// Full CRUD + submission workflow for academic papers.

import { Router, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { authenticate, optionalAuth } from "../middleware/auth";
import { requireRole, requireOwnerOrRole } from "../middleware/rbac";
import { validate } from "../middleware/validation";
import { audit } from "../middleware/audit";
import { submitRateLimiter } from "../middleware/rate-limiter";
import {
  createPaperSchema,
  updatePaperSchema,
  paperFilterSchema,
  idParamSchema,
} from "../utils/validators";

export const paperRoutes = Router();

// ─── GET /api/papers — List papers (public: published only, auth: filtered) ──
paperRoutes.get(
  "/",
  optionalAuth,
  validate(paperFilterSchema, "query"),
  async (req: Request, res: Response) => {
    try {
      const { page, limit, sortBy, sortOrder, status, categoryId, authorId, search } =
        req.query as any;

      const skip = (page - 1) * limit;

      // Build where clause based on role
      const where: any = {};

      if (!req.user) {
        // Public: only published papers
        where.status = "PUBLISHED";
      } else if (req.user.role === "CUSTOMER") {
        // Customer: own papers + published
        if (authorId && authorId === req.user.id) {
          // Viewing own papers — show all statuses
        } else {
          where.status = "PUBLISHED";
        }
      } else {
        // Admin/Designer: can filter by any status
        if (status) where.status = status;
      }

      if (categoryId) where.categoryId = categoryId;
      if (authorId) where.authorId = authorId;

      // Full-text search on title and abstract
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { abstract: { contains: search, mode: "insensitive" } },
          { keywords: { has: search } },
        ];
      }

      const [papers, total] = await Promise.all([
        prisma.paper.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy || "createdAt"]: sortOrder },
          include: {
            author: {
              select: { id: true, name: true, image: true, affiliation: true },
            },
            category: {
              select: { id: true, name: true, slug: true, color: true },
            },
            _count: { select: { reviews: true } },
          },
        }),
        prisma.paper.count({ where }),
      ]);

      // For public/customer view: strip private fields
      const sanitizedPapers = papers.map((paper) => {
        if (!req.user || req.user.role === "CUSTOMER") {
          // Don't expose review count to non-admin users
          const { _count, ...rest } = paper;
          return rest;
        }
        return paper;
      });

      res.json({
        data: sanitizedPapers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      console.error("Failed to list papers:", err);
      res.status(500).json({ error: "Failed to retrieve papers" });
    }
  }
);

// ─── GET /api/papers/:id — Get single paper ─────────────────
paperRoutes.get(
  "/:id",
  optionalAuth,
  validate(idParamSchema, "params"),
  async (req: Request, res: Response) => {
    try {
      const paper = await prisma.paper.findUnique({
        where: { id: req.params.id },
        include: {
          author: {
            select: { id: true, name: true, image: true, affiliation: true, orcidId: true },
          },
          category: {
            select: { id: true, name: true, slug: true, color: true },
          },
          versions: {
            orderBy: { versionNumber: "desc" },
            select: { id: true, versionNumber: true, changeNotes: true, createdAt: true },
          },
          reviews: req.user && (req.user.role === "ADMIN" || req.user.role === "DESIGNER")
            ? {
                include: {
                  reviewer: { select: { id: true, name: true, image: true } },
                },
              }
            : false,
        },
      });

      if (!paper) {
        res.status(404).json({ error: "Paper not found" });
        return;
      }

      // Access control
      if (paper.status !== "PUBLISHED") {
        if (!req.user) {
          res.status(404).json({ error: "Paper not found" });
          return;
        }
        if (
          req.user.role === "CUSTOMER" &&
          paper.authorId !== req.user.id
        ) {
          res.status(404).json({ error: "Paper not found" });
          return;
        }
      }

      res.json({ data: paper });
    } catch (err) {
      console.error("Failed to get paper:", err);
      res.status(500).json({ error: "Failed to retrieve paper" });
    }
  }
);

// ─── POST /api/papers — Create a new paper (draft) ──────────
paperRoutes.post(
  "/",
  authenticate,
  validate(createPaperSchema, "body"),
  audit("CREATE", "paper"),
  async (req: Request, res: Response) => {
    try {
      const paper = await prisma.paper.create({
        data: {
          ...req.body,
          authorId: req.user!.id,
          status: "DRAFT",
        },
        include: {
          category: { select: { id: true, name: true, slug: true, color: true } },
        },
      });

      res.status(201).json({ data: paper });
    } catch (err) {
      console.error("Failed to create paper:", err);
      res.status(500).json({ error: "Failed to create paper" });
    }
  }
);

// ─── PUT /api/papers/:id — Update paper (author only, draft/revision) ──
paperRoutes.put(
  "/:id",
  authenticate,
  validate(idParamSchema, "params"),
  validate(updatePaperSchema, "body"),
  requireOwnerOrRole(
    async (req) => {
      const paper = await prisma.paper.findUnique({
        where: { id: req.params.id },
        select: { authorId: true },
      });
      return paper?.authorId || "";
    },
    "ADMIN",
    "DESIGNER"
  ),
  audit("UPDATE", "paper"),
  async (req: Request, res: Response) => {
    try {
      const paper = await prisma.paper.findUnique({
        where: { id: req.params.id },
        select: { status: true, authorId: true },
      });

      if (!paper) {
        res.status(404).json({ error: "Paper not found" });
        return;
      }

      // Only allow editing draft or revision-requested papers
      if (!["DRAFT", "REVISION_REQUESTED"].includes(paper.status)) {
        if (req.user!.role === "CUSTOMER") {
          res.status(403).json({
            error: "Cannot edit a paper that has been submitted for review",
            code: "PAPER_NOT_EDITABLE",
          });
          return;
        }
      }

      const updated = await prisma.paper.update({
        where: { id: req.params.id },
        data: req.body,
        include: {
          category: { select: { id: true, name: true, slug: true, color: true } },
        },
      });

      res.json({ data: updated });
    } catch (err) {
      console.error("Failed to update paper:", err);
      res.status(500).json({ error: "Failed to update paper" });
    }
  }
);

// ─── POST /api/papers/:id/submit — Submit paper for review ──
paperRoutes.post(
  "/:id/submit",
  authenticate,
  submitRateLimiter,
  validate(idParamSchema, "params"),
  audit("SUBMIT", "paper"),
  async (req: Request, res: Response) => {
    try {
      const paper = await prisma.paper.findUnique({
        where: { id: req.params.id },
        select: { status: true, authorId: true, fileUrl: true },
      });

      if (!paper) {
        res.status(404).json({ error: "Paper not found" });
        return;
      }

      if (paper.authorId !== req.user!.id) {
        res.status(403).json({ error: "Only the author can submit a paper" });
        return;
      }

      if (!["DRAFT", "REVISION_REQUESTED"].includes(paper.status)) {
        res.status(400).json({
          error: "Paper cannot be submitted in its current state",
          code: "PAPER_INVALID_STATE",
          currentStatus: paper.status,
        });
        return;
      }

      if (!paper.fileUrl) {
        res.status(400).json({
          error: "Please upload a paper file before submitting",
          code: "PAPER_NO_FILE",
        });
        return;
      }

      const updated = await prisma.paper.update({
        where: { id: req.params.id },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });

      // Create notification for admins
      const admins = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "DESIGNER"] }, isActive: true },
        select: { id: true },
      });

      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: "PAPER_SUBMITTED",
            title: "New Paper Submission",
            message: `A new paper "${updated.title}" has been submitted for review.`,
            metadata: { paperId: updated.id },
          })),
        });
      }

      res.json({ data: updated, message: "Paper submitted for review" });
    } catch (err) {
      console.error("Failed to submit paper:", err);
      res.status(500).json({ error: "Failed to submit paper" });
    }
  }
);

// ─── POST /api/papers/:id/decision — Admin decision (accept/reject/revise) ──
paperRoutes.post(
  "/:id/decision",
  authenticate,
  requireRole("ADMIN", "DESIGNER"),
  validate(idParamSchema, "params"),
  audit("DECISION", "paper"),
  async (req: Request, res: Response) => {
    try {
      const { decision, reason } = req.body;

      if (!["ACCEPTED", "REJECTED", "REVISION_REQUESTED"].includes(decision)) {
        res.status(400).json({ error: "Invalid decision" });
        return;
      }

      const paper = await prisma.paper.findUnique({
        where: { id: req.params.id },
        select: { status: true, authorId: true, title: true },
      });

      if (!paper) {
        res.status(404).json({ error: "Paper not found" });
        return;
      }

      if (!["SUBMITTED", "UNDER_REVIEW"].includes(paper.status)) {
        res.status(400).json({
          error: "Paper is not in a reviewable state",
          code: "PAPER_NOT_REVIEWABLE",
        });
        return;
      }

      const statusMap: Record<string, string> = {
        ACCEPTED: "ACCEPTED",
        REJECTED: "REJECTED",
        REVISION_REQUESTED: "REVISION_REQUESTED",
      };

      const notificationTypeMap: Record<string, string> = {
        ACCEPTED: "PAPER_ACCEPTED",
        REJECTED: "PAPER_REJECTED",
        REVISION_REQUESTED: "REVISION_REQUESTED",
      };

      const updated = await prisma.paper.update({
        where: { id: req.params.id },
        data: {
          status: statusMap[decision] as any,
          ...(decision === "ACCEPTED" ? { publishedAt: new Date() } : {}),
        },
      });

      // Notify the author
      await prisma.notification.create({
        data: {
          userId: paper.authorId,
          type: notificationTypeMap[decision] as any,
          title: `Paper ${decision.toLowerCase().replace("_", " ")}`,
          message: reason || `Your paper "${paper.title}" has been ${decision.toLowerCase().replace("_", " ")}.`,
          metadata: { paperId: updated.id, decision },
        },
      });

      res.json({ data: updated, message: `Paper ${decision.toLowerCase()}` });
    } catch (err) {
      console.error("Failed to process decision:", err);
      res.status(500).json({ error: "Failed to process decision" });
    }
  }
);

// ─── POST /api/papers/:id/publish — Publish an accepted paper ──
paperRoutes.post(
  "/:id/publish",
  authenticate,
  requireRole("ADMIN", "DESIGNER"),
  validate(idParamSchema, "params"),
  audit("PUBLISH", "paper"),
  async (req: Request, res: Response) => {
    try {
      const paper = await prisma.paper.findUnique({
        where: { id: req.params.id },
        select: { status: true, title: true, authorId: true },
      });

      if (!paper) {
        res.status(404).json({ error: "Paper not found" });
        return;
      }

      if (paper.status !== "ACCEPTED") {
        res.status(400).json({
          error: "Only accepted papers can be published",
          code: "PAPER_NOT_ACCEPTED",
        });
        return;
      }

      const updated = await prisma.paper.update({
        where: { id: req.params.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      });

      // Notify the author
      await prisma.notification.create({
        data: {
          userId: paper.authorId,
          type: "PAPER_PUBLISHED",
          title: "Paper Published! 🎉",
          message: `Your paper "${paper.title}" has been published and is now publicly accessible.`,
          metadata: { paperId: updated.id },
        },
      });

      res.json({ data: updated, message: "Paper published successfully" });
    } catch (err) {
      console.error("Failed to publish paper:", err);
      res.status(500).json({ error: "Failed to publish paper" });
    }
  }
);

// ─── DELETE /api/papers/:id — Delete paper (author draft only, or admin) ──
paperRoutes.delete(
  "/:id",
  authenticate,
  validate(idParamSchema, "params"),
  audit("DELETE", "paper"),
  async (req: Request, res: Response) => {
    try {
      const paper = await prisma.paper.findUnique({
        where: { id: req.params.id },
        select: { status: true, authorId: true },
      });

      if (!paper) {
        res.status(404).json({ error: "Paper not found" });
        return;
      }

      // Customer can only delete their own drafts
      if (req.user!.role === "CUSTOMER") {
        if (paper.authorId !== req.user!.id) {
          res.status(403).json({ error: "Cannot delete another author's paper" });
          return;
        }
        if (paper.status !== "DRAFT") {
          res.status(403).json({
            error: "Only draft papers can be deleted",
            code: "PAPER_NOT_DRAFT",
          });
          return;
        }
      }

      // Admin can delete submitted/rejected, Designer can delete anything
      if (req.user!.role === "ADMIN" && paper.status === "PUBLISHED") {
        res.status(403).json({ error: "Only designers can delete published papers" });
        return;
      }

      await prisma.paper.delete({ where: { id: req.params.id } });

      res.json({ message: "Paper deleted successfully" });
    } catch (err) {
      console.error("Failed to delete paper:", err);
      res.status(500).json({ error: "Failed to delete paper" });
    }
  }
);
