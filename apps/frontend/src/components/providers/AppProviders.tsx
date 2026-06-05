"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useWishlistStore } from "@/store/wishlist.store";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const { hydrate, accessToken } = useAuthStore();
  const loadWishlist = useWishlistStore((s) => s.load);

  useEffect(() => {
    // Restore session on mount
    hydrate().then(() => {
      const token = useAuthStore.getState().accessToken;
      if (token) loadWishlist(token);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
