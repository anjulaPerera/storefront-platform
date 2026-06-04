import { z } from "zod";

const categoryBody = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  parentId: z.string().uuid().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const createCategorySchema = z.object({ body: categoryBody });

export const updateCategorySchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: categoryBody.partial(),
});
