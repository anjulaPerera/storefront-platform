import { Request, Response, NextFunction } from "express";
import { parsePagination } from "@/utils/pagination.utils";
import * as svc from "@/modules/users/users.service";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const pagination = parsePagination(req.query);
    const { users, meta } = await svc.listUsers(
      pagination,
      req.query.role as string | undefined,
    );
    res.json({ success: true, data: users, meta });
  } catch (err) {
    next(err);
  }
}

export async function getById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await svc.getUserById(req.params.id as string);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as { firstName?: string; lastName?: string };
    const data = await svc.updateProfile(
      req.params.id as string,
      req.user!.userId,
      req.user!.role,
      body,
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function changeRole(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { role } = req.body as { role: "customer" | "admin" };
    const data = await svc.changeRole(
      req.params.id as string,
      req.user!.userId,
      role,
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function toggle(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await svc.toggleUserActive(
      req.params.id as string,
      req.user!.userId,
      req.user!.role,
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await svc.deleteUser(
      req.params.id as string,
      req.user!.userId,
      req.user!.role,
    );
    res.json({ success: true, data: { message: "User deleted" } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /users
 * Create a new admin or customer account (super_admin only).
 *
 * The response includes `tempPassword` exactly once — the super_admin must
 * copy and share it with the new user. It is never stored in plain text and
 * will not be retrievable again after this response.
 */
export async function createAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as {
      email: string;
      firstName: string;
      lastName: string;
      role: "customer" | "admin";
    };

    const { user, tempPassword } = await svc.createAdmin(
      req.user!.userId,
      body,
    );

    res.status(201).json({
      success: true,
      data: {
        ...user,
        // One-time reveal — the super_admin must share this with the new user.
        // It will not be returned in any subsequent request.
        tempPassword,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /users/audit-logs
 * List audit logs (super_admin only).
 */
export async function listAuditLogs(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const pagination = parsePagination(req.query);
    const { logs, meta } = await svc.listAuditLogs(
      pagination,
      req.query.action as string | undefined,
    );
    res.json({ success: true, data: logs, meta });
  } catch (err) {
    next(err);
  }
}
