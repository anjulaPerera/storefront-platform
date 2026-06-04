import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "@/middleware/validate.middleware";
import { authMiddleware } from "@/middleware/auth.middleware";
import * as c from "@/modules/auth/auth.controller";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/modules/auth/auth.schema";

export const authRouter: ExpressRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many attempts. Try again in 15 minutes.",
    },
  },
});

authRouter.post("/register", authLimiter, validate(registerSchema), c.register);
authRouter.post("/login", authLimiter, validate(loginSchema), c.login);
authRouter.post("/refresh", c.refresh);
authRouter.post("/logout", authMiddleware, c.logout);
authRouter.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  c.forgotPassword,
);
authRouter.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  c.resetPassword,
);
authRouter.get("/verify-email/:token", c.verifyEmail);
authRouter.get("/me", authMiddleware, c.getMe);
