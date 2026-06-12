"use client";

import Image from "next/image";
import { useRef, useState } from "react";

interface ImageUploadProps {
  value: string; // current URL (empty string = no image)
  onChange: (url: string) => void;
  label?: string;
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

export function ImageUpload({
  value,
  onChange,
  label = "Product Image",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function uploadFile(file: File) {
    // Basic client-side validation
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10 MB.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", "products");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData },
      );

      if (!res.ok) {
        const body = (await res.json()) as { error?: { message: string } };
        throw new Error(body.error?.message ?? "Upload failed");
      }

      const data = (await res.json()) as { secure_url: string };
      onChange(data.secure_url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload failed. Try again.",
      );
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset input so re-selecting same file still triggers onChange
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleRemove() {
    onChange("");
    setError("");
  }

  return (
    <div className="space-y-1.5">
      {label && <p className="admin-label">{label}</p>}

      {/* Drop zone / preview */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`
          relative flex items-center justify-center rounded-xl border-2 border-dashed
          transition-colors cursor-pointer select-none
          ${
            dragOver
              ? "border-violet-400 bg-violet-500/10"
              : value
                ? "border-white/10 bg-white/[0.03]"
                : "border-white/20 bg-white/[0.02] hover:border-violet-500/50 hover:bg-violet-500/5"
          }
          ${uploading ? "pointer-events-none opacity-60" : ""}
        `}
        style={{ minHeight: "10rem" }}
      >
        {value ? (
          /* Image preview */
          <>
            <Image
              src={value}
              alt="Product thumbnail"
              fill
              className="object-contain rounded-xl p-2"
              sizes="300px"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-black/0 hover:bg-black/50 transition-colors group">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="hidden group-hover:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/90 text-slate-900 text-xs font-medium"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Replace
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="hidden group-hover:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600/90 text-white text-xs font-medium"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Remove
              </button>
            </div>
          </>
        ) : uploading ? (
          /* Uploading state */
          <div className="flex flex-col items-center gap-2 py-6 text-muted">
            <svg
              className="w-8 h-8 animate-spin text-violet-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <p className="text-sm text-violet-300">Uploading…</p>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-300">
                <span className="text-violet-400 font-medium">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-muted mt-0.5">
                PNG, JPG, WebP up to 10 MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Hidden file input */}
      <input
        id="hidden-input"
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
