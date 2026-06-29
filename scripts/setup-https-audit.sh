#!/usr/bin/env bash
# HTTPS + durcissement pour audit.skydeen.ai (Amazon Linux 2023)
set -euo pipefail

DOMAIN="audit.skydeen.ai"
EMAIL="${CERTBOT_EMAIL:-admin@skydeen.ai}"
APP_DIR="${PORTIA_APP_DIR:-/opt/portia-audit}"
NGINX_CONF="/etc/nginx/conf.d/portia.conf"
WEBROOT="/var/www/certbot"
PHASE1="/tmp/portia-nginx-acme.conf"

echo "==> Prérequis"
sudo dnf install -y certbot 2>/dev/null || sudo yum install -y certbot
sudo mkdir -p "$WEBROOT"
sudo chown -R nginx:nginx "$WEBROOT" 2>/dev/null || sudo chown -R ec2-user:ec2-user "$WEBROOT"

echo "==> Nginx phase 1 (ACME uniquement, pas de redirect)"
sudo tee "$PHASE1" >/dev/null <<EOF
limit_req_zone \$binary_remote_addr zone=portia_login:10m rate=10r/m;
limit_req_zone \$binary_remote_addr zone=portia_api:10m rate=120r/m;

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} 13.51.252.61 _;

    location ^~ /.well-known/acme-challenge/ {
        root ${WEBROOT};
        default_type text/plain;
        allow all;
    }

    location / {
        proxy_pass http://127.0.0.1:3080;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
sudo cp "$PHASE1" "$NGINX_CONF"
sudo nginx -t
sudo systemctl reload nginx

if [[ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
  echo "==> Certificat Let's Encrypt"
  sudo certbot certonly --webroot -w "$WEBROOT" \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos --non-interactive --no-eff-email
fi

echo "==> Nginx phase 2 (HTTPS + redirect)"
sudo cp "$APP_DIR/portia-nginx-security.conf" "$NGINX_CONF"
sudo nginx -t
sudo systemctl reload nginx

echo "==> Variables .env sécurité"
ENV_FILE="$APP_DIR/.env"
touch "$ENV_FILE"
set_env() {
  local key="$1" val="$2"
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
  else
    echo "${key}=${val}" >> "$ENV_FILE"
  fi
}
set_env "FORCE_HSTS" "1"
set_env "CORS_ORIGINS" "https://${DOMAIN}"
set_env "CALENDAR_PUBLIC_BASE_URL" "https://${DOMAIN}"
set_env "PUBLIC_BASE_URL" "https://${DOMAIN}"

echo "==> Renouvellement auto certbot"
sudo systemctl enable certbot-renew.timer 2>/dev/null || true
sudo systemctl start certbot-renew.timer 2>/dev/null || true

echo "==> Redémarrage API"
sudo systemctl restart portia-audit

echo "==> Vérification"
curl -sI "https://${DOMAIN}/api/health" | head -8 || true
echo "OK — https://${DOMAIN}"
