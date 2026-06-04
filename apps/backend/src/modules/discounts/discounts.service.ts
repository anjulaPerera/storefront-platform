import { pool } from "@/config/db";
import { createError } from "@/middleware/error.middleware";

export interface Discount {
  id: string;
  productId: string | null;
  categoryId: string | null;
  type: "percentage" | "fixed_amount";
  value: number;
  label: string | null;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
}

function mapDiscount(row: Record<string, unknown>): Discount {
  return {
    id: row.id as string,
    productId: row.product_id as string | null,
    categoryId: row.category_id as string | null,
    type: row.type as Discount["type"],
    value: parseFloat(String(row.value)),
    label: row.label as string | null,
    startsAt: (row.starts_at as Date).toISOString(),
    endsAt: row.ends_at ? (row.ends_at as Date).toISOString() : null,
    isActive: row.is_active as boolean,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export async function listDiscounts(activeOnly = false): Promise<Discount[]> {
  const where = activeOnly
    ? `WHERE is_active = true AND starts_at <= NOW() AND (ends_at IS NULL OR ends_at > NOW())`
    : "";
  const { rows } = await pool.query(
    `SELECT * FROM discounts ${where} ORDER BY created_at DESC`,
  );
  return rows.map((r) => mapDiscount(r as Record<string, unknown>));
}

export async function createDiscount(data: {
  productId?: string | null;
  categoryId?: string | null;
  type: "percentage" | "fixed_amount";
  value: number;
  label?: string | null;
  startsAt: string;
  endsAt?: string | null;
  isActive?: boolean;
}): Promise<Discount> {
  const { rows } = await pool.query(
    `INSERT INTO discounts
       (product_id, category_id, type, value, label, starts_at, ends_at, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      data.productId ?? null,
      data.categoryId ?? null,
      data.type,
      data.value,
      data.label ?? null,
      data.startsAt,
      data.endsAt ?? null,
      data.isActive ?? true,
    ],
  );
  return mapDiscount(rows[0] as Record<string, unknown>);
}

export async function updateDiscount(
  id: string,
  data: Partial<Parameters<typeof createDiscount>[0]>,
): Promise<Discount> {
  const { rows } = await pool.query(
    `UPDATE discounts SET
       product_id  = COALESCE($1, product_id),
       category_id = COALESCE($2, category_id),
       type        = COALESCE($3, type),
       value       = COALESCE($4, value),
       label       = COALESCE($5, label),
       starts_at   = COALESCE($6, starts_at),
       ends_at     = COALESCE($7, ends_at),
       is_active   = COALESCE($8, is_active)
     WHERE id = $9
     RETURNING *`,
    [
      data.productId,
      data.categoryId,
      data.type ?? null,
      data.value ?? null,
      data.label,
      data.startsAt ?? null,
      data.endsAt,
      data.isActive ?? null,
      id,
    ],
  );
  if (rows.length === 0)
    throw createError("Discount not found", 404, "NOT_FOUND");
  return mapDiscount(rows[0] as Record<string, unknown>);
}

export async function deleteDiscount(id: string): Promise<void> {
  const { rowCount } = await pool.query("DELETE FROM discounts WHERE id = $1", [
    id,
  ]);
  if ((rowCount ?? 0) === 0)
    throw createError("Discount not found", 404, "NOT_FOUND");
}
