import { Router } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/role.middleware";
import { validate } from "@/middleware/validate.middleware";
import {
  createBannerSchema,
  updateBannerSchema,
} from "@/modules/banners/banners.schema";
import * as c from "@/modules/banners/banners.controller";

export const bannersRouter = Router();

bannersRouter.get("/", c.listActive);
bannersRouter.get("/all", authMiddleware, requireRole("admin"), c.listAll);
bannersRouter.post(
  "/",
  authMiddleware,
  requireRole("admin"),
  validate(createBannerSchema),
  c.create,
);
bannersRouter.put(
  "/:id",
  authMiddleware,
  requireRole("admin"),
  validate(updateBannerSchema),
  c.update,
);
bannersRouter.delete("/:id", authMiddleware, requireRole("admin"), c.remove);
