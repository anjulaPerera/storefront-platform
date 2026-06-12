-- ─── enquiries ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enquiries (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  phone      VARCHAR(50),
  message    TEXT        NOT NULL,
  product_id UUID        REFERENCES products(id) ON DELETE SET NULL,
  status     VARCHAR(20) NOT NULL DEFAULT 'open'
               CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS enquiries_status_idx     ON enquiries (status);
CREATE INDEX IF NOT EXISTS enquiries_created_at_idx ON enquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS enquiries_product_id_idx ON enquiries (product_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_enquiries_updated_at'
  ) THEN
    CREATE TRIGGER update_enquiries_updated_at
      BEFORE UPDATE ON enquiries
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;