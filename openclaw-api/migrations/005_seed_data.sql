INSERT INTO plans (name, price, monthly_limit, max_pages) VALUES
  ('Starter', 50000, 50, 5),
  ('Basic', 100000, 150, 10),
  ('Pro', 250000, 500, 25)
ON CONFLICT DO NOTHING;
