import { z } from "zod";

const bannerBody = z.object({
  type: z.enum(["top_strip", "hero", "promotional"]),
  content: z.string().min(1),
  linkUrl: z.string().url().optional().nullable(),
  linkText: z.string().max(100).optional().nullable(),
  backgroundColour: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .nullable(),
  textColour: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .nullable(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const createBannerSchema = z.object({ body: bannerBody });
export const updateBannerSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: bannerBody.partial(),
});
