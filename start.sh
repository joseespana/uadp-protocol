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
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

header() { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }
ok()     { echo -e "  ${GREEN}✓${NC} $1"; }
fail()   { echo -e "  ${RED}✗${NC} $1"; }
warn()   { echo -e "  ${YELLOW}⚠${NC} $1"; }

# ── Pre-checks ──────────────────────────────────────────
prechecks() {
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

  # Scraper .env
  if [ ! -f "$SCRIPT_DIR/packages/uadp-scraper/.env" ]; then
    warn "packages/uadp-scraper/.env not found — creating from example"
    cp "$SCRIPT_DIR/packages/uadp-scraper/.env.example" \
       "$SCRIPT_DIR/packages/uadp-scraper/.env"
    warn "Edit packages/uadp-scraper/.env with LASTFM_API_KEY etc."
  else
    ok "Scraper .env found"
  fi

  # MongoDB network
  if docker network inspect perseusoft-mongodb-network &>/dev/null; then
    ok "perseusoft-mongodb-network found"
  else
    fail "perseusoft-mongodb-network not found — start MongoDB docker-compose first"
    exit 1
  fi
}

# ── Service list ───────────────────────────────────────
print_services() {
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
  echo -e "  ${CYAN}RSSHub${NC}    http://localhost:1200  (Twitter RSS proxy)"
  echo -e "  ${CYAN}Scraper${NC}   cron @ midnight UTC    (articles/videos/social/music → MongoDB)"
}

wait_for_gateway() {
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
    echo -e "  ${GREEN}All services are running in the background (15 UADP + RSSHub + Scraper).${NC}"
    echo -e "  Closing this terminal will ${BOLD}NOT${NC} stop them."
    echo ""
    echo -e "  ${YELLOW}./start.sh logs${NC}         Tail all logs"
    echo -e "  ${YELLOW}./start.sh logs nova${NC}    Tail a specific service"
    echo -e "  ${YELLOW}./start.sh status${NC}       Check running containers"
    echo -e "  ${YELLOW}./start.sh down${NC}         Stop everything"
    echo -e "  ${YELLOW}./test.sh${NC}               Probe all endpoints"
    echo ""
  else
    warn "Gateway not responding yet. Check logs with: ${YELLOW}./start.sh logs${NC}"
  fi
}

# ── Actions ────────────────────────────────────────────

do_up() {
  header "Building & starting Cosmos"
  docker compose down --remove-orphans 2>/dev/null || true
  echo -e "  Building images (this may take a minute the first time)...\n"
  docker compose build --parallel
  echo ""
  docker compose up -d
  print_services
  wait_for_gateway
}

do_down() {
  header "Stopping Cosmos"
  docker compose down --remove-orphans
  ok "All services stopped"
}

do_restart() {
  header "Restarting Cosmos"
  docker compose down --remove-orphans
  docker compose build --parallel
  docker compose up -d
  print_services
  ok "All services rebuilt and restarted"
}

do_restart_one() {
  local svc="$1"
  header "Rebuilding & restarting: $svc"
  echo -e "  Stopping ${CYAN}$svc${NC}..."
  docker compose stop "$svc" 2>/dev/null || true
  docker compose rm -f "$svc" 2>/dev/null || true
  echo -e "  Building ${CYAN}$svc${NC}..."
  docker compose build "$svc"
  echo -e "  Starting ${CYAN}$svc${NC}..."
  docker compose up -d "$svc"
  sleep 2
  local status
  status=$(docker compose ps "$svc" --format '{{.Status}}' 2>/dev/null | head -1)
  if echo "$status" | grep -q "Up"; then
    ok "$svc is running: $status"
  else
    fail "$svc may have failed — check logs: ./start.sh logs $svc"
  fi
}

do_logs() {
  local svc="${1:-}"
  if [ -n "$svc" ]; then
    docker compose logs -f "$svc"
  else
    docker compose logs -f
  fi
}

do_rebuild() {
  header "Full rebuild (no cache)"
  docker compose down --remove-orphans
  echo -e "  Removing old images..."
  docker compose down --rmi local 2>/dev/null || true
  echo -e "  Building from scratch...\n"
  docker compose build --no-cache --parallel
  docker compose up -d
  print_services
  wait_for_gateway
}

