#!/usr/bin/env bash
set -euo pipefail

URL="${1:?Usage: crawl.sh <url> [task] [maxPages]}"
TASK="${2:-}"
MAX_PAGES="${3:-10}"
BASE_URL="${OPENCLAW_BASE_URL:-https://api.openclaw.vn}"
API_KEY="${OPENCLAW_API_KEY:?Set OPENCLAW_API_KEY in environment}"

PAYLOAD=$(cat <<EOF
{
  "url": "$URL",
  "task": "$TASK",
  "options": { "maxPages": $MAX_PAGES }
}
EOF
)

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$BASE_URL/api/v1/crawl" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "$BODY"
else
  echo "Error $HTTP_CODE: $BODY" >&2
  exit 1
fi
