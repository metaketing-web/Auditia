#!/usr/bin/env bash
# Vérification post-déploiement : page HTML + API + permissions Nginx
set -euo pipefail

DOMAIN="${PUBLIC_DOMAIN:-audit.skydeen.ai}"
APP="${PORTIA_APP_DIR:-/opt/portia-audit}"
ON_SERVER=0

if [[ "${1:-}" == "--on-server" ]]; then
  ON_SERVER=1
fi

fail() {
  echo "SMOKE FAIL: $*" >&2
  exit 1
}

ok() {
  echo "SMOKE OK: $*"
}

if [[ "$ON_SERVER" == 1 ]]; then
  systemctl is-active nginx >/dev/null 2>&1 || fail "service nginx inactif"
  systemctl is-active portia-audit >/dev/null 2>&1 || fail "service portia-audit inactif"

  if [[ ! -r "$APP/index.html" ]]; then
    fail "index.html illisible (permissions fichier)"
  fi
  if ! sudo -u nginx test -r "$APP/index.html" 2>/dev/null; then
    fail "nginx ne peut pas lire $APP/index.html — lancer: find $APP -maxdepth 1 -name '*.html' -exec chmod o+r {} \\;"
  fi

  curl -sf --max-time 8 "http://127.0.0.1:3080/api/health" | grep -q '"ok":true' \
    || fail "backend local :3080/api/health"

  local_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 -H "Host: ${DOMAIN}" "http://127.0.0.1/" || echo "000")
  case "$local_code" in
    200|301|302) ;;
    *) fail "nginx local GET / → HTTP $local_code" ;;
  esac

  ok "serveur (permissions, backend, nginx local)"
  exit 0
fi

# Contrôles externes (depuis la machine qui déploie)
home_code=$(curl -s -o /tmp/portia-smoke-home.html -w "%{http_code}" --max-time 20 "https://${DOMAIN}/" || echo "000")
if [[ "$home_code" != "200" ]]; then
  fail "GET https://${DOMAIN}/ → HTTP $home_code (403 = permissions index.html, 502 = API down)"
fi
if ! grep -qi '<html' /tmp/portia-smoke-home.html 2>/dev/null; then
  fail "GET / ne renvoie pas une page HTML valide"
fi
if ! grep -qi 'portia\|Skydeen\|audit' /tmp/portia-smoke-home.html 2>/dev/null; then
  fail "GET / : contenu inattendu (pas la plateforme Portia)"
fi

health=$(curl -sf --max-time 15 "https://${DOMAIN}/api/health" 2>/dev/null) \
  || fail "GET https://${DOMAIN}/api/health injoignable"
echo "$health" | grep -q '"ok":true' || fail "/api/health : réponse invalide"

ok "https://${DOMAIN}/ (HTTP 200) et /api/health"
