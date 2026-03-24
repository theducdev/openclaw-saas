CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id),
  amount          INTEGER NOT NULL,
  payment_method  VARCHAR(50),
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  status          VARCHAR(20) DEFAULT 'pending',
  transaction_ref VARCHAR(255),
  notes           TEXT,
  confirmed_at    TIMESTAMPTZ,
  confirmed_by    VARCHAR(100),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
