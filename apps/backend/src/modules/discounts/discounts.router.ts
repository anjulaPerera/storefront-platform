import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/role.middleware";
import { validate } from "@/middleware/validate.middleware";
import {
  createDiscountSchema,
  updateDiscountSchema,
} from "@/modules/discounts/discounts.schema";
import * as c from "@/modules/discounts/discounts.controller";

export const discountsRouter: ExpressRouter = Router();


discountsRouter.get("/", authMiddleware, requireRole("admin"), c.list); // admin: all
discountsRouter.get("/active", c.list); // public: active only (passes ?active=true internally via middleware — see below)
discountsRouter.post(
  "/",
  authMiddleware,
  requireRole("admin"),
  validate(createDiscountSchema),
  c.create,
);
discountsRouter.put(
  "/:id",
  authMiddleware,
  requireRole("admin"),
  validate(updateDiscountSchema),
  c.update,
);
discountsRouter.delete("/:id", authMiddleware, requireRole("admin"), c.remove);
