"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.auth.login(email, "");
    } catch {
      /* expected */
    }
    // Use the forgot-password endpoint directly
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      /* silent */
    }
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Forgot Password
          </h1>
          <p className="text-muted mt-1">We&apos;ll send you a reset link</p>
        </div>

        <div className="bg-surface rounded-2xl border border-gray-100 p-8 shadow-sm">
          {sent ? (
            <div className="text-center py-4">
              <svg
                className="w-12 h-12 text-green-500 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <p className="font-medium text-foreground">Check your email</p>
              <p className="text-sm text-muted mt-1">
                If that address is registered, you&apos;ll receive a reset link
                shortly.
              </p>
              <Link
                href="/login"
                className="block mt-4 text-sm text-primary hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="fp-email"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Email address
                </label>
                <input
                  id="fp-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
              <p className="text-center text-sm">
                <Link href="/login" className="text-primary hover:underline">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
