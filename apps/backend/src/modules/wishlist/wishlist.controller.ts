import { Request, Response, NextFunction } from "express";
import * as svc from "@/modules/wishlist/wishlist.service";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await svc.getWishlist(req.user!.userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function add(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await svc.addToWishlist(
      req.user!.userId,
      req.params.productId as string,
    );
    res.status(201).json({ success: true, data });
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
    await svc.removeFromWishlist(req.user!.userId, req.params.productId as string);
    res.json({ success: true, data: { message: "Removed from wishlist" } });
  } catch (err) {
    next(err);
  }
}
