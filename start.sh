#!/usr/bin/env bash
set -euo pipefail
set -a
[[ -f /opt/portia-audit/.env ]] && source /opt/portia-audit/.env
set +a
cd /opt/portia-audit
export PORTIA_APP_DIR="${PORTIA_APP_DIR:-/opt/portia-audit}"
export DATA_DIR="${DATA_DIR:-/opt/portia-audit/data}"
HOST="${UVICORN_HOST:-127.0.0.1}"
exec /usr/bin/python3 -m uvicorn server:app --host "$HOST" --port "${PORT:-3080}"
