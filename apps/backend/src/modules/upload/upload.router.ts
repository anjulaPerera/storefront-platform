import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/role.middleware";
import { uploadImageController } from "./upload.controller";
import { createError } from "@/middleware/error.middleware";

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
cb(createError("Only image files are accepted.", 400, "INVALID_FILE_TYPE"));    }
  },
});

const router = Router();

router.post(
  "/upload/image",
  authMiddleware,
  requireRole("admin"), // allows admin + super_admin (level >= 2)
  multerUpload.single("file"),
  uploadImageController,
);

export default router;
