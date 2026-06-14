"use client";

import Image from "next/image";
import { useRef, useState, useCallback } from "react";
import { useImageProcessor } from "@/hooks/useImageProcessor";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

// ─── Types ───────────────────────────────────────────────────────────────────

interface MultiImageUploadProps {
  /** All saved image URLs — first is thumbnail */
  values: string[];
  /** Called with the full updated array after any change */
  onChange: (urls: string[]) => void;
  label?: string;
}

type Tab = "manual" | "ai";

// ─── Cloudinary upload ────────────────────────────────────────────────────────

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
    <div className="w-full space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-violet-300 font-medium">{label}</span>
        <span className="text-muted tabular-nums">{value}%</span>
      </div>
      <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-400 transition-all duration-300"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ─── Image grid with hover slideshow ─────────────────────────────────────────

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
        Images ({urls.length}) — first image is the thumbnail
      </p>
      <div className="grid grid-cols-4 gap-2">
        {urls.map((url, idx) => (
          <div
            key={url + idx}
            className={`relative rounded-lg overflow-hidden border aspect-square group cursor-default ${
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

            {/* Primary badge */}
            {idx === 0 && (
              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/90 text-white">
                MAIN
              </span>
            )}

            {/* Hover actions */}
            {hoverIdx === idx && !disabled && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/70 transition-all">
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
}: MultiImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("manual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    stage,
    progress,
    originalUrl,
    processedResult,
    error: processError,
    process: runProcess,
    reset: resetProcess,
  } = useImageProcessor();

  const isAiProcessing = stage === "removing-bg" || stage === "compositing";

  // ── Manual upload ────────────────────────────────────────────────────────

  const handleManualFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError("");
      setLoading(true);

      const toUpload = Array.from(files).filter((f) => {
        if (!f.type.startsWith("image/")) return false;
        if (f.size > 10 * 1024 * 1024) return false;
        return true;
      });

      if (toUpload.length === 0) {
        setError("No valid images selected (max 10MB each, images only).");
        setLoading(false);
        return;
      }

      try {
        const urls = await Promise.all(
          toUpload.map((f) =>
            uploadToCloudinary(f, `product-${Date.now()}-${f.name}`),
          ),
        );
        onChange([...values, ...urls]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setLoading(false);
      }
    },
    [values, onChange],
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleManualFiles(e.target.files);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleManualFiles(e.dataTransfer.files);
  }

  // ── AI pipeline ──────────────────────────────────────────────────────────

  async function handleAiFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Images only.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File must be under 20MB.");
      return;
    }
    setError("");
    await runProcess(file);
  }

  async function confirmAiUpload() {
    if (!processedResult) return;
    setLoading(true);
    setError("");
    try {
      const url = await uploadToCloudinary(
        processedResult.blob,
        `product-ai-${Date.now()}.jpg`,
      );
      onChange([...values, url]);
      resetProcess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setLoading(false);
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

  const anyError = error || processError;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {label && <p className="admin-label">{label}</p>}

      {/* Existing images grid */}
      {values.length > 0 && (
        <ImageGrid
          urls={values}
          onRemove={removeImage}
          onSetPrimary={setPrimary}
          disabled={loading || isAiProcessing}
        />
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/08 w-fit">
        <button
          type="button"
          onClick={() => setTab("manual")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            tab === "manual"
              ? "bg-primary text-white shadow"
              : "text-white/40 hover:text-white"
          }`}
        >
          📁 Manual Upload
        </button>
        <button
          type="button"
          onClick={() => setTab("ai")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            tab === "ai"
              ? "bg-violet-600 text-white shadow"
              : "text-white/40 hover:text-white"
          }`}
        >
          ✨ AI Background
        </button>
      </div>

      {/* ── MANUAL TAB ── */}
      {tab === "manual" && (
        <div
          onClick={() => !loading && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`relative flex items-center justify-center rounded-xl border-2 border-dashed
            transition-colors cursor-pointer select-none min-h-[8rem]
            ${
              loading
                ? "border-primary/30 bg-primary/5 pointer-events-none opacity-70"
                : "border-white/20 bg-white/[0.02] hover:border-primary/50 hover:bg-primary/5"
            }`}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2 py-6">
              <svg
                className="w-7 h-7 animate-spin text-primary"
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
              <p className="text-sm text-primary">Uploading…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white/30"
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
                <p className="text-sm text-white/60">
                  <span className="text-primary font-semibold">
                    Click to upload
                  </span>{" "}
                  or drag & drop
                </p>
                <p className="text-xs text-white/30 mt-0.5">
                  PNG, JPG, WebP — up to 10MB each — multiple files supported
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AI TAB ── */}
      {tab === "ai" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-xs text-violet-300/80 leading-relaxed">
            ✨ <strong>AI Background</strong> — removes the original background
            and places the product on a cinematic dark-navy gradient with
            ambient glow and a mirror reflection. Works entirely in your
            browser. Upload one image at a time.
          </div>

          {/* Drop zone — only shown when not processing */}
          {stage === "idle" || stage === "error" ? (
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleAiFile(f);
              }}
              className="flex items-center justify-center rounded-xl border-2 border-dashed border-violet-500/30
                bg-violet-500/[0.03] hover:border-violet-400/50 hover:bg-violet-500/[0.06]
                transition-colors cursor-pointer min-h-[8rem]"
            >
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-lg">
                  ✨
                </div>
                <div>
                  <p className="text-sm text-white/60">
                    <span className="text-violet-400 font-semibold">
                      Choose image
                    </span>{" "}
                    for AI processing
                  </p>
                  <p className="text-xs text-white/30 mt-0.5">
                    One image at a time — up to 20MB
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Processing state */}
          {isAiProcessing && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-3">
              {originalUrl && (
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border border-white/10"
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
                  <div className="flex-1">
                    <ProgressBar
                      value={progress}
                      label={
                        stage === "removing-bg"
                          ? "Removing background…"
                          : "Building cinematic background…"
                      }
                    />
                    <p className="text-[11px] text-white/30 mt-1.5">
                      {stage === "removing-bg"
                        ? "AI model runs in your browser — first run downloads ~30MB"
                        : "Almost done…"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Done state */}
          {stage === "done" && processedResult && (
            <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-4 space-y-3">
              {/* Before / after */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-muted text-center font-medium">
                    Before
                  </p>
                  <div
                    className="relative rounded-lg overflow-hidden aspect-square"
                    style={{
                      backgroundImage:
                        "repeating-conic-gradient(#1e2a3a 0% 25%, #111827 0% 50%)",
                      backgroundSize: "14px 14px",
                    }}
                  >
                    <img
                      src={originalUrl}
                      alt="Original"
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-violet-400 text-center font-medium">
                    After
                  </p>
                  <div className="relative rounded-lg overflow-hidden aspect-square">
                    <img
                      src={processedResult.dataUrl}
                      alt="Processed"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-600/90 text-white">
                      AI
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={confirmAiUpload}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
                >
                  {loading ? "Saving…" : "✓ Use this image"}
                </button>
                <button
                  type="button"
                  onClick={resetProcess}
                  disabled={loading}
                  className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] disabled:opacity-60 text-white/50 text-sm transition-colors"
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Errors */}
      {anyError && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
          {anyError}
        </p>
      )}

      {/* Hidden input — manual uses multiple, AI uses single */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={tab === "manual"}
        className="hidden"
        onChange={
          tab === "manual"
            ? handleFileChange
            : (e) => {
                const f = e.target.files?.[0];
                if (f) handleAiFile(f);
                e.target.value = "";
              }
        }
      />
    </div>
  );
}
