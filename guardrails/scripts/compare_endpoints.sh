#!/usr/bin/env bash
# compare_endpoints.sh — Compare Laravel (port 8088) vs FastAPI (port 8000) responses
#
# Usage:
#   ./guardrails/scripts/compare_endpoints.sh [endpoint_path]
#
# If no endpoint is provided, it tests all endpoints defined in ENDPOINTS array.
# Requires: curl, jq

set -euo pipefail

LARAVEL_URL="http://localhost:8088"
FASTAPI_URL="http://localhost:8000"
FIXTURES_DIR="$(dirname "$0")/../fixtures"
RESULTS_DIR="$(dirname "$0")/../results"
mkdir -p "$RESULTS_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ENDPOINTS=(
  "/api/v1/health"
  "/api/v1/provinces/"
  "/api/v1/districts/"
)

compare_endpoint() {
  local path="$1"
  local label="${2:-$path}"
  local outfile="$RESULTS_DIR/$(echo "$path" | tr '/' '_').json"

  echo -e "${YELLOW}Testing:${NC} $label"

  # Fetch from both servers
  local laravel_resp
  local fastapi_resp
  local laravel_code
  local fastapi_code

  laravel_resp=$(curl -s -w "\n%{http_code}" "${LARAVEL_URL}${path}" 2>/dev/null || echo -e "\n000")
  fastapi_resp=$(curl -s -w "\n%{http_code}" "${FASTAPI_URL}${path}" 2>/dev/null || echo -e "\n000")

  laravel_code=$(echo "$laravel_resp" | tail -1)
  fastapi_code=$(echo "$fastapi_resp" | tail -1)
  laravel_body=$(echo "$laravel_resp" | sed '$d')
  fastapi_body=$(echo "$fastapi_resp" | sed '$d')

  # Compare status codes
  if [ "$laravel_code" != "$fastapi_code" ]; then
    echo -e "  ${RED}MISMATCH${NC} Status codes differ: Laravel=$laravel_code FastAPI=$fastapi_code"
    echo "{\"endpoint\":\"$path\",\"laravel_status\":$laravel_code,\"fastapi_status\":$fastapi_code,\"status\":\"STATUS_MISMATCH\"}" > "$outfile"
    return 1
  fi

  # Try to compare JSON structure (keys)
  laravel_keys=$(echo "$laravel_body" | jq -r 'if type == "array" then (.[0] // {}) | keys_unsorted | sort else keys_unsorted | sort end' 2>/dev/null || echo "PARSE_ERROR")
  fastapi_keys=$(echo "$fastapi_body" | jq -r 'if type == "array" then (.[0] // {}) | keys_unsorted | sort else keys_unsorted | sort end' 2>/dev/null || echo "PARSE_ERROR")

  if [ "$laravel_keys" != "$fastapi_keys" ]; then
    echo -e "  ${RED}MISMATCH${NC} JSON keys differ:"
    echo "    Laravel:  $laravel_keys"
    echo "    FastAPI:  $fastapi_keys"
    echo "{\"endpoint\":\"$path\",\"laravel_keys\":\"$laravel_keys\",\"fastapi_keys\":\"$fastapi_keys\",\"status\":\"KEYS_MISMATCH\"}" > "$outfile"
    return 1
  fi

  echo -e "  ${GREEN}MATCH${NC} Status=$laravel_code, Keys match"
  echo "{\"endpoint\":\"$path\",\"status_code\":$laravel_code,\"status\":\"MATCH\"}" > "$outfile"
  return 0
}

# Main
if [ $# -gt 0 ]; then
  compare_endpoint "$1" "$1"
else
  pass=0
  fail=0
  for endpoint in "${ENDPOINTS[@]}"; do
    if compare_endpoint "$endpoint"; then
      ((pass++))
    else
      ((fail++))
    fi
  done
  echo ""
  echo "Results: ${GREEN}${pass} passed${NC}, ${RED}${fail} failed${NC}"
fi
