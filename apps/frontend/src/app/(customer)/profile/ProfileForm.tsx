"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { apiFetch } from "@/lib/api";

export function ProfileForm() {
  const router = useRouter();
  const { user, accessToken, setAuth } = useAuthStore();

  // ✅ Initialize state directly from store data if present to prevent cascading re-renders
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // ✅ Keep useEffect dedicated strictly to navigation guard logic
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

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

  if (!user) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="prof-first"
            className="block text-sm font-medium text-foreground mb-1"
          >
            First Name
          </label>
          <input
            id="prof-first"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label
            htmlFor="prof-last"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Last Name
          </label>
          <input
            id="prof-last"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="prof-email"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Email
        </label>
        <input
          id="prof-email"
          type="email"
          value={user.email}
          disabled
          className="w-full border border-gray-100 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-muted cursor-not-allowed"
        />
        <p className="text-xs text-muted mt-1">
          Email address cannot be changed here.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted">Role:</span>
        <span className="text-sm font-medium capitalize text-foreground">
          {user.role.replace("_", " ")}
        </span>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
          Profile saved successfully.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-8 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-60 transition-colors"
      >
        {loading ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}
