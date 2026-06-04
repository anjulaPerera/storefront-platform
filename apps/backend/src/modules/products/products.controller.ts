import { Request, Response, NextFunction } from "express";
import { parsePagination } from "@/utils/pagination.utils";
import * as svc from "@/modules/products/products.service";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const pagination = parsePagination(req.query);
    const q = req.query as Record<string, string>;
    const { products, meta } = await svc.listProducts({
      ...pagination,
      categorySlug: q.categorySlug,
      brand: q.brand,
      minPrice: q.minPrice ? parseFloat(q.minPrice) : undefined,
      maxPrice: q.maxPrice ? parseFloat(q.maxPrice) : undefined,
      search: q.search,
      sort: q.sort,
      featured: q.featured === "true",
      inStock: q.inStock === "true",
    });
    res.json({ success: true, data: products, meta });
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
    const data = await svc.getProductBySlug(req.params.slug as string);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function featured(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const limit = parseInt(String(req.query.limit ?? 8), 10);
    const data = await svc.getFeaturedProducts(limit);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function search(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const q = String(req.query.q ?? "").trim();
    if (!q) {
      res.json({
        success: true,
        data: [],
        meta: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
      return;
    }
    const { products, meta } = await svc.searchProducts(
      q,
      req.query as Record<string, unknown>,
    );
    res.json({ success: true, data: products, meta });
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
    const data = await svc.createProduct(
      req.body as Parameters<typeof svc.createProduct>[0],
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
    const data = await svc.updateProduct(
      req.params.id as string,
      req.body as Parameters<typeof svc.updateProduct>[1],
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateStock(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await svc.updateStock(
      req.params.id as string,
      (req.body as { stockQuantity: number }).stockQuantity,
    );
    res.json({ success: true, data: { message: "Stock updated" } });
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
    const data = await svc.toggleProduct(req.params.id as string);
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
    await svc.deleteProduct(req.params.id as string as string);
    res.json({ success: true, data: { message: "Product deactivated" } });
  } catch (err) {
    next(err);
  }
}
