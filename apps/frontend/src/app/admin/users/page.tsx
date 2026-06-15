"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "customer" | "admin" | "super_admin";
import type { AuditLog, Meta, User } from "@storefront/types";


// ─── Constants ────────────────────────────────────────────────────────────────
const AUDIT_ACTION_LABELS: Record<string, { label: string; color: string }> = {
  ADMIN_CREATED: { label: "Admin Created", color: "bg-blue-100 text-blue-800" },
  ROLE_CHANGED: {
    label: "Role Changed",
    color: "bg-yellow-100 text-yellow-800",
  },
  USER_DISABLED: { label: "User Disabled", color: "bg-red-100 text-red-800" },
  USER_ENABLED: { label: "User Enabled", color: "bg-green-100 text-green-800" },
  USER_DELETED: { label: "User Deleted", color: "bg-gray-100 text-gray-800" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString();
}

function roleBadge(role: Role) {
  const map: Record<Role, string> = {
    super_admin: "bg-purple-100 text-purple-800",
    admin: "bg-blue-100 text-blue-800",
    customer: "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${map[role]}`}
    >
      {role.replace("_", " ")}
    </span>
  );
}

// ─── Create Admin Modal ───────────────────────────────────────────────────────
function CreateAdminModal({
  token,
  onClose,
  onCreated,
}: {
  token: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "admin" as "admin" | "customer",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Holds the one-time temp password returned after successful creation
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // The API now returns { ...user, tempPassword } on creation
      const result = (await api.admin.createUser(form, token)) as {
        tempPassword?: string;
      };
      onCreated();
      // Stay open to show the temp password — don't call onClose() yet
      setTempPassword(result.tempPassword ?? null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  }

  // ── After creation: show one-time password reveal screen ──────────────────
  if (tempPassword) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
          <h2 className="text-lg font-semibold mb-2 text-gray-900">
            Account Created
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Share this temporary password with the new user. It will{" "}
            <span className="font-semibold text-red-600">not</span> be shown
            again.
          </p>

          <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 mb-6">
            <p className="text-xs text-gray-400 mb-1">Temporary password</p>
            <p className="font-mono text-sm text-gray-900 break-all select-all">
              {tempPassword}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full rounded-lg bg-blue-600 py-2 text-white text-sm font-medium hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── Default: creation form ─────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
        <h2 className="text-lg font-semibold mb-5 text-gray-900">
          Create Account
        </h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.firstName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, firstName: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.lastName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lastName: e.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              required
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              aria-label="select-role"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  role: e.target.value as "admin" | "customer",
                }))
              }
              
            >
              <option value="admin">Admin</option>
              <option value="customer">Customer</option>
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Super Admin accounts can only be created via database seed.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 py-2 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
        <p className="text-sm text-gray-700 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-600 py-2 text-white text-sm font-medium hover:bg-red-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function UsersPage() {
  const { user, accessToken, hydrate, isHydrated } = useAuthStore();

  const [tab, setTab] = useState<"users" | "audit">("users");

  // Users Tab State
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Audit Logs Tab State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsMeta, setLogsMeta] = useState<Meta | null>(null);
  const [logsPage, setLogsPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [logsLoading, setLogsLoading] = useState(false);

  // Modal / Inline actions
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [inlineRoleUser, setInlineRoleUser] = useState<string | null>(null);

  const isSuperAdmin = user?.role === "super_admin";

  // Trigger hydration
  useEffect(() => {
    if (!isHydrated) {
      void hydrate();
    }
  }, [hydrate, isHydrated]);

  // Fetch Users List
  const fetchUsers = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.admin.listUsers(accessToken, {
        page: String(page),
        limit: String(20),
        ...(roleFilter ? { role: roleFilter } : {}),
      });
      setUsers(res.data as User[]);
      if (res.meta) setMeta(res.meta as Meta);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to fetch users.");
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, roleFilter]);

  // Fetch Audit Logs List
  const fetchLogs = useCallback(async () => {
    if (!accessToken || !isSuperAdmin) return;
    setLogsLoading(true);
    try {
      const res = await api.admin.listAuditLogs(accessToken, {
        page: logsPage,
        limit: 20,
        ...(actionFilter ? { action: actionFilter } : {}),
      });
      setLogs(res.data as AuditLog[]);
      if (res.meta) setLogsMeta(res.meta as Meta);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLogsLoading(false);
    }
  }, [accessToken, isSuperAdmin, logsPage, actionFilter]);

  // Handle side-effects for automated fetches
  useEffect(() => {
    if (isHydrated && accessToken && tab === "users") {
      void fetchUsers();
    }
  }, [isHydrated, accessToken, tab, fetchUsers]);

  useEffect(() => {
    if (isHydrated && accessToken && isSuperAdmin && tab === "audit") {
      void fetchLogs();
    }
  }, [isHydrated, accessToken, isSuperAdmin, tab, fetchLogs]);

  // Actions
  async function handleToggle(userToToggle: User) {
    if (!accessToken) return;
    setActionLoading(`${userToToggle.id}:toggle`);
    try {
      await api.admin.toggleUser(userToToggle.id, accessToken);
      await fetchUsers();
    } catch (err) {
      if (err instanceof ApiError) alert(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(userToDelete: User) {
    if (!accessToken) return;
    setActionLoading(`${userToDelete.id}:delete`);
    setConfirmDelete(null);
    try {
      await api.admin.deleteUser(userToDelete.id, accessToken);
      await fetchUsers();
    } catch (err) {
      if (err instanceof ApiError) alert(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRoleChange(userId: string, role: "customer" | "admin") {
    if (!accessToken) return;
    setActionLoading(`${userId}:role`);
    try {
      await api.admin.changeUserRole(userId, role, accessToken);
      setInlineRoleUser(null);
      await fetchUsers();
    } catch (err) {
      if (err instanceof ApiError) alert(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  function canToggle(u: User) {
    if (isSuperAdmin) return u.id !== user?.id;
    return u.role === "customer";
  }

  // Pre-hydration rendering blocks
  if (!isHydrated) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  if (!user || !accessToken) {
    return <div className="p-8 text-red-600">Authentication required.</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Container */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isSuperAdmin
              ? "Super Admin — full access"
              : "Admin — customer management"}
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            + Create Account
          </button>
        )}
      </div>

      {/* Tabs Navigation */}
      {isSuperAdmin && (
        <div className="mb-6 flex gap-1 border-b border-gray-200">
          {(["users", "audit"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "audit" ? "Audit Logs" : "Users"}
            </button>
          ))}
        </div>
      )}

      {/* ── USERS TAB ──────────────────────────────────────────────────────── */}
      {tab === "users" && (
        <>
          <div className="flex gap-3 mb-4">
            <select
              aria-label="Filter by role"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Roles</option>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
              {isSuperAdmin && <option value="super_admin">Super Admin</option>}
            </select>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">User</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="px-4 py-3 font-medium text-gray-600">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-600">
                    Last Login
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-600">
                    Joined
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.id}
                      className={`hover:bg-gray-50 transition-colors ${!u.isActive ? "opacity-60" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {u.firstName} {u.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        {isSuperAdmin && u.role !== "super_admin" ? (
                          inlineRoleUser === u.id ? (
                            <div className="flex items-center gap-2">
                              <select
                                aria-label="Change user role"
                                value={u.role}
                                className="border border-gray-300 rounded px-2 py-0.5 text-xs"
                                onChange={(e) =>
                                  void handleRoleChange(
                                    u.id,
                                    e.target.value as "customer" | "admin",
                                  )
                                }
                              >
                                <option value="customer">customer</option>
                                <option value="admin">admin</option>
                              </select>
                              <button
                                onClick={() => setInlineRoleUser(null)}
                                className="text-gray-400 hover:text-gray-600 text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setInlineRoleUser(u.id)}
                              className="group flex items-center gap-1"
                              title="Click to change role"
                            >
                              {roleBadge(u.role)}
                              <span className="text-gray-300 group-hover:text-gray-500 text-xs">
                                ✎
                              </span>
                            </button>
                          )
                        ) : (
                          roleBadge(u.role)
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                        >
                          {u.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {fmtDate(u.lastLoginAt)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {fmtDate(u.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {canToggle(u) && (
                            <button
                              disabled={actionLoading === `${u.id}:toggle`}
                              onClick={() => void handleToggle(u)}
                              className={`px-2 py-1 rounded text-xs font-medium border ${u.isActive ? "border-orange-300 text-orange-600 hover:bg-orange-50" : "border-green-300 text-green-600 hover:bg-green-50"} disabled:opacity-40`}
                            >
                              {actionLoading === `${u.id}:toggle`
                                ? "…"
                                : u.isActive
                                  ? "Disable"
                                  : "Enable"}
                            </button>
                          )}
                          {isSuperAdmin && u.id !== user?.id && (
                            <button
                              disabled={actionLoading === `${u.id}:delete`}
                              onClick={() => setConfirmDelete(u)}
                              className="px-2 py-1 rounded text-xs font-medium border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-40"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* User List Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <span>
                Showing {(page - 1) * meta.limit + 1}–
                {Math.min(page * meta.limit, meta.total)} of {meta.total}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page === meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── AUDIT LOGS TAB ─────────────────────────────────────────────────── */}
      {tab === "audit" && isSuperAdmin && (
        <>
          <div className="flex gap-3 mb-4">
            <select
              aria-label="Action filter"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setLogsPage(1);
              }}
            >
              <option value="">All Actions</option>
              {Object.entries(AUDIT_ACTION_LABELS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">
                    Action
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-600">Actor</th>
                  <th className="px-4 py-3 font-medium text-gray-600">
                    Target
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-600">
                    Details
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-600">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logsLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const badge = AUDIT_ACTION_LABELS[log.action];
                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-medium ${badge?.color ?? "bg-gray-100 text-gray-600"}`}
                          >
                            {badge?.label ?? log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">
                          {log.actorEmail ?? log.actorUserId}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">
                          {log.targetEmail ?? log.targetUserId ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">
                          {log.metadata ? JSON.stringify(log.metadata) : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {fmtDate(log.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Logs List Pagination */}
          {logsMeta && logsMeta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <span>
                Showing {(logsPage - 1) * logsMeta.limit + 1}–
                {Math.min(logsPage * logsMeta.limit, logsMeta.total)} of{" "}
                {logsMeta.total}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={logsPage === 1}
                  onClick={() => setLogsPage((p) => p - 1)}
                  className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={logsPage === logsMeta.totalPages}
                  onClick={() => setLogsPage((p) => p + 1)}
                  className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modals Declarations ──────────────────────────────────────────────── */}
      {showCreate && accessToken && (
        <CreateAdminModal
          token={accessToken}
          onClose={() => setShowCreate(false)}
          onCreated={() => void fetchUsers()}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          message={`Delete ${confirmDelete.firstName} ${confirmDelete.lastName}? This cannot be undone.`}
          onConfirm={() => void handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
