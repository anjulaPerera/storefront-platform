"use client";

import Link from "next/link";
import Image from "next/image";
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

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    if (!accessToken) {
      window.location.href = "/login";
      return;
    }
    try {
      isWishlisted
        ? await remove(product.id, accessToken)
        : await add(product.id, accessToken);
    } catch {
      /* silent */
    }
  }

  const savings = hasDiscount
    ? Math.round(
        ((product.price - product.discountedPrice!) / product.price) * 100,
      )
    : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="card-cinematic group block"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-space-3">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-16 h-16 text-white/10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Shine on hover */}
        <div className="absolute inset-0 bg-card-shine opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

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
              className={`w-4 h-4 transition-colors ${isWishlisted ? "text-red-400 fill-current" : "text-white"}`}
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
          <p className="text-xs text-muted uppercase tracking-widest mb-1 font-semibold">
            {product.brand}
          </p>
        )}
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug mb-3 group-hover:text-white transition-colors">
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

          {/* Arrow hint */}
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
