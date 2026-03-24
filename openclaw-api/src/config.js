import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  databaseUrl: process.env.DATABASE_URL,
  apifyToken: process.env.APIFY_TOKEN,
  apifyActorId: process.env.APIFY_ACTOR_ID || 'apify/web-scraper',
  adminApiKey: process.env.ADMIN_API_KEY,
  apiKeyPrefix: process.env.API_KEY_PREFIX || 'oc_',
  apiKeyLength: parseInt(process.env.API_KEY_LENGTH || '32'),
};
