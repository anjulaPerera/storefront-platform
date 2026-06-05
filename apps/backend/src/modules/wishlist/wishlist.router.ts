import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import * as c from "@/modules/wishlist/wishlist.controller";

export const wishlistRouter: ExpressRouter = Router();


wishlistRouter.use(authMiddleware);
wishlistRouter.get("/", c.list);
wishlistRouter.post("/:productId", c.add);
wishlistRouter.delete("/:productId", c.remove);
