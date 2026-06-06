"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminModal } from "@/components/admin/AdminModal";
import { Badge } from "@/components/ui/Badge";
import { tenantConfig } from "@storefront/config";

interface Discount {
  id: string;
  productId: string | null;
  categoryId: string | null;
  type: string;
  value: number;
  label: string | null;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
}
interface Category {
  id: string;
  name: string;
}
interface Product {
  id: string;
  name: string;
}

const EMPTY = {
  productId: "",
  categoryId: "",
  type: "percentage",
  value: "",
  label: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
};

export default function AdminDiscountsPage() {
  const { accessToken } = useAuthStore();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { currencySymbol } = tenantConfig.identity;

  async function load() {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [d, c, p] = await Promise.all([
        api.admin.listAllDiscounts(accessToken) as Promise<Discount[]>,
        api.admin.listAllCategories(accessToken) as Promise<Category[]>,
        api.admin.listAllProducts(accessToken) as Promise<Product[]>,
      ]);
      setDiscounts(d);
      setCategories(c);
      setProducts(p);
    } catch {
      /* silent */
    }
    setLoading(false);
  }

  

  useEffect(() => {
    load();
  }, [accessToken]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setShowForm(true);
  }
  function openEdit(d: Discount) {
    setEditing(d);
    setForm({
      productId: d.productId ?? "",
      categoryId: d.categoryId ?? "",
      type: d.type,
      value: String(d.value),
      label: d.label ?? "",
      startsAt: d.startsAt.slice(0, 16),
      endsAt: d.endsAt ? d.endsAt.slice(0, 16) : "",
      isActive: d.isActive,
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
      productId: form.productId || null,
      categoryId: form.categoryId || null,
      type: form.type,
      value: parseFloat(form.value),
      label: form.label || null,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await api.admin.updateDiscount(editing.id, data, accessToken);
      } else {
        await api.admin.createDiscount(data, accessToken);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!accessToken || !confirm("Delete discount?")) return;
    await api.admin.deleteDiscount(id, accessToken).catch(() => {});
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Discounts</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
        >
          + Add Discount
        </button>
      </div>
      {loading ? (
        <div className="text-center py-12 text-muted">Loading…</div>
      ) : (
        <AdminTable
          rows={discounts}
          keyFn={(d) => d.id}
          empty="No discounts"
          columns={[
            {
              label: "Label",
              render: (d) => (
                <span className="font-medium">{d.label ?? "Unlabelled"}</span>
              ),
            },
            {
              label: "Type",
              render: (d) =>
                d.type === "percentage"
                  ? `${d.value}%`
                  : `${currencySymbol}${d.value}`,
            },
            {
              label: "Target",
              render: (d) =>
                d.productId
                  ? "Product"
                  : d.categoryId
                    ? "Category"
                    : "Sitewide",
            },
            {
              label: "Starts",
              render: (d) => new Date(d.startsAt).toLocaleDateString(),
              width: "w-28",
            },
            {
              label: "Status",
              render: (d) => (
                <Badge variant={d.isActive ? "success" : "outline"}>
                  {d.isActive ? "Active" : "Off"}
                </Badge>
              ),
              width: "w-20",
            },
            {
              label: "Actions",
              width: "w-24",
              render: (d) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(d)}
                    className="text-xs text-primary hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}
      <AdminModal
        title={editing ? "Edit Discount" : "Add Discount"}
        open={showForm}
        onClose={() => setShowForm(false)}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="disc-type"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Type *
              </label>
              <select
                id="disc-type"
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_amount">
                  Fixed Amount ({currencySymbol})
                </option>
              </select>
            </div>
            <div>
              <label
                htmlFor="disc-val"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Value *
              </label>
              <input
                id="disc-val"
                type="number"
                required
                min={0.01}
                step="0.01"
                value={form.value}
                onChange={(e) =>
                  setForm((f) => ({ ...f, value: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="disc-label"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Label (shown to customers)
            </label>
            <input
              id="disc-label"
              value={form.label}
              onChange={(e) =>
                setForm((f) => ({ ...f, label: e.target.value }))
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. Flash Sale"
            />
          </div>
          <div>
            <label
              htmlFor="disc-cat"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Apply to Category (leave blank for product or sitewide)
            </label>
            <select
              id="disc-cat"
              value={form.categoryId}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  categoryId: e.target.value,
                  productId: "",
                }))
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="disc-prod"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Apply to Product (overrides category)
            </label>
            <select
              id="disc-prod"
              value={form.productId}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  productId: e.target.value,
                  categoryId: "",
                }))
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">None</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="disc-start"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Start Date *
              </label>
              <input
                id="disc-start"
                type="datetime-local"
                required
                value={form.startsAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startsAt: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label
                htmlFor="disc-end"
                className="block text-sm font-medium text-foreground mb-1"
              >
                End Date (optional)
              </label>
              <input
                id="disc-end"
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endsAt: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              id="disc-active"
              checked={form.isActive}
              onChange={(e) =>
                setForm((f) => ({ ...f, isActive: e.target.checked }))
              }
              className="w-4 h-4 text-primary border-gray-300 rounded"
            />
            <span className="text-sm text-foreground">Active</span>
          </label>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-60"
            >
              {saving ? "Saving…" : editing ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
