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
    activeDiscount?: { label: string | null };
  };
}

// Same LATERAL discount join pattern as products.service.ts
const WISHLIST_SELECT = `
  SELECT
    w.id,
    w.product_id,
    w.created_at,
    p.name,
    p.slug,
    p.price,
    p.thumbnail,
    p.stock_quantity,
    d.id    AS discount_id,
    d.label AS discount_label,
    GREATEST(0,
      CASE
        WHEN d.type = 'percentage'    THEN p.price - (p.price * d.value / 100)
        WHEN d.type = 'fixed_amount'  THEN p.price - d.value
        ELSE p.price
      END
    )::NUMERIC(10,2) AS discounted_price
  FROM wishlists w
  JOIN products p ON p.id = w.product_id AND p.is_active = true
  LEFT JOIN LATERAL (
    SELECT id, type, value, label
    FROM   discounts
    WHERE  is_active  = true
      AND  starts_at <= NOW()
      AND  (ends_at IS NULL OR ends_at > NOW())
      AND  (product_id = p.id OR category_id = p.category_id)
    ORDER BY CASE WHEN product_id = p.id THEN 0 ELSE 1 END
    LIMIT 1
  ) d ON true
`;

export async function getWishlist(userId: string): Promise<WishlistItem[]> {
  const { rows } = await pool.query(
    `${WISHLIST_SELECT} WHERE w.user_id = $1 ORDER BY w.created_at DESC`,
    [userId],
  );

  return rows.map((row) => {
    const r = row as Record<string, unknown>;
    const price = parseFloat(String(r.price));
    const hasDiscount = r.discount_id != null;

    return {
      id: r.id as string,
      productId: r.product_id as string,
      createdAt: (r.created_at as Date).toISOString(),
      product: {
        name: r.name as string,
        slug: r.slug as string,
        price, // ← now always a real number
        thumbnail: r.thumbnail as string | null,
        stockQuantity: r.stock_quantity as number,
        ...(hasDiscount && {
          discountedPrice: parseFloat(String(r.discounted_price)),
          activeDiscount: { label: r.discount_label as string | null },
        }),
      },
    };
  });
}

export async function addToWishlist(
  userId: string,
  productId: string,
): Promise<void> {
  const { rows } = await pool.query(
    "SELECT id FROM products WHERE id = $1 AND is_active = true",
    [productId],
  );
  if (rows.length === 0)
    throw createError("Product not found", 404, "NOT_FOUND");

  await pool.query(
    `INSERT INTO wishlists (user_id, product_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, product_id) DO NOTHING`,
    [userId, productId],
  );
}

export async function removeFromWishlist(
  userId: string,
  productId: string,
): Promise<void> {
  await pool.query(
    "DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2",
    [userId, productId],
  );
}
