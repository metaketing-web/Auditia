#!/usr/bin/env bash
# Vérifie les assets critiques (logos) — restaure depuis backup si manquants.
set -euo pipefail
APP="${PORTIA_APP_DIR:-/opt/portia-audit}"
MISSING=0
for f in logo-skydeen-login.png logo-skydeen-blanc.png picto-skydeen.png favicon.png; do
  [[ -f "$APP/$f" ]] || MISSING=1
done
if [[ "$MISSING" -eq 0 ]]; then
  echo "OK — assets logos présents"
  exit 0
fi
BACKUP=$(ls -t "$APP/backups"/portia-daily-*.zip 2>/dev/null | while read -r z; do
  unzip -l "$z" 2>/dev/null | grep -q logo-skydeen-login.png && echo "$z" && break
done)
if [[ -z "${BACKUP:-}" ]]; then
  echo "ERREUR — logos manquants et aucun backup contenant logo-skydeen-login.png" >&2
  exit 1
fi
TMP=$(mktemp -d)
unzip -q "$BACKUP" -d "$TMP"
ROOT=$(find "$TMP" -name logo-skydeen-login.png -print -quit | xargs dirname)
for f in logo-skydeen-login.png logo-skydeen-blanc.png picto-skydeen.png favicon.png; do
  [[ -f "$ROOT/$f" ]] && cp "$ROOT/$f" "$APP/$f"
done
rm -rf "$TMP"
echo "OK — logos restaurés depuis $(basename "$BACKUP")"
