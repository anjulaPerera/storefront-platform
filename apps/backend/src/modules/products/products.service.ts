import { pool } from "@/config/db";
import { uniqueSlug } from "@/utils/slug.utils";
import {
  parsePagination,
  buildMeta,
  offset,
  PaginationMeta,
} from "@/utils/pagination.utils";
import { createError } from "@/middleware/error.middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductDiscount {
  id: string;
  type: "percentage" | "fixed_amount";
  value: number;
  label: string | null;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stockQuantity: number;
  sku: string | null;
  brand: string | null;
  attributes: Record<string, unknown>;
  images: string[];
  thumbnail: string | null;
  externalLink: string | null;
  isFeatured: boolean;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined
  categoryName?: string;
  categorySlug?: string;
  activeDiscount?: ProductDiscount;
  discountedPrice?: number;
  averageRating: number;
  reviewCount: number;
}

export interface ProductFilters {
  categorySlug?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: string;
  featured?: boolean;
  inStock?: boolean;
  page: number;
  limit: number;
}

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    categoryId: row.category_id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: row.description as string | null,
    price: parseFloat(String(row.price)),
    stockQuantity: row.stock_quantity as number,
    sku: row.sku as string | null,
    brand: row.brand as string | null,
    attributes: (row.attributes ?? {}) as Record<string, unknown>,
    images: (row.images ?? []) as string[],
    thumbnail: row.thumbnail as string | null,
    externalLink: row.external_link as string | null,
    isFeatured: row.is_featured as boolean,
    isActive: row.is_active as boolean,
    metaTitle: row.meta_title as string | null,
    metaDescription: row.meta_description as string | null,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
    categoryName: row.category_name as string | undefined,
    categorySlug: row.category_slug as string | undefined,
    activeDiscount: row.discount_id
      ? {
          id: row.discount_id as string,
          type: row.discount_type as "percentage" | "fixed_amount",
          value: parseFloat(String(row.discount_value)),
          label: row.discount_label as string | null,
        }
      : undefined,
    discountedPrice: row.discount_id
      ? Math.max(
          0,
          parseFloat(parseFloat(String(row.discounted_price)).toFixed(2)),
        )
      : undefined,
    averageRating: parseFloat(String(row.average_rating ?? 0)),
    reviewCount: parseInt(String(row.review_count ?? 0), 10),
  };
}

// Core JOIN fragment — reused in list and detail queries
const PRODUCT_SELECT = `
  SELECT
    p.*,
    c.name  AS category_name,
    c.slug  AS category_slug,
    d.id    AS discount_id,
    d.type  AS discount_type,
    d.value AS discount_value,
    d.label AS discount_label,
    GREATEST(0,
      CASE
        WHEN d.type = 'percentage'  THEN p.price - (p.price * d.value / 100)
        WHEN d.type = 'fixed_amount' THEN p.price - d.value
        ELSE p.price
      END
    )::NUMERIC(10,2)                      AS discounted_price,
    COALESCE(ROUND(AVG(r.rating), 1), 0)  AS average_rating,
    COUNT(DISTINCT r.id)::INT             AS review_count
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN LATERAL (
    SELECT id, type, value, label
    FROM   discounts
    WHERE  is_active   = true
      AND  starts_at  <= NOW()
      AND  (ends_at IS NULL OR ends_at > NOW())
      AND  (product_id = p.id OR category_id = p.category_id)
    ORDER BY CASE WHEN product_id = p.id THEN 0 ELSE 1 END
    LIMIT 1
  ) d ON true
  LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = true
`;

// ─── Service ──────────────────────────────────────────────────────────────────

