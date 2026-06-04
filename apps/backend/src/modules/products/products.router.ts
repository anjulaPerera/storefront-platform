import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/role.middleware";
import { validate } from "@/middleware/validate.middleware";
import {
  createProductSchema,
  updateProductSchema,
  listProductsSchema,
  updateStockSchema,
} from "@/modules/products/products.schema";
import * as c from "@/modules/products/products.controller";

export const productsRouter: ExpressRouter = Router();


// Public
productsRouter.get("/", validate(listProductsSchema), c.list);
productsRouter.get("/featured", c.featured);
productsRouter.get("/search", c.search);
productsRouter.get("/:slug", c.getBySlug);

// Admin
productsRouter.post(
  "/",
  authMiddleware,
  requireRole("admin"),
  validate(createProductSchema),
  c.create,
);
productsRouter.put(
  "/:id",
  authMiddleware,
  requireRole("admin"),
  validate(updateProductSchema),
  c.update,
);
productsRouter.patch(
  "/:id/stock",
  authMiddleware,
  requireRole("admin"),
  validate(updateStockSchema),
  c.updateStock,
);
productsRouter.patch(
  "/:id/toggle",
  authMiddleware,
  requireRole("admin"),
  c.toggle,
);
productsRouter.delete("/:id", authMiddleware, requireRole("admin"), c.remove);
