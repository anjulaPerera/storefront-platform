"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { tenantConfig } from "@storefront/config";
import { useAuthStore } from "@/store/auth.store";

const STARS = Array.from({ length: 60 }, (_, i) => ({
  top: (i * 37) % 100,
  left: (i * 53) % 100,
  size: ((i * 7) % 2) + 1,
  opacity: ((i * 11) % 50) / 100 + 0.1,
  delay: `${((i * 3) % 30) / 10}s`,
}));

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      router.push("/");
    } catch {
      setError("Invalid email or password. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Cinematic branding panel */}
      <div
        className="hidden lg:flex flex-col w-1/2 relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 30% 40%, rgba(37,99,235,0.35) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 80% 80%, rgba(124,58,237,0.2) 0%, transparent 50%), #050816",
        }}
      >
        {/* Stars */}
        {STARS.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-twinkle pointer-events-none"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              opacity: s.opacity,
              animationDelay: s.delay,
            }}
          />
        ))}

        {/* Orbs */}
        <div
          className="orb w-80 h-80 bg-glow-blue opacity-20 animate-float top-[-10%] left-[-10%]"
          aria-hidden="true"
        />
        <div
          className="orb w-60 h-60 bg-glow-purple opacity-15 animate-float-slow bottom-[10%] right-[-5%]"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col justify-between h-full p-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-glow-sm">
              <span className="font-display font-bold text-white">R</span>
            </div>
            <span className="font-display font-bold text-xl text-white">
              {tenantConfig.identity.shopName}
            </span>
          </Link>

          <div>
            <h2 className="font-display font-black text-hero-sm text-white mb-4 leading-tight">
              The future in
              <br />
              <span className="text-gradient">your hands.</span>
            </h2>
            <p className="text-muted max-w-xs leading-relaxed">
              {tenantConfig.identity.tagline}
            </p>
          </div>

          <div className="flex gap-6 text-sm text-dim">
            <span>{tenantConfig.identity.phone}</span>
            <span>·</span>
            <span>{tenantConfig.identity.email}</span>
          </div>
        </div>
      </div>

      {/* Right — Form panel */}
      <div
        className="flex-1 flex items-center justify-center p-8 relative"
        style={{ background: "#080d1f" }}
      >
        {/* Top glow */}
        <div
          className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at top right, rgba(124,58,237,0.12), transparent 60%)",
          }}
          aria-hidden="true"
        />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="font-display font-bold text-white text-sm">
                R
              </span>
            </div>
            <span className="font-display font-bold text-white">
              {tenantConfig.identity.shopName}
            </span>
          </Link>

          <h1 className="font-display font-black text-3xl text-white mb-2">
            Welcome back.
          </h1>
          <p className="text-muted mb-10">
            Sign in to your account to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-semibold text-muted mb-2"
              >
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-dark"
                placeholder="hello@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="login-password"
                  className="text-sm font-semibold text-muted"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-dark"
                placeholder="••••••••"
              />
            </div>

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

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-3.5 text-base"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
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
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>

            <p className="text-center text-sm text-muted">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-white font-semibold hover:text-primary transition-colors"
              >
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
