import { z } from "zod";

const discountBody = z.object({
  productId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  type: z.enum(["percentage", "fixed_amount"]),
  value: z.number().positive(),
  label: z.string().max(100).optional().nullable(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const createDiscountSchema = z.object({ body: discountBody });
export const updateDiscountSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: discountBody.partial(),
});
