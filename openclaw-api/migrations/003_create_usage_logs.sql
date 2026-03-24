CREATE TABLE IF NOT EXISTS usage_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id),
  request_url     TEXT NOT NULL,
  request_task    TEXT,
  request_options JSONB DEFAULT '{}',
  response_status INTEGER,
  pages_crawled   INTEGER DEFAULT 0,
  apify_run_id    VARCHAR(100),
  apify_cost_usd  DECIMAL(10,6) DEFAULT 0,
  duration_ms     INTEGER,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_usage_customer_month ON usage_logs(customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_created ON usage_logs(created_at);
