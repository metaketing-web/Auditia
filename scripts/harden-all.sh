#!/usr/bin/env bash
# Durcissement complet Skydeen Audit (à lancer sur EC2)
set -euo pipefail
APP="${PORTIA_APP_DIR:-/opt/portia-audit}"
cd "$APP"
chmod +x scripts/*.sh

echo "==> Env"
bash scripts/harden-env.sh

echo "==> Permissions"
bash scripts/harden-permissions.sh

echo "==> SSH + fail2ban"
sudo bash scripts/harden-ssh-fail2ban.sh 2>/dev/null || true
sudo bash scripts/harden-fail2ban-login.sh

echo "==> ClamAV"
sudo bash scripts/harden-clamav.sh 2>/dev/null | tail -2 || true

echo "==> Nginx"
sudo bash scripts/deploy-nginx.sh
sudo bash scripts/nginx-cloudflare-realip.sh
sudo bash scripts/nginx-harden-tokens.sh

echo "==> Sysctl"
sudo bash scripts/harden-sysctl.sh

echo "==> Crons"
bash scripts/setup-security-cron.sh
bash scripts/setup-cloudflare-watch.sh

echo "==> Restart"
sudo systemctl restart portia-audit
sleep 2
systemctl is-active portia-audit

echo "==> Status"
bash scripts/security-status.sh
