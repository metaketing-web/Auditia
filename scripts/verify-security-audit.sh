#!/usr/bin/env bash
# Vérification correctifs audit Alpha Active Cyber (VLN01–VLN05)
set -euo pipefail

BASE="${PORTIA_URL:-https://audit.skydeen.ai}"
FAIL=0

check() {
  local label="$1" url="$2" expect_code="${3:-404}"
  local code
  code=$(curl -s -o /tmp/secbody -w "%{http_code}" "$BASE$url")
  if [[ "$code" == "$expect_code" ]]; then
    echo "  OK $label → HTTP $code"
  else
    echo "  FAIL $label → HTTP $code (attendu $expect_code)"
    FAIL=1
  fi
}

echo "=== Audit sécurité — $BASE ==="

echo "--- VLN01 / VLN02 fichiers sensibles ---"
check "DS_Store" "/.DS_Store" 404
check "package.json" "/package.json" 404
check "requirements.txt" "/requirements.txt" 404

echo "--- VLN03 API publique ---"
health=$(curl -s "$BASE/api/health")
echo "  health: $health"
if echo "$health" | grep -q '"ok"[[:space:]]*:[[:space:]]*true' && \
   ! echo "$health" | grep -qE 'entretien|model|anthropic'; then
  echo "  OK /api/health minimal"
else
  echo "  FAIL /api/health trop verbeux ou invalide"
  FAIL=1
fi
pub=$(curl -s "$BASE/api/config/public")
echo "  config/public keys: $(echo "$pub" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(",".join(sorted(d.keys())))' 2>/dev/null || echo ERR)"
if echo "$pub" | grep -q 'aiReady'; then
  echo "  FAIL config/public expose aiReady"
  FAIL=1
else
  echo "  OK config/public sans aiReady"
fi

echo "--- VLN04 bundle (local grep) ---"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if grep -q 'dangerous-direct-browser-access' "$ROOT/index.html" 2>/dev/null; then
  echo "  FAIL index.html contient dangerous-direct-browser-access"
  FAIL=1
else
  echo "  OK pas de clé navigateur directe dans index.html"
fi

echo "--- VLN05 IP démo ---"
if grep -q '13\.63\.156\.32' "$ROOT/portia-mission-pnipm.js" "$ROOT/portia-mission-ext.js" 2>/dev/null; then
  echo "  FAIL IP hardcodée dans mission JS"
  FAIL=1
else
  echo "  OK pas d'IP démo hardcodée"
fi

if [[ $FAIL -eq 0 ]]; then
  echo "=== TOUS LES CONTRÔLES OK ==="
else
  echo "=== ÉCHECS — voir ci-dessus ==="
  exit 1
fi
