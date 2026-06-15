import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/role.middleware";
import { pool } from "@/config/db";

export const adminRouter: ExpressRouter = Router();

/**
 * GET /admin/stats
 * General dashboard stats — accessible by admin and super_admin.
 */
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
          pool.query(`
            SELECT COUNT(*)::INT AS count FROM discounts
            WHERE is_active = true AND starts_at <= NOW()
            AND (ends_at IS NULL OR ends_at > NOW())
          `),
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

/**
 * GET /admin/audit-logs/stats
 * Audit log summary — super_admin only.
 * Returns per-action counts for the last 30 days.
 */
adminRouter.get(
  "/audit-logs/stats",
  authMiddleware,
  requireRole("super_admin"),
  async (_req, res, next) => {
    try {
      const { rows } = await pool.query(`
        SELECT
          action,
          COUNT(*)::INT AS count
        FROM audit_logs
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY action
        ORDER BY count DESC
      `);

      const { rows: recentRows } = await pool.query(`
        SELECT
          al.id,
          al.action,
          actor.email  AS actor_email,
          target.email AS target_email,
          al.metadata,
          al.created_at
        FROM audit_logs al
        LEFT JOIN users actor  ON actor.id  = al.actor_user_id
        LEFT JOIN users target ON target.id = al.target_user_id
        ORDER BY al.created_at DESC
        LIMIT 10
      `);

      res.json({
        success: true,
        data: {
          actionCounts: rows,
          recentActivity: recentRows,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);
