import { z } from "zod";

export const updateProfileSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
  }),
});

/**
 * Role change: super_admin cannot be assigned via the API.
 * Super Admin accounts are created only through seeds/migrations.
 */
export const changeRoleSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    role: z.enum(["customer", "admin"], {
      errorMap: () => ({
        message:
          "Role must be 'customer' or 'admin'. Super Admin cannot be assigned via API.",
      }),
    }),
  }),
});

/**
 * Create a new admin (or customer) account.
 * Called by super_admin only. super_admin role is intentionally excluded.
 */
export const createAdminSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    role: z.enum(["customer", "admin"], {
      errorMap: () => ({
        message: "Role must be 'customer' or 'admin'.",
      }),
    }),
  }),
});
