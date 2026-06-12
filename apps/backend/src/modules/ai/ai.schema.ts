import { z } from "zod";

export const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(1000),
    sessionId: z.string().min(1).max(100),
    history: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        }),
      )
      .max(20)
      .optional()
      .default([]),
  }),
});

export const generateProductSchema = z.object({
  body: z.object({
    productName: z.string().min(1).max(200),
    externalLink: z.string().url().optional(),
    /** Optional: if provided the AI will also fill category-specific attributes */
    categoryKey: z.string().max(100).optional(),
  }),
});