export async function listProducts(
  filters: ProductFilters,
): Promise<{ products: Product[]; meta: PaginationMeta }> {
  const conditions: string[] = ["p.is_active = true"];
  const params: unknown[] = [];
  let i = 1;

  if (filters.categorySlug) {
    conditions.push(
      `p.category_id = (SELECT id FROM categories WHERE slug = $${i++} LIMIT 1)`,
    );
    params.push(filters.categorySlug);
  }

  if (filters.brand) {
    conditions.push(`p.brand ILIKE $${i++}`);
    params.push(filters.brand);
  }

  if (filters.minPrice !== undefined) {
    conditions.push(`p.price >= $${i++}`);
    params.push(filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    conditions.push(`p.price <= $${i++}`);
    params.push(filters.maxPrice);
  }

  if (filters.search) {
    conditions.push(`p.search_vector @@ plainto_tsquery('english', $${i++})`);
    params.push(filters.search);
  }

  if (filters.featured) {
    conditions.push("p.is_featured = true");
  }

  if (filters.inStock) {
    conditions.push("p.stock_quantity > 0");
  }

  const WHERE = `WHERE ${conditions.join(" AND ")}`;

  const sortMap: Record<string, string> = {
    newest: "p.created_at DESC",
    oldest: "p.created_at ASC",
    price_asc: "p.price ASC",
    price_desc: "p.price DESC",
    name_asc: "p.name ASC",
  };
  const ORDER = sortMap[filters.sort ?? "newest"] ?? "p.created_at DESC";

  // Count
  const { rows: countRows } = await pool.query(
    `SELECT COUNT(DISTINCT p.id)::INT AS total
     FROM products p ${WHERE}`,
    params,
  );
  const total = (countRows[0] as { total: number }).total;

  // Data
  params.push(filters.limit, offset(filters));

  const { rows } = await pool.query(
    `${PRODUCT_SELECT}
     ${WHERE}
     GROUP BY p.id, c.name, c.slug, d.id, d.type, d.value, d.label
     ORDER BY ${ORDER}
     LIMIT $${i++} OFFSET $${i++}`,
    params,
  );

  return {
    products: rows.map((r) => mapProduct(r as Record<string, unknown>)),
    meta: buildMeta(total, filters),
  };
}

export async function getProductBySlug(slug: string): Promise<Product> {
  const { rows } = await pool.query(
    `${PRODUCT_SELECT}
     WHERE p.slug = $1 AND p.is_active = true
     GROUP BY p.id, c.name, c.slug, d.id, d.type, d.value, d.label`,
    [slug],
  );
  if (rows.length === 0)
    throw createError("Product not found", 404, "NOT_FOUND");
  return mapProduct(rows[0] as Record<string, unknown>);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const { rows } = await pool.query(
    `${PRODUCT_SELECT}
     WHERE p.is_active = true AND p.is_featured = true
     GROUP BY p.id, c.name, c.slug, d.id, d.type, d.value, d.label
     ORDER BY p.created_at DESC
     LIMIT $1`,
    [limit],
  );
  return rows.map((r) => mapProduct(r as Record<string, unknown>));
}

export async function searchProducts(
  query: string,
  rawQuery: Record<string, unknown>,
): Promise<{ products: Product[]; meta: PaginationMeta }> {
  const pagination = parsePagination(rawQuery);
  return listProducts({ ...pagination, search: query });
}

export async function createProduct(data: {
  categoryId: string;
  name: string;
  description?: string | null;
  price: number;
  stockQuantity?: number;
  sku?: string | null;
  brand?: string | null;
  attributes?: Record<string, unknown>;
  images?: string[];
  thumbnail?: string | null;
  externalLink?: string | null;
  isFeatured?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
}): Promise<Product> {
  const slug = await uniqueSlug("products", data.name);

  const { rows } = await pool.query(
    `INSERT INTO products
       (category_id, name, slug, description, price, stock_quantity, sku, brand,
        attributes, images, thumbnail, external_link, is_featured, meta_title, meta_description)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING *`,
    [
      data.categoryId,
      data.name,
      slug,
      data.description ?? null,
      data.price,
      data.stockQuantity ?? 0,
      data.sku ?? null,
      data.brand ?? null,
      JSON.stringify(data.attributes ?? {}),
      data.images ?? [],
      data.thumbnail ?? null,
      data.externalLink ?? null,
      data.isFeatured ?? false,
      data.metaTitle ?? null,
      data.metaDescription ?? null,
    ],
  );

  return getProductBySlug((rows[0] as Record<string, unknown>).slug as string);
}

export async function updateProduct(
  id: string,
  data: Partial<Parameters<typeof createProduct>[0]>,
): Promise<Product> {
  const { rows: existing } = await pool.query(
    "SELECT * FROM products WHERE id = $1",
    [id],
  );
  if (existing.length === 0)
    throw createError("Product not found", 404, "NOT_FOUND");

  const curr = existing[0] as Record<string, unknown>;
  const slug = data.name
    ? await uniqueSlug("products", data.name, id)
    : (curr.slug as string);

  const { rows } = await pool.query(
    `UPDATE products SET
       category_id      = COALESCE($1,  category_id),
       name             = COALESCE($2,  name),
       slug             = $3,
       description      = COALESCE($4,  description),
       price            = COALESCE($5,  price),
       stock_quantity   = COALESCE($6,  stock_quantity),
       sku              = COALESCE($7,  sku),
       brand            = COALESCE($8,  brand),
       attributes       = COALESCE($9,  attributes),
       images           = COALESCE($10, images),
       thumbnail        = COALESCE($11, thumbnail),
       external_link    = COALESCE($12, external_link),
       is_featured      = COALESCE($13, is_featured),
       is_active        = COALESCE($14, is_active),
       meta_title       = COALESCE($15, meta_title),
       meta_description = COALESCE($16, meta_description),
       updated_at       = NOW()
     WHERE id = $17
     RETURNING slug`,
    [
      data.categoryId ?? null,
      data.name ?? null,
      slug,
      data.description,
      data.price ?? null,
      data.stockQuantity ?? null,
      data.sku,
      data.brand,
      data.attributes ? JSON.stringify(data.attributes) : null,
      data.images ?? null,
      data.thumbnail,
      data.externalLink,
      data.isFeatured ?? null,
      null,
      data.metaTitle,
      data.metaDescription,
      id,
    ],
  );

  return getProductBySlug((rows[0] as Record<string, unknown>).slug as string);
}

export async function updateStock(id: string, qty: number): Promise<void> {
  const { rowCount } = await pool.query(
    "UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2",
    [qty, id],
  );
  if ((rowCount ?? 0) === 0)
    throw createError("Product not found", 404, "NOT_FOUND");
}

export async function toggleProduct(
  id: string,
): Promise<{ isActive: boolean }> {
  const { rows } = await pool.query(
    `UPDATE products SET is_active = NOT is_active, updated_at = NOW()
     WHERE id = $1 RETURNING is_active`,
    [id],
  );
  if (rows.length === 0)
    throw createError("Product not found", 404, "NOT_FOUND");
  return {
    isActive: (rows[0] as Record<string, unknown>).is_active as boolean,
  };
}

export async function deleteProduct(id: string): Promise<void> {
  await pool.query(
    "UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1",
    [id],
  );
}
