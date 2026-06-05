import { z } from "zod";

export const createEnquirySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    email: z.string().email(),
    phone: z.string().max(30).optional(),
    message: z.string().min(10).max(2000),
    productId: z.string().uuid().optional(),
  }),
});

export const updateEnquiryStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ status: z.enum(["open", "replied", "closed"]) }),
});
