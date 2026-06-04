import { Request, Response, NextFunction } from "express";
import * as svc from "@/modules/banners/banners.service";

export async function listActive(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await svc.listActiveBanners(
      req.query.type as string | undefined,
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listAll(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await svc.listAllBanners();
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
    const data = await svc.createBanner(
      req.body as Parameters<typeof svc.createBanner>[0],
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
    const data = await svc.updateBanner(
      req.params.id as string,
      req.body as Parameters<typeof svc.updateBanner>[1],
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
    await svc.deleteBanner(req.params.id as string);
    res.json({ success: true, data: { message: "Banner deleted" } });
  } catch (err) {
    next(err);
  }
}
