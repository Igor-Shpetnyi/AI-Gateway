CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  api_key_hash TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  daily_quota INTEGER,
  monthly_quota INTEGER,
  allowed_models JSONB,
  allowed_ips JSONB
);

CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  requests_per_minute INTEGER,
  requests_per_day INTEGER,
  status TEXT DEFAULT 'healthy',
  circuit_breaker_until TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS request_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  provider_id TEXT REFERENCES providers(id),
  model TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  latency_ms INTEGER,
  status TEXT,
  error_message TEXT,
  cache_hit BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_stats (
  date DATE,
  project_id TEXT,
  provider_id TEXT,
  model TEXT,
  total_requests INTEGER,
  cache_hits INTEGER,
  total_tokens INTEGER,
  avg_latency_ms INTEGER,
  error_count INTEGER,
  PRIMARY KEY (date, project_id, provider_id, model)
);

CREATE TABLE IF NOT EXISTS response_cache (
  cache_key TEXT PRIMARY KEY,
  response TEXT,
  model TEXT,
  provider_id TEXT,
  expires_at TIMESTAMPTZ,
  hit_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rate_limit_state (
  provider_id TEXT,
  window_start TIMESTAMPTZ,
  request_count INTEGER,
  PRIMARY KEY (provider_id, window_start)
);

-- Seed: Groq provider (api_key_encrypted = env reference, resolved at runtime)
INSERT INTO providers (id, name, base_url, api_key_encrypted, is_active, priority, requests_per_minute, requests_per_day, status)
VALUES ('groq', 'Groq', 'https://api.groq.com/openai/v1', 'env:GROQ_API_KEY', true, 1, 30, 14400, 'healthy')
ON CONFLICT (id) DO NOTHING;
