-- Track which specific API key served each request so daily limits can be
-- enforced per (provider, key) instead of per provider. NULL means the
-- request used the code adapter's env-var fallback key (no DB row for it).
ALTER TABLE request_logs
  ADD COLUMN IF NOT EXISTS provider_key_id TEXT REFERENCES provider_api_keys(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_request_logs_daily_limit
  ON request_logs (provider_id, provider_key_id, status, created_at);
