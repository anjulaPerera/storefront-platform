"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types (mirror your Product from products.service.ts) ─────────────────────

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  price: number;
  categoryName?: string;
  thumbnail: string | null;
  updatedAt: string;
  // Full product data for pre-filling
  categoryId: string;
  description: string | null;
  stockQuantity: number;
  sku: string | null;
  attributes: Record<string, unknown>;
  images: string[];
  externalLink: string | null;
  isFeatured: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
}

export type MatchAction = "edit" | "duplicate" | "create_new";

interface ProductNameLookupProps {
  /** All products already loaded in the admin panel */
  products: ProductSummary[];
  /** Current value of the name input */
  value: string;
  /** Called on every keystroke — wire to your form's name field setter */
  onChange: (name: string) => void;
  /**
   * Called when the user picks an action from the match card.
   * `product` is the matched product; use it to pre-fill your form.
   * `action`:
   *   "edit"       → pre-fill everything, keep the same product id for PUT /products/:id
   *   "duplicate"  → pre-fill everything except id/sku, POST /products (new record)
   *   "create_new" → dismiss the card, let the user keep typing
   */
  onMatch: (product: ProductSummary, action: MatchAction) => void;
  /** Input class names forwarded to the <input> */
  className?: string;
  disabled?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Score 0–3: 3 = exact, 2 = starts-with, 1 = contains, 0 = no match */
function matchScore(query: string, name: string): number {
  const q = normalize(query);
  const n = normalize(name);
  if (!q || q.length < 2) return 0;
  if (n === q) return 3;
  if (n.startsWith(q)) return 2;
  if (n.includes(q)) return 1;
  return 0;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductNameLookup({
  products,
  value,
  onChange,
  onMatch,
  className = "",
  disabled = false,
}: ProductNameLookupProps) {
  const [match, setMatch] = useState<ProductSummary | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const prevValue = useRef(value);

  // Re-show card whenever the user changes the name after dismissing
  useEffect(() => {
    if (value !== prevValue.current) {
      setDismissed(false);
      prevValue.current = value;
    }
  }, [value]);

  // Find best match from in-memory products
  useEffect(() => {
    if (dismissed) {
      setMatch(null);
      return;
    }

    const best = products
      .map((p) => ({ p, score: matchScore(value, p.name) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)[0];

    setMatch(best ? best.p : null);
  }, [value, products, dismissed]);

  function handleAction(action: MatchAction) {
    if (!match) return;
    if (action === "create_new") {
      setDismissed(true);
    } else {
      onMatch(match, action);
      setDismissed(true);
    }
  }

  return (
    <div className="relative w-full">
      {/* Name input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="e.g. iPhone 16 Pro"
        className={className}
      />

      {/* Match card */}
      {match && !dismissed && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-yellow-200 bg-yellow-50 shadow-lg dark:border-yellow-800 dark:bg-yellow-950">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-yellow-700 dark:text-yellow-400">
              Existing product found
            </span>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-300 text-lg leading-none"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>

          {/* Product summary */}
          <div className="flex items-center gap-3 px-4 py-2">
            {match.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={match.thumbnail}
                alt={match.name}
                className="h-10 w-10 rounded-md object-cover border border-yellow-200"
              />
            )}
            <div className="min-w-0">
              <p className="truncate font-medium text-sm text-gray-900 dark:text-gray-100">
                {match.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {[match.brand, match.categoryName].filter(Boolean).join(" · ")}
                {" · "}
                <span>Updated {timeAgo(match.updatedAt)}</span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 px-4 pb-3 pt-1">
            <button
              type="button"
              onClick={() => handleAction("edit")}
              className="flex-1 rounded-lg bg-yellow-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-yellow-700 transition-colors"
            >
              Edit Existing
            </button>
            <button
              type="button"
              onClick={() => handleAction("duplicate")}
              className="flex-1 rounded-lg border border-yellow-400 px-3 py-1.5 text-xs font-semibold text-yellow-800 hover:bg-yellow-100 dark:text-yellow-300 dark:hover:bg-yellow-900 transition-colors"
            >
              Duplicate
            </button>
            <button
              type="button"
              onClick={() => handleAction("create_new")}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            >
              Create New
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
