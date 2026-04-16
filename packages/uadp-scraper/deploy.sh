#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "╔══════════════════════════════════════════════╗"
echo "║   UADP Scraper Deploy                        ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ─── Check .env ──────────────────────────────────────────────────────────
if [ ! -f "$DIR/.env" ]; then
  echo "WARNING: .env not found — creating from example"
  cp "$DIR/.env.example" "$DIR/.env"
  echo ">>> EDIT .env with LASTFM_API_KEY etc. <<<"
  echo ">>> Then run ./deploy.sh again <<<"
  exit 1
fi

# ─── Verify perseusoft-mongodb-network exists ────────────────────────────
if ! docker network inspect perseusoft-mongodb-network &>/dev/null; then
  echo "[!] perseusoft-mongodb-network not found"
  echo "    Start your MongoDB docker-compose first."
  exit 1
fi

# ─── Stop existing ───────────────────────────────────────────────────────
docker rm -f uadp-scraper rsshub 2>/dev/null || true

# ─── RSSHub (Twitter/X RSS without API key) ─────────────────────────────
echo "[1/2] Starting RSSHub..."
if ! docker ps --format '{{.Names}}' | grep -q '^rsshub$'; then
  docker run -d \
    --name rsshub \
    --network perseusoft-mongodb-network \
    --restart unless-stopped \
    -p 1200:1200 \
    diygod/rsshub 2>&1 | tail -1
else
  docker network connect perseusoft-mongodb-network rsshub 2>/dev/null || true
  echo "  (already running)"
fi

# ─── Build + start scraper ───────────────────────────────────────────────
echo "[2/2] Building uadp-scraper..."
docker build -f Dockerfile -t uadp-scraper . 2>&1 | tail -3

docker run -d \
  --name uadp-scraper \
  --network perseusoft-mongodb-network \
  --restart unless-stopped \
  --env-file "$DIR/.env" \
  uadp-scraper

# Connect to RSSHub too (if rsshub is on a different network)
docker network connect perseusoft-mongodb-network rsshub 2>/dev/null || true

# ─── Verify ──────────────────────────────────────────────────────────────
sleep 3
SCRAPER_OK=$(docker ps --filter name=uadp-scraper --format '{{.Status}}' | grep -q "Up" && echo "UP" || echo "DOWN")
RSSHUB_OK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:1200/ 2>/dev/null || echo "000")

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Container        Port    Status                          ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  rsshub           1200    $([ "$RSSHUB_OK" = "200" ] && echo "✓ UP  " || echo "✗ DOWN")                          ║"
echo "║  uadp-scraper     cron    ✓ $SCRAPER_OK                            ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Network: perseusoft-mongodb-network                      ║"
echo "║  Cron: midnight UTC + on startup if >20h since last       ║"
echo "║  Manual: docker exec uadp-scraper bun run scrape          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "To stop:  docker rm -f uadp-scraper rsshub"
