"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { tenantConfig } from "@storefront/config";
import { useAuthStore } from "@/store/auth.store";
import { useWishlistStore } from "@/store/wishlist.store";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    thumbnail: string | null;
    images?: string[];
    brand: string | null;
    stockQuantity: number;
    averageRating: number;
    reviewCount: number;
    activeDiscount?: { label: string | null };
    discountedPrice?: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { currencySymbol } = tenantConfig.identity;
  const { features } = tenantConfig;

  const { accessToken } = useAuthStore();
  const { has, add, remove } = useWishlistStore();

  const isWishlisted = has(product.id);

  const hasDiscount =
    product.discountedPrice !== undefined &&
    product.discountedPrice < product.price;

  const inStock = product.stockQuantity > 0;

  const cardRef = useRef<HTMLAnchorElement | null>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  /*
   * Build slideshow images
   * Thumbnail first, then the remaining images
   */
  const slideshowImages = useMemo(() => {
    const imgs = [product.thumbnail, ...(product.images ?? [])].filter(
      Boolean,
    ) as string[];

    return [...new Set(imgs)].slice(0, 3);
  }, [product.thumbnail, product.images]);

  /*
   * Observe viewport visibility
   */
  useEffect(() => {
    const element = cardRef.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.3,
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  /*
   * Run slideshow ONLY while visible
   */
  useEffect(() => {
    if (!isVisible) return;

    if (slideshowImages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % slideshowImages.length);
    }, 2500);

    return () => clearInterval(timer);
  }, [isVisible, slideshowImages.length]);

  /*
   * Reset index if image list changes
   */
  useEffect(() => {
    setCurrentImage(0);
  }, [slideshowImages]);

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();

    if (!accessToken) {
      window.location.href = "/login";
      return;
    }

    try {
      if (isWishlisted) {
        await remove(product.id, accessToken);
      } else {
        await add(product.id, accessToken);
      }
    } catch {
      // silent
    }
  }

  const savings = hasDiscount
    ? Math.round(
        ((product.price - product.discountedPrice!) / product.price) * 100,
      )
    : 0;

  return (
    <Link
      ref={cardRef}
      href={`/products/${product.slug}`}
      className="card-cinematic group block"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-black">
        {slideshowImages.length > 0 ? (
          <>
            {slideshowImages.map((src, index) => (
              <Image
                key={`${src}-${index}`}
                src={src}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw"
                className={`
                  object-cover
                  transition-opacity duration-1000
                  ${index === currentImage ? "opacity-100" : "opacity-0"}
                `}
                priority={index === 0}
              />
            ))}
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-white/5">
            <svg
              className="w-12 h-12 text-white/20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
        )}

        {/* Shine */}
        <div className="absolute inset-0 bg-card-shine opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Slideshow indicators */}
        {slideshowImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slideshowImages.map((_, index) => (
              <span
                key={index}
                className={`
                  h-1.5 rounded-full transition-all duration-300
                  ${
                    index === currentImage
                      ? "w-5 bg-white"
                      : "w-1.5 bg-white/40"
                  }
                `}
              />
            ))}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {hasDiscount && (
            <span className="badge-amber text-xs">−{savings}%</span>
          )}

          {!inStock && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-white/10 border border-white/15 rounded-full text-white/60">
              Out of Stock
            </span>
          )}
        </div>

        {/* Wishlist */}
        {features.wishlist && (
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-8 h-8 glass border border-border-mid rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:border-red-400/50 hover:shadow-glow-sm"
            aria-label={
              isWishlisted ? "Remove from wishlist" : "Add to wishlist"
            }
          >
            <svg
              className={`w-4 h-4 transition-colors ${
                isWishlisted ? "text-red-400 fill-current" : "text-white"
              }`}
              fill={isWishlisted ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        {product.brand && (
          <p className="text-sm text-white uppercase tracking-widest mb-1 font-semibold">
            {product.brand}
          </p>
        )}

        <h3 className="text-sm font-semibold text-white/80 line-clamp-2 leading-snug mb-3 group-hover:text-white transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center justify-between">
          <div>
            {hasDiscount ? (
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold text-white">
                  {currencySymbol}
                  {product.discountedPrice!.toLocaleString()}
                </span>

                <span className="text-sm text-muted line-through">
                  {currencySymbol}
                  {product.price.toLocaleString()}
                </span>
              </div>
            ) : (
              <span className="text-base font-bold text-white">
                {currencySymbol}
                {product.price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Arrow */}
          <div className="w-7 h-7 rounded-full border border-border-mid flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:border-primary/50 group-hover:bg-primary/10">
            <svg
              className="w-3.5 h-3.5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
