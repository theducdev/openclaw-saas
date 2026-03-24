#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${OPENCLAW_BASE_URL:-https://api.openclaw.vn}"
API_KEY="${OPENCLAW_API_KEY:?Set OPENCLAW_API_KEY in environment}"

curl -s \
  -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/v1/usage"
