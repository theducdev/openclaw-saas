import { pool } from '../../db.js';

export async function adminUsageRoutes(fastify) {
  fastify.get('/api/v1/admin/usage', async (request, reply) => {
    const { month = new Date().toISOString().slice(0, 7), customer_id } = request.query;
    const date = new Date(month + '-01');
    const params = [date];
    const conditions = [];

    if (customer_id) { params.push(customer_id); conditions.push(`ul.customer_id = $${params.length}`); }
    const where = conditions.length ? 'AND ' + conditions.join(' AND ') : '';

    const result = await pool.query(`
      SELECT c.name as customer, c.id as customer_id,
             COUNT(ul.id) FILTER (WHERE ul.response_status = 200) as successful,
             COUNT(ul.id) FILTER (WHERE ul.response_status != 200) as failed,
             COUNT(ul.id) as total,
             p.monthly_limit as limit_,
             COALESCE(SUM(ul.apify_cost_usd), 0) as cost_usd
      FROM customers c
      LEFT JOIN usage_logs ul ON ul.customer_id = c.id
        AND ul.created_at >= date_trunc('month', $1::timestamptz)
        AND ul.created_at < date_trunc('month', $1::timestamptz) + interval '1 month'
        ${where}
      LEFT JOIN plans p ON c.plan_id = p.id
      GROUP BY c.id, c.name, p.monthly_limit
      ORDER BY total DESC
    `, params);

    return { month, usage: result.rows };
  });
}
