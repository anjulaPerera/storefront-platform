"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useWishlistStore } from "@/store/wishlist.store";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const { hydrate } = useAuthStore();
  const loadWishlist = useWishlistStore((s) => s.load);

  useEffect(() => {
    void hydrate().then(() => {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        void loadWishlist(token);
      }
    });
  }, [hydrate, loadWishlist]);

  return <>{children}</>;
}
