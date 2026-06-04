import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "@/middleware/error.middleware";
import { authRouter } from "@/modules/auth/auth.router";
import { categoriesRouter } from "@/modules/categories/categories.router";
import { productsRouter } from "@/modules/products/products.router";
import { discountsRouter } from "@/modules/discounts/discounts.router";
import { bannersRouter } from "@/modules/banners/banners.router";

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
  app.use(cookieParser());

  if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
  }

  app.get("/api/v1/health", (_req, res) => {
    res.json({
      success: true,
      message: "Storefront API running",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/categories", categoriesRouter);
  app.use("/api/v1/products", productsRouter);
  app.use("/api/v1/discounts", discountsRouter);
  app.use("/api/v1/banners", bannersRouter);

  app.use(errorMiddleware);
  return app;
}
