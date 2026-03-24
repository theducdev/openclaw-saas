# OpenClaw

A SaaS web crawling platform powered by [Apify](https://apify.com). Sell crawling-as-a-service to your customers with quota management, billing, and a full admin dashboard.

## Architecture

```
openclaw/
├── openclaw-api/        # Node.js + Fastify backend (REST API)
├── openclaw-dashboard/  # React admin dashboard (owner)
├── openclaw-portal/     # React customer portal (end users)
├── openclaw-skill/      # Claude Code skill for CLI access
├── nginx/               # Nginx reverse proxy config
└── deploy.sh            # One-command VPS deploy script
```

## Features

- **13 Apify actors** — general scraper, Instagram, YouTube, Twitter/X, Facebook (pages/posts/groups/comments/profile), Booking.com, TripAdvisor
- **Plan-based quota** — Starter / Basic / Pro with monthly crawl limits
- **Admin dashboard** — manage customers, payments, usage analytics, revenue tracking, pricing calculator
- **Customer portal** — live crawl tester with table/JSON view, usage stats, history
- **Security** — bcrypt API keys, timing-safe auth, SSRF blocklist, CORS allowlist, HSTS/CSP headers

## Tech Stack

| Layer | Stack |
|-------|-------|
| API | Node.js 22, Fastify, PostgreSQL 17 |
| Frontend | React 18, Vite 5, Tailwind CSS |
| Crawling | Apify REST API |
| Process | PM2 |
| Proxy | Nginx |

## Quick Start (Local)

### Prerequisites
- Node.js 22+
- PostgreSQL 17
- Apify account + API token

### 1. Clone
```bash
git clone https://github.com/theducdev/openclaw-saas.git
cd openclaw-saas
```

### 2. API
```bash
cd openclaw-api
cp .env.example .env
# Fill in your values in .env
npm install
node src/migrate.js      # create tables + seed data
node src/index.js        # starts on port 3000
```

### 3. Admin Dashboard
```bash
cd openclaw-dashboard
echo "VITE_API_URL=http://localhost:3000/api/v1" > .env.local
npm install && npm run dev   # http://localhost:5173
```

### 4. Customer Portal
```bash
cd openclaw-portal
echo "VITE_API_URL=http://localhost:3000/api/v1" > .env.local
npm install && npm run dev   # http://localhost:5174
```

Default admin key: `oc_admin_supersecretkey123456789abc` (change this in `.env` before going live)

## Deploy to VPS (Ubuntu)

```bash
ssh user@your-vps

# Set secrets first
export APIFY_TOKEN=your_apify_token
export ADMIN_API_KEY=your_admin_key

# One-command deploy
curl -fsSL https://raw.githubusercontent.com/theducdev/openclaw-saas/main/deploy.sh | bash
```

After deploy:

| Service | URL |
|---------|-----|
| Customer Portal | `http://your-vps-ip` |
| Admin Dashboard | `http://your-vps-ip:8080` |
| API Health | `http://your-vps-ip/api/v1/health` |

## Environment Variables

```env
DATABASE_URL=postgresql://openclaw:password@localhost:5432/openclaw
APIFY_TOKEN=apify_api_...
ADMIN_API_KEY=oc_admin_...
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

See `openclaw-api/.env.example` for the full list.

## API Reference

### Customer endpoints (Bearer `oc_...` key)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/crawl` | Run a crawl |
| `GET` | `/api/v1/plan` | Current plan & quota |
| `GET` | `/api/v1/usage` | Usage history |
| `GET` | `/api/v1/actors` | Available actors |

### Admin endpoints (Bearer admin key)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/admin/dashboard` | Overview stats |
| `GET/POST` | `/api/v1/admin/customers` | List / create customers |
| `PUT/DELETE` | `/api/v1/admin/customers/:id` | Update / cancel |
| `POST` | `/api/v1/admin/customers/:id/reset-key` | Reset API key |
| `GET` | `/api/v1/admin/revenue` | Revenue analytics |
| `GET/POST` | `/api/v1/admin/payments` | Payments |
| `GET/POST` | `/api/v1/admin/plans` | Plans |
| `GET` | `/api/v1/admin/usage` | Usage logs |

## Supported Actors

| Actor ID | Category |
|----------|----------|
| `apify/cheerio-scraper` | General |
| `apify/web-scraper` | General |
| `apify/puppeteer-scraper` | General |
| `apify/instagram-scraper` | Social |
| `streamers/youtube-scraper` | Social |
| `apidojo/tweet-scraper` | Social |
| `apify/facebook-pages-scraper` | Facebook |
| `apify/facebook-posts-scraper` | Facebook |
| `apify/facebook-groups-scraper` | Facebook |
| `apify/facebook-comments-scraper` | Facebook |
| `apify/facebook-profile-scraper` | Facebook |
| `voyager/booking-scraper` | Travel |
| `maxcopell/tripadvisor` | Travel |

## License

MIT
