"use client";

import { useState, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────

export type ProcessingStage =
  | "idle"
  | "removing-bg"
  | "compositing"
  | "done"
  | "error";

export interface ProcessedResult {
  /** Final JPEG blob ready to upload */
  blob: Blob;
  /** data-URL for immediate <img> preview without a round-trip */
  dataUrl: string;
}

// ─── Background removal (lazy – only loads the WASM when first needed) ──────

async function runBackgroundRemoval(file: File): Promise<Blob> {
  // Dynamic import keeps the heavy WASM bundle out of the initial JS chunk.
  const { removeBackground } = await import("@imgly/background-removal");

  const blob = await removeBackground(file, {
    model: "isnet_fp16",
    output: {
      format: "image/png",
      quality: 0.95,
    },
  });

  return blob;
}

// ─── Canvas compositing ─────────────────────────────────────────────────────

/**
 * Takes a transparent-background PNG blob (the product subject) and composites
 * it onto a cinematic dark-navy radial-gradient background that matches the
 * store's product-card aesthetic (deep navy centre → near-black edges, subtle
 * ambient glow, drop shadow, and a fading mirror reflection beneath).
 */
async function compositeOnCinematicBackground(
  subjectBlob: Blob,
): Promise<{ blob: Blob; dataUrl: string }> {
  const img = await createImageBitmap(subjectBlob);

  const W = 800;
  const H = 800;

  // ── Main canvas ────────────────────────────────────────────────────────────
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // 1. Background — deep navy radial gradient, centre slightly above mid
  const cx = W / 2;
  const cy = H * 0.44;
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.74);
  bg.addColorStop(0, "#1b2a4a"); // blue-navy centre
  bg.addColorStop(0.42, "#0e1a30"); // mid-navy
  bg.addColorStop(0.78, "#080f1e"); // very dark
  bg.addColorStop(1, "#040810"); // near-black edge
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 2. Subtle ambient blue glow (makes subject look illuminated from behind)
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.40);
  glow.addColorStop(0, "rgba(55, 120, 230, 0.16)");
  glow.addColorStop(0.6, "rgba(40, 90, 180, 0.07)");
  glow.addColorStop(1, "rgba(40, 90, 180, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // 3. Scale subject — leave ~10 % horizontal padding, 8 % top, 32 % bottom
  //    (the bottom space is for the reflection)
  const PAD_X = W * 0.10;
  const PAD_TOP = H * 0.08;
  const PAD_BOTTOM = H * 0.34; // room for reflection + vignette

  const maxW = W - PAD_X * 2;
  const maxH = H - PAD_TOP - PAD_BOTTOM;
  const scale = Math.min(maxW / img.width, maxH / img.height);
  const sw = img.width * scale;
  const sh = img.height * scale;
  const sx = (W - sw) / 2;
  const sy = PAD_TOP + (maxH - sh) / 2;

  // 4. Drop shadow under the subject
  ctx.save();
  ctx.shadowColor = "rgba(0, 5, 20, 0.80)";
  ctx.shadowBlur = 56;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 28;
  ctx.drawImage(img, sx, sy, sw, sh);
  ctx.restore();

  // 5. Subject itself (crisp, no shadow so it doesn't double-draw)
  ctx.drawImage(img, sx, sy, sw, sh);

  // ── Reflection ──────────────────────────────────────────────────────────────
  // Grab just the bottom ~35 % of the subject, flip it, fade it out downward.
  const REFL_FRAC = 0.35; // how much of subject height we mirror
  const srcH = sh * REFL_FRAC;
  const reflH = srcH; // same pixel height in output

  const rc = document.createElement("canvas");
  rc.width = sw;
  rc.height = reflH;
  const rCtx = rc.getContext("2d")!;

  // Flip vertically so the bottom of the subject is at the top of rc
  rCtx.save();
  rCtx.translate(0, reflH);
  rCtx.scale(1, -1);
  // Draw the bottom slice of the (already scaled) subject
  rCtx.drawImage(
    img,
    0,
    img.height * (1 - REFL_FRAC), // src y offset in original bitmap
    img.width,
    img.height * REFL_FRAC,
    0,
    0,
    sw,
    reflH,
  );
  rCtx.restore();

  // Fade reflection from semi-opaque at top to fully transparent at bottom
  const fadeGrad = rCtx.createLinearGradient(0, 0, 0, reflH);
  fadeGrad.addColorStop(0, "rgba(0,0,0,0.30)"); // keep a little at top
  fadeGrad.addColorStop(1, "rgba(0,0,0,1)"); // fully cut by bottom
  rCtx.globalCompositeOperation = "destination-in";
  rCtx.fillStyle = fadeGrad;
  rCtx.fillRect(0, 0, sw, reflH);

  // Blit reflection onto main canvas just below the subject
  const ry = sy + sh + 3;
  ctx.save();
  ctx.globalAlpha = 0.38;
  ctx.drawImage(rc, sx, ry);
  ctx.restore();

  // ── Bottom vignette ────────────────────────────────────────────────────────
  // Darkens the lower portion so the reflection fades into the background
  // rather than clipping abruptly.
  const vStart = H * 0.65;
  const vig = ctx.createLinearGradient(0, vStart, 0, H);
  vig.addColorStop(0, "rgba(4,8,16,0)");
  vig.addColorStop(0.55, "rgba(4,8,16,0.55)");
  vig.addColorStop(1, "rgba(4,8,16,0.92)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, vStart, W, H - vStart);

  // ── Export ─────────────────────────────────────────────────────────────────
  return new Promise<{ blob: Blob; dataUrl: string }>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas toBlob returned null"));
          return;
        }
        resolve({ blob, dataUrl: canvas.toDataURL("image/jpeg", 0.93) });
      },
      "image/jpeg",
      0.93,
    );
  });
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export interface UseImageProcessorReturn {
  /** Current stage of the pipeline */
  stage: ProcessingStage;
  /** 0-100 rough progress indicator */
  progress: number;
  /** Object-URL of the original file for side-by-side comparison */
  originalUrl: string;
  /** Final composited result; available when stage === 'done' */
  processedResult: ProcessedResult | null;
  /** Human-readable error string when stage === 'error' */
  error: string;
  /** Kick off the full pipeline for a given File */
  process: (file: File) => Promise<void>;
  /** Reset all state back to 'idle' */
  reset: () => void;
}

