-- Rate limits vary per API key/account (a vendor's free tier is granted per
-- key, not per provider), so let each key override the provider's default
-- requests_per_minute/requests_per_day. NULL means "inherit the provider's
-- value" — this keeps existing keys and the env-var fallback path unchanged.
ALTER TABLE provider_api_keys ADD COLUMN IF NOT EXISTS requests_per_minute INTEGER;
ALTER TABLE provider_api_keys ADD COLUMN IF NOT EXISTS requests_per_day INTEGER;
