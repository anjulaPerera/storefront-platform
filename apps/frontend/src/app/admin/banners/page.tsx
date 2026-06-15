"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminModal } from "@/components/admin/AdminModal";
import { Badge } from "@/components/ui/Badge";
import { useAdminData } from "@/hooks/useAdminData";

interface Banner {
  id: string;
  type: string;
  content: string;
  linkUrl: string | null;
  linkText: string | null;
  backgroundColour: string | null;
  textColour: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  sortOrder: number;
}

const EMPTY = {
  type: "top_strip",
  content: "",
  linkUrl: "",
  linkText: "",
  backgroundColour: "#1D4ED8",
  textColour: "#FFFFFF",
  startsAt: "",
  endsAt: "",
  isActive: true,
  sortOrder: "0",
};

export default function AdminBannersPage() {
  const { accessToken } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const {
    data: banners = [],
    loading,
    reload,
  } = useAdminData(
    (token) => api.admin.listAllBanners(token) as Promise<Banner[]>,
    accessToken,
  );

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setShowForm(true);
  }

  function openEdit(b: Banner) {
    setEditing(b);
    setForm({
      type: b.type,
      content: b.content,
      linkUrl: b.linkUrl ?? "",
      linkText: b.linkText ?? "",
      backgroundColour: b.backgroundColour ?? "#1D4ED8",
      textColour: b.textColour ?? "#FFFFFF",
      startsAt: b.startsAt ? b.startsAt.slice(0, 16) : "",
      endsAt: b.endsAt ? b.endsAt.slice(0, 16) : "",
      isActive: b.isActive,
      sortOrder: String(b.sortOrder),
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
      type: form.type,
      content: form.content,
      linkUrl: form.linkUrl || null,
      linkText: form.linkText || null,
      backgroundColour: form.backgroundColour || null,
      textColour: form.textColour || null,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      isActive: form.isActive,
      sortOrder: parseInt(form.sortOrder, 10),
    };
    try {
      if (editing) {
        await api.admin.updateBanner(editing.id, data, accessToken);
      } else {
        await api.admin.createBanner(data, accessToken);
      }
      setShowForm(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!accessToken || !confirm("Delete banner?")) return;
    await api.admin.deleteBanner(id, accessToken).catch(() => {});
    await reload();
  }

  const fieldClass = "admin-field";
  const selectClass = "admin-field admin-select";
  const labelClass = "admin-label";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Banners</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
        >
          + Add Banner
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted">Loading…</div>
      ) : (
        <AdminTable
          rows={banners ?? []}
          keyFn={(b) => b.id}
          empty="No banners"
          columns={[
            {
              label: "Type",
              render: (b) => (
                <Badge variant="outline">{b.type.replace("_", " ")}</Badge>
              ),
              width: "w-32",
            },
            {
              label: "Content",
              render: (b) => (
                <span className="text-sm line-clamp-1">
                  {b.content.replace(/<[^>]*>/g, "")}
                </span>
              ),
            },
            {
              label: "Colour",
              render: (b) => (
                <div className="flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded border border-white/10 flex-shrink-0"
                    style={{ backgroundColor: b.backgroundColour ?? "#fff" }}
                  />
                  <span className="text-xs text-muted">
                    {b.backgroundColour}
                  </span>
                </div>
              ),
              width: "w-32",
            },
            {
              label: "Status",
              render: (b) => (
                <Badge variant={b.isActive ? "success" : "outline"}>
                  {b.isActive ? "Active" : "Inactive"}
                </Badge>
              ),
              width: "w-24",
            },
            {
              label: "Actions",
              width: "w-24",
              render: (b) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(b)}
                    className="text-xs text-primary hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
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
        title={editing ? "Edit Banner" : "Add Banner"}
        open={showForm}
        onClose={() => setShowForm(false)}
        wide
      >
        <form
          onSubmit={handleSave}
          className="space-y-6 max-h-[72vh] overflow-y-auto pr-2"
        >
          {/* Type + Sort Order */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ban-type" className={labelClass}>
                Type *
              </label>
              <select
                id="ban-type"
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value }))
                }
                className={selectClass}
              >
                <option value="top_strip">Top Strip</option>
                <option value="hero">Hero</option>
                <option value="promotional">Promotional</option>
              </select>
            </div>
            <div>
              <label htmlFor="ban-sort" className={labelClass}>
                Sort Order
              </label>
              <input
                id="ban-sort"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sortOrder: e.target.value }))
                }
                className={fieldClass}
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="ban-content" className={labelClass}>
              Content * (HTML supported)
            </label>
            <textarea
              id="ban-content"
              required
              rows={3}
              value={form.content}
              onChange={(e) =>
                setForm((f) => ({ ...f, content: e.target.value }))
              }
              className={`${fieldClass} admin-textarea`}
              placeholder="e.g. New iPhone arrives next month! <strong>Limited stock.</strong>"
            />
          </div>

          {/* Link URL + Link Text */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ban-link" className={labelClass}>
                Link URL
              </label>
              <input
                id="ban-link"
                type="url"
                value={form.linkUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, linkUrl: e.target.value }))
                }
                className={fieldClass}
                placeholder="https://…"
              />
            </div>
            <div>
              <label htmlFor="ban-link-text" className={labelClass}>
                Link Text
              </label>
              <input
                id="ban-link-text"
                value={form.linkText}
                onChange={(e) =>
                  setForm((f) => ({ ...f, linkText: e.target.value }))
                }
                className={fieldClass}
                placeholder="Shop Now"
              />
            </div>
          </div>

          {/* Colours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ban-bg" className={labelClass}>
                Background Colour
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="ban-bg"
                  value={form.backgroundColour}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      backgroundColour: e.target.value,
                    }))
                  }
                  className="w-10 h-[48px] rounded-xl border border-white/10 cursor-pointer bg-transparent flex-shrink-0"
                />
                <input
                  type="text"
                  value={form.backgroundColour}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      backgroundColour: e.target.value,
                    }))
                  }
                  className={fieldClass}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  aria-label="Background colour hex code"
                />
              </div>
            </div>
            <div>
              <label htmlFor="ban-text-col" className={labelClass}>
                Text Colour
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="ban-text-col"
                  value={form.textColour}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, textColour: e.target.value }))
                  }
                  className="w-10 h-[48px] rounded-xl border border-white/10 cursor-pointer bg-transparent flex-shrink-0"
                />
                <input
                  type="text"
                  value={form.textColour}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, textColour: e.target.value }))
                  }
                  className={fieldClass}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  aria-label="Text colour hex code"
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ban-start" className={labelClass}>
                Start Date
              </label>
              <input
                id="ban-start"
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startsAt: e.target.value }))
                }
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="ban-end" className={labelClass}>
                End Date
              </label>
              <input
                id="ban-end"
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endsAt: e.target.value }))
                }
                className={fieldClass}
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                id="ban-active"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isActive: e.target.checked }))
                }
                className="w-4 h-4 text-primary border-gray-300 rounded"
              />
              <span className="text-sm text-white/50">Active (visible)</span>
            </label>
          </div>

          {/* Preview */}
          <div>
            <p className={labelClass}>Preview</p>
            <div
              className="py-3 px-5 text-center text-sm rounded-2xl border border-white/10"
              style={{
                backgroundColor: form.backgroundColour,
                color: form.textColour,
              }}
            >
              <span
                dangerouslySetInnerHTML={{
                  __html: form.content || "Banner preview",
                }}
              />
            </div>
          </div>

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
              {saving ? "Saving…" : editing ? "Update Banner" : "Create Banner"}
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
