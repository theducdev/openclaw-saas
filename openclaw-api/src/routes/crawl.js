import { pool } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { checkQuota } from '../services/quota.js';
import { runCrawl } from '../services/apify.js';

export async function crawlRoutes(fastify) {
  fastify.post('/api/v1/crawl', { preHandler: authenticate }, async (request, reply) => {
    const { url, task, actor_id, options = {} } = request.body || {};

    if (!url) {
      return reply.code(400).send({ success: false, error: { code: 'BAD_REQUEST', message: 'url is required' } });
    }
    let parsedUrl;
    try { parsedUrl = new URL(url); } catch {
      return reply.code(400).send({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid URL format' } });
    }
    // SSRF protection: block internal/private IP ranges and loopback
    const hostname = parsedUrl.hostname.toLowerCase();
    const ssrfBlocked = /^(localhost|127\.|0\.0\.0\.0|::1|169\.254\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(hostname);
    if (ssrfBlocked || parsedUrl.protocol === 'file:') {
      return reply.code(400).send({ success: false, error: { code: 'BAD_REQUEST', message: 'URL not allowed' } });
    }

    const customer = request.customer;
    const monthlyLimit = customer.monthly_limit || 0;
    const quota = await checkQuota(customer, monthlyLimit);

    if (quota.exceeded) {
      return reply.code(429).send({
        success: false,
        error: { code: 'QUOTA_EXCEEDED', message: `Bạn đã sử dụng hết ${quota.used}/${quota.limit} lượt trong tháng này` },
        usage: { used: quota.used, limit: quota.limit, remaining: 0 },
      });
    }

    const rawMaxPages = parseInt(options.maxPages);
    const maxPages = Math.max(1, Math.min(
      Number.isFinite(rawMaxPages) ? rawMaxPages : (customer.max_pages || 10),
      customer.max_pages || 10
    ));
    const startTime = Date.now();

    const logResult = await pool.query(
      `INSERT INTO usage_logs (customer_id, request_url, request_task, request_options, response_status)
       VALUES ($1, $2, $3, $4, NULL) RETURNING id`,
      [customer.id, url, task || null, JSON.stringify({ maxPages, actor_id: actor_id || null, ...options })]
    );
    const logId = logResult.rows[0].id;

    try {
      const { items, runId } = await runCrawl({ url, task, maxPages, actorId: actor_id, options });
      const duration = Date.now() - startTime;

      await pool.query(
        `UPDATE usage_logs SET response_status = 200, pages_crawled = $1, apify_run_id = $2, duration_ms = $3 WHERE id = $4`,
        [items.length, runId, duration, logId]
      );

      const newQuota = { used: quota.used + 1, limit: quota.limit, remaining: quota.remaining - 1 };
      return reply.code(200).send({
        success: true,
        data: { results: items, pages_crawled: items.length, crawl_time_ms: duration },
        usage: { ...newQuota, period: new Date().toISOString().slice(0, 7) },
      });
    } catch (err) {
      const duration = Date.now() - startTime;
      await pool.query(
        `UPDATE usage_logs SET response_status = 502, duration_ms = $1, error_message = $2 WHERE id = $3`,
        [duration, err.message, logId]
      );
      if (err.message.includes('TIMEOUT')) {
        return reply.code(502).send({ success: false, error: { code: 'APIFY_ERROR', message: 'Crawl timed out. Try reducing maxPages.' } });
      }
      return reply.code(502).send({ success: false, error: { code: 'APIFY_ERROR', message: 'Crawl service error. Please try again.' } });
    }
  });
}
