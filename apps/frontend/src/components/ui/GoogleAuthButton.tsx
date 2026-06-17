"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { ApiError } from "@/lib/api";

interface Props {
  /** Called after backend auth succeeds — caller handles redirect */
  onSuccess: () => void;
  label?: string;
}

// Ensure TypeScript knows window.google exists
declare global {
  interface Window {
    google?: any;
    __googleAuthInitialized?: boolean;
  }
}

export function GoogleAuthButton({
  onSuccess,
  label = "Continue with Google",
}: Props) {
  const { googleLogin } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Use a ref to store our callback function so it always accesses the latest closure variables
  const callbackRef = useRef<any>(null);

  // Define what happens when a credential is successfully returned
  async function handleCredential(response: any) {
    if (!response.credential) {
      setError("No credential received from Google. Please try again.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await googleLogin(response.credential);
      onSuccess();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Google sign-in failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  // Update our ref whenever dependencies change
  useEffect(() => {
    callbackRef.current = handleCredential;
  });

  useEffect(() => {
    const initGoogleGSI = () => {
      if (!window.google?.accounts?.id) return;

      // ─── CRITICAL FIX ───
      // Check a custom global flag to prevent double-initialization warnings
      if (!window.__googleAuthInitialized) {
        window.google.accounts.id.initialize({
          // Use your environment variable client ID here
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          // Always invoke our ref so we get the most up to date closure scope
          callback: (res: any) => callbackRef.current?.(res),
          ux_mode: "popup",
        });
        window.__googleAuthInitialized = true;
      }
    };

    if (window.google) {
      initGoogleGSI();
    } else {
      // Fallback in case script hasn't loaded yet
      const script = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]',
      );
      script?.addEventListener("load", initGoogleGSI);
      return () => script?.removeEventListener("load", initGoogleGSI);
    }
  }, []);

function handleOurButtonClick() {
  if (!window.google?.accounts?.id) {
    setError(
      "Google authentication script is still loading. Please try again in a second.",
    );
    return;
  }

  // Double-check if initialization was skipped or delayed
  if (!window.__googleAuthInitialized) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Missing Google Client ID configuration.");
      console.error(
        "NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing from frontend environment.",
      );
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (res: any) => callbackRef.current?.(res),
      ux_mode: "popup",
    });
    window.__googleAuthInitialized = true;
  }

  // Safely trigger the prompt once we guarantee initialization
  window.google.accounts.id.prompt();
}

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading}
        onClick={handleOurButtonClick}
        className="
          w-full flex items-center justify-center gap-3
          px-4 py-3 rounded-xl
          bg-white/5 hover:bg-white/10 active:bg-white/15
          border border-white/10 hover:border-white/20
          text-white text-sm font-semibold
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {loading ? <Spinner /> : <GoogleIcon />}
        {loading ? "Signing in…" : label}
      </button>

      {/* ── Error message ────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <svg
            className="w-4 h-4 text-red-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}

// ─── Icons unchanged (Spinner & GoogleIcon) ───────────────────────────────────
function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
