"use client";

import { useState, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ProcessingStage =
  | "idle"
  | "removing-bg"
  | "compositing"
  | "done"
  | "error";

export interface ProcessedResult {
  /** Final JPEG blob ready to upload */
  blob: Blob;
  /** data-URL for immediate <img> preview */
  dataUrl: string;
}

// ─── Network-aware model picker ──────────────────────────────────────────────
// Checks the non-standard Network Information API (available in Chrome/Edge/
// Android WebView). Falls back to "medium" on browsers that don't support it.
// Valid model strings for @imgly/background-removal v1.x: "small" | "medium".
//   "small"  — faster download (~6 MB), slightly lower edge accuracy
//   "medium" — best quality    (~43 MB), cached in IndexedDB after first run

function pickModel(): "isnet_fp16" | "isnet" {
  try {
     
    const conn = (navigator as any).connection;
    const slow =
      conn?.saveData === true ||
      conn?.effectiveType === "slow-2g" ||
      conn?.effectiveType === "2g";
    return slow ? "isnet_fp16" : "isnet";
  } catch {
    return "isnet"; // safe default if API unavailable
  }
}

// ─── Background removal via @imgly/background-removal ───────────────────────
// Runs entirely in the browser (ONNX via WebAssembly).
// Model is fetched from jsDelivr CDN on first use, then cached in IndexedDB —
// subsequent uploads skip the download entirely.

async function runBackgroundRemoval(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<Blob> {
  // Dynamic import keeps this out of the SSR bundle
  const { removeBackground } = await import("@imgly/background-removal");

  const model = pickModel();

  return removeBackground(file, {
    model,
    output: { format: "image/png", quality: 1 },
    progress: (_key: string, current: number, total: number) => {
      if (total > 0) {
        // Map each step's progress into the 5–68 % window
        const ratio = current / total;
        onProgress?.(Math.round(5 + ratio * 63));
      }
    },
  });
}

// ─── Cinematic canvas compositing ───────────────────────────────────────────
// Composites the transparent-PNG subject onto a dark-navy radial gradient
// background with ambient glow, drop shadow, and a fading mirror reflection.

async function compositeOnCinematicBackground(
  subjectBlob: Blob,
): Promise<{ blob: Blob; dataUrl: string }> {
  const img = await createImageBitmap(subjectBlob);

  const W = 800;
  const H = 800;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // 1 ── Deep navy radial gradient background
  const cx = W / 2;
  const cy = H * 0.44;
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.74);
  bg.addColorStop(0, "#1b2a4a");
  bg.addColorStop(0.42, "#0e1a30");
  bg.addColorStop(0.78, "#080f1e");
  bg.addColorStop(1, "#040810");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 2 ── Subtle ambient blue glow
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.4);
  glow.addColorStop(0, "rgba(55, 120, 230, 0.16)");
  glow.addColorStop(0.6, "rgba(40, 90, 180, 0.07)");
  glow.addColorStop(1, "rgba(40, 90, 180, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // 3 ── Scale subject — 10 % H-pad, 8 % top, 32 % bottom
  const PAD_X = W * 0.1;
  const PAD_TOP = H * 0.08;
  const PAD_BOTTOM = H * 0.32;
  const maxW = W - PAD_X * 2;
  const maxH = H - PAD_TOP - PAD_BOTTOM;
  const scale = Math.min(maxW / img.width, maxH / img.height);
  const sw = img.width * scale;
  const sh = img.height * scale;
  const sx = (W - sw) / 2;
  const sy = PAD_TOP + (maxH - sh) / 2;

  // 4 ── Drop shadow
  ctx.save();
  ctx.shadowColor = "rgba(0, 5, 20, 0.85)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 32;
  ctx.drawImage(img, sx, sy, sw, sh);
  ctx.restore();

  // 5 ── Subject
  ctx.drawImage(img, sx, sy, sw, sh);

  // 6 ── Fading mirror reflection
  const REFL_FRAC = 0.35;
  const reflH = sh * REFL_FRAC;

  const rc = document.createElement("canvas");
  rc.width = sw;
  rc.height = reflH;
  const rCtx = rc.getContext("2d")!;

  rCtx.save();
  rCtx.translate(0, reflH);
  rCtx.scale(1, -1);
  rCtx.drawImage(
    img,
    0,
    img.height * (1 - REFL_FRAC),
    img.width,
    img.height * REFL_FRAC,
    0,
    0,
    sw,
    reflH,
  );
  rCtx.restore();

  // Fade the reflection out to transparent
  const fadeGrad = rCtx.createLinearGradient(0, 0, 0, reflH);
  fadeGrad.addColorStop(0, "rgba(0,0,0,0.30)");
  fadeGrad.addColorStop(1, "rgba(0,0,0,1)");
  rCtx.globalCompositeOperation = "destination-in";
  rCtx.fillStyle = fadeGrad;
  rCtx.fillRect(0, 0, sw, reflH);

  ctx.save();
  ctx.globalAlpha = 0.38;
  ctx.drawImage(rc, sx, sy + sh + 3);
  ctx.restore();

  // 7 ── Bottom vignette
  const vStart = H * 0.65;
  const vig = ctx.createLinearGradient(0, vStart, 0, H);
  vig.addColorStop(0, "rgba(4,8,16,0)");
  vig.addColorStop(0.55, "rgba(4,8,16,0.55)");
  vig.addColorStop(1, "rgba(4,8,16,0.92)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, vStart, W, H - vStart);

  return new Promise<{ blob: Blob; dataUrl: string }>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Canvas toBlob returned null"));
        else resolve({ blob, dataUrl: canvas.toDataURL("image/jpeg", 0.93) });
      },
      "image/jpeg",
      0.93,
    );
  });
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export interface UseImageProcessorReturn {
  stage: ProcessingStage;
  progress: number;
  originalUrl: string;
  processedResult: ProcessedResult | null;
  error: string;
  /** The original File, kept so callers can upload it unmodified if needed */
  originalFile: File | null;
  process: (file: File) => Promise<void>;
  reset: () => void;
}

export function useImageProcessor(): UseImageProcessorReturn {
  const [stage, setStage] = useState<ProcessingStage>("idle");
  const [progress, setProgress] = useState(0);
  const [originalUrl, setOriginalUrl] = useState("");
  const [processedResult, setProcessedResult] =
    useState<ProcessedResult | null>(null);
  const [error, setError] = useState("");
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  const process = useCallback(async (file: File) => {
    // Revoke any previous blob URL to prevent memory leaks
    setOriginalUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });

    setOriginalFile(file);
    setStage("removing-bg");
    setProgress(5);
    setError("");
    setProcessedResult(null);

    try {
      // Stage 1 — AI background removal (ONNX, runs in-browser)
      const subjectBlob = await runBackgroundRemoval(file, setProgress);
      setProgress(70);

      // Stage 2 — canvas compositing
      setStage("compositing");
      setProgress(82);
      const result = await compositeOnCinematicBackground(subjectBlob);
      setProgress(100);

      setProcessedResult({ blob: result.blob, dataUrl: result.dataUrl });
      setStage("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image processing failed.");
      setStage("error");
    }
  }, []);

  function reset() {
    setOriginalUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    setOriginalFile(null);
    setStage("idle");
    setProgress(0);
    setProcessedResult(null);
    setError("");
  }

  return {
    stage,
    progress,
    originalUrl,
    processedResult,
    error,
    originalFile,
    process,
    reset,
  };
}
