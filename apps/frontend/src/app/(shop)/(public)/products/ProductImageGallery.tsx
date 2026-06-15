"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-gray-50 flex items-center justify-center">
        <span className="text-gray-400">No Image</span>
      </div>
    );
  }

  const currentImage = images[selectedImage];

  const previous = () => {
    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const next = () => {
    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div>
      {/* Main image */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50">
        <Image
          src={currentImage}
          alt={`${productName} ${selectedImage + 1}`}
          fill
          priority
          className="object-contain"
          sizes="(max-width:1024px) 100vw, 50vw"
        />

        {/* Previous */}
        {images.length > 1 && (
          <button
            onClick={previous}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-10 h-10 flex items-center justify-center shadow"
          >
            ‹
          </button>
        )}

        {/* Next */}
        {images.length > 1 && (
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-10 h-10 flex items-center justify-center shadow"
          >
            ›
          </button>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 mt-4 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setSelectedImage(index)}
              aria-label={`View image ${index + 1} of ${images.length} for ${productName}`}
              aria-current={selectedImage === index ? "true" : undefined}
              className={`
    relative w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0
    ${selectedImage === index ? "border-primary" : "border-transparent"}
  `}
            >
              <Image
                src={image}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
