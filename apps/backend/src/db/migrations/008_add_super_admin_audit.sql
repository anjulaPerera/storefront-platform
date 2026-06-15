-- ============================================================
-- Migration 008: Super Admin Management + Audit Logs
-- ============================================================

-- 1. Add last_login_at to users (safe — skips if column exists)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 2. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id   UUID          REFERENCES users(id) ON DELETE SET NULL,
  -- Nullable: logs survive even if the actor account is later deleted.
  -- ON DELETE SET NULL requires the column to be nullable (no NOT NULL).
  action          VARCHAR(100)  NOT NULL,
  -- e.g. 'ADMIN_CREATED' | 'ROLE_CHANGED' | 'USER_DISABLED' | 'USER_ENABLED' | 'USER_DELETED'
  target_user_id  UUID          REFERENCES users(id) ON DELETE SET NULL,
  metadata        JSONB,
  -- e.g. { "oldRole": "customer", "newRole": "admin" }
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 3. Index for fast lookups by actor, target, or date
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor      ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target     ON audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action     ON audit_logs(action);