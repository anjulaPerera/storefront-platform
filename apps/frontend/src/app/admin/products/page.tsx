"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { tenantConfig } from "@storefront/config";
import { useAuthStore } from "@/store/auth.store";
import { api, ApiError } from "@/lib/api";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminModal } from "@/components/admin/AdminModal";
import { AttributeEditor } from "@/components/admin/AttributeEditor";
// import { ImageUpload } from "../ImageUpload";
import { SmartImageUpload } from "../SmartImageUpload";
import { Badge } from "@/components/ui/Badge";
import { useAdminData } from "@/hooks/useAdminData";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  stockQuantity: number;
  brand: string | null;
  thumbnail: string | null;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
  categoryName?: string;
  description: string | null;
  sku: string | null;
  externalLink: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  attributes: Record<string, unknown>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface GeneratedContent {
  description: string;
  metaTitle: string;
  metaDescription: string;
  keyFeatures: string[];
  attributes?: Record<string, string>;
}

const EMPTY_FORM = {
  categoryId: "",
  name: "",
  description: "",
  price: "",
  stockQuantity: "0",
  sku: "",
  brand: "",
  thumbnail: "",
  externalLink: "",
  isFeatured: false,
  isActive: true,
  metaTitle: "",
  metaDescription: "",
  attributes: {} as Record<string, unknown>,
};

const PAGE_SIZE = 10;

