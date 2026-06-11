"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "customer" | "admin" | "super_admin";
  isActive: boolean;
  emailVerified: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isHydrated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  hydrate: () => Promise<void>;
}

// Held outside Zustand state — purely internal, never needs to trigger re-renders
let _hydrateInFlight = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: false,
  isHydrated: false,

  setAuth: (user, accessToken) => set({ user, accessToken }),
  clearAuth: () => set({ user: null, accessToken: null }),

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = (await api.auth.login(email, password)) as {
        user: User;
        accessToken: string;
      };
      set({ user: data.user, accessToken: data.accessToken, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    const { accessToken } = get();
    try {
      if (accessToken) await api.auth.logout(accessToken);
    } catch {
      /* ignore */
    }
    set({ user: null, accessToken: null });
  },

  hydrate: async () => {
    // Bail if already done OR if a call is already in-flight
    if (get().isHydrated || _hydrateInFlight) return;
    _hydrateInFlight = true;
    set({ isLoading: true });

    try {
      const data = (await api.auth.refresh()) as { accessToken: string };
      const user = (await api.auth.me(data.accessToken)) as { user: User };
      set({
        user: user.user,
        accessToken: data.accessToken,
        isLoading: false,
        isHydrated: true,
      });
    } catch (err) {
      // 401 = no active session (expected on first visit / after logout)
      if (process.env.NODE_ENV !== "production") {
        console.warn("[auth] hydrate failed:", err);
      }
      set({
        user: null,
        accessToken: null,
        isLoading: false,
        isHydrated: true,
      });
    } finally {
      _hydrateInFlight = false;
    }
  },
}));
