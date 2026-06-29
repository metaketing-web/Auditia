#!/usr/bin/env bash
# Installation complète Skydeen Audit Cockpit (FastAPI + assets)
set -euo pipefail

APP_DIR="/opt/portia-audit"
SRC_DIR="$(cd "$(dirname "$0")" && pwd)"

sudo mkdir -p "$APP_DIR/data/uploads"
sudo rsync -a --delete \
  --exclude '.git' --exclude '__pycache__' --exclude '*.pyc' \
  --exclude 'data/' \
  "$SRC_DIR/" "$APP_DIR/"

if [[ -f "$SRC_DIR/scripts/fix-logo-transparent.py" ]] && python3 -c "import PIL" 2>/dev/null; then
  python3 "$SRC_DIR/scripts/fix-logo-transparent.py" 2>/dev/null || true
  sudo cp "$SRC_DIR/logo-portia-blanc.png" "$APP_DIR/logo-portia-blanc.png" 2>/dev/null || true
fi

if [[ -f /home/ec2-user/.env ]]; then
  sudo cp /home/ec2-user/.env "$APP_DIR/.env"
elif [[ -f "$SRC_DIR/.env" ]]; then
  sudo cp "$SRC_DIR/.env" "$APP_DIR/.env"
fi
if [[ -f "$APP_DIR/.env" ]] && ! grep -q '^BOOTSTRAP_SECRET=' "$APP_DIR/.env" 2>/dev/null; then
  {
    echo ""
    echo "BOOTSTRAP_SECRET=$(openssl rand -hex 32)"
  } | sudo tee -a "$APP_DIR/.env" >/dev/null
  if [[ -f /home/ec2-user/.env ]] && ! grep -q '^BOOTSTRAP_SECRET=' /home/ec2-user/.env 2>/dev/null; then
    {
      echo ""
      echo "BOOTSTRAP_SECRET=$(sudo grep '^BOOTSTRAP_SECRET=' "$APP_DIR/.env" | cut -d= -f2-)"
    } >> /home/ec2-user/.env
  fi
fi
if [[ -f "$APP_DIR/.env" ]] && ! grep -q '^UVICORN_HOST=' "$APP_DIR/.env" 2>/dev/null; then
  printf '\nUVICORN_HOST=127.0.0.1\n' | sudo tee -a "$APP_DIR/.env" >/dev/null
fi

sudo chown -R ec2-user:ec2-user "$APP_DIR"
sudo chmod 600 "$APP_DIR/.env" 2>/dev/null || true
sudo chmod +x "$APP_DIR/start.sh" "$APP_DIR/install-ec2.sh" 2>/dev/null || true

if ! python3 -c "import uvicorn, fastapi" 2>/dev/null; then
  python3 -m pip install --user -r "$APP_DIR/requirements.txt"
fi

sudo tee /etc/systemd/system/portia-audit.service >/dev/null << 'UNIT'
[Unit]
Description=Skydeen Audit Cockpit API
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/portia-audit
EnvironmentFile=-/opt/portia-audit/.env
Environment=PORTIA_APP_DIR=/opt/portia-audit
Environment=DATA_DIR=/opt/portia-audit/data
ExecStart=/opt/portia-audit/start.sh
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable portia-audit
sudo systemctl restart portia-audit

sleep 4
if [[ -f "$APP_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$APP_DIR/.env"
  set +a
  export PORTIA_APP_DIR="$APP_DIR"
fi
if [[ -f "$APP_DIR/seed-db.js" ]]; then
  cd "$APP_DIR"
  NEED_SEED=1
  if curl -sf "http://127.0.0.1:${PORT:-3080}/api/health" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('missionInitialized') and d.get('gapCount',0)>=40 else 1)" 2>/dev/null; then
    NEED_SEED=0
  fi
  if [[ "$NEED_SEED" == "1" ]]; then
    node seed-db.js && node seed-enterprise-data.js || echo "Attention: seed incomplet — relancez seed-db.js puis seed-enterprise-data.js"
  fi
fi

NGINX_CONF="/home/ec2-user/portia-audit-config/nginx-portia.conf"
if [[ -f "$NGINX_CONF" ]] && command -v nginx >/dev/null; then
  sudo rm -f /etc/nginx/conf.d/portia-audit.conf 2>/dev/null || true
  sudo cp "$NGINX_CONF" /etc/nginx/conf.d/portia.conf 2>/dev/null && sudo nginx -t && sudo systemctl enable nginx 2>/dev/null; sudo systemctl reload nginx 2>/dev/null || true
fi

PUBLIC_IP="$(curl -s --max-time 2 ifconfig.me 2>/dev/null || echo 127.0.0.1)"
echo "Skydeen déployé : http://${PUBLIC_IP}/"
if [[ -x "$SRC_DIR/scripts/audit-platform.sh" ]]; then
  echo "--- Vérification post-déploiement ---"
  bash "$SRC_DIR/scripts/audit-platform.sh" || echo "Audit : corriger les points signalés ci-dessus"
fi
