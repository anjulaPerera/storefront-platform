import { pool } from "@/config/db";
import { createError } from "@/middleware/error.middleware";
import { PaginationParams, buildMeta, offset } from "@/utils/pagination.utils";

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "customer" | "admin" | "super_admin";
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

function mapUser(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    email: row.email as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    role: row.role as UserProfile["role"],
    isActive: row.is_active as boolean,
    emailVerified: row.email_verified as boolean,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

const SAFE_COLUMNS = `id, email, first_name, last_name, role, is_active, email_verified, created_at`;

export async function listUsers(
  pagination: PaginationParams,
  role?: string,
): Promise<{ users: UserProfile[]; meta: ReturnType<typeof buildMeta> }> {
  const roleClause = role ? `WHERE role = '${role}'` : "";

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::INT AS total FROM users ${roleClause}`,
  );
  const total = (countRows[0] as { total: number }).total;

  const { rows } = await pool.query(
    `SELECT ${SAFE_COLUMNS} FROM users ${roleClause}
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [pagination.limit, offset(pagination)],
  );

  return {
    users: rows.map((r) => mapUser(r as Record<string, unknown>)),
    meta: buildMeta(total, pagination),
  };
}

export async function getUserById(id: string): Promise<UserProfile> {
  const { rows } = await pool.query(
    `SELECT ${SAFE_COLUMNS} FROM users WHERE id = $1`,
    [id],
  );
  if (rows.length === 0) throw createError("User not found", 404, "NOT_FOUND");
  return mapUser(rows[0] as Record<string, unknown>);
}

export async function updateProfile(
  id: string,
  requesterId: string,
  requesterRole: string,
  data: { firstName?: string; lastName?: string },
): Promise<UserProfile> {
  // Only self or admin can update
  if (id !== requesterId && requesterRole === "customer") {
    throw createError("Forbidden", 403, "FORBIDDEN");
  }

  const { rows } = await pool.query(
    `UPDATE users
     SET first_name = COALESCE($1, first_name),
         last_name  = COALESCE($2, last_name),
         updated_at = NOW()
     WHERE id = $3
     RETURNING ${SAFE_COLUMNS}`,
    [data.firstName ?? null, data.lastName ?? null, id],
  );
  if (rows.length === 0) throw createError("User not found", 404, "NOT_FOUND");
  return mapUser(rows[0] as Record<string, unknown>);
}

export async function changeRole(
  id: string,
  requesterId: string,
  newRole: "customer" | "admin" | "super_admin",
): Promise<UserProfile> {
  if (id === requesterId) {
    throw createError(
      "You cannot change your own role",
      400,
      "SELF_ROLE_CHANGE",
    );
  }

  const { rows } = await pool.query(
    `UPDATE users SET role = $1, updated_at = NOW()
     WHERE id = $2 RETURNING ${SAFE_COLUMNS}`,
    [newRole, id],
  );
  if (rows.length === 0) throw createError("User not found", 404, "NOT_FOUND");
  return mapUser(rows[0] as Record<string, unknown>);
}

export async function toggleUserActive(
  id: string,
  requesterId: string,
): Promise<UserProfile> {
  if (id === requesterId) {
    throw createError(
      "You cannot disable your own account",
      400,
      "SELF_DISABLE",
    );
  }

  const { rows } = await pool.query(
    `UPDATE users SET is_active = NOT is_active, updated_at = NOW()
     WHERE id = $1 RETURNING ${SAFE_COLUMNS}`,
    [id],
  );
  if (rows.length === 0) throw createError("User not found", 404, "NOT_FOUND");
  return mapUser(rows[0] as Record<string, unknown>);
}

export async function deleteUser(
  id: string,
  requesterId: string,
): Promise<void> {
  if (id === requesterId) {
    throw createError("You cannot delete your own account", 400, "SELF_DELETE");
  }
  const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [
    id,
  ]);
  if ((rowCount ?? 0) === 0)
    throw createError("User not found", 404, "NOT_FOUND");
}
