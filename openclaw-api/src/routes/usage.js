import { pool } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { getMonthlyUsage } from '../services/quota.js';

export async function usageRoutes(fastify) {
  fastify.get('/api/v1/usage', { preHandler: authenticate }, async (request, reply) => {
    const customer = request.customer;
    const month = request.query.month || new Date().toISOString().slice(0, 7);

    const { used, costUsd } = await getMonthlyUsage(customer.id, month);
    const limit = customer.monthly_limit || 0;

    const recentResult = await pool.query(
      `SELECT request_url as url, pages_crawled as pages,
              CASE WHEN response_status = 200 THEN 'success' ELSE 'failed' END as status,
              created_at
       FROM usage_logs
       WHERE customer_id = $1
       ORDER BY created_at DESC LIMIT 10`,
      [customer.id]
    );

    return {
      customer: customer.name,
      plan: customer.plan_name,
      period: month,
      usage: { used, limit, remaining: Math.max(0, limit - used) },
      cost_estimate_usd: costUsd,
      recent_crawls: recentResult.rows,
    };
  });

  fastify.get('/api/v1/plan', { preHandler: authenticate }, async (request, reply) => {
    const c = request.customer;
    return {
      plan: c.plan_name,
      price: c.price,
      monthly_limit: c.monthly_limit,
      max_pages_per_crawl: c.max_pages,
      started_at: c.plan_started_at,
      expires_at: c.plan_expires_at,
      status: c.status,
    };
  });
}
