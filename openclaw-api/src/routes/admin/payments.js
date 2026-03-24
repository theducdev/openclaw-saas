import { pool } from '../../db.js';

export async function adminPaymentRoutes(fastify) {
  fastify.get('/api/v1/admin/payments', async (request, reply) => {
    const { status, page = 1, limit = 20 } = request.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];

    if (status) { params.push(status); conditions.push(`p.status = $${params.length}`); }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    params.push(limit, offset);

    const result = await pool.query(
      `SELECT p.*, c.name as customer_name FROM payments p JOIN customers c ON p.customer_id = c.id
       ${where} ORDER BY p.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return { payments: result.rows };
  });

  fastify.post('/api/v1/admin/payments', async (request, reply) => {
    const { customer_id, amount, payment_method, period_start, period_end, notes, transaction_ref } = request.body || {};
    if (!customer_id || !amount || !period_start || !period_end) {
      return reply.code(400).send({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing required fields' } });
    }
    const result = await pool.query(
      `INSERT INTO payments (customer_id, amount, payment_method, period_start, period_end, notes, transaction_ref)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [customer_id, amount, payment_method || null, period_start, period_end, notes || null, transaction_ref || null]
    );
    return reply.code(201).send({ success: true, payment: result.rows[0] });
  });

  fastify.put('/api/v1/admin/payments/:id', async (request, reply) => {
    const { status, transaction_ref, notes, confirmed_by } = request.body || {};
    const params = [];
    const fields = [];

    if (status !== undefined) { params.push(status); fields.push(`status = $${params.length}`); }
    if (transaction_ref !== undefined) { params.push(transaction_ref); fields.push(`transaction_ref = $${params.length}`); }
    if (notes !== undefined) { params.push(notes); fields.push(`notes = $${params.length}`); }

    if (status === 'confirmed') {
      params.push(new Date(), confirmed_by || 'admin');
      fields.push(`confirmed_at = $${params.length - 1}`, `confirmed_by = $${params.length}`);
    }

    if (!fields.length) return reply.code(400).send({ success: false, error: { code: 'BAD_REQUEST', message: 'No fields to update' } });

    params.push(request.params.id);
    const result = await pool.query(
      `UPDATE payments SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!result.rows.length) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } });
    return { success: true, payment: result.rows[0] };
  });

  fastify.get('/api/v1/admin/revenue', async (request, reply) => {
    const result = await pool.query(`
      SELECT to_char(period_start, 'YYYY-MM') as month,
             SUM(amount) as revenue_vnd,
             (SELECT COALESCE(SUM(apify_cost_usd), 0) FROM usage_logs ul
              WHERE to_char(ul.created_at, 'YYYY-MM') = to_char(p.period_start, 'YYYY-MM')) as apify_cost_usd
      FROM payments p
      WHERE p.status = 'confirmed'
      GROUP BY to_char(period_start, 'YYYY-MM'), p.period_start
      ORDER BY month DESC LIMIT 12
    `);
    return { revenue: result.rows };
  });
}
