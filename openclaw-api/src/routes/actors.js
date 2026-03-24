import { pool } from '../db.js';

export async function actorRoutes(fastify) {
  // Public: list active actors
  fastify.get('/api/v1/actors', async (request, reply) => {
    const result = await pool.query(
      'SELECT id, name, actor_id, description, category, icon FROM actors WHERE is_active = true ORDER BY category, name'
    );
    return { actors: result.rows };
  });
}

export async function adminActorRoutes(fastify) {
  // Admin: list all actors
  fastify.get('/api/v1/admin/actors', async (request, reply) => {
    const result = await pool.query('SELECT * FROM actors ORDER BY category, name');
    return { actors: result.rows };
  });

  // Admin: toggle active
  fastify.put('/api/v1/admin/actors/:id', async (request, reply) => {
    const { is_active, name, description } = request.body || {};
    const fields = [];
    const params = [];
    if (is_active !== undefined) { params.push(is_active); fields.push(`is_active = $${params.length}`); }
    if (name !== undefined) { params.push(name); fields.push(`name = $${params.length}`); }
    if (description !== undefined) { params.push(description); fields.push(`description = $${params.length}`); }
    if (!fields.length) return reply.code(400).send({ success: false, error: { code: 'BAD_REQUEST', message: 'No fields' } });
    params.push(request.params.id);
    const result = await pool.query(`UPDATE actors SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
    if (!result.rows.length) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Actor not found' } });
    return { success: true, actor: result.rows[0] };
  });
}
