-- ─── discounts ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS discounts (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID          REFERENCES products(id)   ON DELETE CASCADE,
  category_id UUID          REFERENCES categories(id) ON DELETE CASCADE,
  type        VARCHAR(20)   NOT NULL CHECK (type IN ('percentage', 'fixed_amount')),
  value       NUMERIC(10,2) NOT NULL CHECK (value > 0),
  label       VARCHAR(100),
  starts_at   TIMESTAMPTZ   NOT NULL,
  ends_at     TIMESTAMPTZ,
  is_active   BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  -- A discount must target either a product or a category (or neither = sitewide)
  CONSTRAINT discount_target_check CHECK (
    NOT (product_id IS NOT NULL AND category_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS discounts_product_id_idx  ON discounts (product_id);
CREATE INDEX IF NOT EXISTS discounts_category_id_idx ON discounts (category_id);
CREATE INDEX IF NOT EXISTS discounts_is_active_idx   ON discounts (is_active);
CREATE INDEX IF NOT EXISTS discounts_dates_idx       ON discounts (starts_at, ends_at);

-- ─── banners ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banners (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type               VARCHAR(30) NOT NULL CHECK (type IN ('top_strip', 'hero', 'promotional')),
  content            TEXT        NOT NULL,
  link_url           TEXT,
  link_text          VARCHAR(100),
  background_colour  VARCHAR(7),
  text_colour        VARCHAR(7),
  starts_at          TIMESTAMPTZ,
  ends_at            TIMESTAMPTZ,
  is_active          BOOLEAN     NOT NULL DEFAULT true,
  sort_order         INT         NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS banners_type_idx      ON banners (type);
CREATE INDEX IF NOT EXISTS banners_is_active_idx ON banners (is_active);