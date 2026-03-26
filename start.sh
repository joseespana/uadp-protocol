#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────
# Cosmos — Start all services locally via Docker Compose
# ─────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

header() { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }
ok()     { echo -e "  ${GREEN}✓${NC} $1"; }
fail()   { echo -e "  ${RED}✗${NC} $1"; }
warn()   { echo -e "  ${YELLOW}⚠${NC} $1"; }

# ── Pre-checks ──────────────────────────────────────────
header "Pre-checks"

if ! command -v docker &>/dev/null; then
  fail "Docker not found. Install it: https://docs.docker.com/get-docker/"
  exit 1
fi
ok "Docker found: $(docker --version | head -1)"

if ! docker compose version &>/dev/null 2>&1; then
  fail "Docker Compose (v2) not found. Install it: https://docs.docker.com/compose/install/"
  exit 1
fi
ok "Docker Compose found: $(docker compose version --short)"

if ! docker info &>/dev/null 2>&1; then
  fail "Docker daemon is not running. Start Docker first."
  exit 1
fi
ok "Docker daemon is running"

# ── Parse args ──────────────────────────────────────────
ACTION="${1:-up}"

case "$ACTION" in
  up|start)
    header "Building & starting Cosmos"
    echo -e "  Building images (this may take a minute the first time)...\n"
    docker compose build --parallel
    echo ""
    docker compose up -d

    header "Services"
    echo -e "  ${CYAN}Gateway${NC}   http://localhost:4000"
    echo -e "  ${CYAN}Nova${NC}      http://localhost:4001  (social text)"
    echo -e "  ${CYAN}Pulse${NC}     http://localhost:4002  (social visual)"
    echo -e "  ${CYAN}Orbit${NC}     http://localhost:4003  (bank)"
    echo -e "  ${CYAN}Zinc${NC}      http://localhost:4004  (neobank)"
    echo -e "  ${CYAN}Market${NC}    http://localhost:4005  (store)"
    echo -e "  ${CYAN}Stream${NC}    http://localhost:4006  (video)"
    echo -e "  ${CYAN}Echo${NC}      http://localhost:4007  (messaging)"
    echo -e "  ${CYAN}Herald${NC}    http://localhost:4008  (news)"
    echo -e "  ${CYAN}Lyra${NC}      http://localhost:4009  (music)"
    echo -e "  ${CYAN}Vortex${NC}    http://localhost:4010  (movies)"
    echo -e "  ${CYAN}Beacon${NC}    http://localhost:4011  (email)"
    echo -e "  ${CYAN}Compass${NC}   http://localhost:4012  (rides)"
    echo -e "  ${CYAN}Flame${NC}     http://localhost:4013  (food delivery)"
    echo -e "  ${CYAN}Atlas${NC}     http://localhost:4014  (calendar)"

    header "Waiting for services to be ready..."
    READY=0
    for i in $(seq 1 30); do
      if curl -sf http://localhost:4000/services >/dev/null 2>&1; then
        READY=1
        break
      fi
      sleep 1
      echo -ne "  Attempt $i/30...\r"
    done

    if [ "$READY" -eq 1 ]; then
      ok "Gateway is responding!"
      echo ""
      echo -e "  Run ${YELLOW}./test.sh${NC} to probe all endpoints."
      echo -e "  Run ${YELLOW}./start.sh down${NC} to stop everything."
      echo -e "  Press ${YELLOW}Ctrl+C${NC} to detach from logs.\n"
      docker compose logs -f --tail=20
    else
      warn "Gateway not responding yet. Showing logs:"
      docker compose logs -f
    fi
    ;;

  down|stop)
    header "Stopping Cosmos"
    docker compose down
    ok "All services stopped"
    ;;

  restart)
    header "Restarting Cosmos"
    docker compose down
    docker compose up -d
    ok "All services restarted"
    ;;

  logs)
    if [ -n "${2:-}" ]; then
      docker compose logs -f "$2"
    else
      docker compose logs -f
    fi
    ;;

  rebuild)
    header "Full rebuild"
    docker compose down
    docker compose build --no-cache --parallel
    docker compose up -d
    ok "Rebuilt and started"
    ;;

  status)
    header "Service status"
    docker compose ps
    ;;

  *)
    echo "Usage: ./start.sh [up|down|restart|logs|rebuild|status]"
    echo ""
    echo "  up       Build & start all services (default)"
    echo "  down     Stop all services"
    echo "  restart  Restart all services"
    echo "  logs     Tail logs (optional: ./start.sh logs nova)"
    echo "  rebuild  Full rebuild from scratch (no cache)"
    echo "  status   Show running containers"
    exit 1
    ;;
esac
