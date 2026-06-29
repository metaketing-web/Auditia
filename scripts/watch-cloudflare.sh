#!/usr/bin/env bash
# Surveille l’activation Cloudflare et logue quand cf-ray apparaît.
set -euo pipefail
APP="${PORTIA_APP_DIR:-/opt/portia-audit}"
LOG="${APP}/data/cloudflare-watch.log"
DOMAIN="${PORTIA_DOMAIN:-audit.skydeen.ai}"
FLAG="${APP}/data/.cloudflare-active"
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

if curl -fsSI --max-time 15 "https://${DOMAIN}/" 2>/dev/null | grep -qi cf-ray; then
  if [[ ! -f "$FLAG" ]]; then
    echo "$TS CLOUDFLARE_ACTIVE" >> "$LOG"
    touch "$FLAG"
    logger -t portia-cf "Cloudflare actif sur ${DOMAIN}"
    bash "${APP}/scripts/post-cloudflare-verify.sh" >> "$LOG" 2>&1 || true
  fi
else
  echo "$TS waiting" >> "$LOG"
fi

# Garder les 200 dernières lignes
tail -200 "$LOG" > "${LOG}.tmp" 2>/dev/null && mv "${LOG}.tmp" "$LOG" || true
