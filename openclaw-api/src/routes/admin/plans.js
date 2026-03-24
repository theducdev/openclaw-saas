import { pool } from '../../db.js';

export async function adminPlanRoutes(fastify) {
  fastify.get('/api/v1/admin/plans', async (request, reply) => {
    const result = await pool.query('SELECT * FROM plans ORDER BY price ASC');
    return { plans: result.rows };
  });

  fastify.post('/api/v1/admin/plans', async (request, reply) => {
    const { name, price, monthly_limit, max_pages, features } = request.body || {};
    if (!name || !price || !monthly_limit) {
      return reply.code(400).send({ success: false, error: { code: 'BAD_REQUEST', message: 'name, price, monthly_limit are required' } });
    }
    const result = await pool.query(
      `INSERT INTO plans (name, price, monthly_limit, max_pages, features) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, price, monthly_limit, max_pages || 10, JSON.stringify(features || {})]
    );
    return reply.code(201).send({ success: true, plan: result.rows[0] });
  });

  fastify.put('/api/v1/admin/plans/:id', async (request, reply) => {
    const { name, price, monthly_limit, max_pages, features, is_active } = request.body || {};
    const fields = [];
    const params = [];

    if (name !== undefined) { params.push(name); fields.push(`name = $${params.length}`); }
    if (price !== undefined) { params.push(price); fields.push(`price = $${params.length}`); }
    if (monthly_limit !== undefined) { params.push(monthly_limit); fields.push(`monthly_limit = $${params.length}`); }
    if (max_pages !== undefined) { params.push(max_pages); fields.push(`max_pages = $${params.length}`); }
    if (features !== undefined) { params.push(JSON.stringify(features)); fields.push(`features = $${params.length}`); }
    if (is_active !== undefined) { params.push(is_active); fields.push(`is_active = $${params.length}`); }

    if (!fields.length) return reply.code(400).send({ success: false, error: { code: 'BAD_REQUEST', message: 'No fields to update' } });

    params.push(new Date(), request.params.id);
    fields.push(`updated_at = $${params.length - 1}`);

    const result = await pool.query(
      `UPDATE plans SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!result.rows.length) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Plan not found' } });
    return { success: true, plan: result.rows[0] };
  });
}
