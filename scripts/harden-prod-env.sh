#!/usr/bin/env bash
# Applique les variables de sécurité manquantes dans /opt/portia-audit/.env (sans écraser les secrets)
set -euo pipefail
KEY="${DEPLOY_KEY:-$HOME/Downloads/clef_vha.pem}"
HOST="${DEPLOY_HOST:-ec2-user@13.51.252.61}"
APP="/opt/portia-audit"

ssh -i "$KEY" "$HOST" "bash -s" <<'REMOTE'
set -euo pipefail
ENV="/opt/portia-audit/.env"
touch "$ENV"
chmod 600 "$ENV"

ensure_kv() {
  local key="$1"
  local val="$2"
  if grep -q "^${key}=" "$ENV" 2>/dev/null; then
    return 0
  fi
  echo "${key}=${val}" >> "$ENV"
  echo "Ajouté: ${key}=${val}"
}

ensure_kv DISABLE_DEFAULT_USER_SEED 1
ensure_kv REQUIRE_TOTP_PILOTAGE 1
ensure_kv SESSION_COOKIE_AUTH 1
ensure_kv HIDE_TOKEN_IN_LOGIN_JSON 1
ensure_kv DISABLE_SHARED_ICS_TOKEN 1
ensure_kv COOKIE_SECURE 1
ensure_kv FORCE_HSTS 1

if ! grep -q "^MISSION_ACCESS_CODE=" "$ENV" 2>/dev/null; then
  secret=$(openssl rand -base64 18 | tr -d '/+=' | head -c 20)
  echo "MISSION_ACCESS_CODE=${secret}" >> "$ENV"
  echo "Généré MISSION_ACCESS_CODE (noter pour l'équipe)"
fi
if ! grep -q "^PLANNING_ICS_SECRET=" "$ENV" 2>/dev/null; then
  ics=$(openssl rand -hex 16)
  echo "PLANNING_ICS_SECRET=${ics}" >> "$ENV"
  echo "Généré PLANNING_ICS_SECRET"
fi
if ! grep -q "^BOOTSTRAP_SECRET=" "$ENV" 2>/dev/null; then
  bs=$(openssl rand -hex 24)
  echo "BOOTSTRAP_SECRET=${bs}" >> "$ENV"
  echo "Généré BOOTSTRAP_SECRET"
fi

if [[ -f /opt/portia-audit/team-users.json ]]; then
  chmod 600 /opt/portia-audit/team-users.json
  ensure_kv MISSION_TEAM_FILE /opt/portia-audit/team-users.json
fi

sudo systemctl restart portia-audit
echo "OK — .env durci, service redémarré"
REMOTE