export default function AdminProductsPage() {
  const { accessToken } = useAuthStore();
  const { currencySymbol } = tenantConfig.identity;

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Pagination
  const [page, setPage] = useState(1);

  // AI generation state
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [generatedPreview, setGeneratedPreview] =
    useState<GeneratedContent | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "new") {
      setShowForm(true);
    }
  }, []);

  const { data, loading, reload } = useAdminData(
    (token) =>
      Promise.all([
        api.admin.listAllProducts(token) as Promise<Product[]>,
        api.admin.listAllCategories(token) as Promise<Category[]>,
      ]).then(([products, categories]) => ({ products, categories })),
    accessToken,
  );

  const products = data?.products ?? [];
  const categories = data?.categories ?? [];

  // Reset to page 1 whenever the product list reloads
  useEffect(() => {
    setPage(1);
  }, [data]);

  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const visibleProducts = products.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setGenerateError("");
    setGeneratedPreview(null);
    setShowPreview(false);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      categoryId: p.categoryId,
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      stockQuantity: String(p.stockQuantity),
      sku: p.sku ?? "",
      brand: p.brand ?? "",
      thumbnail: p.thumbnail ?? "",
      externalLink: p.externalLink ?? "",
      isFeatured: p.isFeatured,
      isActive: p.isActive,
      metaTitle: p.metaTitle ?? "",
      metaDescription: p.metaDescription ?? "",
      attributes: p.attributes,
    });
    setError("");
    setGenerateError("");
    setGeneratedPreview(null);
    setShowPreview(false);
    setShowForm(true);
  }

  // ─── AI Generate handler ───────────────────────────────────────────────────

  async function callGenerateProduct(
    categoryKey?: string,
  ): Promise<GeneratedContent> {
    if (!form.name.trim()) throw new Error("Enter a product name first.");
    if (!accessToken) throw new Error("Not authenticated.");

    return (await api.ai.generateProduct(
      form.name.trim(),
      form.externalLink || undefined,
      accessToken,
      categoryKey,
    )) as GeneratedContent;
  }

  async function handleGenerate() {
    if (!form.name.trim()) {
      setGenerateError("Enter a product name first.");
      return;
    }

    setGenerating(true);
    setGenerateError("");
    setGeneratedPreview(null);
    setShowPreview(false);

    try {
      const result = await callGenerateProduct(
        selectedCategoryKey || undefined,
      );
      setGeneratedPreview(result);
      setShowPreview(true);
    } catch (err) {
      const isRateLimit =
        err instanceof ApiError && err.code === "RATE_LIMITED";
      setGenerateError(
        isRateLimit
          ? "Too many requests. Please wait a moment."
          : err instanceof Error
            ? err.message
            : "Generation failed. Try again.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleAttributeAIFill(): Promise<Record<
    string,
    string
  > | null> {
    if (!form.name.trim()) throw new Error("Enter a product name first.");
    const result = await callGenerateProduct(selectedCategoryKey || undefined);
    return result.attributes ?? null;
  }

  function applyGenerated() {
    if (!generatedPreview) return;
    setForm((f) => ({
      ...f,
      description: generatedPreview.description,
      metaTitle: generatedPreview.metaTitle,
      metaDescription: generatedPreview.metaDescription,
    }));
    setShowPreview(false);
    setGeneratedPreview(null);
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    setError("");
    const payload = {
      categoryId: form.categoryId,
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      stockQuantity: parseInt(form.stockQuantity, 10),
      sku: form.sku || null,
      brand: form.brand || null,
      thumbnail: form.thumbnail || null,
      externalLink: form.externalLink || null,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
      metaTitle: form.metaTitle || null,
      metaDescription: form.metaDescription || null,
      attributes: form.attributes,
    };
    try {
      if (editing) {
        await api.admin.updateProduct(editing.id, payload, accessToken);
      } else {
        await api.admin.createProduct(payload, accessToken);
      }
      setShowForm(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  }

  async function handleToggle(id: string) {
    if (!accessToken) return;
    await api.admin.toggleProduct(id, accessToken).catch(() => {});
    await reload();
  }

  async function handleDelete(id: string) {
    if (!accessToken || !confirm("Deactivate this product?")) return;
    await api.admin.deleteProduct(id, accessToken).catch(() => {});
    await reload();
  }

  const selectedCategoryKey =
    categories.find((c) => c.id === form.categoryId)?.slug ?? "";

  const fieldClass = "admin-field";
  const selectClass = "admin-field admin-select";
  const labelClass = "admin-label";

  return (
    <div>
      <div className="flex items-center justify-between mb-6 pt-24">
        <h1 className="text-2xl font-bold text-white/80">Products</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
        >
          + Add Product
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted">Loading…</div>
      ) : (
        <>
          <AdminTable
            rows={visibleProducts}
            keyFn={(p) => p.id}
            empty="No products found"
            columns={[
              {
                label: "Product",
                render: (p) => (
                  <div className="flex items-center gap-3">
                    {p.thumbnail ? (
                      <Image
                        src={p.thumbnail}
                        alt={p.name}
                        width={36}
                        height={36}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-gray-100" />
                    )}
                    <div>
                      <p className="font-medium text-white/70 text-sm">
                        {p.name}
                      </p>
                      {p.brand && (
                        <p className="text-xs text-white/600">{p.brand}</p>
                      )}
                    </div>
                  </div>
                ),
              },
              {
                label: "Price",
                render: (p) => (
                  <span className="font-medium">
                    {currencySymbol}
                    {p.price.toLocaleString()}
                  </span>
                ),
                width: "w-28",
              },
              {
                label: "Stock",
                render: (p) => (
                  <span
                    className={
                      p.stockQuantity === 0 ? "text-red-600 font-medium" : ""
                    }
                  >
                    {p.stockQuantity}
                  </span>
                ),
                width: "w-20",
              },
              {
                label: "Status",
                render: (p) => (
                  <div className="flex gap-1">
                    <Badge variant={p.isActive ? "success" : "outline"}>
                      {p.isActive ? "Active" : "Hidden"}
                    </Badge>
                    {p.isFeatured && <Badge variant="default">Featured</Badge>}
                  </div>
                ),
                width: "w-36",
              },
              {
                label: "Actions",
                render: (p) => (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-xs text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggle(p.id)}
                      className="text-xs text-muted hover:text-foreground"
                    >
                      {p.isActive ? "Hide" : "Show"}
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ),
                width: "w-36",
              },
            ]}
          />

          {/* ─── Pagination ─────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-white/50">
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, products.length)} of{" "}
                {products.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`px-3 py-1.5 rounded-lg border transition-colors ${
                        n === page
                          ? "bg-primary border-primary text-white"
                          : "border-white/10 hover:bg-white/5"
                      }`}
                    >
                      {n}
                    </button>
                  ),
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <AdminModal
        title={editing ? "Edit Product" : "Add Product"}
        open={showForm}
        onClose={() => setShowForm(false)}
        wide
      >
        <form
          onSubmit={handleSave}
          className="space-y-6 max-h-[72vh] overflow-y-auto pr-2"
        >
          {/* Category */}
          <div>
            <label htmlFor="prod-cat" className={labelClass}>
              Category *
            </label>
            <select
              id="prod-cat"
              required
              value={form.categoryId}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  categoryId: e.target.value,
                  attributes: {},
                }))
              }
              className={selectClass}
            >
              <option value="" className="text-foreground">
                Select category…
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="text-foreground">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Name + AI button */}
            <div className="col-span-2">
              <label htmlFor="prod-name" className={labelClass}>
                Product Name *
              </label>
              <div className="flex gap-2 items-start">
                <input
                  id="prod-name"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className={`${fieldClass} flex-1`}
                  placeholder="e.g. Samsung Galaxy S25 Ultra"
                />
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating || !form.name.trim()}
                  title="Generate description, SEO fields, and key features with AI"
                  className="
                    flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                    bg-violet-600 hover:bg-violet-700 text-white
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors whitespace-nowrap flex-shrink-0
                  "
                >
                  {generating ? (
                    <>
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
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      Generating…
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      AI Fill
                    </>
                  )}
                </button>
              </div>
              {generateError && (
                <p className="text-xs text-red-400 mt-1">{generateError}</p>
              )}
            </div>

            {/* Price */}
            <div>
              <label htmlFor="prod-price" className={labelClass}>
                Price ({currencySymbol}) *
              </label>
              <input
                id="prod-price"
                type="number"
                required
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
                className={fieldClass}
              />
            </div>

            {/* Stock */}
            <div>
              <label htmlFor="prod-stock" className={labelClass}>
                Stock Quantity
              </label>
              <input
                id="prod-stock"
                type="number"
                min={0}
                value={form.stockQuantity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stockQuantity: e.target.value }))
                }
                className={fieldClass}
              />
            </div>

            {/* Brand */}
            <div>
              <label htmlFor="prod-brand" className={labelClass}>
                Brand
              </label>
              <input
                id="prod-brand"
                value={form.brand}
                onChange={(e) =>
                  setForm((f) => ({ ...f, brand: e.target.value }))
                }
                className={fieldClass}
              />
            </div>

            {/* SKU */}
            <div>
              <label htmlFor="prod-sku" className={labelClass}>
                SKU
              </label>
              <input
                id="prod-sku"
                value={form.sku}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sku: e.target.value }))
                }
                className={fieldClass}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="prod-desc" className={labelClass}>
                Description
              </label>
              {form.description && (
                <span className="text-xs text-muted">
                  {form.description.length} chars
                </span>
              )}
            </div>
            <textarea
              id="prod-desc"
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className={`${fieldClass} admin-textarea`}
              placeholder="Product description — or use ✨ AI Fill above to generate it"
            />
          </div>

          {/* ─── AI Preview Panel ─────────────────────────────────────────── */}
          {showPreview && generatedPreview && (
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-violet-300 flex items-center gap-1.5">
                  <span>✨</span> AI Generated Preview
                </p>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="text-xs text-muted hover:text-white transition-colors"
                >
                  Dismiss
                </button>
              </div>

              <div>
                <p className="text-xs font-medium text-violet-400 mb-1">
                  Description
                </p>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
                  {generatedPreview.description}
                </p>
              </div>

              {generatedPreview.keyFeatures?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-violet-400 mb-1">
                    Key Features
                  </p>
                  <ul className="space-y-0.5">
                    {generatedPreview.keyFeatures.map((f, i) => (
                      <li
                        key={i}
                        className="text-xs text-slate-300 flex gap-1.5"
                      >
                        <span className="text-violet-400 flex-shrink-0">•</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-violet-400 mb-0.5">
                    Meta Title
                  </p>
                  <p className="text-xs text-slate-300">
                    {generatedPreview.metaTitle}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-violet-400 mb-0.5">
                    Meta Description
                  </p>
                  <p className="text-xs text-slate-300 line-clamp-2">
                    {generatedPreview.metaDescription}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={applyGenerated}
                className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
              >
                Apply to Form
              </button>
            </div>
          )}

          {/* ─── Thumbnail upload + External Link ─────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 items-start">
            <div className="col-span-2">
              <SmartImageUpload
                label="Product Thumbnail"
                value={form.thumbnail}
                onChange={(url) => setForm((f) => ({ ...f, thumbnail: url }))}
              />
            </div>

            <div className="col-span-2">
              <label htmlFor="prod-ext" className={labelClass}>
                External Spec Link
                <span className="ml-1 text-violet-400 text-xs">
                  (used by AI)
                </span>
              </label>
              <input
                id="prod-ext"
                type="url"
                value={form.externalLink}
                onChange={(e) =>
                  setForm((f) => ({ ...f, externalLink: e.target.value }))
                }
                className={fieldClass}
                placeholder="https://gsmarena.com/…"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                id="prod-featured"
                checked={form.isFeatured}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isFeatured: e.target.checked }))
                }
                className="w-4 h-4 text-primary border-gray-300 rounded"
              />
              <span className="text-sm text-white/50">
                Featured on homepage
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                id="prod-active"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isActive: e.target.checked }))
                }
                className="w-4 h-4 text-primary border-gray-300 rounded"
              />
              <span className="text-sm text-white/50">Active (visible)</span>
            </label>
          </div>

          {/* Dynamic attributes */}
          {selectedCategoryKey && (
            <div>
              <p className="text-sm font-medium text-foreground mb-3">
                Specifications
              </p>
              <AttributeEditor
                categoryKey={selectedCategoryKey}
                values={form.attributes}
                onChange={(attrs) =>
                  setForm((f) => ({ ...f, attributes: attrs }))
                }
                onAIFill={handleAttributeAIFill}
              />
            </div>
          )}

          {/* SEO */}
          <details className="text-sm" open={!!form.metaTitle}>
            <summary className="cursor-pointer font-medium text-muted hover:text-foreground">
              SEO (optional)
              {form.metaTitle && (
                <span className="ml-2 text-xs text-violet-400">
                  ✨ AI filled
                </span>
              )}
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="prod-meta-title" className={labelClass}>
                  Meta Title
                </label>
                <input
                  id="prod-meta-title"
                  value={form.metaTitle}
                  maxLength={160}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, metaTitle: e.target.value }))
                  }
                  className={fieldClass}
                />
                <p className="text-xs text-muted mt-0.5">
                  {form.metaTitle.length}/160
                </p>
              </div>
              <div>
                <label htmlFor="prod-meta-desc" className={labelClass}>
                  Meta Description
                </label>
                <textarea
                  id="prod-meta-desc"
                  rows={2}
                  value={form.metaDescription}
                  maxLength={320}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      metaDescription: e.target.value,
                    }))
                  }
                  className={`${fieldClass} admin-textarea`}
                />
                <p className="text-xs text-muted mt-0.5">
                  {form.metaDescription.length}/320
                </p>
              </div>
            </div>
          </details>

          {error && (
            <p className="text-red-300 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-60 transition-colors"
            >
              {saving
                ? "Saving…"
                : editing
                  ? "Update Product"
                  : "Create Product"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2 border border-gray-200 rounded-lg text-sm text-white/50 hover:bg-gray-50 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
