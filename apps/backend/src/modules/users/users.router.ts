import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/role.middleware";
import { validate } from "@/middleware/validate.middleware";
import {
  updateProfileSchema,
  changeRoleSchema,
  createAdminSchema,
} from "@/modules/users/users.schema";
import * as c from "@/modules/users/users.controller";

export const usersRouter: ExpressRouter = Router();

// All user routes require authentication
usersRouter.use(authMiddleware);

// ─── Super Admin only ─────────────────────────────────────────────────────────

/**
 * POST /users
 * Create a new admin or customer account.
 * super_admin only — schema blocks super_admin role assignment.
 */
usersRouter.post(
  "/",
  requireRole("super_admin"),
  validate(createAdminSchema),
  c.createAdmin,
);

/**
 * GET /users/audit-logs
 * View full audit log history.
 * super_admin only.
 * NOTE: This route must be declared BEFORE /:id to avoid "audit-logs" being
 * treated as a UUID param.
 */
usersRouter.get("/audit-logs", requireRole("super_admin"), c.listAuditLogs);

/**
 * PATCH /users/:id/role
 * Change any user's role (customer ↔ admin only, not super_admin).
 * super_admin only.
 */
usersRouter.patch(
  "/:id/role",
  requireRole("super_admin"),
  validate(changeRoleSchema),
  c.changeRole,
);

// ─── Admin + Super Admin ──────────────────────────────────────────────────────

/**
 * GET /users
 * List all users with optional role filter.
 * admin+ can view the list; service returns all roles.
 */
usersRouter.get("/", requireRole("admin"), c.list);

/**
 * GET /users/:id
 * Get user by ID.
 */
usersRouter.get("/:id", requireRole("admin"), c.getById);

/**
 * PATCH /users/:id/toggle
 * Toggle is_active.
 * admin can call but service blocks toggling admin/super_admin accounts.
 * super_admin can toggle anyone (except themselves).
 */
usersRouter.patch("/:id/toggle", requireRole("admin"), c.toggle);

/**
 * DELETE /users/:id
 * Delete a user.
 * admin can call but service blocks deleting admin/super_admin accounts.
 * super_admin can delete anyone (except themselves).
 */
usersRouter.delete("/:id", requireRole("admin"), c.remove);

// ─── Authenticated user (self) ────────────────────────────────────────────────

/**
 * PATCH /users/:id
 * Update own profile (first/last name).
 * Customers can only update themselves; admins can update anyone.
 */
usersRouter.patch("/:id", validate(updateProfileSchema), c.updateProfile);
