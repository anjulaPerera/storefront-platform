-- ─── ai_conversations ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_conversations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) NOT NULL,
  user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  role       VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_conversations_session_id_idx ON ai_conversations (session_id);
CREATE INDEX IF NOT EXISTS ai_conversations_user_id_idx    ON ai_conversations (user_id);
CREATE INDEX IF NOT EXISTS ai_conversations_created_at_idx ON ai_conversations (created_at);