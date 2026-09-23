// Shaoor.org — Rate Limiter Middleware
// Uses express-rate-limit for per-IP rate limiting.
// In production, this is supplemented by API Gateway throttling + Upstash Redis.

import rateLimit from "express-rate-limit";

// General API rate limit: 100 requests per 15 minutes per IP
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    error: "Too many requests",
    code: "RATE_LIMIT_EXCEEDED",
    retryAfter: "15 minutes",
  },
  keyGenerator: (req) => {
    // Use X-Forwarded-For for clients behind API Gateway/proxy
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      return forwarded.split(",")[0].trim();
    }
    return req.ip || "unknown";
  },
});

// Stricter rate limit for auth-related routes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts",
    code: "AUTH_RATE_LIMIT_EXCEEDED",
    retryAfter: "15 minutes",
  },
});

// Stricter rate limit for paper submission
export const submitRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Paper submission rate limit exceeded",
    code: "SUBMIT_RATE_LIMIT_EXCEEDED",
    retryAfter: "1 hour",
  },
});

// Very strict limit for file uploads
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Upload rate limit exceeded",
    code: "UPLOAD_RATE_LIMIT_EXCEEDED",
    retryAfter: "1 hour",
  },
});
