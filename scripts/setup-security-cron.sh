#!/usr/bin/env bash
# Cron rapport sécurité quotidien (4h UTC)
set -euo pipefail
APP="${PORTIA_APP_DIR:-/opt/portia-audit}"
MARK="# portia-security-daily"
LINE="0 4 * * * bash ${APP}/scripts/security-status.sh >> ${APP}/data/security-daily.log 2>&1 ${MARK}"
(crontab -l 2>/dev/null | grep -v "$MARK"; echo "$LINE") | crontab -
echo "OK — cron security-daily (4h UTC)"
