"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { StarRating } from "@/components/ui/StarRating";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
  userFirstName?: string;
  userLastName?: string;
}

export function ReviewSection({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { accessToken, user } = useAuthStore();

  useEffect(() => {
    api.reviews
      .list(productId)
      .then((data) => setReviews(data as Review[]))
      .catch(() => {});
  }, [productId, submitted]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setLoading(true);
    try {
      await api.reviews.create({ productId, rating, title, body }, accessToken);
      setSubmitted(true);
      setShowForm(false);
    } catch {
      /* silent */
    }
    setLoading(false);
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white/80">
          Customer Reviews ({reviews.length})
        </h2>
        {user && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-primary border border-primary px-4 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-50 rounded-xl p-6 mb-8 space-y-4"
        >
          <h3 className="font-semibold text-foreground">
            Your review for {productName}
          </h3>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Rating *
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  aria-label={`${s} star`}
                >
                  <svg
                    className={`w-7 h-7 ${s <= rating ? "text-accent" : "text-gray-300"} hover:text-accent transition-colors`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="rev-title"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Title
            </label>
            <input
              id="rev-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label
              htmlFor="rev-body"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Review
            </label>
            <textarea
              id="rev-body"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60"
            >
              {loading ? "Submitting…" : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2 border border-gray-200 rounded-lg text-sm text-foreground hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="text-muted text-sm">
          No reviews yet. Be the first to review this product.
        </p>
      ) : (
        <div className="space-y-6">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-gray-100 pb-6">
              <div className="flex items-center gap-3 mb-2">
                <StarRating rating={r.rating} size="sm" />
                <span className="text-sm font-medium text-foreground">
                  {r.userFirstName} {r.userLastName}
                </span>
                <span className="text-xs text-muted">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
              {r.title && (
                <p className="text-sm font-medium text-foreground mb-1">
                  {r.title}
                </p>
              )}
              {r.body && <p className="text-sm text-muted">{r.body}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
