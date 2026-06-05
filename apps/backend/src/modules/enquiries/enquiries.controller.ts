import { Request, Response, NextFunction } from "express";
import { parsePagination } from "@/utils/pagination.utils";
import * as svc from "@/modules/enquiries/enquiries.service";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const pagination = parsePagination(req.query);
    const status = req.query.status as string | undefined;
    const { enquiries, meta } = await svc.listEnquiries(pagination, status);
    res.json({ success: true, data: enquiries, meta });
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
    const data = await svc.getEnquiryById(req.params.id as string);
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
    const body = req.body as Parameters<typeof svc.createEnquiry>[0];
    const data = await svc.createEnquiry(body, req.user?.userId);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { status } = req.body as { status: "open" | "replied" | "closed" };
    const data = await svc.updateStatus(req.params.id as string, status);
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
    await svc.deleteEnquiry(req.params.id as string);
    res.json({ success: true, data: { message: "Enquiry deleted" } });
  } catch (err) {
    next(err);
  }
}
