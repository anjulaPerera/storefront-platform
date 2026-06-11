"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

export function ProfileForm() {
  const router = useRouter();
  const { user, accessToken, setAuth, isHydrated, isLoading } = useAuthStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isHydrated || isLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }
    setFirstName(user.firstName);
    setLastName(user.lastName);
  }, [user, isHydrated, isLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !accessToken) return;
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const updated = await apiFetch<typeof user>(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ firstName, lastName }),
        token: accessToken,
        cache: "no-store",
      });
      setAuth(updated, accessToken);
      setSaved(true);
    } catch {
      setError("Failed to save. Please try again.");
    }
    setLoading(false);
  }

 if (!isHydrated || isLoading) {
   return <div className="py-10">Loading profile...</div>;
 }

 if (!user) {
   return null;
 }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass rounded-2xl border border-border-mid p-8 space-y-6"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="prof-first"
            className="block text-sm font-semibold text-white/60 mb-2"
          >
            First Name
          </label>
          <input
            id="prof-first"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="input-dark"
          />
        </div>
        <div>
          <label
            htmlFor="prof-last"
            className="block text-sm font-semibold text-white/60 mb-2"
          >
            Last Name
          </label>
          <input
            id="prof-last"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="input-dark"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="prof-email"
          className="block text-sm font-semibold text-white/60 mb-2"
        >
          Email
        </label>
        <input
          id="prof-email"
          type="email"
          value={user.email}
          disabled
          className="input-dark opacity-40 cursor-not-allowed"
        />
        <p className="text-xs text-white/30 mt-1.5">
          Email address cannot be changed here.
        </p>
      </div>
      {user.role !== "customer" && (
        <span className="text-xs text-muted capitalize">{user.role}</span>
      )}
      <Link
        href="/wishlist"
        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group"
      >
        <svg
          className="w-5 h-5 text-muted group-hover:text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <span className="text-sm font-medium text-muted group-hover:text-white">
          My Wishlist
        </span>
      </Link>
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
          <svg
            className="w-4 h-4 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p className="text-sm text-green-400">Profile saved successfully.</p>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary px-8 py-3"
      >
        {loading ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}
