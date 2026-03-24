import { pool } from '../../db.js';
import { generateApiKey, hashApiKey, getKeyPrefix } from '../../services/apiKey.js';

export async function adminCustomerRoutes(fastify) {
  // GET /api/v1/admin/customers
  fastify.get('/api/v1/admin/customers', async (request, reply) => {
    const { page = 1, limit = 20, status, search } = request.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (status) { params.push(status); conditions.push(`c.status = $${params.length}`); }
    if (search && String(search).length <= 100) { params.push(`%${String(search).slice(0, 100)}%`); conditions.push(`(c.name ILIKE $${params.length} OR c.email ILIKE $${params.length})`); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    params.push(limit, offset);

    const result = await pool.query(
      `SELECT c.id, c.name, c.email, c.phone, c.api_key_prefix, c.status,
              c.plan_started_at, c.plan_expires_at, c.notes, c.created_at,
              p.name as plan_name, p.monthly_limit, p.price,
              (SELECT COUNT(*) FROM usage_logs ul WHERE ul.customer_id = c.id AND ul.response_status = 200
               AND ul.created_at >= date_trunc('month', NOW())) as usage_this_month
       FROM customers c LEFT JOIN plans p ON c.plan_id = p.id
       ${where}
       ORDER BY c.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countResult = await pool.query(`SELECT COUNT(*) FROM customers c ${where}`, params.slice(0, -2));

    return { customers: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) };
  });

  // POST /api/v1/admin/customers
  fastify.post('/api/v1/admin/customers', async (request, reply) => {
    const { name, email, phone, plan_id, notes } = request.body || {};
    if (!name) return reply.code(400).send({ success: false, error: { code: 'BAD_REQUEST', message: 'name is required' } });

    const apiKey = generateApiKey();
    const hash = await hashApiKey(apiKey);
    const prefix = getKeyPrefix(apiKey);

    const planStarted = new Date();
    const planExpires = new Date();
    planExpires.setMonth(planExpires.getMonth() + 1);

    const result = await pool.query(
      `INSERT INTO customers (name, email, phone, api_key_hash, api_key_prefix, plan_id, plan_started_at, plan_expires_at, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, name, plan_started_at, plan_expires_at`,
      [name, email || null, phone || null, hash, prefix, plan_id || null, planStarted, planExpires, notes || null]
    );

    const customer = result.rows[0];
    let planName = null;
    if (plan_id) {
      const plan = await pool.query('SELECT name FROM plans WHERE id = $1', [plan_id]);
      planName = plan.rows[0]?.name;
    }

    return reply.code(201).send({
      success: true,
      customer: { id: customer.id, name: customer.name, api_key: apiKey, plan: planName, expires_at: customer.plan_expires_at },
      warning: 'API key chỉ hiển thị 1 lần. Hãy copy và gửi cho KH ngay.',
    });
  });

  // GET /api/v1/admin/customers/:id
  fastify.get('/api/v1/admin/customers/:id', async (request, reply) => {
    const result = await pool.query(
      `SELECT c.*, p.name as plan_name, p.monthly_limit, p.max_pages, p.price
       FROM customers c LEFT JOIN plans p ON c.plan_id = p.id WHERE c.id = $1`,
      [request.params.id]
    );
    if (!result.rows.length) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });

    const usageLogs = await pool.query(
      `SELECT request_url, pages_crawled, response_status, duration_ms, created_at
       FROM usage_logs WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [request.params.id]
    );

    const payments = await pool.query(
      'SELECT * FROM payments WHERE customer_id = $1 ORDER BY created_at DESC',
      [request.params.id]
    );

    const customer = result.rows[0];
    delete customer.api_key_hash;
    return { customer, usage_logs: usageLogs.rows, payments: payments.rows };
  });

  // PUT /api/v1/admin/customers/:id
  fastify.put('/api/v1/admin/customers/:id', async (request, reply) => {
    const { name, email, phone, plan_id, status, plan_expires_at, notes } = request.body || {};
    const fields = [];
    const params = [];

    if (name !== undefined) { params.push(name); fields.push(`name = $${params.length}`); }
    if (email !== undefined) { params.push(email); fields.push(`email = $${params.length}`); }
    if (phone !== undefined) { params.push(phone); fields.push(`phone = $${params.length}`); }
    if (plan_id !== undefined) { params.push(plan_id); fields.push(`plan_id = $${params.length}`); }
    if (status !== undefined) { params.push(status); fields.push(`status = $${params.length}`); }
    if (plan_expires_at !== undefined) { params.push(plan_expires_at); fields.push(`plan_expires_at = $${params.length}`); }
    if (notes !== undefined) { params.push(notes); fields.push(`notes = $${params.length}`); }

    if (!fields.length) return reply.code(400).send({ success: false, error: { code: 'BAD_REQUEST', message: 'No fields to update' } });

    params.push(new Date(), request.params.id);
    fields.push(`updated_at = $${params.length - 1}`);

    const result = await pool.query(
      `UPDATE customers SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING id, name, status`,
      params
    );

    if (!result.rows.length) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
    return { success: true, customer: result.rows[0] };
  });

  // DELETE /api/v1/admin/customers/:id (soft delete)
  fastify.delete('/api/v1/admin/customers/:id', async (request, reply) => {
    const result = await pool.query(
      `UPDATE customers SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING id`,
      [request.params.id]
    );
    if (!result.rows.length) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
    return { success: true, message: 'Customer cancelled' };
  });

  // POST /api/v1/admin/customers/:id/reset-key
  fastify.post('/api/v1/admin/customers/:id/reset-key', async (request, reply) => {
    const apiKey = generateApiKey();
    const hash = await hashApiKey(apiKey);
    const prefix = getKeyPrefix(apiKey);

    const result = await pool.query(
      `UPDATE customers SET api_key_hash = $1, api_key_prefix = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name`,
      [hash, prefix, request.params.id]
    );

    if (!result.rows.length) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
    return {
      success: true,
      customer: result.rows[0],
      api_key: apiKey,
      warning: 'New API key chỉ hiển thị 1 lần. Hãy gửi cho KH ngay.',
    };
  });
}
