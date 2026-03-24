import { config } from '../config.js';
import { timingSafeEqual } from 'crypto';

export async function adminAuthenticate(request, reply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing admin key' } });
  }

  const key = authHeader.slice(7).trim();
  const expected = config.adminApiKey || '';

  // Timing-safe comparison to prevent timing attacks
  let valid = false;
  try {
    const a = Buffer.from(key.padEnd(expected.length));
    const b = Buffer.from(expected.padEnd(key.length));
    valid = key.length === expected.length && timingSafeEqual(
      Buffer.from(key),
      Buffer.from(expected)
    );
  } catch {
    valid = false;
  }

  if (!valid) {
    return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid admin key' } });
  }
}
