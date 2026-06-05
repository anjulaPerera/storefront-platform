import { Request, Response, NextFunction } from "express";

type Role = "customer" | "admin" | "super_admin";

// Higher number = more permissions
const ROLE_LEVEL: Record<Role, number> = {
  customer: 1,
  admin: 2,
  super_admin: 3,
};

/**
 * requireRole('admin') — allows admin AND super_admin
 * requireRole('super_admin') — allows only super_admin
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
      return;
    }

    const userLevel = ROLE_LEVEL[req.user.role];
    const requiredLevel = Math.min(...roles.map((r) => ROLE_LEVEL[r]));

    if (userLevel < requiredLevel) {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Insufficient permissions" },
      });
      return;
    }

    next();
  };
}