do_reinstall() {
  header "Full reinstall — nuclear option"
  warn "This will destroy ALL containers, images, volumes, and caches for Cosmos."
  echo ""
  read -rp "  Are you sure? (y/N) " confirm
  if [[ "$confirm" != [yY] ]]; then
    echo "  Aborted."
    return
  fi

  echo ""
  header "Stopping all services"
  docker compose down --remove-orphans --rmi all --volumes 2>/dev/null || true
  ok "Containers, images, and volumes removed"

  header "Cleaning up Docker resources"
  docker builder prune -f --filter "label=com.docker.compose.project=uadp-protocol" 2>/dev/null || true
  docker images --filter "dangling=true" -q 2>/dev/null | xargs -r docker rmi 2>/dev/null || true
  ok "Build cache pruned"

  header "Reinstalling dependencies"
  rm -rf node_modules packages/*/node_modules services/*/node_modules
  ok "Removed node_modules"
  bun install
  ok "Dependencies installed"

  header "Regenerating seed data"
  bun run seed
  ok "Seed data regenerated"

  header "Building images from scratch"
  docker compose build --no-cache --parallel
  ok "Images built"

  header "Starting services"
  docker compose up -d
  print_services
  wait_for_gateway
}

do_status() {
  header "Service status"
  docker compose ps
}

# ── Interactive menu ───────────────────────────────────

show_menu() {
  echo ""
  echo -e "${BOLD}${CYAN}  ╔══════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${CYAN}  ║        🌌  Cosmos Control Panel         ║${NC}"
  echo -e "${BOLD}${CYAN}  ╚══════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  ${GREEN}1)${NC} ${BOLD}Start${NC}        Build & start all services"
  echo -e "  ${GREEN}2)${NC} ${BOLD}Stop${NC}         Stop all services"
  echo -e "  ${GREEN}3)${NC} ${BOLD}Restart${NC}      Rebuild & restart all"
  echo -e "  ${GREEN}4)${NC} ${BOLD}Rebuild${NC}      Full rebuild (no cache)"
  echo -e "  ${CYAN}5)${NC} ${BOLD}Restart one${NC}  Rebuild & restart a single service"
  echo -e "  ${YELLOW}6)${NC} ${BOLD}Reinstall${NC}    Nuclear: destroy all → reinstall → reseed → rebuild"
  echo -e "  ${DIM}7)${NC} ${BOLD}Status${NC}       Show running containers"
  echo -e "  ${DIM}8)${NC} ${BOLD}Logs${NC}         Tail all logs"
  echo -e "  ${DIM}9)${NC} ${BOLD}Service log${NC}   Tail a specific service"
  echo -e "  ${RED}0)${NC} ${BOLD}Exit${NC}"
  echo ""
  echo -ne "  ${BOLD}Pick an option: ${NC}"
}

run_menu() {
  while true; do
    show_menu
    read -r choice

    case "$choice" in
      1) prechecks; do_up; break ;;
      2) do_down; break ;;
      3) prechecks; do_restart; break ;;
      4) prechecks; do_rebuild; break ;;
      5)
        echo ""
        echo -ne "  ${BOLD}Service name${NC} (scraper, herald, nova, stream...): "
        read -r svc_name
        if [ -n "$svc_name" ]; then
          prechecks; do_restart_one "$svc_name"; break
        else
          warn "No service name provided"
        fi
        ;;
      6) prechecks; do_reinstall; break ;;
      7) do_status ;;
      8) do_logs; break ;;
      9)
        echo ""
        echo -ne "  ${BOLD}Service name${NC} (nova, orbit, stream...): "
        read -r svc_name
        if [ -n "$svc_name" ]; then
          do_logs "$svc_name"
          break
        else
          warn "No service name provided"
        fi
        ;;
      0|q|Q) echo -e "\n  Bye! 👋\n"; exit 0 ;;
      *) warn "Invalid option '$choice'" ;;
    esac
  done
}

# ── Entrypoint ─────────────────────────────────────────

# No args → interactive menu
if [ $# -eq 0 ]; then
  run_menu
  exit 0
fi

# With args → direct command (backwards compatible)
ACTION="$1"
shift

prechecks

case "$ACTION" in
  up|start)         do_up ;;
  down|stop)        do_down ;;
  restart)          do_restart ;;
  restart-one)
    if [ -z "${1:-}" ]; then
      echo "Usage: ./start.sh restart-one <service>"
      echo "  e.g. ./start.sh restart-one scraper"
      exit 1
    fi
    do_restart_one "$1" ;;
  logs)             do_logs "${1:-}" ;;
  rebuild)          do_rebuild ;;
  reinstall)        do_reinstall ;;
  status)           do_status ;;
  *)
    echo "Usage: ./start.sh [command]"
    echo ""
    echo "  No args          Interactive menu"
    echo "  up               Stop old → build → start all services"
    echo "  down             Stop all services"
    echo "  restart          Rebuild and restart all services"
    echo "  restart-one SVC  Rebuild and restart a single service"
    echo "  logs [SVC]       Tail logs (optional: ./start.sh logs nova)"
    echo "  rebuild          Full rebuild (no cache, removes old images)"
    echo "  reinstall        Nuclear: destroy everything, reinstall deps, reseed, rebuild"
    echo "  status           Show running containers"
    echo ""
    echo "Examples:"
    echo "  ./start.sh restart-one scraper"
    echo "  ./start.sh logs herald"
    exit 1
    ;;
esac
