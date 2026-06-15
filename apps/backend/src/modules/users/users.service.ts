import { pool } from "@/config/db";
import { hashPassword } from "@/utils/hash.utils";
import { createError } from "@/middleware/error.middleware";
import { PaginationParams, buildMeta, offset } from "@/utils/pagination.utils";
import crypto from "crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "customer" | "admin" | "super_admin";
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorUserId: string | null;
  actorEmail?: string;
  action: string;
  targetUserId: string | null;
  targetEmail?: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export type AuditAction =
  | "ADMIN_CREATED"
  | "ROLE_CHANGED"
  | "USER_DISABLED"
  | "USER_ENABLED"
  | "USER_DELETED";

// ─── Internal helpers ─────────────────────────────────────────────────────────

const SAFE_COLUMNS = `
  id, email, first_name, last_name, role,
  is_active, email_verified, last_login_at, created_at
`;

function mapUser(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    email: row.email as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    role: row.role as UserProfile["role"],
    isActive: row.is_active as boolean,
    emailVerified: row.email_verified as boolean,
    lastLoginAt: row.last_login_at
      ? (row.last_login_at as Date).toISOString()
      : null,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

function mapAuditLog(row: Record<string, unknown>): AuditLog {
  return {
    id: row.id as string,
    actorUserId: (row.actor_user_id as string) ?? null,
    actorEmail: row.actor_email as string | undefined,
    action: row.action as string,
    targetUserId: (row.target_user_id as string) ?? null,
    targetEmail: row.target_email as string | undefined,
    metadata: (row.metadata as Record<string, unknown>) ?? null,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

/**
 * Write an audit log entry. Fire-and-forget — never throws.
 */
async function createAuditLog(
  actorUserId: string,
  action: AuditAction,
  targetUserId: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_logs (actor_user_id, action, target_user_id, metadata)
       VALUES ($1, $2, $3, $4)`,
      [
        actorUserId,
        action,
        targetUserId ?? null,
        metadata ? JSON.stringify(metadata) : null,
      ],
    );
  } catch (err) {
    // Audit log failure must never break the primary operation
    console.error("[audit_log] Failed to write:", err);
  }
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function listUsers(
  pagination: PaginationParams,
  role?: string,
): Promise<{ users: UserProfile[]; meta: ReturnType<typeof buildMeta> }> {
  // Whitelist role values to prevent injection
  const ALLOWED_ROLES = ["customer", "admin", "super_admin"];
  const filteredRole = role && ALLOWED_ROLES.includes(role) ? role : null;

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::INT AS total FROM users
     ${filteredRole ? "WHERE role = $1" : ""}`,
    filteredRole ? [filteredRole] : [],
  );
  const total = (countRows[0] as { total: number }).total;

  const { rows } = filteredRole
    ? await pool.query(
        `SELECT ${SAFE_COLUMNS} FROM users WHERE role = $1
         ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [filteredRole, pagination.limit, offset(pagination)],
      )
    : await pool.query(
        `SELECT ${SAFE_COLUMNS} FROM users
         ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
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

/**
 * Create a new admin or customer account. Only super_admin may call this.
 * super_admin cannot be assigned as the role here (enforced at schema + service level).
 * Returns the created user profile AND the one-time temporary password.
 */
export async function createAdmin(
  actorId: string,
  data: {
    email: string;
    firstName: string;
    lastName: string;
    role: "customer" | "admin";
  },
): Promise<{ user: UserProfile; tempPassword: string }> {
  // Block super_admin creation via API — belt-and-suspenders even though schema blocks it
  if ((data.role as string) === "super_admin") {
    throw createError(
      "Super Admin accounts cannot be created through the API",
      403,
      "FORBIDDEN",
    );
  }

  const { rows: existing } = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [data.email.toLowerCase().trim()],
  );
  if (existing.length > 0) {
    throw createError(
      "An account with this email already exists",
      409,
      "EMAIL_TAKEN",
    );
  }

  // Generate a secure temporary password — must be shown once to the super_admin
  const tempPassword = crypto.randomBytes(16).toString("hex");
  const passwordHash = await hashPassword(tempPassword);

  const { rows } = await pool.query(
    `INSERT INTO users
       (email, password_hash, first_name, last_name, role, is_active, email_verified)
     VALUES ($1, $2, $3, $4, $5, true, true)
     RETURNING ${SAFE_COLUMNS}`,
    [
      data.email.toLowerCase().trim(),
      passwordHash,
      data.firstName,
      data.lastName,
      data.role,
    ],
  );

  const created = mapUser(rows[0] as Record<string, unknown>);

  await createAuditLog(actorId, "ADMIN_CREATED", created.id, {
    email: created.email,
    role: created.role,
    tempPasswordGenerated: true,
  });

  // Return tempPassword so the controller can expose it once in the response
  return { user: created, tempPassword };
}

/**
 * Change a user's role. Only super_admin may call this.
 * Cannot promote to super_admin via API.
 */
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

  // Block super_admin promotion via API
  if ((newRole as string) === "super_admin") {
    throw createError(
      "Super Admin roles cannot be assigned through the API",
      403,
      "FORBIDDEN",
    );
  }

  // Fetch current role for audit log metadata
  const { rows: current } = await pool.query(
    "SELECT role FROM users WHERE id = $1",
    [id],
  );
  if (current.length === 0)
    throw createError("User not found", 404, "NOT_FOUND");
  const oldRole = (current[0] as Record<string, unknown>).role as string;

  const { rows } = await pool.query(
    `UPDATE users SET role = $1, updated_at = NOW()
     WHERE id = $2 RETURNING ${SAFE_COLUMNS}`,
    [newRole, id],
  );
  if (rows.length === 0) throw createError("User not found", 404, "NOT_FOUND");

  const updated = mapUser(rows[0] as Record<string, unknown>);

  await createAuditLog(requesterId, "ROLE_CHANGED", id, {
    oldRole,
    newRole,
    targetEmail: updated.email,
  });

  return updated;
}

/**
 * Toggle a user's is_active flag.
 * Admins cannot toggle other admins or super_admins — only super_admin can.
 */
export async function toggleUserActive(
  id: string,
  requesterId: string,
  requesterRole: string,
): Promise<UserProfile> {
  if (id === requesterId) {
    throw createError(
      "You cannot disable your own account",
      400,
      "SELF_DISABLE",
    );
  }

  // Fetch the target user to check their role
  const { rows: target } = await pool.query(
    "SELECT role, is_active FROM users WHERE id = $1",
    [id],
  );
  if (target.length === 0)
    throw createError("User not found", 404, "NOT_FOUND");

  const targetRow = target[0] as Record<string, unknown>;
  const targetRole = targetRow.role as string;

  // A plain admin cannot toggle another admin or super_admin
  if (requesterRole === "admin" && targetRole !== "customer") {
    throw createError(
      "Admins can only disable/enable customer accounts",
      403,
      "FORBIDDEN",
    );
  }

  const { rows } = await pool.query(
    `UPDATE users SET is_active = NOT is_active, updated_at = NOW()
     WHERE id = $1 RETURNING ${SAFE_COLUMNS}`,
    [id],
  );
  if (rows.length === 0) throw createError("User not found", 404, "NOT_FOUND");

  const updated = mapUser(rows[0] as Record<string, unknown>);

  const action: AuditAction = updated.isActive
    ? "USER_ENABLED"
    : "USER_DISABLED";
  await createAuditLog(requesterId, action, id, {
    targetEmail: updated.email,
    targetRole: updated.role,
    isActive: updated.isActive,
  });

  return updated;
}

/**
 * Delete a user.
 * Admins cannot delete other admins or super_admins — only super_admin can.
 */
export async function deleteUser(
  id: string,
  requesterId: string,
  requesterRole: string,
): Promise<void> {
  if (id === requesterId) {
    throw createError("You cannot delete your own account", 400, "SELF_DELETE");
  }

  // Fetch target to check role and capture email for audit log
  const { rows: target } = await pool.query(
    "SELECT role, email FROM users WHERE id = $1",
    [id],
  );
  if (target.length === 0)
    throw createError("User not found", 404, "NOT_FOUND");

  const targetRow = target[0] as Record<string, unknown>;
  const targetRole = targetRow.role as string;
  const targetEmail = targetRow.email as string;

  // A plain admin cannot delete another admin or super_admin
  if (requesterRole === "admin" && targetRole !== "customer") {
    throw createError(
      "Admins can only delete customer accounts",
      403,
      "FORBIDDEN",
    );
  }

  // Write audit log BEFORE deletion (target row will be gone after)
  await createAuditLog(requesterId, "USER_DELETED", id, {
    targetEmail,
    targetRole,
  });

  const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [
    id,
  ]);
  if ((rowCount ?? 0) === 0)
    throw createError("User not found", 404, "NOT_FOUND");
}

/**
 * List audit logs with parameterised filtering (super_admin only).
 */
export async function listAuditLogs(
  pagination: PaginationParams,
  action?: string,
): Promise<{ logs: AuditLog[]; meta: ReturnType<typeof buildMeta> }> {
  // Use a parameterised query — never interpolate user input directly into SQL
  const actionParam = action && action.trim().length > 0 ? action.trim() : null;

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::INT AS total FROM audit_logs al
     ${actionParam ? "WHERE al.action = $1" : ""}`,
    actionParam ? [actionParam] : [],
  );
  const total = (countRows[0] as { total: number }).total;

  const { rows } = actionParam
    ? await pool.query(
        `SELECT
           al.id,
           al.actor_user_id,
           actor.email  AS actor_email,
           al.action,
           al.target_user_id,
           target.email AS target_email,
           al.metadata,
           al.created_at
         FROM audit_logs al
         LEFT JOIN users actor  ON actor.id  = al.actor_user_id
         LEFT JOIN users target ON target.id = al.target_user_id
         WHERE al.action = $3
         ORDER BY al.created_at DESC
         LIMIT $1 OFFSET $2`,
        [pagination.limit, offset(pagination), actionParam],
      )
    : await pool.query(
        `SELECT
           al.id,
           al.actor_user_id,
           actor.email  AS actor_email,
           al.action,
           al.target_user_id,
           target.email AS target_email,
           al.metadata,
           al.created_at
         FROM audit_logs al
         LEFT JOIN users actor  ON actor.id  = al.actor_user_id
         LEFT JOIN users target ON target.id = al.target_user_id
         ORDER BY al.created_at DESC
         LIMIT $1 OFFSET $2`,
        [pagination.limit, offset(pagination)],
      );

  return {
    logs: rows.map((r) => mapAuditLog(r as Record<string, unknown>)),
    meta: buildMeta(total, pagination),
  };
}
