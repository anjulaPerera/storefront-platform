-- ─── updated_at trigger (reusable for all tables) ─────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── users ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email                VARCHAR(255) NOT NULL UNIQUE,
  password_hash        VARCHAR(255) NOT NULL,
  first_name           VARCHAR(100) NOT NULL,
  last_name            VARCHAR(100) NOT NULL,
  role                 VARCHAR(20)  NOT NULL DEFAULT 'customer'
                         CHECK (role IN ('customer', 'admin', 'super_admin')),
  is_active            BOOLEAN     NOT NULL DEFAULT true,
  email_verified       BOOLEAN     NOT NULL DEFAULT false,
  verification_token   VARCHAR(255),
  reset_token          VARCHAR(255),
  reset_token_expires  TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_role_idx  ON users (role);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at'
  ) THEN
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ─── categories ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  parent_id   UUID         REFERENCES categories(id) ON DELETE SET NULL,
  image_url   TEXT,
  sort_order  INT          NOT NULL DEFAULT 0,
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS categories_slug_idx      ON categories (slug);
CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON categories (parent_id);
CREATE INDEX IF NOT EXISTS categories_is_active_idx ON categories (is_active);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_categories_updated_at'
  ) THEN
    CREATE TRIGGER update_categories_updated_at
      BEFORE UPDATE ON categories
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ─── products ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id      UUID          NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name             VARCHAR(255)  NOT NULL,
  slug             VARCHAR(280)  NOT NULL UNIQUE,
  description      TEXT,
  price            NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  stock_quantity   INT           NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  sku              VARCHAR(100)  UNIQUE,
  brand            VARCHAR(100),
  attributes       JSONB         NOT NULL DEFAULT '{}',
  images           TEXT[]        NOT NULL DEFAULT '{}',
  thumbnail        TEXT,
  external_link    TEXT,
  is_featured      BOOLEAN       NOT NULL DEFAULT false,
  is_active        BOOLEAN       NOT NULL DEFAULT true,
  meta_title       VARCHAR(160),
  meta_description VARCHAR(320),
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS products_slug_idx        ON products (slug);
CREATE INDEX IF NOT EXISTS products_category_id_idx ON products (category_id);
CREATE INDEX IF NOT EXISTS products_is_active_idx   ON products (is_active);
CREATE INDEX IF NOT EXISTS products_is_featured_idx ON products (is_featured);
CREATE INDEX IF NOT EXISTS products_brand_idx       ON products (brand);
CREATE INDEX IF NOT EXISTS products_price_idx       ON products (price);
CREATE INDEX IF NOT EXISTS products_attributes_idx  ON products USING GIN (attributes);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at'
  ) THEN
    CREATE TRIGGER update_products_updated_at
      BEFORE UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;