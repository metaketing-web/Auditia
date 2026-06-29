#!/usr/bin/env bash
set -euo pipefail
APP="${PORTIA_APP_DIR:-/opt/portia-audit}"

chmod 700 "$APP/data" 2>/dev/null || true
chmod 600 "$APP/.env" 2>/dev/null || true
chmod 600 "$APP"/.team-passwords* 2>/dev/null || true
find "$APP/data" -type f -name '*.db' -exec chmod 600 {} \; 2>/dev/null || true
find "$APP/backups" -type f -name '*.zip' -exec chmod 600 {} \; 2>/dev/null || true
echo "OK — permissions fichiers sensibles"
