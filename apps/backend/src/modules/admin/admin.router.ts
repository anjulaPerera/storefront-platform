import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/role.middleware";
import { pool } from "@/config/db";

export const adminRouter: ExpressRouter = Router();


adminRouter.get(
  "/stats",
  authMiddleware,
  requireRole("admin"),
  async (_req, res, next) => {
    try {
      const [products, reviews, enquiries, discounts, users] =
        await Promise.all([
          pool.query(
            "SELECT COUNT(*)::INT AS count FROM products WHERE is_active = true",
          ),
          pool.query(
            "SELECT COUNT(*)::INT AS count FROM reviews WHERE is_approved = false",
          ),
          pool.query(
            "SELECT COUNT(*)::INT AS count FROM enquiries WHERE status = 'open'",
          ),
          pool.query(`SELECT COUNT(*)::INT AS count FROM discounts
                  WHERE is_active = true AND starts_at <= NOW()
                  AND (ends_at IS NULL OR ends_at > NOW())`),
          pool.query("SELECT COUNT(*)::INT AS count FROM users"),
        ]);

      res.json({
        success: true,
        data: {
          totalProducts: (products.rows[0] as { count: number }).count,
          pendingReviews: (reviews.rows[0] as { count: number }).count,
          openEnquiries: (enquiries.rows[0] as { count: number }).count,
          activeDiscounts: (discounts.rows[0] as { count: number }).count,
          totalUsers: (users.rows[0] as { count: number }).count,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);
