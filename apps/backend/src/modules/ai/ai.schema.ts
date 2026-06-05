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
