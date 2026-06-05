import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/role.middleware";
import { validate } from "@/middleware/validate.middleware";
import {
  updateProfileSchema,
  changeRoleSchema,
} from "@/modules/users/users.schema";
import * as c from "@/modules/users/users.controller";

export const usersRouter: ExpressRouter = Router();


usersRouter.use(authMiddleware);

usersRouter.get("/", requireRole("admin"), c.list);
usersRouter.get("/:id", requireRole("admin"), c.getById);
usersRouter.patch("/:id", validate(updateProfileSchema), c.updateProfile);
usersRouter.patch(
  "/:id/role",
  requireRole("super_admin"),
  validate(changeRoleSchema),
  c.changeRole,
);
usersRouter.patch("/:id/toggle", requireRole("admin"), c.toggle);
usersRouter.delete("/:id", requireRole("admin"), c.remove);
