-- Multiple API keys per provider, admin-managed (encrypted at rest).
-- Existing providers keep working via their env var (GROQ_API_KEY etc.)
-- when no rows exist here; router.ts prefers DB-stored keys once added.
ALTER TABLE providers ALTER COLUMN api_key_encrypted DROP NOT NULL;

CREATE TABLE IF NOT EXISTS provider_api_keys (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  label TEXT,
  key_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_api_keys_provider_id ON provider_api_keys(provider_id);
