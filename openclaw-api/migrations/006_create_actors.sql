CREATE TABLE IF NOT EXISTS actors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  actor_id    VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category    VARCHAR(100),
  icon        VARCHAR(10) DEFAULT '🕷️',
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
