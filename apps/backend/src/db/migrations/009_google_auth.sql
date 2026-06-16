-- ─── Migration 007: Google OAuth support ──────────────────────────────────────
--
-- Changes:
--   1. Make password_hash nullable (Google-only users have no password)
--   2. Add google_id for token-based user lookup
--   3. Add auth_provider to distinguish 'local' vs 'google' accounts
--   4. Index google_id for fast lookup on every Google login
-- ──────────────────────────────────────────────────────────────────────────────

-- 1. Allow Google-only users to have no password
ALTER TABLE users
  ALTER COLUMN password_hash DROP NOT NULL;

-- 2. Google subject ID (the "sub" claim from the Google ID token)
--    UNIQUE so one Google account can only map to one user record
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- 3. Track how the account was originally created
--    'local'  → registered with email + password
--    'google' → first authenticated via Google OAuth
--    NULL on existing rows is intentional; treat NULL as 'local' in application code
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20)
    CHECK (auth_provider IN ('local', 'google'));

-- 4. Fast lookup by google_id on every Google sign-in
CREATE INDEX IF NOT EXISTS users_google_id_idx ON users (google_id)
  WHERE google_id IS NOT NULL;

-- ─── Back-fill existing rows ───────────────────────────────────────────────────
-- All pre-existing accounts were created with email+password, so they are 'local'.
-- New Google accounts will have auth_provider = 'google' set explicitly.
UPDATE users
  SET auth_provider = 'local'
  WHERE auth_provider IS NULL;