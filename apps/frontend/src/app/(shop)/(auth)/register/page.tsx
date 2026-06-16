"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { tenantConfig } from "@storefront/config";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { GoogleAuthButton } from "@/components/ui/GoogleAuthButton";

const STARS = Array.from({ length: 60 }, (_, i) => ({
  top: (i * 37) % 100,
  left: (i * 53) % 100,
  size: ((i * 7) % 2) + 1,
  opacity: ((i * 11) % 50) / 100 + 0.1,
  delay: `${((i * 3) % 30) / 10}s`,
}));

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleAuthSuccess() {
    router.push("/");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.auth.register(form);
      await login(form.email, form.password);
      router.push("/");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Registration failed. Please try again.",
      );
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col w-1/2 relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 30% 40%, rgba(124,58,237,0.3) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 80% 80%, rgba(37,99,235,0.2) 0%, transparent 50%), #050816",
        }}
      >
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
        <div
          className="orb w-80 h-80 bg-glow-purple opacity-20 animate-float top-[-10%] right-[-10%]"
          aria-hidden="true"
        />
        <div
          className="orb w-60 h-60 bg-glow-blue opacity-15 animate-float-slow bottom-[10%] left-[-5%]"
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
            <p className="badge-amber mb-5">
              Join thousands of happy customers
            </p>
            <h2 className="font-display font-black text-hero-sm text-white mb-4 leading-tight">
              Your journey
              <br />
              <span className="text-gradient">starts here.</span>
            </h2>
            <ul className="space-y-3 text-sm text-muted">
              {[
                "Exclusive member discounts",
                "Wishlist & order tracking",
                "Priority support",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-accent flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-dim">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-white hover:text-primary transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right — Form */}
      <div
        className="flex-1 flex items-center justify-center p-8 relative"
        style={{ background: "#080d1f" }}
      >
        <div
          className="absolute top-0 left-0 w-96 h-96 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at top left, rgba(37,99,235,0.08), transparent 60%)",
          }}
          aria-hidden="true"
        />

        <div className="w-full max-w-md relative z-10">
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
            Create account.
          </h1>
          <p className="text-muted mb-8">
            Join {tenantConfig.identity.shopName} today — it&apos;s free.
          </p>

          {/* ── Google sign-up ── */}
          <GoogleAuthButton
            onSuccess={handleAuthSuccess}
            label="Sign up with Google"
          />

          {/* ── Divider ── */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-dim font-medium">
              or register with email
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* ── Email/password form ── */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="reg-first"
                  className="block text-sm font-semibold text-muted mb-2"
                >
                  First name
                </label>
                <input
                  id="reg-first"
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                  className="input-dark"
                  placeholder="Anjula"
                />
              </div>
              <div>
                <label
                  htmlFor="reg-last"
                  className="block text-sm font-semibold text-muted mb-2"
                >
                  Last name
                </label>
                <input
                  id="reg-last"
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                  className="input-dark"
                  placeholder="Silva"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="block text-sm font-semibold text-muted mb-2"
              >
                Email address
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="input-dark"
                placeholder="hello@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="reg-pass"
                className="block text-sm font-semibold text-muted mb-2"
              >
                Password
              </label>
              <input
                id="reg-pass"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                className="input-dark"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
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
              disabled={loading}
              className="btn-primary w-full justify-center py-3.5 text-base"
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>

            <p className="text-center text-sm text-muted">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-white font-semibold hover:text-primary transition-colors"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
