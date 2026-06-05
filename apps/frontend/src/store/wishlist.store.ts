"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

interface WishlistState {
  productIds: Set<string>;
  isLoading: boolean;

  load: (token: string) => Promise<void>;
  add: (productId: string, token: string) => Promise<void>;
  remove: (productId: string, token: string) => Promise<void>;
  has: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  productIds: new Set<string>(),
  isLoading: false,

  has: (productId) => get().productIds.has(productId),

  clear: () => set({ productIds: new Set<string>() }),

  load: async (token) => {
    try {
      const items = (await api.wishlist.get(token)) as Array<{
        productId: string;
      }>;
      set({ productIds: new Set<string>(items.map((i) => i.productId)) });
    } catch {
      /* unauthenticated — silent */
    }
  },

  add: async (productId, token) => {
    // Optimistic update — add immediately
    set((s) => {
      const next = new Set<string>(s.productIds);
      next.add(productId);
      return { productIds: next };
    });
    try {
      await api.wishlist.add(productId, token);
    } catch {
      // Rollback on failure
      set((s) => {
        const next = new Set<string>(s.productIds);
        next.delete(productId);
        return { productIds: next };
      });
      throw new Error("Failed to add to wishlist");
    }
  },

  remove: async (productId, token) => {
    // Optimistic update — remove immediately
    set((s) => {
      const next = new Set<string>(s.productIds);
      next.delete(productId);
      return { productIds: next };
    });
    try {
      await api.wishlist.remove(productId, token);
    } catch {
      // Rollback on failure
      set((s) => {
        const next = new Set<string>(s.productIds);
        next.add(productId);
        return { productIds: next };
      });
      throw new Error("Failed to remove from wishlist");
    }
  },
}));
