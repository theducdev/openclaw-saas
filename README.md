# OpenClaw SaaS Platform

Web crawling service platform with API, Dashboard, and Claude Skill.

## Components

| Component | Description | Port |
|-----------|-------------|------|
| `openclaw-api` | Node.js Fastify backend | 3000 |
| `openclaw-dashboard` | React admin dashboard | 5173 |
| `openclaw-skill` | Claude Skill integration | - |

## Quick Start

### 1. Backend

```bash
cd openclaw-api
cp .env.example .env
# Edit .env with your values

# With Docker:
docker-compose up -d

# Or manually:
npm install
npm run migrate
npm start
```

### 2. Dashboard

```bash
cd openclaw-dashboard
npm install
npm run dev
# Open http://localhost:5173
```

### 3. Environment Variables

Edit `openclaw-api/.env`:

```
DATABASE_URL=postgresql://openclaw:password@localhost:5432/openclaw
APIFY_TOKEN=apify_api_xxxxxxxxxxxx
APIFY_ACTOR_ID=apify/web-scraper
ADMIN_API_KEY=oc_admin_your_secret_key_here
PORT=3000
DB_PASSWORD=your_db_password
```

## API Examples

```bash
# Health check
curl http://localhost:3000/health

# Create customer (admin)
curl -X POST http://localhost:3000/api/v1/admin/customers \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Co","email":"test@co.com","plan_id":"<plan-uuid>"}'

# Crawl URL (customer)
curl -X POST http://localhost:3000/api/v1/crawl \
  -H "Authorization: Bearer $CUSTOMER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","task":"Get page title"}'
```
# openclaw-saas
