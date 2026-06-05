import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "@/middleware/validate.middleware";
import { chatSchema } from "@/modules/ai/ai.schema";
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

aiRouter.post("/chat", aiLimiter, validate(chatSchema), c.chat);
aiRouter.get("/history/:sessionId", c.getHistory);
