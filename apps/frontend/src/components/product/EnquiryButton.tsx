"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface EnquiryButtonProps {
  product: { id: string; name: string };
}

export function EnquiryButton({ product }: EnquiryButtonProps) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.enquiries.create({ ...form, productId: product.id });
      setSent(true);
    } catch {
      /* silent */
    }
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
      >
        Enquire Now
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">
                Enquire about {product.name}
              </h3>
              <button
                onClick={() => {
                  setOpen(false);
                  setSent(false);
                }}
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5 text-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {sent ? (
              <div className="text-center py-8">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-foreground font-medium">Enquiry sent!</p>
                <p className="text-sm text-muted mt-1">
                  We&apos;ll get back to you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="enq-name"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Name *
                  </label>
                  <input
                    id="enq-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label
                    htmlFor="enq-email"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Email *
                  </label>
                  <input
                    id="enq-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label
                    htmlFor="enq-phone"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Phone
                  </label>
                  <input
                    id="enq-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label
                    htmlFor="enq-msg"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Message *
                  </label>
                  <textarea
                    id="enq-msg"
                    required
                    rows={3}
                    value={form.message}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, message: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
                >
                  {loading ? "Sending…" : "Send Enquiry"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
