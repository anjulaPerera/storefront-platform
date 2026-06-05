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
    const { role } = req.body as { role: "customer" | "admin" | "super_admin" };
    const data = await svc.changeRole(req.params.id as string, req.user!.userId, role);
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
    const data = await svc.toggleUserActive(req.params.id as string, req.user!.userId);
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
    await svc.deleteUser(req.params.id as string, req.user!.userId);
    res.json({ success: true, data: { message: "User deleted" } });
  } catch (err) {
    next(err);
  }
}
