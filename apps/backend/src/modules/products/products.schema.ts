import { z } from "zod";

const productBody = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  price: z.number().min(0),
  stockQuantity: z.number().int().min(0).optional(),
  sku: z.string().max(100).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  attributes: z.record(z.unknown()).optional(),
  images: z.array(z.string().url()).optional(),
  thumbnail: z.string().url().optional().nullable(),
  externalLink: z.string().url().optional().nullable(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  metaTitle: z.string().max(160).optional().nullable(),
  metaDescription: z.string().max(320).optional().nullable(),
});

export const createProductSchema = z.object({ body: productBody });

export const updateProductSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: productBody.partial(),
});

export const listProductsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    categorySlug: z.string().optional(),
    brand: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    search: z.string().optional(),
    sort: z
      .enum(["newest", "oldest", "price_asc", "price_desc", "name_asc"])
      .optional(),
    featured: z.string().optional(),
    inStock: z.string().optional(),
  }),
});

export const updateStockSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ stockQuantity: z.number().int().min(0) }),
});
