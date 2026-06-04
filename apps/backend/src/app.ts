import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorMiddleware } from "@/middleware/error.middleware";

export function createApp(): Express {
  const app = express();

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

  app.get("/api/v1/health", (_req, res) => {
    res.json({
      success: true,
      message: "Storefront API is running",
      timestamp: new Date().toISOString(),
    });
  });

  // app.use('/api/v1/auth', authRouter);

  app.use(errorMiddleware);

  return app;
}
