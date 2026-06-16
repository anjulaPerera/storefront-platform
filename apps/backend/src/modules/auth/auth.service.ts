import crypto from "crypto";
import { pool } from "@/config/db";
import { hashPassword, comparePassword } from "@/utils/hash.utils";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/utils/jwt.utils";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "@/utils/email.utils";
import { createError } from "@/middleware/error.middleware";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "customer" | "admin" | "super_admin";
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function mapUser(row: Record<string, unknown>): AuthUser {
  return {
    id: row.id as string,
    email: row.email as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    role: row.role as AuthUser["role"],
    isActive: row.is_active as boolean,
    emailVerified: row.email_verified as boolean,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
): Promise<AuthUser> {
  const { rows: existing } = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email.toLowerCase().trim()],
  );

  if (existing.length > 0) {
    throw createError(
      "An account with this email already exists",
      409,
      "EMAIL_TAKEN",
    );
  }

  const passwordHash = await hashPassword(password);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const { rows } = await pool.query(
    `INSERT INTO users
       (email, password_hash, first_name, last_name, verification_token)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      email.toLowerCase().trim(),
      passwordHash,
      firstName,
      lastName,
      verificationToken,
    ],
  );

  const user = rows[0] as Record<string, unknown>;

  // Non-blocking — email failure does not break registration
  const verifyUrl = `${process.env.CORS_ORIGIN ?? ""}/verify-email?token=${verificationToken}`;
  sendVerificationEmail(user.email as string, firstName, verifyUrl).catch(
    console.error,
  );

  return mapUser(user);
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [
    email.toLowerCase().trim(),
  ]);

  // Use a constant-time comparison message to prevent email enumeration
  const INVALID = createError(
    "Invalid email or password",
    401,
    "INVALID_CREDENTIALS",
  );

  if (rows.length === 0) throw INVALID;

  const row = rows[0] as Record<string, unknown>;

  if (!row.is_active) {
    throw createError(
      "Your account has been disabled",
      403,
      "ACCOUNT_DISABLED",
    );
  }

   if (!row.password_hash) {
     throw createError(
       "This account uses Google sign-in. Please continue with Google.",
       400,
       "USE_GOOGLE_LOGIN",
     );
   }

   const valid = await comparePassword(password, row.password_hash as string);
   if (!valid) throw INVALID;

await pool.query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [
  row.id,
]);

  const accessToken = signAccessToken({
    userId: row.id as string,
    email: row.email as string,
    role: row.role as string,
  });
  const refreshToken = signRefreshToken({ userId: row.id as string });

  await pool.query("UPDATE users SET refresh_token_hash = $1 WHERE id = $2", [
    hashToken(refreshToken),
    row.id,
  ]);

  return { user: mapUser(row), accessToken, refreshToken };
}

export async function googleLoginUser(idToken: string): Promise<{
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}> {
  // ── Step 1: Verify the ID token with Google ──────────────────────────────────
  // verifyIdToken checks signature, expiry, and audience (your client ID).
  // Never skip this — a raw JWT decode without verification is unsafe.
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch {
    throw createError("Invalid Google token", 401, "INVALID_GOOGLE_TOKEN");
  }

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw createError(
      "Google token payload is missing required fields",
      401,
      "INVALID_GOOGLE_TOKEN",
    );
  }

  const googleId = payload.sub;
  const email = payload.email.toLowerCase().trim();
  const firstName = payload.given_name ?? payload.name?.split(" ")[0] ?? "User";
  const lastName =
    payload.family_name ?? payload.name?.split(" ").slice(1).join(" ") ?? "";

  // ── Step 2: Find existing user ───────────────────────────────────────────────
  // Check by google_id first (fastest, most accurate on repeat logins).
  // Fall back to email in case the user previously registered with a password
  // using the same email address.
  const { rows } = await pool.query(
    `SELECT * FROM users
     WHERE google_id = $1 OR email = $2
     LIMIT 1`,
    [googleId, email],
  );

  let row: Record<string, unknown>;

  if (rows.length > 0) {
    row = rows[0] as Record<string, unknown>;

    if (!row.is_active) {
      throw createError(
        "Your account has been disabled",
        403,
        "ACCOUNT_DISABLED",
      );
    }

    // If this user registered with email+password and is now signing in with
    // Google for the first time, link the Google account to their existing record.
    if (!row.google_id) {
      await pool.query(
        `UPDATE users
         SET google_id = $1, updated_at = NOW()
         WHERE id = $2`,
        [googleId, row.id],
      );
      row.google_id = googleId;
    }
  } else {
    // ── Step 3: First-ever Google login — create the account ──────────────────
    // email_verified is set to true because Google has already verified it.
    // password_hash is NULL — these users authenticate only via Google.
    // auth_provider = 'google' so the app knows never to expect a password.
    const { rows: created } = await pool.query(
      `INSERT INTO users
         (email, google_id, first_name, last_name,
          auth_provider, email_verified, password_hash)
       VALUES ($1, $2, $3, $4, 'google', true, NULL)
       RETURNING *`,
      [email, googleId, firstName, lastName],
    );
    row = created[0] as Record<string, unknown>;
  }

  // ── Step 4: Issue tokens (identical to loginUser) ────────────────────────────
  await pool.query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [
    row.id,
  ]);

  const accessToken = signAccessToken({
    userId: row.id as string,
    email: row.email as string,
    role: row.role as string,
  });
  const refreshToken = signRefreshToken({ userId: row.id as string });

  await pool.query("UPDATE users SET refresh_token_hash = $1 WHERE id = $2", [
    hashToken(refreshToken),
    row.id,
  ]);

  return { user: mapUser(row), accessToken, refreshToken };
}

export async function refreshTokens(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  let payload: { userId: string };

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw createError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
  }

  const { rows } = await pool.query(
    "SELECT * FROM users WHERE id = $1 AND refresh_token_hash = $2",
    [payload.userId, hashToken(refreshToken)],
  );

  if (rows.length === 0) {
    throw createError(
      "Refresh token has been revoked",
      401,
      "INVALID_REFRESH_TOKEN",
    );
  }

  const row = rows[0] as Record<string, unknown>;

  if (!row.is_active) {
    throw createError("Account has been disabled", 403, "ACCOUNT_DISABLED");
  }

  // Token rotation — issue new pair, invalidate old
  const newAccessToken = signAccessToken({
    userId: row.id as string,
    email: row.email as string,
    role: row.role as string,
  });
  const newRefreshToken = signRefreshToken({ userId: row.id as string });

  await pool.query("UPDATE users SET refresh_token_hash = $1 WHERE id = $2", [
    hashToken(newRefreshToken),
    row.id,
  ]);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logoutUser(userId: string): Promise<void> {
  await pool.query("UPDATE users SET refresh_token_hash = NULL WHERE id = $1", [
    userId,
  ]);
}

export async function forgotPassword(email: string): Promise<void> {
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [
    email.toLowerCase().trim(),
  ]);

  // Always return success — never reveal whether email exists
  if (rows.length === 0) return;

  const row = rows[0] as Record<string, unknown>;

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await pool.query(
    "UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3",
    [resetToken, resetExpires, row.id],
  );

  const resetUrl = `${process.env.CORS_ORIGIN ?? ""}/reset-password?token=${resetToken}`;
  sendPasswordResetEmail(
    row.email as string,
    row.first_name as string,
    resetUrl,
  ).catch(console.error);
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  const { rows } = await pool.query(
    `SELECT * FROM users
     WHERE reset_token = $1 AND reset_token_expires > NOW()`,
    [token],
  );

  if (rows.length === 0) {
    throw createError(
      "Reset token is invalid or has expired",
      400,
      "INVALID_RESET_TOKEN",
    );
  }

  const passwordHash = await hashPassword(newPassword);

  await pool.query(
    `UPDATE users
     SET password_hash = $1,
         reset_token = NULL,
         reset_token_expires = NULL,
         refresh_token_hash = NULL
     WHERE id = $2`,
    [passwordHash, (rows[0] as Record<string, unknown>).id],
  );
}

export async function verifyEmail(token: string): Promise<void> {
  const { rows } = await pool.query(
    "SELECT id FROM users WHERE verification_token = $1",
    [token],
  );

  if (rows.length === 0) {
    throw createError(
      "Invalid or expired verification token",
      400,
      "INVALID_TOKEN",
    );
  }

  await pool.query(
    "UPDATE users SET email_verified = true, verification_token = NULL WHERE id = $1",
    [(rows[0] as Record<string, unknown>).id],
  );
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const { rows } = await pool.query(
    `SELECT id, email, first_name, last_name, role,
            is_active, email_verified, created_at
     FROM users WHERE id = $1`,
    [id],
  );

  return rows.length > 0 ? mapUser(rows[0] as Record<string, unknown>) : null;
}
