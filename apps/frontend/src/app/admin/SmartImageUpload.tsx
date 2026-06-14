"use client";

import Image from "next/image";
import { useRef, useState, useCallback } from "react";
import { useImageProcessor } from "@/hooks/useImageProcessor";

// ─── Cloudinary config (same env vars as the original ImageUpload) ───────────

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

// ─── Props ──────────────────────────────────────────────────────────────────

interface SmartImageUploadProps {
  /** Current persisted image URL (empty = none) */
  value: string;
  /** Called with the final Cloudinary URL once the processed image is uploaded */
  onChange: (url: string) => void;
  label?: string;
}

// ─── Upload helper ──────────────────────────────────────────────────────────

async function uploadToCloudinary(blob: Blob, filename: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", new File([blob], filename, { type: blob.type }));
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "products");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData },
  );

  if (!res.ok) {
    const body = (await res.json()) as { error?: { message: string } };
    throw new Error(body.error?.message ?? `Upload failed (${res.status})`);
  }

  const data = (await res.json()) as { secure_url: string };
  return data.secure_url;
}

// ─── Progress bar ───────────────────────────────────────────────────────────

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-violet-300 font-medium">{label}</span>
        <span className="text-muted tabular-nums">{value}%</span>
      </div>
      <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-400 transition-all duration-300 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ─── Before / After preview ─────────────────────────────────────────────────

