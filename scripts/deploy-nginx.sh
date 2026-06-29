#!/usr/bin/env bash
# Déploie la config nginx Skydeen (un seul fichier conf.d/portia.conf)
set -euo pipefail
APP="${PORTIA_APP_DIR:-/opt/portia-audit}"
sudo cp "${APP}/portia-nginx-security.conf" /etc/nginx/conf.d/portia.conf
sudo rm -f /etc/nginx/conf.d/portia-audit.conf
sudo nginx -t
sudo systemctl reload nginx
echo "OK — nginx portia.conf"
