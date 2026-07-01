INSERT INTO providers (id, name, base_url, api_key_encrypted, is_active, priority, requests_per_minute, requests_per_day, status)
VALUES
  ('gemini', 'Google Gemini', 'https://generativelanguage.googleapis.com/v1beta', 'env:GEMINI_API_KEY', true, 2, 15, 1500, 'healthy'),
  ('openrouter', 'OpenRouter', 'https://openrouter.ai/api/v1', 'env:OPENROUTER_API_KEY', true, 3, 20, 200, 'healthy')
ON CONFLICT (id) DO NOTHING;