function BeforeAfter({
  originalUrl,
  processedDataUrl,
}: {
  originalUrl: string;
  processedDataUrl: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {/* Before */}
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-muted text-center font-medium">
          Before
        </p>
        <div className="relative rounded-lg overflow-hidden bg-[url('/checker.svg')] bg-repeat bg-[length:16px_16px] aspect-square">
          {/* Checkerboard via a tiny inline SVG pattern fallback */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-conic-gradient(#1e2a3a 0% 25%, #111827 0% 50%)",
              backgroundSize: "16px 16px",
            }}
          />
          <img
            src={originalUrl}
            alt="Original"
            className="relative w-full h-full object-contain p-2"
          />
        </div>
      </div>

      {/* After */}
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-violet-400 text-center font-medium">
          After
        </p>
        <div className="relative rounded-lg overflow-hidden aspect-square">
          <img
            src={processedDataUrl}
            alt="Processed"
            className="w-full h-full object-cover"
          />
          {/* Tiny "AI" badge */}
          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-600/90 text-white tracking-wide">
            AI
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function SmartImageUpload({
  value,
  onChange,
  label = "Product Image",
}: SmartImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const {
    stage,
    progress,
    originalUrl,
    processedResult,
    error: processError,
    process,
    reset,
  } = useImageProcessor();

  // ── Accept a file ─────────────────────────────────────────────────────────

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setUploadError("Please select an image file.");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setUploadError("Image must be under 20 MB.");
        return;
      }
      setUploadError("");
      await process(file);
    },
    [process],
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ""; // allow re-selecting same file
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  // ── Confirm: upload processed result ────────────────────────────────────

  async function handleConfirmUpload() {
    if (!processedResult) return;
    setUploading(true);
    setUploadError("");

    try {
      const filename = `product-${Date.now()}.jpg`;
      const url = await uploadToCloudinary(processedResult.blob, filename);
      onChange(url);
      reset();
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed. Try again.",
      );
    } finally {
      setUploading(false);
    }
  }

  // ── Remove existing image ────────────────────────────────────────────────

  function handleRemove() {
    onChange("");
    setUploadError("");
    reset();
  }

  // ── Stage labels ─────────────────────────────────────────────────────────

  const stageLabel: Record<string, string> = {
    "removing-bg": "Removing background…",
    compositing: "Building cinematic background…",
    done: "Ready to save",
    error: "Processing failed",
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const isProcessing = stage === "removing-bg" || stage === "compositing";
  const anyError = uploadError || processError;

  return (
    <div className="space-y-2">
      {label && <p className="admin-label">{label}</p>}

      {/* ── Existing saved image ── */}
      {value && stage === "idle" && (
        <div
          className="relative rounded-xl overflow-hidden border border-white/10 bg-white/[0.03]"
          style={{ minHeight: "10rem" }}
        >
          <Image
            src={value}
            alt="Product thumbnail"
            fill
            className="object-contain p-2 rounded-xl"
            sizes="360px"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-black/0 hover:bg-black/55 transition-colors group">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 text-slate-900 text-xs font-medium"
            >
              <IconPhoto className="w-3.5 h-3.5" />
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/90 text-white text-xs font-medium"
            >
              <IconTrash className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>
        </div>
      )}

      {/* ── Drop zone (shown when no saved image and idle / error) ── */}
      {!value && (stage === "idle" || stage === "error") && (
        <div
          onClick={() => inputRef.current?.click()}
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
                : "border-white/20 bg-white/[0.02] hover:border-violet-500/50 hover:bg-violet-500/5"
            }
          `}
          style={{ minHeight: "10rem" }}
        >
          <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
            {/* Icon */}
            <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center">
              <IconSparkle className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm text-slate-300">
                <span className="text-violet-400 font-medium">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-muted mt-0.5">
                Background will be automatically removed & styled
              </p>
              <p className="text-xs text-muted/60 mt-0.5">
                PNG, JPG, WebP up to 20 MB
              </p>
            </div>
            {/* AI badge */}
            <div className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full border border-violet-500/30 bg-violet-500/10">
              <span className="text-[10px] text-violet-300 font-medium tracking-wide">
                ✨ AI background processing
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Processing in-progress ── */}
      {isProcessing && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          {/* Before preview while we work */}
          {originalUrl && (
            <div className="flex items-center gap-3">
              <div
                className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-white/10"
                style={{
                  backgroundImage:
                    "repeating-conic-gradient(#1e2a3a 0% 25%, #111827 0% 50%)",
                  backgroundSize: "12px 12px",
                }}
              >
                <img
                  src={originalUrl}
                  alt="Source"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <ProgressBar
                  value={progress}
                  label={stageLabel[stage] ?? "Processing…"}
                />
              </div>
            </div>
          )}

          {/* Animated spinner row */}
          <div className="flex items-center gap-2 text-xs text-muted">
            <svg
              className="w-3.5 h-3.5 animate-spin text-violet-400 flex-shrink-0"
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
            <span>
              {stage === "removing-bg"
                ? "Running background removal model in your browser — this takes 10–20 s the first time while the AI model downloads"
                : "Compositing cinematic dark background…"}
            </span>
          </div>
        </div>
      )}

      {/* ── Done — before/after + confirm ── */}
      {stage === "done" && processedResult && (
        <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-4 space-y-4">
          <BeforeAfter
            originalUrl={originalUrl}
            processedDataUrl={processedResult.dataUrl}
          />

          {/* Action row */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirmUpload}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              {uploading ? (
                <>
                  <svg
                    className="w-3.5 h-3.5 animate-spin"
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
                  Saving…
                </>
              ) : (
                <>
                  <IconCheck className="w-3.5 h-3.5" />
                  Use this image
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-2 rounded-lg border border-white/15 bg-white/[0.04] hover:bg-white/[0.07] disabled:opacity-60 text-white/70 text-sm transition-colors"
              title="Pick a different file"
            >
              <IconRefresh className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={uploading}
              className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] disabled:opacity-60 text-muted text-sm transition-colors"
              title="Cancel"
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {anyError && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
          {anyError}
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

// ─── Micro icons (inline SVGs to avoid an extra icon-lib dep) ───────────────

function IconSparkle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M5 3l.94 2.06L8 6l-2.06.94L5 9l-.94-2.06L2 6l2.06-.94L5 3zM19 11l.94 2.06L22 14l-2.06.94L19 17l-.94-2.06L16 14l2.06-.94L19 11zM12 2l1.5 3.5L17 7l-3.5 1.5L12 12l-1.5-3.5L7 7l3.5-1.5L12 2z"
      />
    </svg>
  );
}

function IconPhoto({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
