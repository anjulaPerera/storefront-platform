"use client";

import { create } from "zustand";

interface UIState {
  mobileMenuOpen: boolean;
  chatOpen: boolean;
  searchOpen: boolean;

  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleChat: () => void;
  openSearch: () => void;
  closeSearch: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  mobileMenuOpen: false,
  chatOpen: false,
  searchOpen: false,

  toggleMobileMenu: () => set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),
  closeMobileMenu: () => set({ mobileMenuOpen: false }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
}));
