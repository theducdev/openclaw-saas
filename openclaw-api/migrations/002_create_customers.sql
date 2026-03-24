CREATE TABLE IF NOT EXISTS customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255),
  phone           VARCHAR(20),
  api_key_hash    VARCHAR(255) NOT NULL UNIQUE,
  api_key_prefix  VARCHAR(10) NOT NULL,
  status          VARCHAR(20) DEFAULT 'active',
  plan_id         UUID REFERENCES plans(id),
  plan_started_at TIMESTAMPTZ,
  plan_expires_at TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_api_key_prefix ON customers(api_key_prefix);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
