import { Request, Response, NextFunction } from "express";
import { parsePagination } from "@/utils/pagination.utils";
import * as svc from "@/modules/reviews/reviews.service";

export async function listApproved(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const  productId  = req.params.productId as string;
    const pagination = parsePagination(req.query);
    const { reviews, meta } = await svc.listApprovedReviews(
      productId,
      pagination,
    );
    res.json({ success: true, data: reviews, meta });
  } catch (err) {
    next(err);
  }
}

export async function listPending(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await svc.listPendingReviews();
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
    const { productId, rating, title, body } = req.body as {
      productId: string;
      rating: number;
      title?: string;
      body?: string;
    };
    const data = await svc.createReview(req.user!.userId, productId, {
      rating,
      title,
      body,
    });
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function approve(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await svc.approveReview(req.params.id as string);
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
    await svc.deleteReview(req.params.id as string);
    res.json({ success: true, data: { message: "Review deleted" } });
  } catch (err) {
    next(err);
  }
}
