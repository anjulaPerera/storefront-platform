"use client";

import Link from "next/link";
import Image from "next/image";
import { tenantConfig } from "@storefront/config";
import { StarRating } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/Badge";
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

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block bg-surface rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasDiscount && (
            <Badge variant="danger" className="text-xs">
              {product.activeDiscount?.label ?? "Sale"}
            </Badge>
          )}
          {features.stockBadge && !inStock && (
            <Badge variant="outline" className="text-xs bg-white">
              Out of Stock
            </Badge>
          )}
        </div>

        {/* Wishlist button */}
        {features.wishlist && (
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors"
            aria-label={
              isWishlisted ? "Remove from wishlist" : "Add to wishlist"
            }
          >
            <svg
              className={`w-4 h-4 ${isWishlisted ? "text-red-500 fill-current" : "text-gray-400"}`}
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
      <div className="p-3">
        {product.brand && (
          <p className="text-xs text-muted mb-0.5">{product.brand}</p>
        )}
        <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1.5 mt-1">
            <StarRating rating={product.averageRating} size="sm" />
            <span className="text-xs text-muted">({product.reviewCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mt-2">
          {hasDiscount ? (
            <>
              <span className="text-base font-bold text-primary">
                {currencySymbol}
                {product.discountedPrice!.toLocaleString()}
              </span>
              <span className="text-sm text-muted line-through">
                {currencySymbol}
                {product.price.toLocaleString()}
              </span>
            </>
          ) : (
            <span className="text-base font-bold text-foreground">
              {currencySymbol}
              {product.price.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
