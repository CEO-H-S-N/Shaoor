// Shaoor.org — Error Handler Middleware
// Centralized error handling with structured responses.
// Never leaks stack traces or internal details in production.

import { Request, Response, NextFunction } from "express";

interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";

  // Log full error details server-side
  console.error(`[ERROR ${statusCode}]`, {
    message: err.message,
    code: err.code,
    stack: err.stack,
    details: err.details,
  });

  // Sanitized response — never expose internals in production
  res.status(statusCode).json({
    error: statusCode === 500 && isProduction
      ? "Internal server error"
      : err.message,
    code: err.code || "INTERNAL_ERROR",
    ...(isProduction ? {} : { stack: err.stack, details: err.details }),
  });
}

/**
 * Helper to create typed application errors.
 */
export function createError(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: unknown
): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}
