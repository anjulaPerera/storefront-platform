ALTER TABLE users
  ADD COLUMN IF NOT EXISTS refresh_token_hash VARCHAR(255);

CREATE INDEX IF NOT EXISTS users_reset_token_idx        ON users (reset_token);
CREATE INDEX IF NOT EXISTS users_verification_token_idx ON users (verification_token);