import { Request, Response, NextFunction } from "express";
import * as svc from "@/modules/categories/categories.service";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const activeOnly = req.query.all !== "true";
    const data = await svc.listCategories(activeOnly);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getBySlug(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await svc.getCategoryBySlug(req.params.slug as string);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function create(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await svc.createCategory(
      req.body as Parameters<typeof svc.createCategory>[0],
    );
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function update(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await svc.updateCategory(
      req.params.id as string,
      req.body as Parameters<typeof svc.updateCategory>[1],
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
    await svc.deleteCategory(req.params.id as string);
    res.json({ success: true, data: { message: "Category deleted" } });
  } catch (err) {
    next(err);
  }
}
