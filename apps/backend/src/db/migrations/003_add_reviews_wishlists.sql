-- ─── reviews ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  rating      SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title       VARCHAR(200),
  body        TEXT,
  is_approved BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS reviews_product_id_idx  ON reviews (product_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx     ON reviews (user_id);
CREATE INDEX IF NOT EXISTS reviews_is_approved_idx ON reviews (is_approved);

-- ─── wishlists ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlists (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  product_id UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS wishlists_user_id_idx ON wishlists (user_id);