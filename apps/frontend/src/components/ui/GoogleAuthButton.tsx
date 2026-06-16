"use client";

// apps/frontend/src/components/auth/GoogleAuthButton.tsx
//
// How this works:
//   - `GoogleLogin` from @react-oauth/google is the ONLY way to get an id_token
//     (credential) via @react-oauth/google without a backend code exchange.
//     `useGoogleLogin` with flow="implicit" gives an access_token — not an id_token.
//   - We render GoogleLogin invisibly and store a ref to its inner button.
//   - Our own styled button click → programmatically clicks the hidden Google button
//     → Google's account picker popup opens → onSuccess fires with credential (id_token)
//     → we POST it to our backend's POST /auth/google-login.
//   - This gives us a fully custom-styled button with zero extra network round trips.

import { useRef, useState } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuthStore } from "@/store/auth.store";
import { ApiError } from "@/lib/api";

interface Props {
  /** Called after backend auth succeeds — caller handles redirect */
  onSuccess: () => void;
  label?: string;
}

export function GoogleAuthButton({
  onSuccess,
  label = "Continue with Google",
}: Props) {
  const { googleLogin } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Ref to the hidden GoogleLogin wrapper div — we click inside it to trigger
  // Google's native account picker popup when our custom button is pressed.
  const hiddenGoogleRef = useRef<HTMLDivElement>(null);

  function handleOurButtonClick() {
    // Find and click the button that Google's SDK renders inside its div.
    // Google renders an <iframe> + a <div role="button"> we can programmatically click.
    const googleBtn =
      hiddenGoogleRef.current?.querySelector<HTMLElement>('[role="button"]');
    googleBtn?.click();
  }

  async function handleCredential(response: CredentialResponse) {
    if (!response.credential) {
      setError("No credential received from Google. Please try again.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // credential is a signed Google ID token (JWT).
      // Our backend verifies it with google-auth-library and issues our own JWT.
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

  function handleGoogleError() {
    setError("Google sign-in was cancelled or failed. Please try again.");
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      {/* ── Our custom styled button ─────────────────────────────────────────── */}
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

      {/* ── Hidden GoogleLogin — provides the real popup + id_token ─────────── */}
      {/* Invisible but present in DOM so the SDK can render and be clicked.    */}
      <div
        ref={hiddenGoogleRef}
        className="absolute opacity-0 pointer-events-none overflow-hidden h-0"
        aria-hidden="true"
      >
        <GoogleLogin
          onSuccess={handleCredential}
          onError={handleGoogleError}
          useOneTap={false}
          auto_select={false}
        />
      </div>

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

// ─── Icons ────────────────────────────────────────────────────────────────────

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
