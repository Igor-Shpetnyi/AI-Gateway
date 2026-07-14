ALTER TABLE provider_api_keys ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'healthy';
ALTER TABLE provider_api_keys ADD COLUMN IF NOT EXISTS circuit_breaker_until TIMESTAMPTZ;
