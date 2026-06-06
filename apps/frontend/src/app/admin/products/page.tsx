"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { tenantConfig } from "@storefront/config";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminModal } from "@/components/admin/AdminModal";
import { AttributeEditor } from "@/components/admin/AttributeEditor";
import { Badge } from "@/components/ui/Badge";

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

export default function AdminProductsPage() {
  const { accessToken } = useAuthStore();
  const { currencySymbol } = tenantConfig.identity;
  const [showForm, setShowForm] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("action") === "new") {
      setShowForm(true);
    }
  }, []);
  // Flattens the category tree into a flat array for use in dropdowns
  function flattenCategoryTree(
    cats: (Category & { children?: Category[] })[],
  ): Category[] {
    return cats.flatMap((c) => [
      { id: c.id, name: c.name, slug: c.slug },
      ...(c.children
        ? flattenCategoryTree(
            c.children as (Category & { children?: Category[] })[],
          )
        : []),
    ]);
  }
  async function load() {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    try {
      const [prods, cats] = await Promise.all([
        api.admin.listAllProducts(accessToken) as Promise<Product[]>,
        api.admin.listAllCategories(accessToken) as Promise<Category[]>,
      ]);
      setProducts(prods);
setCategories(
  flattenCategoryTree(
    cats as unknown as (Category & { children?: Category[] })[],
  ),
);    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [accessToken]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
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
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    setError("");
    const data = {
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
        await api.admin.updateProduct(editing.id, data, accessToken);
      } else {
        await api.admin.createProduct(data, accessToken);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  }

  async function handleToggle(id: string) {
    if (!accessToken) return;
    await api.admin.toggleProduct(id, accessToken).catch(() => {});
    await load();
  }

  async function handleDelete(id: string) {
    if (!accessToken || !confirm("Deactivate this product?")) return;
    await api.admin.deleteProduct(id, accessToken).catch(() => {});
    await load();
  }

  const selectedCategoryKey =
    categories.find((c) => c.id === form.categoryId)?.slug ?? "";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
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
        <AdminTable
          rows={products}
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
                    <p className="font-medium text-foreground text-sm">
                      {p.name}
                    </p>
                    {p.brand && <p className="text-xs text-muted">{p.brand}</p>}
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
      )}

      <AdminModal
        title={editing ? "Edit Product" : "Add Product"}
        open={showForm}
        onClose={() => setShowForm(false)}
        wide
      >
        <form
          onSubmit={handleSave}
          className="space-y-5 max-h-[70vh] overflow-y-auto pr-2"
        >
          {/* Category */}
          <div>
            <label
              htmlFor="prod-cat"
              className="block text-sm font-medium text-foreground mb-1"
            >
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
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="col-span-2">
              <label
                htmlFor="prod-name"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Product Name *
              </label>
              <input
                id="prod-name"
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {/* Price */}
            <div>
              <label
                htmlFor="prod-price"
                className="block text-sm font-medium text-foreground mb-1"
              >
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
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {/* Stock */}
            <div>
              <label
                htmlFor="prod-stock"
                className="block text-sm font-medium text-foreground mb-1"
              >
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
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {/* Brand */}
            <div>
              <label
                htmlFor="prod-brand"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Brand
              </label>
              <input
                id="prod-brand"
                value={form.brand}
                onChange={(e) =>
                  setForm((f) => ({ ...f, brand: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {/* SKU */}
            <div>
              <label
                htmlFor="prod-sku"
                className="block text-sm font-medium text-foreground mb-1"
              >
                SKU
              </label>
              <input
                id="prod-sku"
                value={form.sku}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sku: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="prod-desc"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Description
            </label>
            <textarea
              id="prod-desc"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Thumbnail & External Link */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="prod-thumb"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Thumbnail URL
              </label>
              <input
                id="prod-thumb"
                type="url"
                value={form.thumbnail}
                onChange={(e) =>
                  setForm((f) => ({ ...f, thumbnail: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://…"
              />
            </div>
            <div>
              <label
                htmlFor="prod-ext"
                className="block text-sm font-medium text-foreground mb-1"
              >
                External Spec Link
              </label>
              <input
                id="prod-ext"
                type="url"
                value={form.externalLink}
                onChange={(e) =>
                  setForm((f) => ({ ...f, externalLink: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://gsmarena.com/…"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-6">
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
              <span className="text-sm text-foreground">
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
              <span className="text-sm text-foreground">Active (visible)</span>
            </label>
          </div>

          {/* Dynamic attributes from SSOT taxonomy */}
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
              />
            </div>
          )}

          {/* SEO */}
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-muted hover:text-foreground">
              SEO (optional)
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <label
                  htmlFor="prod-meta-title"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Meta Title
                </label>
                <input
                  id="prod-meta-title"
                  value={form.metaTitle}
                  maxLength={160}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, metaTitle: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label
                  htmlFor="prod-meta-desc"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Meta Description
                </label>
                <textarea
                  id="prod-meta-desc"
                  rows={2}
                  value={form.metaDescription}
                  maxLength={320}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, metaDescription: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
          </details>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
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
              className="px-6 py-2 border border-gray-200 rounded-lg text-sm text-foreground hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
