import { pool } from "@/config/db";
import { createError } from "@/middleware/error.middleware";
import { PaginationParams, buildMeta, offset } from "@/utils/pagination.utils";

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  body: string | null;
  isApproved: boolean;
  createdAt: string;
  userFirstName?: string;
  userLastName?: string;
}

function mapReview(row: Record<string, unknown>): Review {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    userId: row.user_id as string,
    rating: row.rating as number,
    title: row.title as string | null,
    body: row.body as string | null,
    isApproved: row.is_approved as boolean,
    createdAt: (row.created_at as Date).toISOString(),
    userFirstName: row.first_name as string | undefined,
    userLastName: row.last_name as string | undefined,
  };
}

export async function listApprovedReviews(
  productId: string,
  pagination: PaginationParams,
): Promise<{ reviews: Review[]; meta: ReturnType<typeof buildMeta> }> {
  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::INT AS total FROM reviews
     WHERE product_id = $1 AND is_approved = true`,
    [productId],
  );
  const total = (countRows[0] as { total: number }).total;

  const { rows } = await pool.query(
    `SELECT r.*, u.first_name, u.last_name
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.product_id = $1 AND r.is_approved = true
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [productId, pagination.limit, offset(pagination)],
  );

  return {
    reviews: rows.map((r) => mapReview(r as Record<string, unknown>)),
    meta: buildMeta(total, pagination),
  };
}

export async function listPendingReviews(): Promise<Review[]> {
  const { rows } = await pool.query(
    `SELECT r.*, u.first_name, u.last_name
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.is_approved = false
     ORDER BY r.created_at ASC`,
  );
  return rows.map((r) => mapReview(r as Record<string, unknown>));
}

export async function createReview(
  userId: string,
  productId: string,
  data: { rating: number; title?: string; body?: string },
): Promise<Review> {
  // Verify product exists
  const { rows: prod } = await pool.query(
    "SELECT id FROM products WHERE id = $1 AND is_active = true",
    [productId],
  );
  if (prod.length === 0)
    throw createError("Product not found", 404, "NOT_FOUND");

  // Check for existing review
  const { rows: existing } = await pool.query(
    "SELECT id FROM reviews WHERE product_id = $1 AND user_id = $2",
    [productId, userId],
  );
  if (existing.length > 0) {
    throw createError(
      "You have already reviewed this product",
      409,
      "ALREADY_REVIEWED",
    );
  }

  const { rows } = await pool.query(
    `INSERT INTO reviews (product_id, user_id, rating, title, body)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [productId, userId, data.rating, data.title ?? null, data.body ?? null],
  );

  return mapReview(rows[0] as Record<string, unknown>);
}

export async function approveReview(id: string): Promise<Review> {
  const { rows } = await pool.query(
    `UPDATE reviews SET is_approved = true WHERE id = $1 RETURNING *`,
    [id],
  );
  if (rows.length === 0)
    throw createError("Review not found", 404, "NOT_FOUND");
  return mapReview(rows[0] as Record<string, unknown>);
}

export async function deleteReview(id: string): Promise<void> {
  const { rowCount } = await pool.query("DELETE FROM reviews WHERE id = $1", [
    id,
  ]);
  if ((rowCount ?? 0) === 0)
    throw createError("Review not found", 404, "NOT_FOUND");
}
