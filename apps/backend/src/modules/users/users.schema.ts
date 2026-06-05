import { z } from "zod";

export const updateProfileSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
  }),
});

export const changeRoleSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ role: z.enum(["customer", "admin", "super_admin"]) }),
});
