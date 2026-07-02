-- Allow deleting a provider (custom ones, from the admin panel) without
-- being blocked by its request_logs history. Historical log rows are kept,
-- just lose the provider association (provider_id becomes NULL) instead of
-- being deleted themselves.
ALTER TABLE request_logs DROP CONSTRAINT IF EXISTS request_logs_provider_id_fkey;
ALTER TABLE request_logs
  ADD CONSTRAINT request_logs_provider_id_fkey
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL;
