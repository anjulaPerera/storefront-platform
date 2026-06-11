"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { tenantConfig } from "@storefront/config";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { useWishlistStore } from "@/store/wishlist.store"; 

interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: {
    name: string;
    slug: string;
    price: number;
    thumbnail: string | null;
    stockQuantity: number;
    discountedPrice?: number;
  };
}

export default function WishlistPage() {
  const router = useRouter();
  const { user, accessToken, isHydrated, isLoading } = useAuthStore();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { currencySymbol } = tenantConfig.identity;
  const removeFromStore = useWishlistStore((s) => s.remove);

useEffect(() => {
  console.log("ITEMS CHANGED", items);
}, [items]);

  useEffect(() => {
    // Wait for session restore to complete before deciding to redirect.
    // Without this, a page refresh sees user=null for ~200ms and bounces
    // to /login even though the session is perfectly valid.
 console.log("AUTH STATE", {
   user,
   accessToken,
   isHydrated,
   isLoading,
 });


    if (!isHydrated || isLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
     if (!accessToken) {
       setLoading(false); 
       return;
     }

    api.wishlist
      .get(accessToken)
      .then((data) => setItems(data as WishlistItem[]))
      .catch((err) => {console.error("WISHLIST ERROR", err);})
      .finally(() => setLoading(false));
  }, [user, accessToken, isHydrated, isLoading, router]);

  async function removeItem(productId: string) {
    if (!accessToken) return;
      try {
        await removeFromStore(productId, accessToken);
        setItems((prev) => prev.filter((i) => i.productId !== productId));
      } catch {
        // store already rolls back productIds on failure
      }
  }

  if (loading) {
    console.log("RENDER", {
      loading,
      itemCount: items.length,
      user,
      accessToken: !!accessToken,
    });
    return (
      <div className="max-w-4xl mx-auto px-4 pt-24">
        <h1 className="text-2xl font-bold text-white/80 mb-8">My Wishlist</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-gray-100 aspect-square animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
      <h1 className="text-2xl font-bold text-white/80 mb-2">My Wishlist</h1>
      <p className="text-muted mb-8">
        {items.length} item{items.length !== 1 ? "s" : ""} saved
      </p>

      {items.length === 0 ? (
        <div className="text-center pt-16 pb-28">
          <svg
            className="w-12 h-12 text-gray-200 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <p className="text-muted">Your wishlist is empty.</p>
          <Link
            href="/products"
            className="inline-block mt-4 text-sm text-primary hover:underline"
          >
            Browse Products →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative bg-surface rounded-xl border border-gray-100 overflow-hidden"
            >
              <Link href={`/products/${item.product.slug}`}>
                <div className="relative aspect-square bg-gray-50">
                  {item.product.thumbnail ? (
                    <Image
                      src={item.product.thumbnail}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-200">
                      <svg
                        className="w-12 h-12"
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
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-foreground line-clamp-2">
                    {item.product.name}
                  </p>
                  <p className="text-sm font-bold text-primary mt-1">
                    {currencySymbol}
                    {(
                      item.product.discountedPrice ?? item.product.price
                    ).toLocaleString()}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => removeItem(item.productId)}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm hover:bg-red-50 text-muted hover:text-red-500 transition-colors"
                aria-label="Remove from wishlist"
              >
                <svg
                  className="w-4 h-4"
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
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
