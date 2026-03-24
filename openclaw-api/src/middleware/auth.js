import { pool } from '../db.js';
import { verifyApiKey } from '../services/apiKey.js';

export async function authenticate(request, reply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({ success: false, error: { code: 'INVALID_KEY', message: 'Missing Authorization header' } });
  }

  const apiKey = authHeader.slice(7).trim();
  if (!apiKey || apiKey.length < 8) {
    return reply.code(401).send({ success: false, error: { code: 'INVALID_KEY', message: 'Invalid API key format' } });
  }

  const prefix = apiKey.slice(0, 8);

  // Lookup by prefix first
  const result = await pool.query(
    'SELECT c.*, p.name as plan_name, p.monthly_limit, p.max_pages, p.price FROM customers c LEFT JOIN plans p ON c.plan_id = p.id WHERE c.api_key_prefix = $1',
    [prefix]
  );

  if (result.rows.length === 0) {
    return reply.code(401).send({ success: false, error: { code: 'INVALID_KEY', message: 'Invalid API key' } });
  }

  // Find the matching customer (could be multiple with same prefix, unlikely but safe)
  let customer = null;
  for (const row of result.rows) {
    if (await verifyApiKey(apiKey, row.api_key_hash)) {
      customer = row;
      break;
    }
  }

  if (!customer) {
    return reply.code(401).send({ success: false, error: { code: 'INVALID_KEY', message: 'Invalid API key' } });
  }

  if (customer.status === 'suspended') {
    return reply.code(402).send({ success: false, error: { code: 'PAYMENT_REQUIRED', message: 'Account suspended. Please contact support.' } });
  }

  if (customer.status === 'cancelled') {
    return reply.code(401).send({ success: false, error: { code: 'INVALID_KEY', message: 'Account cancelled' } });
  }

  if (customer.plan_expires_at && new Date(customer.plan_expires_at) < new Date()) {
    return reply.code(402).send({ success: false, error: { code: 'PAYMENT_REQUIRED', message: 'Plan expired. Please renew.' } });
  }

  request.customer = customer;
}
