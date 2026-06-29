#!/usr/bin/env bash
# Cron surveillance Cloudflare (toutes les heures)
set -euo pipefail
APP="${PORTIA_APP_DIR:-/opt/portia-audit}"
MARK="# portia-watch-cloudflare"
LINE="0 * * * * bash ${APP}/scripts/watch-cloudflare.sh ${MARK}"
(crontab -l 2>/dev/null | grep -v "$MARK"; echo "$LINE") | crontab -
echo "OK — watch Cloudflare (horaire)"
