import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from './config.js';
import { adminAuthenticate } from './middleware/adminAuth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { crawlRoutes } from './routes/crawl.js';
import { usageRoutes } from './routes/usage.js';
import { actorRoutes, adminActorRoutes } from './routes/actors.js';
import { adminDashboardRoutes } from './routes/admin/dashboard.js';
import { adminCustomerRoutes } from './routes/admin/customers.js';
import { adminPaymentRoutes } from './routes/admin/payments.js';
import { adminPlanRoutes } from './routes/admin/plans.js';
import { adminUsageRoutes } from './routes/admin/usage.js';

const fastify = Fastify({ logger: { level: 'info' } });

await fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
});

// CORS: allow localhost for dev + any configured ALLOWED_ORIGINS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',').map(o => o.trim()).filter(Boolean);
await fastify.register(cors, {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  // Key by customer ID when authenticated, otherwise by IP
  keyGenerator: (req) => req.customer?.id ? `cust_${req.customer.id}` : `ip_${req.ip}`,
});

fastify.setErrorHandler(errorHandler);

fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

await fastify.register(crawlRoutes);
await fastify.register(usageRoutes);
await fastify.register(actorRoutes);

fastify.register(async (app) => {
  app.addHook('preHandler', adminAuthenticate);
  await adminDashboardRoutes(app);
  await adminCustomerRoutes(app);
  await adminPaymentRoutes(app);
  await adminPlanRoutes(app);
  await adminUsageRoutes(app);
  await adminActorRoutes(app);
});

try {
  await fastify.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`OpenClaw API running on port ${config.port}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
