#!/usr/bin/env bash
# Étape 6 — Surveillance basique (cron toutes les 15 min)
set -euo pipefail

APP_DIR="${PORTIA_APP_DIR:-/opt/portia-audit}"
LOG="${MONITOR_LOG:-/opt/portia-audit/data/monitor.log}"
ALERT_EMAIL="${MONITOR_EMAIL:-}"
DOMAIN="${PUBLIC_DOMAIN:-audit.skydeen.ai}"
ISSUES=()

check() {
  local name="$1" cmd="$2"
  if ! eval "$cmd" >/dev/null 2>&1; then
    ISSUES+=("$name")
  fi
}

check "nginx" "systemctl is-active nginx"
check "portia-audit" "systemctl is-active portia-audit"
check "https-api" "curl -sf --max-time 10 https://${DOMAIN}/api/health"
HOME_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://${DOMAIN}/" || echo "000")
if [[ "$HOME_CODE" != "200" ]]; then
  ISSUES+=("homepage:${HOME_CODE}")
fi
DISK_PCT=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
check "disk" "test $DISK_PCT -lt 90"

FAILS=$(sudo grep 'POST /api/auth/login' /var/log/nginx/access.log 2>/dev/null | awk -v d="$(date -d '1 hour ago' '+%d/%b/%Y:%H' 2>/dev/null || date '+%d/%b/%Y:%H')" '$0 ~ d' | wc -l | tr -d ' ' || true)
FAILS="${FAILS:-0}"
if [[ "${FAILS:-0}" -gt 50 ]]; then
  ISSUES+=("login_spike:${FAILS}/h")
fi

TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
WARNS=()

if ! curl -fsSI --max-time 10 "https://${DOMAIN}/" 2>/dev/null | grep -qi cf-ray; then
  WARNS+=("cloudflare_inactif")
fi

cd "$APP_DIR" 2>/dev/null || true
if [[ -f data/portia.db ]]; then
  NO2FA=$(python3 - <<'PY'
import sqlite3
c = sqlite3.connect("data/portia.db")
n = c.execute(
    "SELECT COUNT(*) FROM users WHERE role IN ('admin','juliana') AND active=1 AND (totp_enabled IS NULL OR totp_enabled=0)"
).fetchone()[0]
print(n)
PY
  )
  if [[ "${NO2FA:-0}" -gt 0 ]]; then
    WARNS+=("2fa_pilotage:${NO2FA}")
  fi
fi

if [[ ${#ISSUES[@]} -eq 0 ]]; then
  if [[ ${#WARNS[@]} -gt 0 ]]; then
    echo "$TS WARN: ${WARNS[*]}" >> "$LOG"
  else
    echo "$TS OK" >> "$LOG"
  fi
else
  MSG="$TS ALERT: ${ISSUES[*]}"
  echo "$MSG" >> "$LOG"
  logger -t portia-monitor "$MSG"
  if [[ -n "$ALERT_EMAIL" ]] && command -v mail >/dev/null; then
    echo "$MSG" | mail -s "Skydeen Audit alert" "$ALERT_EMAIL" 2>/dev/null || true
  fi
fi
