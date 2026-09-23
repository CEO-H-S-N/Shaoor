// Shaoor.org — Review Routes & Handlers
// Manages the peer review workflow: assignment, submission, listing.

import { Router, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validate } from "../middleware/validation";
import { audit } from "../middleware/audit";
import { createReviewSchema, assignReviewerSchema, idParamSchema } from "../utils/validators";

export const reviewRoutes = Router();

// ─── GET /api/reviews — List reviews (Admin: all assigned, Reviewer: own) ──
reviewRoutes.get(
  "/",
  authenticate,
  requireRole("ADMIN", "DESIGNER"),
  async (req: Request, res: Response) => {
    try {
      const { paperId, reviewerId, isComplete } = req.query;

      const where: any = {};
      if (paperId) where.paperId = paperId;
      if (reviewerId) where.reviewerId = reviewerId;
      if (isComplete !== undefined) where.isComplete = isComplete === "true";

      // Non-designer admins only see their own reviews
      if (req.user!.role === "ADMIN") {
        where.reviewerId = req.user!.id;
      }

      const reviews = await prisma.review.findMany({
        where,
        include: {
          paper: {
            select: { id: true, title: true, status: true, abstract: true },
          },
          reviewer: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({ data: reviews });
    } catch (err) {
      console.error("Failed to list reviews:", err);
      res.status(500).json({ error: "Failed to retrieve reviews" });
    }
  }
);

// ─── GET /api/reviews/my — Get current user's review assignments ──
reviewRoutes.get(
  "/my",
  authenticate,
  requireRole("ADMIN", "DESIGNER"),
  async (req: Request, res: Response) => {
    try {
      const reviews = await prisma.review.findMany({
        where: { reviewerId: req.user!.id },
        include: {
          paper: {
            select: {
              id: true,
              title: true,
              abstract: true,
              status: true,
              submittedAt: true,
              author: {
                select: { id: true, name: true, affiliation: true },
              },
              category: {
                select: { name: true, color: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({ data: reviews });
    } catch (err) {
      console.error("Failed to list my reviews:", err);
      res.status(500).json({ error: "Failed to retrieve your reviews" });
    }
  }
);

// ─── POST /api/reviews/assign — Assign a reviewer to a paper (Admin+) ──
reviewRoutes.post(
  "/assign",
  authenticate,
  requireRole("ADMIN", "DESIGNER"),
  validate(assignReviewerSchema, "body"),
  audit("ASSIGN_REVIEWER", "review"),
  async (req: Request, res: Response) => {
    try {
      const { paperId, reviewerId } = req.body;

      // Verify paper exists and is in a reviewable state
      const paper = await prisma.paper.findUnique({
        where: { id: paperId },
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

      // Prevent self-review
      if (paper.authorId === reviewerId) {
        res.status(400).json({
          error: "An author cannot review their own paper",
          code: "SELF_REVIEW_FORBIDDEN",
        });
        return;
      }

      // Verify reviewer exists and is admin+
      const reviewer = await prisma.user.findUnique({
        where: { id: reviewerId },
        select: { role: true, name: true },
      });

      if (!reviewer || !["ADMIN", "DESIGNER"].includes(reviewer.role)) {
        res.status(400).json({
          error: "Reviewer must be an admin or designer",
          code: "INVALID_REVIEWER",
        });
        return;
      }

      // Check for duplicate assignment
      const existing = await prisma.review.findUnique({
        where: { paperId_reviewerId: { paperId, reviewerId } },
      });

      if (existing) {
        res.status(409).json({
          error: "This reviewer is already assigned to this paper",
          code: "DUPLICATE_ASSIGNMENT",
        });
        return;
      }

      // Create review assignment and update paper status
      const [review] = await prisma.$transaction([
        prisma.review.create({
          data: { paperId, reviewerId },
          include: {
            reviewer: { select: { id: true, name: true } },
          },
        }),
        prisma.paper.update({
          where: { id: paperId },
          data: { status: "UNDER_REVIEW" },
        }),
      ]);

      // Notify the reviewer
      await prisma.notification.create({
        data: {
          userId: reviewerId,
          type: "REVIEWER_ASSIGNED",
          title: "New Review Assignment",
          message: `You have been assigned to review "${paper.title}".`,
          metadata: { paperId, reviewId: review.id },
        },
      });

      res.status(201).json({ data: review, message: "Reviewer assigned" });
    } catch (err) {
      console.error("Failed to assign reviewer:", err);
      res.status(500).json({ error: "Failed to assign reviewer" });
    }
  }
);

// ─── POST /api/reviews/:id/submit — Submit a completed review ──
reviewRoutes.post(
  "/:id/submit",
  authenticate,
  requireRole("ADMIN", "DESIGNER"),
  validate(idParamSchema, "params"),
  audit("SUBMIT_REVIEW", "review"),
  async (req: Request, res: Response) => {
    try {
      const review = await prisma.review.findUnique({
        where: { id: req.params.id },
        select: { reviewerId: true, isComplete: true, paperId: true },
      });

      if (!review) {
        res.status(404).json({ error: "Review not found" });
        return;
      }

      if (review.reviewerId !== req.user!.id && req.user!.role !== "DESIGNER") {
        res.status(403).json({ error: "You can only submit your own reviews" });
        return;
      }

      if (review.isComplete) {
        res.status(400).json({
          error: "This review has already been submitted",
          code: "REVIEW_ALREADY_COMPLETE",
        });
        return;
      }

      const { comments, privateNotes, decision, score } = req.body;

      const updated = await prisma.review.update({
        where: { id: req.params.id },
        data: {
          comments,
          privateNotes,
          decision,
          score,
          isComplete: true,
        },
        include: {
          paper: { select: { authorId: true, title: true } },
        },
      });

      // Notify the author that a review is complete
      await prisma.notification.create({
        data: {
          userId: updated.paper.authorId,
          type: "REVIEW_COMPLETE",
          title: "Review Completed",
          message: `A review has been completed for your paper "${updated.paper.title}".`,
          metadata: { paperId: updated.paperId },
        },
      });

      res.json({ data: updated, message: "Review submitted" });
    } catch (err) {
      console.error("Failed to submit review:", err);
      res.status(500).json({ error: "Failed to submit review" });
    }
  }
);
