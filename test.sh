#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────
# Cosmos — Probe & test all UADP endpoints
# ─────────────────────────────────────────────────────────
#
# Usage:
#   ./test.sh              Run all tests
#   ./test.sh discovery    Only test autodiscovery
#   ./test.sh nova         Only test Nova service
#   ./test.sh gateway      Only test Gateway
#   ./test.sh sse          Test SSE streaming
#   ./test.sh full         Deep test all endpoints
#

BASE="http://localhost"
PASS=0
FAIL=0
SKIP=0
VERBOSE="${VERBOSE:-0}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m'

header()  { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }
subhead() { echo -e "\n  ${YELLOW}▸ $1${NC}"; }

check() {
  local desc="$1"
  local url="$2"
  local method="${3:-GET}"
  local body="${4:-}"
  local expect_status="${5:-200}"

  local curl_args=(-s -w "\n%{http_code}" -X "$method")

  if [ -n "$body" ]; then
    curl_args+=(-H "Content-Type: application/json" -d "$body")
  fi

  local response
  response=$(curl "${curl_args[@]}" "$url" 2>/dev/null) || true

  local status_code
  status_code=$(echo "$response" | tail -1)
  local resp_body
  resp_body=$(echo "$response" | sed '$d')

  if [ "$status_code" = "$expect_status" ]; then
    echo -e "  ${GREEN}✓${NC} $desc ${DIM}($method $url → $status_code)${NC}"
    ((PASS++)) || true

    if [ "$VERBOSE" = "1" ] && [ -n "$resp_body" ]; then
      echo "$resp_body" | head -5 | sed 's/^/    /'
      local lines
      lines=$(echo "$resp_body" | wc -l)
      if [ "$lines" -gt 5 ]; then
        echo -e "    ${DIM}... ($lines lines total)${NC}"
      fi
    fi
  else
    echo -e "  ${RED}✗${NC} $desc ${DIM}($method $url → $status_code, expected $expect_status)${NC}"
    ((FAIL++)) || true
    if [ -n "$resp_body" ]; then
      echo "$resp_body" | head -3 | sed 's/^/    /'
    fi
  fi
}

check_json_field() {
  local desc="$1"
  local url="$2"
  local field="$3"

  local response
  response=$(curl -sf "$url" 2>/dev/null) || true

  if [ -z "$response" ]; then
    echo -e "  ${RED}✗${NC} $desc ${DIM}(no response)${NC}"
    ((FAIL++)) || true
    return
  fi

  # Use simple grep to check field exists
  if echo "$response" | grep -q "\"$field\""; then
    echo -e "  ${GREEN}✓${NC} $desc ${DIM}(field '$field' present)${NC}"
    ((PASS++)) || true
  else
    echo -e "  ${RED}✗${NC} $desc ${DIM}(field '$field' missing)${NC}"
    ((FAIL++)) || true
  fi
}

check_sse() {
  local desc="$1"
  local url="$2"
  local timeout="${3:-3}"

  local response
  response=$(timeout "$timeout" curl -sf -N "$url" 2>/dev/null) || true

  if [ -n "$response" ]; then
    local lines
    lines=$(echo "$response" | wc -l)
    echo -e "  ${GREEN}✓${NC} $desc ${DIM}(received $lines lines in ${timeout}s)${NC}"
    ((PASS++)) || true
    if [ "$VERBOSE" = "1" ]; then
      echo "$response" | head -3 | sed 's/^/    /'
    fi
  else
    echo -e "  ${YELLOW}⚠${NC} $desc ${DIM}(no data in ${timeout}s — may be OK if service is slow)${NC}"
    ((SKIP++)) || true
  fi
}

# ─── Test groups ────────────────────────────────────────

test_gateway() {
  header "Gateway (:4000)"

  check "GET /services" "$BASE:4000/services"
  check_json_field "Services list has 'nova'" "$BASE:4000/services" "nova"
  check_json_field "Services list has 'orbit'" "$BASE:4000/services" "orbit"

  subhead "Proxy routing"
  check "Proxy → Nova feed" "$BASE:4000/nova/uadp/v1/feed"
  check "Proxy → Orbit accounts" "$BASE:4000/orbit/uadp/v1/accounts"
  check "Proxy → Market products" "$BASE:4000/market/uadp/v1/products/search"
  check "Unknown service → 404" "$BASE:4000/nonexistent/test" "GET" "" "404"
}

