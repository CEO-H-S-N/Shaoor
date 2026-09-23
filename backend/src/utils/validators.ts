// Shaoor.org — Zod Validation Schemas
// Centralized input validation for all API endpoints.
// Used in validation middleware to prevent injection and malformed data.

import { z } from "zod";

// ─── Common Schemas ──────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const idParamSchema = z.object({
  id: z.string().cuid(),
});

// ─── Paper Schemas ───────────────────────────────────────────

export const createPaperSchema = z.object({
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(300, "Title must not exceed 300 characters")
    .trim(),
  abstract: z
    .string()
    .min(100, "Abstract must be at least 100 characters")
    .max(5000, "Abstract must not exceed 5000 characters")
    .trim(),
  categoryId: z.string().cuid().optional(),
  keywords: z
    .array(z.string().min(2).max(50).trim())
    .min(1, "At least one keyword is required")
    .max(10, "Maximum 10 keywords allowed"),
});

export const updatePaperSchema = createPaperSchema.partial();

export const submitPaperSchema = z.object({
  id: z.string().cuid(),
});

export const paperFilterSchema = paginationSchema.extend({
  status: z
    .enum([
      "DRAFT",
      "SUBMITTED",
      "UNDER_REVIEW",
      "REVISION_REQUESTED",
      "ACCEPTED",
      "PUBLISHED",
      "REJECTED",
    ])
    .optional(),
  categoryId: z.string().cuid().optional(),
  authorId: z.string().cuid().optional(),
  search: z.string().max(200).optional(),
});

// ─── Review Schemas ──────────────────────────────────────────

export const createReviewSchema = z.object({
  paperId: z.string().cuid(),
  comments: z
    .string()
    .min(20, "Review comments must be at least 20 characters")
    .max(10000, "Review comments must not exceed 10000 characters")
    .trim(),
  privateNotes: z.string().max(5000).optional(),
  decision: z.enum(["ACCEPT", "REJECT", "REVISE"]),
  score: z.number().int().min(1).max(10),
});

export const assignReviewerSchema = z.object({
  paperId: z.string().cuid(),
  reviewerId: z.string().cuid(),
});

// ─── User Schemas ────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  affiliation: z.string().max(200).trim().optional(),
  bio: z.string().max(2000).trim().optional(),
});

export const updateUserRoleSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(["CUSTOMER", "ADMIN"]),
  // Note: DESIGNER role cannot be assigned through the API — only via DB seed
});

// ─── Category Schemas ────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name must not exceed 100 characters")
    .trim(),
  description: z.string().max(500).trim().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex color")
    .optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// ─── Notification Schemas ────────────────────────────────────

export const markNotificationsReadSchema = z.object({
  ids: z.array(z.string().cuid()).min(1).max(100),
});

// ─── Validation Types ────────────────────────────────────────

export type CreatePaperInput = z.infer<typeof createPaperSchema>;
export type UpdatePaperInput = z.infer<typeof updatePaperSchema>;
export type PaperFilterInput = z.infer<typeof paperFilterSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type AssignReviewerInput = z.infer<typeof assignReviewerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
