// Shaoor.org — Request Logger Middleware
// Structured logging for all incoming requests.

import { Request, Response, NextFunction } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  // Log on response finish
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logEntry = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers["user-agent"]?.substring(0, 100),
      userId: req.user?.id,
    };

    // Use appropriate log level based on status
    if (res.statusCode >= 500) {
      console.error("[REQUEST]", JSON.stringify(logEntry));
    } else if (res.statusCode >= 400) {
      console.warn("[REQUEST]", JSON.stringify(logEntry));
    } else {
      console.log("[REQUEST]", JSON.stringify(logEntry));
    }
  });

  next();
}
