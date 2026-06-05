import { pool } from "@/config/db";
import { uniqueSlug } from "@/utils/slug.utils";
import { createError } from "@/middleware/error.middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  children?: Category[];
}

function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: row.description as string | null,
    parentId: row.parent_id as string | null,
    imageUrl: row.image_url as string | null,
    sortOrder: row.sort_order as number,
    isActive: row.is_active as boolean,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function listCategories(activeOnly = true): Promise<Category[]> {
  const where = activeOnly ? "WHERE is_active = true" : "";
  const { rows } = await pool.query(
    `SELECT * FROM categories ${where} ORDER BY sort_order, name`,
  );

  // Build tree in memory
  const map = new Map<string, Category>();
  for (const row of rows) {
    map.set(row.id as string, {
      ...mapCategory(row as Record<string, unknown>),
      children: [],
    });
  }

  const roots: Category[] = [];
  for (const [, cat] of map) {
    if (cat.parentId) {
      map.get(cat.parentId)?.children?.push(cat);
    } else {
      roots.push(cat);
    }
  }
  return roots;
}

export async function getCategoryBySlug(slug: string): Promise<Category> {
  const { rows } = await pool.query(
    "SELECT * FROM categories WHERE slug = $1",
    [slug],
  );
  if (rows.length === 0)
    throw createError("Category not found", 404, "NOT_FOUND");
  return mapCategory(rows[0] as Record<string, unknown>);
}

export async function createCategory(data: {
  name: string;
  description?: string;
  parentId?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
}): Promise<Category> {
  const slug = await uniqueSlug("categories", data.name);

  const { rows } = await pool.query(
    `INSERT INTO categories (name, slug, description, parent_id, image_url, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [
      data.name,
      slug,
      data.description ?? null,
      data.parentId ?? null,
      data.imageUrl ?? null,
      data.sortOrder ?? 0,
    ],
  );
  return mapCategory(rows[0] as Record<string, unknown>);
}

export async function updateCategory(
  id: string,
  data: Partial<{
    name: string;
    description: string | null;
    parentId: string | null;
    imageUrl: string | null;
    sortOrder: number;
    isActive: boolean;
  }>,
): Promise<Category> {
  const { rows: existing } = await pool.query(
    "SELECT * FROM categories WHERE id = $1",
    [id],
  );
  if (existing.length === 0)
    throw createError("Category not found", 404, "NOT_FOUND");

  const slug = data.name
    ? await uniqueSlug("categories", data.name, id)
    : ((existing[0] as Record<string, unknown>).slug as string);

  const { rows } = await pool.query(
    `UPDATE categories
     SET name        = COALESCE($1, name),
         slug        = $2,
         description = COALESCE($3, description),
         parent_id   = COALESCE($4, parent_id),
         image_url   = COALESCE($5, image_url),
         sort_order  = COALESCE($6, sort_order),
         is_active   = COALESCE($7, is_active),
         updated_at  = NOW()
     WHERE id = $8
     RETURNING *`,
    [
      data.name ?? null,
      slug,
      data.description,
      data.parentId,
      data.imageUrl,
      data.sortOrder ?? null,
      data.isActive ?? null,
      id,
    ],
  );
  return mapCategory(rows[0] as Record<string, unknown>);
}

export async function deleteCategory(id: string): Promise<void> {
  const { rows } = await pool.query(
    "SELECT id FROM products WHERE category_id = $1 AND is_active = true LIMIT 1",
    [id],
  );
  if (rows.length > 0) {
    throw createError(
      "Cannot delete category with active products. Deactivate all products first.",
      409,
      "CATEGORY_HAS_PRODUCTS",
    );
  }
  await pool.query("DELETE FROM categories WHERE id = $1", [id]);
}
