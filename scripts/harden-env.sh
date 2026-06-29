#!/usr/bin/env bash
# Variables sécurité production — ajoute sans écraser les existantes.
set -euo pipefail
ENV="${PORTIA_ENV:-/opt/portia-audit/.env}"

set_kv() {
  local key="$1" val="$2"
  if grep -q "^${key}=" "$ENV" 2>/dev/null; then
    return 0
  fi
  echo "${key}=${val}" >> "$ENV"
  echo "+ $key"
}

[[ -f "$ENV" ]] || { echo "Missing $ENV"; exit 1; }

set_kv 'REQUIRE_TOTP_PILOTAGE' '1'
set_kv 'SESSION_DAYS_PILOTAGE' '1'
set_kv 'HIDE_API_DOCS' '1'
set_kv 'TRUST_PROXY' '1'
set_kv 'LOGIN_MAX_ATTEMPTS' '5'
set_kv 'LOGIN_LOCKOUT_SEC' '3600'
set_kv 'LOGIN_WINDOW_SEC' '900'
grep -q '^TOTP_ISSUER=' "$ENV" || echo 'TOTP_ISSUER="Skydeen Audit"' >> "$ENV"

chmod 600 "$ENV"
echo "OK — .env durci"
