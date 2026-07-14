ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false;

-- Not reachable via the public API: api_key_hash is a random placeholder with no known preimage.
INSERT INTO projects (id, name, api_key_hash, is_active, daily_quota, is_system)
VALUES ('admin-playground', 'Admin Playground', '7590a07910f587bc2023103ef2e7d0001a142930badc883fb16e8fd3cf4aa92d', true, NULL, true)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS chat_conversations (
  id TEXT PRIMARY KEY,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  provider_id TEXT REFERENCES providers(id) ON DELETE SET NULL,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);
