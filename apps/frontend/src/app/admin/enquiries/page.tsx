"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminModal } from "@/components/admin/AdminModal";
import { Badge } from "@/components/ui/Badge";

interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  createdAt: string;
  productName?: string;
}

const STATUS_OPTS = ["open", "replied", "closed"];
const STATUS_COLOR: Record<string, "warning" | "success" | "outline"> = {
  open: "warning",
  replied: "success",
  closed: "outline",
};

export default function AdminEnquiriesPage() {
  const { accessToken } = useAuthStore();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Enquiry | null>(null);
  const [filter, setFilter] = useState("");

  async function load() {
    if (!accessToken) return;
    setLoading(true);
    try {
      const params = filter ? { status: filter } : undefined;
      const res = (await api.admin.listEnquiries(
        accessToken,
        params,
      )) as Enquiry[];
      setEnquiries(res);
    } catch {
      /* silent */
    }
    setLoading(false);
  }

  

  useEffect(() => {
    load();
  }, [accessToken, filter]);

  async function updateStatus(id: string, status: string) {
    if (!accessToken) return;
    await api.admin
      .updateEnquiryStatus(id, status, accessToken)
      .catch(() => {});
    await load();
    setViewing((prev) => (prev?.id === id ? { ...prev, status } : prev));
  }

  async function handleDelete(id: string) {
    if (!accessToken || !confirm("Delete enquiry?")) return;
    await api.admin.deleteEnquiry(id, accessToken).catch(() => {});
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Enquiries</h1>
        <div className="flex gap-2">
          {["", ...STATUS_OPTS].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${filter === s ? "bg-primary text-white" : "bg-surface border border-gray-200 text-muted hover:text-foreground"}`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="text-center py-12 text-muted">Loading…</div>
      ) : (
        <AdminTable
          rows={enquiries}
          keyFn={(e) => e.id}
          empty="No enquiries"
          columns={[
            {
              label: "From",
              render: (e) => (
                <div>
                  <p className="font-medium text-sm text-foreground">
                    {e.name}
                  </p>
                  <p className="text-xs text-muted">{e.email}</p>
                </div>
              ),
            },
            {
              label: "Message",
              render: (e) => (
                <span className="text-sm text-muted line-clamp-2">
                  {e.message}
                </span>
              ),
            },
            {
              label: "Product",
              render: (e) =>
                e.productName ? (
                  <span className="text-xs text-primary">{e.productName}</span>
                ) : (
                  <span className="text-xs text-muted">—</span>
                ),
              width: "w-32",
            },
            {
              label: "Status",
              render: (e) => (
                <Badge variant={STATUS_COLOR[e.status] ?? "outline"}>
                  {e.status}
                </Badge>
              ),
              width: "w-24",
            },
            {
              label: "Date",
              render: (e) => new Date(e.createdAt).toLocaleDateString(),
              width: "w-28",
            },
            {
              label: "Actions",
              width: "w-32",
              render: (e) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewing(e)}
                    className="text-xs text-primary hover:underline"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(e.id)}
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
        title="Enquiry Detail"
        open={!!viewing}
        onClose={() => setViewing(null)}
      >
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted">Name</p>
                <p className="font-medium">{viewing.name}</p>
              </div>
              <div>
                <p className="text-muted">Email</p>
                <p className="font-medium">{viewing.email}</p>
              </div>
              {viewing.phone && (
                <div>
                  <p className="text-muted">Phone</p>
                  <p className="font-medium">{viewing.phone}</p>
                </div>
              )}
              {viewing.productName && (
                <div>
                  <p className="text-muted">Product</p>
                  <p className="font-medium text-primary">
                    {viewing.productName}
                  </p>
                </div>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-muted mb-1">Message</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {viewing.message}
              </p>
            </div>
            <div>
              <label
                htmlFor="enq-status-sel"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Update Status
              </label>
              <div className="flex gap-2">
                {STATUS_OPTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(viewing.id, s)}
                    className={`px-3 py-1.5 text-xs rounded-lg capitalize transition-colors ${viewing.status === s ? "bg-primary text-white" : "border border-gray-200 text-muted hover:text-foreground"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