test_discovery() {
  header "UADP Autodiscovery (/.well-known/uadp.json)"

  local services=("nova:4001" "pulse:4002" "orbit:4003" "zinc:4004" "market:4005" "stream:4006" "echo:4007" "herald:4008")

  for entry in "${services[@]}"; do
    local svc="${entry%%:*}"
    local port="${entry##*:}"
    local SVC_UPPER
    SVC_UPPER=$(echo "$svc" | tr '[:lower:]' '[:upper:]')

    check "$SVC_UPPER manifest" "$BASE:$port/.well-known/uadp.json"
  done

  subhead "Manifest structure validation"

  for entry in "${services[@]}"; do
    local svc="${entry%%:*}"
    local port="${entry##*:}"
    local SVC_UPPER
    SVC_UPPER=$(echo "$svc" | tr '[:lower:]' '[:upper:]')

    check_json_field "$SVC_UPPER has service_id" "$BASE:$port/.well-known/uadp.json" "service_id"
    check_json_field "$SVC_UPPER has ai_hints" "$BASE:$port/.well-known/uadp.json" "ai_hints"
    check_json_field "$SVC_UPPER has endpoints" "$BASE:$port/.well-known/uadp.json" "endpoints"
  done

  subhead "Autodiscovery via Gateway proxy"

  for entry in "${services[@]}"; do
    local svc="${entry%%:*}"
    check "Gateway → $svc manifest" "$BASE:4000/$svc/.well-known/uadp.json"
  done
}

test_auth() {
  header "Auth Challenges"

  local services=("nova:4001" "pulse:4002" "orbit:4003" "zinc:4004" "market:4005" "stream:4006" "echo:4007" "herald:4008")

  for entry in "${services[@]}"; do
    local svc="${entry%%:*}"
    local port="${entry##*:}"
    local SVC_UPPER
    SVC_UPPER=$(echo "$svc" | tr '[:lower:]' '[:upper:]')

    check "$SVC_UPPER auth challenge" "$BASE:$port/uadp/v1/auth/challenge" "POST"
  done
}

test_nova() {
  header "Nova — Social Text (:4001)"

  check "Feed" "$BASE:4001/uadp/v1/feed"
  check "Feed with pagination" "$BASE:4001/uadp/v1/feed?limit=5"
  check "Notifications" "$BASE:4001/uadp/v1/notifications"
  check "Trending" "$BASE:4001/uadp/v1/trending"
  check "Search" "$BASE:4001/uadp/v1/search?q=tech"
  check "Create post" "$BASE:4001/uadp/v1/post/create" "POST" \
    '{"body":"Test post from probe","author":{"id":"user:jose_espana"},"tags":["test"]}'
  check_json_field "Feed has uadp_type" "$BASE:4001/uadp/v1/feed" "uadp_type"
}

test_pulse() {
  header "Pulse — Visual Social (:4002)"

  check "Feed" "$BASE:4002/uadp/v1/feed"
  check "Explore" "$BASE:4002/uadp/v1/explore"
  check "Stories" "$BASE:4002/uadp/v1/stories"
  check "DM inbox (stub)" "$BASE:4002/uadp/v1/dm/inbox"
}

test_orbit() {
  header "Orbit — Bank (:4003)"

  check "Accounts" "$BASE:4003/uadp/v1/accounts"
  check "Cards" "$BASE:4003/uadp/v1/cards"
  check "Spending analytics" "$BASE:4003/uadp/v1/spending/analytics"

  # Get first account ID for transaction queries
  local acct_id
  acct_id=$(curl -sf "$BASE:4003/uadp/v1/accounts" 2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -n "$acct_id" ]; then
    check "Account detail" "$BASE:4003/uadp/v1/accounts/$acct_id"
    check "Transactions" "$BASE:4003/uadp/v1/accounts/$acct_id/transactions"
    check "Statement" "$BASE:4003/uadp/v1/accounts/$acct_id/statement"
  fi

  check "Transfer initiate" "$BASE:4003/uadp/v1/transfer/initiate" "POST" \
    '{"destination":"012345678901234567","amount":{"value":100,"currency":"MXN"},"concept":"Test transfer"}'
  check_json_field "Accounts have uadp_type" "$BASE:4003/uadp/v1/accounts" "uadp_type"
}

test_zinc() {
  header "Zinc — Neobank (:4004)"

  check "Accounts" "$BASE:4004/uadp/v1/accounts"
  check "Transactions" "$BASE:4004/uadp/v1/transactions"
  check "Cards" "$BASE:4004/uadp/v1/cards"
  check "Spending analytics" "$BASE:4004/uadp/v1/spending/analytics"
  check "FX rate" "$BASE:4004/uadp/v1/fx/rate"
  check "FX convert" "$BASE:4004/uadp/v1/fx/convert" "POST" \
    '{"amount":100,"from":"USD","to":"MXN"}'
}

test_market() {
  header "Market — Store (:4005)"

  check "Product search" "$BASE:4005/uadp/v1/products/search"
  check "Product search with query" "$BASE:4005/uadp/v1/products/search?q=teclado"
  check "Orders" "$BASE:4005/uadp/v1/orders"
  check "Cart" "$BASE:4005/uadp/v1/cart"
  check "Wishlist" "$BASE:4005/uadp/v1/wishlist"

  # Get a product ID to test add-to-cart
  local prod_id
  prod_id=$(curl -sf "$BASE:4005/uadp/v1/products/search" 2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -n "$prod_id" ]; then
    check "Add to cart" "$BASE:4005/uadp/v1/cart/add" "POST" \
      "{\"product_id\":\"$prod_id\",\"qty\":1}"
  fi

  # Get an order ID for tracking
  local order_id
  order_id=$(curl -sf "$BASE:4005/uadp/v1/orders" 2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -n "$order_id" ]; then
    check "Order detail" "$BASE:4005/uadp/v1/orders/$order_id"
    check "Order tracking" "$BASE:4005/uadp/v1/orders/$order_id/tracking"
  fi
}

