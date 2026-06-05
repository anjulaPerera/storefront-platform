import { Router } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/role.middleware";
import { validate } from "@/middleware/validate.middleware";
import {
  createEnquirySchema,
  updateEnquiryStatusSchema,
} from "@/modules/enquiries/enquiries.schema";
import * as c from "@/modules/enquiries/enquiries.controller";

export const enquiriesRouter = Router();

enquiriesRouter.post("/", validate(createEnquirySchema), c.create);
enquiriesRouter.get("/", authMiddleware, requireRole("admin"), c.list);
enquiriesRouter.get("/:id", authMiddleware, requireRole("admin"), c.getById);
enquiriesRouter.patch(
  "/:id/status",
  authMiddleware,
  requireRole("admin"),
  validate(updateEnquiryStatusSchema),
  c.updateStatus,
);
enquiriesRouter.delete("/:id", authMiddleware, requireRole("admin"), c.remove);
