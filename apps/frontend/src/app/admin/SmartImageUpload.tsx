"use client";

import Image from "next/image";
import { useRef, useState, useCallback } from "react";
import { useImageProcessor } from "@/hooks/useImageProcessor";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

// ─── Types ────────────────────────────────────────────────────────────────────

interface SmartImageUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  maxImages?: number;
  onUpload?: (blob: Blob, filename: string) => Promise<string>;
}

// ─── Cloudinary uploader ─────────────────────────────────────────────────────

async function uploadToCloudinary(
  blob: Blob,
  filename: string,
): Promise<string> {
  const fd = new FormData();
  fd.append("file", new File([blob], filename, { type: blob.type }));
  fd.append("upload_preset", UPLOAD_PRESET);
  fd.append("folder", "products");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: fd },
  );
  if (!res.ok) {
    const body = (await res.json()) as { error?: { message: string } };
    throw new Error(body.error?.message ?? `Upload failed (${res.status})`);
  }
  const data = (await res.json()) as { secure_url: string };
  return data.secure_url;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-violet-300 font-medium">{label}</span>
        <span className="text-white/40 tabular-nums">{value}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-400 transition-all duration-300 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ─── Saved image grid ─────────────────────────────────────────────────────────

function ImageGrid({
  urls,
  onRemove,
  onSetPrimary,
  disabled,
}: {
  urls: string[];
  onRemove: (idx: number) => void;
  onSetPrimary: (idx: number) => void;
  disabled: boolean;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (urls.length === 0) return null;

  return (
    <div>
      <p className="admin-label mb-2">
        Saved images ({urls.length}) — first is the thumbnail
      </p>
      <div className="grid grid-cols-4 gap-2">
        {urls.map((url, idx) => (
          <div
            key={url + idx}
            className={`relative rounded-xl overflow-hidden border aspect-square group ${
              idx === 0
                ? "border-primary/50 ring-1 ring-primary/30"
                : "border-white/10"
            }`}
            onMouseEnter={() => setHoverIdx(idx)}
            onMouseLeave={() => setHoverIdx(null)}
          >
            <Image
              src={url}
              alt={`Image ${idx + 1}`}
              fill
              className="object-cover"
              sizes="120px"
            />

            {idx === 0 && (
              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/90 text-white">
                MAIN
              </span>
            )}

            {hoverIdx === idx && !disabled && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/70">
                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => onSetPrimary(idx)}
                    className="text-[10px] font-semibold text-white bg-primary/80 hover:bg-primary px-2 py-1 rounded transition-colors"
                  >
                    Set Main
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="text-[10px] font-semibold text-white bg-red-600/80 hover:bg-red-600 px-2 py-1 rounded transition-colors"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SmartImageUpload({
  values,
  onChange,
  label = "Product Images",
  maxImages,
  onUpload,
}: SmartImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const {
    stage,
    progress,
    originalUrl,
    processedResult,
    error: processError,
    originalFile,
    process: runProcess,
    reset: resetProcess,
  } = useImageProcessor();

  const isProcessing = stage === "removing-bg" || stage === "compositing";
  const isDone = stage === "done";
  const isIdle = stage === "idle" || stage === "error";
  const anyError = uploadError || processError;

  // ── File handler: always runs through the AI pipeline ───────────────────

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
      await runProcess(file);
    },
    [runProcess],
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  // ── Upload the AI-processed result ───────────────────────────────────────

async function confirmAiUpload() {
  if (!processedResult) return;
  setUploading(true);
  setUploadError("");
  try {
    const filename = `product-ai-${Date.now()}.jpg`;
    // onUpload (backend) takes priority; Cloudinary is the local fallback
    const url = onUpload
      ? await onUpload(processedResult.blob, filename)
      : await uploadToCloudinary(processedResult.blob, filename);
    onChange([...values, url]);
    resetProcess();
  } catch (err) {
    setUploadError(err instanceof Error ? err.message : "Upload failed.");
  } finally {
    setUploading(false);
  }
}

  // ── Upload the original file, bypassing AI ───────────────────────────────

async function skipAiAndUpload() {
  if (!originalFile) return;
  setUploading(true);
  setUploadError("");
  try {
    const filename = `product-${Date.now()}-${originalFile.name}`;
    const url = onUpload
      ? await onUpload(originalFile, filename)
      : await uploadToCloudinary(originalFile, filename);
    onChange([...values, url]);
    resetProcess();
  } catch (err) {
    setUploadError(err instanceof Error ? err.message : "Upload failed.");
  } finally {
    setUploading(false);
  }
}

  // ── Image management ─────────────────────────────────────────────────────

  function removeImage(idx: number) {
    onChange(values.filter((_, i) => i !== idx));
  }

  function setPrimary(idx: number) {
    const next = [...values];
    const [item] = next.splice(idx, 1);
    next.unshift(item);
    onChange(next);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {label && <p className="admin-label">{label}</p>}

      {/* Saved images grid */}
      {values.length > 0 && (
        <ImageGrid
          urls={values}
          onRemove={removeImage}
          onSetPrimary={setPrimary}
          disabled={uploading || isProcessing}
        />
      )}

      {/* ── IDLE / ERROR — drop zone ── */}
      {isIdle && (
        <div
          onClick={() => {
            const atLimit =
              maxImages !== undefined && values.length >= maxImages;
            if (!uploading && !atLimit) inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`
            relative flex items-center justify-center rounded-xl border-2 border-dashed
            cursor-pointer select-none transition-all min-h-[10rem]
            ${
              dragOver
                ? "border-violet-400 bg-violet-500/10 scale-[1.01]"
                : "border-white/15 bg-white/[0.02] hover:border-violet-500/50 hover:bg-violet-500/[0.04]"
            }
          `}
        >
          <div className="flex flex-col items-center gap-3 py-8 px-4 text-center pointer-events-none">
            {/* Icon */}
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/20 to-blue-600/10 border border-violet-500/20 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-violet-400"
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
              {/* Sparkle badge */}
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center text-[10px]">
                ✨
              </span>
            </div>

            <div>
              <p className="text-sm text-white/70">
                <span className="text-violet-400 font-semibold">
                  Click to upload
                </span>{" "}
                or drag &amp; drop
              </p>
              <p className="text-xs text-white/30 mt-0.5">
                PNG · JPG · WebP · up to 20 MB
              </p>
            </div>

            {/* AI badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
              <span className="text-[10px]">✨</span>
              <span className="text-[11px] text-violet-300 font-medium">
                Background removed &amp; gradient applied automatically
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── PROCESSING — progress view ── */}
      {isProcessing && (
        <div className="rounded-xl border border-violet-500/25 bg-violet-500/[0.06] p-4 space-y-4">
          <div className="flex items-center gap-3">
            {/* Original image thumbnail */}
            {originalUrl && (
              <div
                className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border border-white/10"
                style={{
                  backgroundImage:
                    "repeating-conic-gradient(#1e2a3a 0% 25%, #111827 0% 50%)",
                  backgroundSize: "10px 10px",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalUrl}
                  alt="Source"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div className="flex-1 space-y-2">
              <ProgressBar
                value={progress}
                label={
                  stage === "removing-bg"
                    ? "Removing background…"
                    : "Building premium background…"
                }
              />
              <p className="text-[11px] text-white/30">
                {stage === "removing-bg"
                  ? "AI model runs in your browser — first run downloads ~43 MB (cached afterwards)"
                  : "Compositing cinematic gradient & reflection…"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── DONE — before / after comparison ── */}
      {isDone && processedResult && (
        <div className="rounded-xl border border-violet-500/25 bg-gradient-to-b from-violet-500/[0.06] to-transparent p-4 space-y-4">
          {/* Before / After */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-white/30 text-center font-medium">
                Before
              </p>
              <div
                className="relative rounded-xl overflow-hidden aspect-square"
                style={{
                  backgroundImage:
                    "repeating-conic-gradient(#1e2a3a 0% 25%, #111827 0% 50%)",
                  backgroundSize: "12px 12px",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalUrl}
                  alt="Original"
                  className="w-full h-full object-contain p-2"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-violet-400 text-center font-medium">
                After ✨
              </p>
              <div className="relative rounded-xl overflow-hidden aspect-square ring-1 ring-violet-500/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={processedResult.dataUrl}
                  alt="Processed"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-violet-600/90 text-white">
                  AI
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmAiUpload}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {uploading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
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
                  Uploading…
                </>
              ) : (
                "✓ Use this image"
              )}
            </button>

            <button
              type="button"
              onClick={skipAiAndUpload}
              disabled={uploading}
              title="Upload original without AI processing"
              className="px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] disabled:opacity-60 text-white/40 hover:text-white/70 text-xs transition-colors whitespace-nowrap"
            >
              Skip AI
            </button>

            <button
              type="button"
              onClick={resetProcess}
              disabled={uploading}
              title="Discard and start over"
              className="px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-red-500/10 hover:border-red-500/30 disabled:opacity-60 text-white/30 hover:text-red-400 text-sm transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Nudge to add another image after confirming */}
          {!uploading && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full text-[11px] text-white/25 hover:text-white/50 transition-colors py-1"
            >
              + Add another image
            </button>
          )}
        </div>
      )}

      {/* Errors */}
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
