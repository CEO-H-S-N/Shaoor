// Shaoor.org — Express Application (Lambda-ready)
// This is the core Express app, wrapped by Lambda handler for AWS deployment.

import express from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";

import { errorHandler } from "./middleware/error-handler";
import { requestLogger } from "./middleware/request-logger";
import { rateLimiter } from "./middleware/rate-limiter";
import { paperRoutes } from "./handlers/papers";
import { reviewRoutes } from "./handlers/reviews";
import { userRoutes } from "./handlers/users";
import { categoryRoutes } from "./handlers/categories";
import { notificationRoutes } from "./handlers/notifications";

const app = express();

// ─── Security Middleware ─────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:3000"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400, // 24 hours
  })
);

app.use(hpp()); // Protect against HTTP Parameter Pollution
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Request Logging & Rate Limiting ─────────────────────────
app.use(requestLogger);
app.use(rateLimiter);

// ─── Health Check ────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "shaoor-backend",
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || "1.0.0",
  });
});

// ─── API Routes ──────────────────────────────────────────────
app.use("/api/papers", paperRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/notifications", notificationRoutes);

// ─── Honeypot Route (Anti-Scraping) ──────────────────────────
// Any client accessing this route is likely a scraper
app.all("/api/papers/export-all", (req, res) => {
  // Log the IP for monitoring — in production, auto-ban via WAF
  console.warn(`🍯 Honeypot triggered by IP: ${req.ip}, UA: ${req.headers["user-agent"]}`);
  res.status(403).json({ error: "Forbidden" });
});

// ─── 404 Handler ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ─── Global Error Handler ────────────────────────────────────
app.use(errorHandler);

export { app };
