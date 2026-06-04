import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/role.middleware";
import { validate } from "@/middleware/validate.middleware";
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/modules/categories/categories.schema";
import * as c from "@/modules/categories/categories.controller";

export const categoriesRouter: ExpressRouter = Router();


categoriesRouter.get("/", c.list);
categoriesRouter.get("/:slug", c.getBySlug);
categoriesRouter.post(
  "/",
  authMiddleware,
  requireRole("admin"),
  validate(createCategorySchema),
  c.create,
);
categoriesRouter.put(
  "/:id",
  authMiddleware,
  requireRole("admin"),
  validate(updateCategorySchema),
  c.update,
);
categoriesRouter.delete("/:id", authMiddleware, requireRole("admin"), c.remove);
