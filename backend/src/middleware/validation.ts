// Shaoor.org — Validation Middleware
// Wraps Zod schemas into Express middleware for automatic request validation.

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

type ValidationTarget = "body" | "query" | "params";

/**
 * Creates Express middleware that validates the request against a Zod schema.
 *
 * Usage:
 *   router.post("/papers", validate(createPaperSchema, "body"), handler);
 *   router.get("/papers", validate(paperFilterSchema, "query"), handler);
 */
export function validate(schema: ZodSchema, target: ValidationTarget = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[target]);
      // Replace the request data with the validated + transformed data
      req[target] = data;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
          code: e.code,
        }));

        res.status(400).json({
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: errors,
        });
        return;
      }

      res.status(500).json({
        error: "Validation error",
        code: "VALIDATION_INTERNAL_ERROR",
      });
    }
  };
}
