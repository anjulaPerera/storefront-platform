"use client";

import Image from "next/image";
import { useRef, useState, useCallback } from "react";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
// Endpoint targeting your dedicated Python container service
const REMBG_SERVICE_URL =
  process.env.NEXT_PUBLIC_REMBG_SERVICE_URL || "http://localhost:8000";

interface MultiImageUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  label?: string;
}

async function uploadToCloudinary(
  blob: Blob,
  filename: string,
): Promise<string> {
  const fd = new FormData();
  fd.append("file", blob, filename);
  fd.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
    },
  );

  if (!res.ok) {
    throw new Error("Cloudinary upload execution failed");
  }

  const data = await res.json();
  return data.secure_url;
}

// Emulates your existing studio cinematic background composition layer
async function compositeOnCinematicBackground(imageBlob: Blob): Promise<Blob> {
  return new Promise((resolve) => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(imageBlob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(imageBlob);
        return;
      }

      // 1. Render Cinematic Gradient Background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#1a1c23");
      gradient.addColorStop(0.5, "#0d0e12");
      gradient.addColorStop(1, "#020203");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Studio floor glow
      const radialGlow = ctx.createRadialGradient(540, 750, 50, 540, 750, 450);
      radialGlow.addColorStop(0, "rgba(99, 102, 241, 0.15)");
      radialGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Composite Foreground Subject
      const maxW = 800;
      const maxH = 800;
      let w = img.width;
      let h = img.height;

      if (w > maxW || h > maxH) {
        const ratio = Math.min(maxW / w, maxH / h);
        w *= ratio;
        h *= ratio;
      }

      const x = (canvas.width - w) / 2;
      const y = (canvas.height - h) / 2 + 30; // Positioned with slight downward baseline adjustment

      // Ambient contact drop shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
      ctx.shadowBlur = 45;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 25;

      ctx.drawImage(img, x, y, w, h);

      canvas.toBlob(
        (outputBlob) => {
          resolve(outputBlob || imageBlob);
        },
        "image/jpeg",
        0.92,
      );
    };

    img.onerror = () => {
      resolve(imageBlob);
    };
  });
}

export default function SmartImageUpload({
  values,
  onChange,
  label,
}: MultiImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const processAndUploadFile = useCallback(
    async (file: File) => {
      setProcessing(true);
      setStatusMessage("Isolating foreground objects...");

      let workingBlob: Blob = file;

      try {
        // Execute microservice backend call
        const rembgFormData = new FormData();
        rembgFormData.append("file", file);

        const rembgResponse = await fetch(
          `${REMBG_SERVICE_URL}/remove-background`,
          {
            method: "POST",
            body: rembgFormData,
            signal: AbortSignal.timeout(12000), // 12-second processing fallback timeout window
          },
        );

        if (rembgResponse.ok) {
          workingBlob = await rembgResponse.blob();
          setStatusMessage("Applying cinematic composites...");
        } else {
          console.warn(
            "Python rembg service returned error status. Using original image directly.",
          );
          setStatusMessage("Service busy. Defaulting to original layout...");
        }
      } catch (err) {
        console.error("Failed to reach Python microservice:", err);
        // Fallback strategy active: workflow continues uninterrupted using original asset
        setStatusMessage("Network fallback active. Direct routing applied...");
      }

      try {
        // Execute the required cinematic composition step
        const compositedBlob =
          await compositeOnCinematicBackground(workingBlob);

        setStatusMessage("Saving to store repository...");
        const finalCloudinaryUrl = await uploadToCloudinary(
          compositedBlob,
          `prod_${Date.now()}.jpg`,
        );

        onChange([...values, finalCloudinaryUrl]);
      } catch (uploadError) {
        console.error("Cloudinary save operation failure:", uploadError);
        alert(
          "Error finalizing image upload pipeline. Please check internet visibility configurations.",
        );
      } finally {
        setProcessing(false);
        setStatusMessage("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [values, onChange],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  const removeImage = (indexToRemove: number) => {
    onChange(values.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {values.map((url, index) => (
          <div
            key={url}
            className="relative group aspect-square rounded-lg overflow-hidden bg-slate-900 border border-slate-800"
          >
            <Image
              src={url}
              alt="Product Preview"
              fill
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 bg-red-600/90 text-white p-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
            {index === 0 && (
              <span className="absolute bottom-2 left-2 bg-indigo-600 text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">
                Cover Cover
              </span>
            )}
          </div>
        ))}

        {processing ? (
          <div className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-indigo-500 bg-indigo-950/20 text-center p-4 space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            <p className="text-xs text-indigo-300 font-medium animate-pulse">
              {statusMessage}
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-slate-700 bg-slate-900/50 hover:bg-slate-900 transition-colors text-slate-400 hover:text-indigo-400"
          >
            <span className="text-2xl font-light">+</span>
            <span className="text-xs mt-1">Studio Upload</span>
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={processing}
      />
    </div>
  );
}
