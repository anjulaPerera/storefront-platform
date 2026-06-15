import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Streams a file buffer to Cloudinary and returns the secure CDN URL.
 *
 * @param buffer           - Raw file bytes (from multer memoryStorage)
 * @param mimetype         - e.g. "image/jpeg" — tells Cloudinary the format
 * @param removeBackground - When true, applies Cloudinary's AI bg removal.
 *                           Currently always false (in-browser AI handles it),
 *                           but wired up for future use.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  mimetype: string,
  removeBackground: boolean,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "products",
        resource_type: "image",
        // Cloudinary's background_removal is a paid add-on.
        // We only activate it if explicitly requested AND the in-browser
        // pipeline wasn't used (i.e. removeBackground=true from the client).
        ...(removeBackground && {
          transformation: [{ effect: "background_removal" }],
        }),
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary returned no result"));
        } else {
          resolve(result.secure_url);
        }
      },
    );

    // pipe the in-memory buffer directly into the upload stream
    stream.end(buffer);
  });
}
