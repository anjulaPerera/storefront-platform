"use client";

import { useEffect, useRef } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useAuthStore } from "@/store/auth.store";
import { useWishlistStore } from "@/store/wishlist.store";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  const loadWishlist = useWishlistStore((s) => s.load);

  // Guard against React Strict Mode double-mounting in dev
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    void hydrate().then(() => {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        void loadWishlist(token);
      }
    });
  }, [hydrate, loadWishlist]);

  // GoogleOAuthProvider is a context provider — it must wrap the entire tree
  // so that GoogleLogin (used inside GoogleAuthButton) can read the client ID.
  // AppProviders is already "use client", so no extra wrapper file needed.
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      {children}
    </GoogleOAuthProvider>
  );
}
