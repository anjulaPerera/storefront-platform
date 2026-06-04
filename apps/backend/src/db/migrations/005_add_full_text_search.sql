-- ─── search_vector column ─────────────────────────────────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- ─── function to build search_vector ─────────────────────────────────────
CREATE OR REPLACE FUNCTION products_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')),        'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.brand, '')),       'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── trigger (safe re-creation) ───────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'products_search_vector_trigger'
  ) THEN
    CREATE TRIGGER products_search_vector_trigger
      BEFORE INSERT OR UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();
  END IF;
END $$;

-- ─── GIN index on search_vector ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS products_search_vector_idx
  ON products USING GIN (search_vector);

-- ─── backfill search_vector for any existing rows ─────────────────────────
UPDATE products
SET search_vector =
  setweight(to_tsvector('english', COALESCE(name, '')),        'A') ||
  setweight(to_tsvector('english', COALESCE(brand, '')),       'B') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'C')
WHERE search_vector IS NULL;