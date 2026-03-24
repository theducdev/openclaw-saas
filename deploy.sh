#!/bin/bash
set -e
REPO="https://github.com/theducdev/openclaw-saas.git"
APP_DIR="/var/www/openclaw"
DB_NAME="openclaw"
DB_USER="openclaw"
DB_PASS="openclaw123"
API_PORT=3000

echo "=========================================="
echo "  OpenClaw VPS Deploy"
echo "=========================================="

# --- Node.js 22 ---
if ! command -v node &>/dev/null || [[ "$(node -v)" != v22* ]]; then
  echo "[1/8] Installing Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "[1/8] Node.js $(node -v) already installed"
fi

# --- PM2 ---
if ! command -v pm2 &>/dev/null; then
  echo "[2/8] Installing PM2..."
  sudo npm install -g pm2
else
  echo "[2/8] PM2 already installed"
fi

# --- PostgreSQL ---
if ! command -v psql &>/dev/null; then
  echo "[3/8] Installing PostgreSQL..."
  sudo apt-get install -y postgresql postgresql-contrib
  sudo systemctl enable postgresql
  sudo systemctl start postgresql
else
  echo "[3/8] PostgreSQL already installed"
fi

# --- Nginx ---
if ! command -v nginx &>/dev/null; then
  echo "[4/8] Installing Nginx..."
  sudo apt-get install -y nginx
  sudo systemctl enable nginx
else
  echo "[4/8] Nginx already installed"
fi

# --- Database ---
echo "[5/8] Setting up database..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_user WHERE usename='${DB_USER}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"

# --- Clone / update repo ---
echo "[6/8] Deploying application..."
sudo mkdir -p "$APP_DIR"
sudo chown "$USER":"$USER" "$APP_DIR"
if [ -d "$APP_DIR/repo/.git" ]; then
  echo "  Pulling latest..."
  cd "$APP_DIR/repo" && git pull
else
  echo "  Cloning repo..."
  git clone "$REPO" "$APP_DIR/repo"
fi

# --- API setup ---
echo "[7/8] Building API..."
cd "$APP_DIR/repo/openclaw-api"
npm ci --omit=dev

# Write production .env
cat > .env << ENV
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}
APIFY_TOKEN=${APIFY_TOKEN:-REPLACE_WITH_YOUR_APIFY_TOKEN}
APIFY_ACTOR_ID=apify/web-scraper
ADMIN_API_KEY=${ADMIN_API_KEY:-oc_admin_supersecretkey123456789abc}
PORT=${API_PORT}
API_KEY_PREFIX=oc_
API_KEY_LENGTH=32
DB_PASSWORD=${DB_PASS}
ALLOWED_ORIGINS=http://192.168.1.101,http://192.168.1.101:8080
ENV

node src/migrate.js
echo "  Migrations done"

# Start/reload API via PM2
pm2 describe openclaw-api &>/dev/null && pm2 reload openclaw-api || \
  pm2 start ecosystem.config.cjs
pm2 save
sudo env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$USER" --hp "$HOME" | tail -1 | sudo bash || true

# --- Build frontends ---
echo "[8/8] Building frontends..."

# Dashboard
cd "$APP_DIR/repo/openclaw-dashboard"
npm ci
VITE_API_URL=/api/v1 npm run build
sudo mkdir -p /var/www/openclaw/dashboard
sudo rsync -a --delete dist/ /var/www/openclaw/dashboard/

# Portal
cd "$APP_DIR/repo/openclaw-portal"
npm ci
VITE_API_URL=/api/v1 npm run build
sudo mkdir -p /var/www/openclaw/portal
sudo rsync -a --delete dist/ /var/www/openclaw/portal/

# --- Nginx ---
sudo cp "$APP_DIR/repo/nginx/openclaw.conf" /etc/nginx/sites-available/openclaw
sudo ln -sf /etc/nginx/sites-available/openclaw /etc/nginx/sites-enabled/openclaw
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "=========================================="
echo "  Deploy complete!"
echo "  Portal:    http://192.168.1.101"
echo "  Dashboard: http://192.168.1.101:8080"
echo "  API:       http://192.168.1.101/api/v1/health"
echo "=========================================="
