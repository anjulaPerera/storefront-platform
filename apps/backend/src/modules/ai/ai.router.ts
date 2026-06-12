import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/role.middleware";
import { validate } from "@/middleware/validate.middleware";
import { chatSchema, generateProductSchema } from "@/modules/ai/ai.schema";
import * as c from "@/modules/ai/ai.controller";

export const aiRouter: ExpressRouter = Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many messages. Please slow down.",
    },
  },
});

// Stricter limiter for the generation endpoint (costs more tokens)
const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many generation requests. Please wait a moment.",
    },
  },
});

aiRouter.post("/chat", aiLimiter, validate(chatSchema), c.chat);
aiRouter.get("/history/:sessionId", c.getHistory);

// Admin-only: generate product description using Gemini + web search
aiRouter.post(
  "/generate-product",
  authMiddleware,
  requireRole("admin"),
  generateLimiter,
  validate(generateProductSchema),
  c.generateProduct,
);
