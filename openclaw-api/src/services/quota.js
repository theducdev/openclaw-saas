import { pool } from '../db.js';

export async function getMonthlyUsage(customerId, month) {
  const date = month ? new Date(month + '-01') : new Date();
  const result = await pool.query(
    `SELECT COUNT(*) AS used, COALESCE(SUM(apify_cost_usd), 0) AS cost_usd
     FROM usage_logs
     WHERE customer_id = $1
       AND response_status = 200
       AND created_at >= date_trunc('month', $2::timestamptz)
       AND created_at < date_trunc('month', $2::timestamptz) + interval '1 month'`,
    [customerId, date]
  );
  return {
    used: parseInt(result.rows[0].used),
    costUsd: parseFloat(result.rows[0].cost_usd),
  };
}

export async function checkQuota(customer, planMonthlyLimit) {
  const { used } = await getMonthlyUsage(customer.id);
  return {
    used,
    limit: planMonthlyLimit,
    remaining: Math.max(0, planMonthlyLimit - used),
    exceeded: used >= planMonthlyLimit,
  };
}
