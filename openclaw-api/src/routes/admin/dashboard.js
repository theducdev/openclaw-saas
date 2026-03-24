import { pool } from '../../db.js';

export async function adminDashboardRoutes(fastify) {
  fastify.get('/api/v1/admin/dashboard', async (request, reply) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [overview, topCustomers, expiringSoon, pendingPayments] = await Promise.all([
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM customers) as total_customers,
          (SELECT COUNT(*) FROM customers WHERE status = 'active') as active_customers,
          (SELECT COUNT(*) FROM customers WHERE status = 'suspended') as suspended_customers,
          (SELECT COUNT(*) FROM customers WHERE status = 'cancelled') as cancelled_customers,
          (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'confirmed' AND period_start >= $1) as revenue_this_month_vnd,
          (SELECT COUNT(*) FROM usage_logs WHERE created_at >= $1) as total_crawls_this_month,
          (SELECT COUNT(*) FROM usage_logs WHERE response_status = 200 AND created_at >= $1) as successful_crawls,
          (SELECT COUNT(*) FROM usage_logs WHERE response_status != 200 AND created_at >= $1) as failed_crawls,
          (SELECT COALESCE(SUM(apify_cost_usd), 0) FROM usage_logs WHERE created_at >= $1) as apify_cost_usd_this_month,
          (SELECT COALESCE(AVG(duration_ms), 0) FROM usage_logs WHERE response_status = 200 AND created_at >= $1) as avg_response_time_ms
      `, [monthStart]),

      pool.query(`
        SELECT c.name, p.name as plan, p.monthly_limit as limit_,
          (SELECT COUNT(*) FROM usage_logs ul WHERE ul.customer_id = c.id AND ul.response_status = 200 AND ul.created_at >= $1) as usage
        FROM customers c LEFT JOIN plans p ON c.plan_id = p.id
        WHERE c.status = 'active'
        ORDER BY usage DESC LIMIT 5
      `, [monthStart]),

      pool.query(`
        SELECT c.name, c.plan_expires_at as expires_at,
          EXTRACT(DAY FROM c.plan_expires_at - NOW())::int as days_left
        FROM customers c
        WHERE c.status = 'active' AND c.plan_expires_at BETWEEN NOW() AND NOW() + interval '7 days'
        ORDER BY c.plan_expires_at ASC
      `),

      pool.query(`
        SELECT c.name as customer, p.amount, p.created_at
        FROM payments p JOIN customers c ON p.customer_id = c.id
        WHERE p.status = 'pending'
        ORDER BY p.created_at DESC LIMIT 10
      `),
    ]);

    return {
      overview: overview.rows[0],
      top_customers: topCustomers.rows,
      expiring_soon: expiringSoon.rows,
      pending_payments: pendingPayments.rows,
    };
  });
}
