CREATE TABLE IF NOT EXISTS uptime_checks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider text NOT NULL,
  status text NOT NULL CHECK (status IN ('online', 'degraded', 'offline')),
  latency_ms integer NOT NULL,
  models_count integer,
  checked_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_uptime_provider_time ON uptime_checks (provider, checked_at DESC);

CREATE TABLE IF NOT EXISTS token_usage (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider text NOT NULL,
  model text,
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  total_tokens integer NOT NULL DEFAULT 0,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_token_provider_time ON token_usage (provider, recorded_at DESC);

ALTER TABLE uptime_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_uptime" ON uptime_checks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_tokens" ON token_usage FOR ALL USING (true) WITH CHECK (true);
