"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.enquiries.create(form);
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again or call us directly.");
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="text-center py-14 glass rounded-2xl border border-border-mid">
        <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-7 h-7 text-green-400"
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
        </div>
        <p className="font-display font-bold text-xl text-white">
          Message received!
        </p>
        <p className="text-muted text-sm mt-2">
          We&apos;ll be in touch within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="contact-name"
          className="block text-sm font-semibold text-white/60 mb-2"
        >
          Name *
        </label>
        <input
          id="contact-name"
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Your name"
          className="input-dark"
        />
      </div>
      <div>
        <label
          htmlFor="contact-email"
          className="block text-sm font-semibold text-white/60 mb-2"
        >
          Email *
        </label>
        <input
          id="contact-email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="hello@example.com"
          className="input-dark"
        />
      </div>
      <div>
        <label
          htmlFor="contact-phone"
          className="block text-sm font-semibold text-white/60 mb-2"
        >
          Phone
        </label>
        <input
          id="contact-phone"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="+94 77 123 4567"
          className="input-dark"
        />
      </div>
      <div>
        <label
          htmlFor="contact-msg"
          className="block text-sm font-semibold text-white/60 mb-2"
        >
          Message *
        </label>
        <textarea
          id="contact-msg"
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder="How can we help you?"
          className="input-dark resize-none"
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
        className="btn-primary w-full justify-center py-3.5"
      >
        {loading ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
