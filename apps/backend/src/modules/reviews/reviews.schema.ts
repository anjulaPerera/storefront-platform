import { z } from "zod";

export const createReviewSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    title: z.string().max(200).optional(),
    body: z.string().max(2000).optional(),
  }),
});

export const approveReviewSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
