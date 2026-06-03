import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorMiddleware } from "@/middleware/error.middleware.js";

export function createApp(): Express {
  const app = express();

  // ─── Security & Parsing ───────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
  }

  // ─── Health Check ─────────────────────────────────────────────────
  app.get("/api/v1/health", (_req, res) => {
    res.json({
      success: true,
      message: "Storefront API is running",
      timestamp: new Date().toISOString(),
    });
  });

  // ─── Routes (to be added in Phase 2+) ────────────────────────────
  // app.use('/api/v1/auth', authRouter);

  // ─── Error Handler (must be last) ────────────────────────────────
  app.use(errorMiddleware);

  return app;
}
