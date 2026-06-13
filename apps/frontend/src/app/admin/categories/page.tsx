"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminModal } from "@/components/admin/AdminModal";
import { Badge } from "@/components/ui/Badge";
import { useAdminData } from "@/hooks/useAdminData";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
}

const EMPTY = {
  name: "",
  description: "",
  parentId: "",
  sortOrder: "0",
  isActive: true,
};

export default function AdminCategoriesPage() {
  const { accessToken } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Flatten tree for table display
  function flattenCategories(
    cats: Category[],
    depth = 0,
  ): (Category & { depth: number })[] {
    return cats.flatMap((c) => [
      { ...c, depth },
      ...(c.children ? flattenCategories(c.children, depth + 1) : []),
    ]);
  }

const {
  data: categories = [], 
  loading,
  reload,
} = useAdminData(
  (token) => api.admin.listAllCategories(token) as Promise<Category[]>,
  accessToken,
);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setShowForm(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    setForm({
      name: c.name,
      description: c.description ?? "",
      parentId: c.parentId ?? "",
      sortOrder: String(c.sortOrder),
      isActive: c.isActive,
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
      name: form.name,
      description: form.description || null,
      parentId: form.parentId || null,
      sortOrder: parseInt(form.sortOrder, 10),
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await api.admin.updateCategory(editing.id, data, accessToken);
      } else {
        await api.admin.createCategory(data, accessToken);
      }
      setShowForm(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!accessToken || !confirm("Delete this category?")) return;
    try {
      await api.admin.deleteCategory(id, accessToken);
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Cannot delete category");
    }
  }

  const flat = flattenCategories(categories);
  // All top-level for parent selector
  const topLevel = categories;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white/80">Categories</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
        >
          + Add Category
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted">Loading…</div>
      ) : (
        <AdminTable
          rows={flat}
          keyFn={(c) => c.id}
          empty="No categories"
          columns={[
            {
              label: "Name",
              render: (c) => (
                <span
                  style={{ paddingLeft: `${c.depth * 20}px` }}
                  className="flex items-center gap-2"
                >
                  {c.depth > 0 && <span className="text-gray-300">└</span>}
                  <span className="font-medium text-white/80">{c.name}</span>
                </span>
              ),
            },
            {
              label: "Slug",
              render: (c) => (
                <code className="text-xs text-muted bg-gray-50 px-2 py-1 rounded">
                  {c.slug}
                </code>
              ),
            },
            { label: "Sort", render: (c) => c.sortOrder, width: "w-16" },
            {
              label: "Status",
              render: (c) => (
                <Badge variant={c.isActive ? "success" : "outline"}>
                  {c.isActive ? "Active" : "Hidden"}
                </Badge>
              ),
              width: "w-24",
            },
            {
              label: "Actions",
              render: (c) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(c)}
                    className="text-xs text-primary hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              ),
              width: "w-24",
            },
          ]}
        />
      )}

      <AdminModal
        title={editing ? "Edit Category" : "Add Category"}
        open={showForm}
        onClose={() => setShowForm(false)}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label
              htmlFor="cat-name"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Name *
            </label>
            <input
              id="cat-name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label
              htmlFor="cat-desc"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Description
            </label>
            <textarea
              id="cat-desc"
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="cat-parent"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Parent Category
              </label>
              <select
                id="cat-parent"
                value={form.parentId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, parentId: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">None (top-level)</option>
                {topLevel
                  .filter((c) => c.id !== editing?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="cat-sort"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Sort Order
              </label>
              <input
                id="cat-sort"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sortOrder: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              id="cat-active"
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
