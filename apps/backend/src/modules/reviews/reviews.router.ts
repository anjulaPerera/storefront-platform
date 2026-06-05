import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/role.middleware";
import { validate } from "@/middleware/validate.middleware";
import { createReviewSchema } from "@/modules/reviews/reviews.schema";
import * as c from "@/modules/reviews/reviews.controller";

export const reviewsRouter: ExpressRouter = Router();


// Public
reviewsRouter.get("/product/:productId", c.listApproved);

// Customer
reviewsRouter.post("/", authMiddleware, validate(createReviewSchema), c.create);

// Admin
reviewsRouter.get(
  "/pending",
  authMiddleware,
  requireRole("admin"),
  c.listPending,
);
reviewsRouter.patch(
  "/:id/approve",
  authMiddleware,
  requireRole("admin"),
  c.approve,
);
reviewsRouter.delete("/:id", authMiddleware, requireRole("admin"), c.remove);