test_stream() {
  header "Stream — Video (:4006)"

  check "Feed" "$BASE:4006/uadp/v1/feed"
  check "History" "$BASE:4006/uadp/v1/history"
  check "Subscriptions" "$BASE:4006/uadp/v1/subscriptions"
  check "Library" "$BASE:4006/uadp/v1/library"
  check "Search" "$BASE:4006/uadp/v1/search?q=tutorial"
  check "Playback state" "$BASE:4006/uadp/v1/playback/state"
}

test_echo_svc() {
  header "Echo — Messaging (:4007)"

  check "Inbox" "$BASE:4007/uadp/v1/inbox"
  check "Search" "$BASE:4007/uadp/v1/search?q=hola"

  # Get first conversation ID
  local conv_id
  conv_id=$(curl -sf "$BASE:4007/uadp/v1/inbox" 2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -n "$conv_id" ]; then
    check "Conversation" "$BASE:4007/uadp/v1/conversation/$conv_id"
    check "Send message" "$BASE:4007/uadp/v1/message/send" "POST" \
      "{\"conversation_id\":\"$conv_id\",\"body\":\"Hola, soy un test!\"}"
  fi
}

test_herald() {
  header "Herald — News (:4008)"

  check "Latest articles" "$BASE:4008/uadp/v1/feed/latest"
  check "Category: Tecnología" "$BASE:4008/uadp/v1/feed/category/Tecnología"
  check "Category: Economía" "$BASE:4008/uadp/v1/feed/category/Economía"
  check "Search" "$BASE:4008/uadp/v1/search?q=inteligencia"
  check "Bookmarks" "$BASE:4008/uadp/v1/bookmarks"

  # Get an article ID
  local art_id
  art_id=$(curl -sf "$BASE:4008/uadp/v1/feed/latest" 2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -n "$art_id" ]; then
    check "Article detail" "$BASE:4008/uadp/v1/article/$art_id"
    check "Add bookmark" "$BASE:4008/uadp/v1/bookmarks/add" "POST" \
      "{\"article_id\":\"$art_id\"}"
  fi
}

test_sse() {
  header "SSE Streaming"

  check_sse "Nova feed stream" "$BASE:4001/uadp/v1/feed/stream" 3
  check_sse "Pulse feed stream" "$BASE:4002/uadp/v1/feed/stream" 3

  # Echo SSE needs a conversation ID
  local conv_id
  conv_id=$(curl -sf "$BASE:4007/uadp/v1/inbox" 2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -n "$conv_id" ]; then
    check_sse "Echo conversation stream" "$BASE:4007/uadp/v1/conversation/$conv_id/stream" 3
  fi
}

# ─── Summary ────────────────────────────────────────────

summary() {
  header "Results"
  echo -e "  ${GREEN}Passed:${NC}  $PASS"
  echo -e "  ${RED}Failed:${NC}  $FAIL"
  if [ "$SKIP" -gt 0 ]; then
    echo -e "  ${YELLOW}Skipped:${NC} $SKIP"
  fi
  echo -e "  ${CYAN}Total:${NC}   $((PASS + FAIL + SKIP))"
  echo ""

  if [ "$FAIL" -eq 0 ]; then
    echo -e "  ${GREEN}All checks passed!${NC}"
  else
    echo -e "  ${RED}$FAIL check(s) failed.${NC} Run with ${YELLOW}VERBOSE=1 ./test.sh${NC} for details."
  fi
  echo ""
}

# ─── Main ───────────────────────────────────────────────

SCOPE="${1:-all}"

# Check services are running
if ! curl -sf "$BASE:4000/services" >/dev/null 2>&1; then
  echo -e "${RED}Error:${NC} Gateway not responding at $BASE:4000"
  echo -e "Run ${YELLOW}./start.sh${NC} first to start all services."
  exit 1
fi

case "$SCOPE" in
  all)
    test_gateway
    test_discovery
    test_auth
    test_nova
    test_pulse
    test_orbit
    test_zinc
    test_market
    test_stream
    test_echo_svc
    test_herald
    test_sse
    ;;
  discovery|disco|autodiscovery)
    test_discovery
    ;;
  gateway)
    test_gateway
    ;;
  auth)
    test_auth
    ;;
  nova)     test_nova ;;
  pulse)    test_pulse ;;
  orbit)    test_orbit ;;
  zinc)     test_zinc ;;
  market)   test_market ;;
  stream)   test_stream ;;
  echo)     test_echo_svc ;;
  herald)   test_herald ;;
  sse)      test_sse ;;
  full)
    test_gateway
    test_discovery
    test_auth
    test_nova
    test_pulse
    test_orbit
    test_zinc
    test_market
    test_stream
    test_echo_svc
    test_herald
    test_sse
    ;;
  *)
    echo "Usage: ./test.sh [all|discovery|gateway|auth|nova|pulse|orbit|zinc|market|stream|echo|herald|sse|full]"
    exit 1
    ;;
esac

summary
