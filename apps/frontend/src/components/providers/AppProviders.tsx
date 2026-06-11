"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useWishlistStore } from "@/store/wishlist.store";

export function AppProviders({ children }: { children: React.ReactNode }) {
  // Use selectors to prevent unnecessary re-renders
  const hydrate = useAuthStore((s) => s.hydrate);
  const loadWishlist = useWishlistStore((s) => s.load);

  // Guard against React Strict Mode double-mounting in dev
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    void hydrate().then(() => {
      // Use getState() so we don't subscribe to token changes here
      const token = useAuthStore.getState().accessToken;
      if (token) {
        void loadWishlist(token);
      }
    });
  }, [hydrate, loadWishlist]);

  return <>{children}</>;
}
