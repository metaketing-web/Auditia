#!/usr/bin/env bash
# Vérification après bascule DNS Cloudflare (Proxied orange).
set -euo pipefail

DOMAIN="${PORTIA_DOMAIN:-audit.skydeen.ai}"
APP="${PORTIA_APP_DIR:-/opt/portia-audit}"

echo "=== Vérification Cloudflare — ${DOMAIN} ==="

HDR=$(curl -fsSI "https://${DOMAIN}/" 2>&1) || {
  echo "ERREUR: HTTPS inaccessible"
  exit 1
}

if echo "$HDR" | grep -qi cf-ray; then
  echo "OK — Cloudflare actif (cf-ray présent)"
  echo "$HDR" | grep -i cf-ray
else
  echo "ATTENTION — Pas de cf-ray : le trafic ne passe pas encore par Cloudflare."
  echo "  → Vérifier l’enregistrement A audit en Proxied (nuage orange)"
  echo "  → Vérifier que les NS du domaine pointent vers Cloudflare"
  exit 1
fi

if [[ -f /etc/nginx/conf.d/cloudflare-realip.conf ]]; then
  echo "OK — nginx real_ip Cloudflare"
else
  echo "→ Installation real_ip…"
  sudo bash "${APP}/scripts/nginx-cloudflare-realip.sh"
fi

echo ""
echo "Test API health:"
curl -fsS "https://${DOMAIN}/api/health" && echo ""
echo ""
echo "Rapport sécurité:"
bash "${APP}/scripts/security-status.sh"
