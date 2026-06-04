import { Request, Response, NextFunction } from "express";
import * as svc from "@/modules/discounts/discounts.service";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await svc.listDiscounts(req.query.active === "true");
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
    const data = await svc.createDiscount(
      req.body as Parameters<typeof svc.createDiscount>[0],
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
    const data = await svc.updateDiscount(
      req.params.id as string,
      req.body as Parameters<typeof svc.updateDiscount>[1],
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
    await svc.deleteDiscount(req.params.id as string);
    res.json({ success: true, data: { message: "Discount deleted" } });
  } catch (err) {
    next(err);
  }
}
