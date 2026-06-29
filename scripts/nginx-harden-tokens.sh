#!/usr/bin/env bash
# Masque la version nginx dans les en-têtes Server.
set -euo pipefail
CONF="/etc/nginx/conf.d/00-portia-harden.conf"
sudo tee "$CONF" >/dev/null <<'EOF'
# Skydeen Audit — durcissement nginx global
server_tokens off;
EOF
sudo nginx -t
sudo systemctl reload nginx
echo "OK — server_tokens off"
