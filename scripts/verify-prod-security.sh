#!/usr/bin/env bash
# Vérifie les réglages de sécurité sur le serveur de production
set -euo pipefail
KEY="${DEPLOY_KEY:-$HOME/Downloads/clef_vha.pem}"
HOST="${DEPLOY_HOST:-ec2-user@13.51.252.61}"
APP="${DEPLOY_APP:-/opt/portia-audit}"

echo "=== Vérification sécurité Skydeen — $HOST ==="

ssh -i "$KEY" "$HOST" "bash -s" <<'REMOTE'
set -euo pipefail
APP="/opt/portia-audit"
ENV="$APP/.env"
fail=0
warn() { echo "WARN: $*"; }
ok() { echo "OK: $*"; }
err() { echo "FAIL: $*"; fail=1; }

if [[ ! -f "$ENV" ]]; then
  err ".env absent ($ENV)"
else
  ok ".env présent"
  check_env() {
    local key="$1"
    local expected="${2:-}"
    if grep -q "^${key}=" "$ENV" 2>/dev/null; then
      val=$(grep "^${key}=" "$ENV" | cut -d= -f2- | tr -d '"' | tr -d "'")
      if [[ -n "$expected" && "$val" != "$expected" ]]; then
        warn "$key=$val (attendu: $expected)"
      elif [[ -z "$val" ]]; then
        warn "$key défini mais vide"
      else
        ok "$key configuré"
      fi
    else
      err "$key manquant dans .env"
    fi
  }
  check_env DISABLE_DEFAULT_USER_SEED 1
  check_env REQUIRE_TOTP_PILOTAGE 1
  check_env SESSION_COOKIE_AUTH 1
  check_env DISABLE_SHARED_ICS_TOKEN 1
  if grep -q "^MISSION_ACCESS_CODE=" "$ENV"; then
    code=$(grep "^MISSION_ACCESS_CODE=" "$ENV" | cut -d= -f2-)
    if [[ ${#code} -lt 12 ]]; then
      err "MISSION_ACCESS_CODE trop court (< 12 car.)"
    else
      ok "MISSION_ACCESS_CODE longueur OK"
    fi
  else
    err "MISSION_ACCESS_CODE manquant"
  fi
fi

if [[ -f "$APP/team-users.json" ]]; then
  warn "team-users.json présent sur le serveur (OK si hors git, chmod 600)"
  if [[ "$(stat -c %a "$APP/team-users.json" 2>/dev/null || stat -f %Lp "$APP/team-users.json")" != "600" ]]; then
    warn "team-users.json devrait être chmod 600"
  fi
else
  ok "pas de team-users.json dans l'app (utiliser MISSION_TEAM_JSON ou fichier serveur)"
fi

if curl -sf http://127.0.0.1:3080/api/health >/dev/null 2>&1; then
  health=$(curl -s http://127.0.0.1:3080/api/health)
  ok "API health: $health"
else
  warn "API locale :3080 non joignable (service down?)"
fi

if systemctl is-active --quiet portia-audit 2>/dev/null; then
  ok "service portia-audit actif"
else
  warn "service portia-audit inactif"
fi

if command -v clamscan >/dev/null 2>&1; then
  ok "ClamAV installé"
else
  warn "ClamAV absent — REQUIRE_AV_SCAN=1 bloquera les uploads"
fi

exit $fail
REMOTE

echo "=== Terminé ==="
