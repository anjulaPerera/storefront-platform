import { pool } from "@/config/db";
import { createError } from "@/middleware/error.middleware";

export interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: {
    name: string;
    slug: string;
    price: number;
    thumbnail: string | null;
    stockQuantity: number;
    discountedPrice?: number;
  };
}

function mapItem(row: Record<string, unknown>): WishlistItem {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    createdAt: (row.created_at as Date).toISOString(),
    product: {
      name: row.product_name as string,
      slug: row.product_slug as string,
      price: parseFloat(String(row.product_price)),
      thumbnail: row.product_thumbnail as string | null,
      stockQuantity: row.stock_quantity as number,
      discountedPrice: row.discounted_price
        ? parseFloat(String(row.discounted_price))
        : undefined,
    },
  };
}

export async function getWishlist(userId: string): Promise<WishlistItem[]> {
  const { rows } = await pool.query(
    `SELECT
       w.*,
       p.name            AS product_name,
       p.slug            AS product_slug,
       p.price           AS product_price,
       p.thumbnail       AS product_thumbnail,
       p.stock_quantity,
       GREATEST(0,
         CASE
           WHEN d.type = 'percentage'   THEN p.price - (p.price * d.value / 100)
           WHEN d.type = 'fixed_amount' THEN p.price - d.value
           ELSE NULL
         END
       )::NUMERIC(10,2) AS discounted_price
     FROM wishlists w
     JOIN products p ON p.id = w.product_id
     LEFT JOIN LATERAL (
       SELECT type, value FROM discounts
       WHERE is_active = true
         AND starts_at <= NOW()
         AND (ends_at IS NULL OR ends_at > NOW())
         AND (product_id = p.id OR category_id = p.category_id)
       ORDER BY CASE WHEN product_id = p.id THEN 0 ELSE 1 END
       LIMIT 1
     ) d ON true
     WHERE w.user_id = $1
     ORDER BY w.created_at DESC`,
    [userId],
  );
  return rows.map((r) => mapItem(r as Record<string, unknown>));
}

export async function addToWishlist(
  userId: string,
  productId: string,
): Promise<WishlistItem> {
  const { rows: prod } = await pool.query(
    "SELECT id FROM products WHERE id = $1 AND is_active = true",
    [productId],
  );
  if (prod.length === 0)
    throw createError("Product not found", 404, "NOT_FOUND");

  const { rows: existing } = await pool.query(
    "SELECT id FROM wishlists WHERE user_id = $1 AND product_id = $2",
    [userId, productId],
  );
  if (existing.length > 0) {
    throw createError(
      "Product already in wishlist",
      409,
      "ALREADY_IN_WISHLIST",
    );
  }

  await pool.query(
    "INSERT INTO wishlists (user_id, product_id) VALUES ($1,$2)",
    [userId, productId],
  );

  const items = await getWishlist(userId);
  const added = items.find((i) => i.productId === productId);
  if (!added)
    throw createError(
      "Wishlist item not found after insert",
      500,
      "INTERNAL_ERROR",
    );
  return added;
}

export async function removeFromWishlist(
  userId: string,
  productId: string,
): Promise<void> {
  const { rowCount } = await pool.query(
    "DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2",
    [userId, productId],
  );
  if ((rowCount ?? 0) === 0) {
    throw createError("Product not in wishlist", 404, "NOT_FOUND");
  }
}
