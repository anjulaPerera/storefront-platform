"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { useAdminData } from "@/hooks/useAdminData";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const ROLE_COLOR: Record<string, "default" | "warning" | "danger"> = {
  customer: "default",
  admin: "warning",
  super_admin: "danger",
};

export default function AdminUsersPage() {
  const { accessToken, user: me } = useAuthStore();
  const [filter, setFilter] = useState("");

const {
  data: users = [],
  loading,
  reload,
} = useAdminData(
  (token) => {
    const params = filter ? { role: filter } : undefined;
    return api.admin.listUsers(token, params) as Promise<User[]>;
  },
  accessToken,
  filter, 
);
  async function toggleUser(id: string) {
    if (!accessToken || id === me?.id) return;
    await api.admin.toggleUser(id, accessToken).catch(() => {});
    await reload();
  }

  async function changeRole(id: string, role: string) {
    if (!accessToken || me?.role !== "super_admin") return;
    await api.admin.changeUserRole(id, role, accessToken).catch(() => {});
    await reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <div className="flex gap-2">
          {["", "customer", "admin", "super_admin"].map((r) => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${filter === r ? "bg-primary text-white" : "bg-surface border border-gray-200 text-muted hover:text-foreground"}`}
            >
              {r || "All"}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="text-center py-12 text-muted">Loading…</div>
      ) : (
        <AdminTable
          rows={users}
          keyFn={(u) => u.id}
          empty="No users"
          columns={[
            {
              label: "User",
              render: (u) => (
                <div>
                  <p className="font-medium text-sm text-foreground">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-xs text-muted">{u.email}</p>
                </div>
              ),
            },
            {
              label: "Role",
              render: (u) => (
                <Badge variant={ROLE_COLOR[u.role] ?? "default"}>
                  {u.role.replace("_", " ")}
                </Badge>
              ),
              width: "w-32",
            },
            {
              label: "Status",
              render: (u) => (
                <Badge variant={u.isActive ? "success" : "outline"}>
                  {u.isActive ? "Active" : "Disabled"}
                </Badge>
              ),
              width: "w-24",
            },
            {
              label: "Joined",
              render: (u) => new Date(u.createdAt).toLocaleDateString(),
              width: "w-28",
            },
            {
              label: "Actions",
              width: "w-48",
              render: (u) => (
                <div className="flex items-center gap-2 flex-wrap">
                  {u.id !== me?.id && (
                    <button
                      onClick={() => toggleUser(u.id)}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${u.isActive ? "border-red-200 text-red-500 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}
                    >
                      {u.isActive ? "Disable" : "Enable"}
                    </button>
                  )}
                  {me?.role === "super_admin" && u.id !== me.id && (
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                      aria-label={`Change role for ${u.firstName}`}
                    >
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