export function useImageProcessor(): UseImageProcessorReturn {
  const [stage, setStage] = useState<ProcessingStage>("idle");
  const [progress, setProgress] = useState(0);
  const [originalUrl, setOriginalUrl] = useState("");
  const [processedResult, setProcessedResult] =
    useState<ProcessedResult | null>(null);
  const [error, setError] = useState("");

  const process = useCallback(async (file: File) => {
    // Revoke any previous object URL to avoid memory leaks
    setOriginalUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });

    setStage("removing-bg");
    setProgress(8);
    setError("");
    setProcessedResult(null);

    const origUrl = URL.createObjectURL(file);
    setOriginalUrl(origUrl);

    try {
      // Stage 1 — AI background removal (WASM, runs in-browser)
      setProgress(15);
      const subjectBlob = await runBackgroundRemoval(file);
      setProgress(72);

      // Stage 2 — Canvas compositing
      setStage("compositing");
      setProgress(80);
      const result = await compositeOnCinematicBackground(subjectBlob);
      setProgress(100);

      setProcessedResult({ blob: result.blob, dataUrl: result.dataUrl });
      setStage("done");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Image processing failed.";
      setError(msg);
      setStage("error");
    }
  }, []);

  function reset() {
    setOriginalUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    setStage("idle");
    setProgress(0);
    setProcessedResult(null);
    setError("");
  }

  return { stage, progress, originalUrl, processedResult, error, process, reset };
}
