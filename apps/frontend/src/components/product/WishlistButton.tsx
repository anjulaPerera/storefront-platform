"use client";

import { useAuthStore } from "@/store/auth.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { useRouter } from "next/navigation";

export function WishlistButton({ productId }: { productId: string }) {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const { has, add, remove } = useWishlistStore();
  const isWishlisted = has(productId);

  async function handleClick() {
    if (!accessToken) {
      router.push("/login");
      return;
    }
    try {
      isWishlisted
        ? await remove(productId, accessToken)
        : await add(productId, accessToken);
    } catch {
      /* silent */
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
        isWishlisted
          ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
          : "border-gray-600 text-white/60 hover:border-primary hover:text-primary"
      }`}
    >
      <svg
        className="w-4 h-4"
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
      {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
    </button>
  );
}
