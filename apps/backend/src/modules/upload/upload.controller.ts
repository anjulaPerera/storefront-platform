import { Request, Response } from "express";
import { uploadToCloudinary } from "./upload.service";

export async function uploadImageController(
  req: Request,
  res: Response,
): Promise<void> {
  // multer puts the parsed file on req.file
  if (!req.file) {
    res.status(400).json({
      success: false,
      error: {
        code: "NO_FILE",
        message: "No file was attached to the request.",
      },
    });
    return;
  }

  // The frontend sends removeBackground as a form field string ("true"/"false")
  const removeBackground = req.body.removeBackground === "true";

  try {
    const url = await uploadToCloudinary(
      req.file.buffer,
      req.file.mimetype,
      removeBackground,
    );

    // Match the shape that api.ts expects:  { success: true, data: { url } }
    res.status(200).json({ success: true, data: { url } });
  } catch (err) {
    console.error("[upload] Cloudinary error:", err);
    res.status(500).json({
      success: false,
      error: {
        code: "UPLOAD_FAILED",
        message: err instanceof Error ? err.message : "Upload failed.",
      },
    });
  }
}
