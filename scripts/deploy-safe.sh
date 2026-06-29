#!/usr/bin/env bash
# Déploiement vers EC2 — sans --delete (ne supprime pas les fichiers serveur absents du repo local)
set -euo pipefail
KEY="${DEPLOY_KEY:-$HOME/Downloads/clef_vha.pem}"
HOST="${DEPLOY_HOST:-ec2-user@13.51.252.61}"
SRC="${DEPLOY_SRC:-$(cd "$(dirname "$0")/.." && pwd)}"
DEST="/opt/portia-audit"

rsync -avz \
  -e "ssh -i $KEY" \
  --exclude 'node_modules/' \
  --exclude '.git/' \
  --exclude 'data/' \
  --exclude 'backups/' \
  --exclude 'backup-papier/' \
  --exclude '*.zip' \
  --exclude '.env' \
  --exclude '__pycache__/' \
  --exclude '.team-passwords*' \
  --exclude '.DS_Store' \
  "$SRC/" "$HOST:$DEST/"

ssh -i "$KEY" "$HOST" "chmod 755 $DEST && find $DEST -maxdepth 1 -type f \\( -name '*.html' -o -name '*.js' -o -name '*.css' -o -name '*.png' \\) -exec chmod o+r {} \\; && chmod -R o+rX $DEST/tutoriels 2>/dev/null || true; chmod +x $DEST/start.sh $DEST/scripts/*.sh 2>/dev/null; bash $DEST/scripts/verify-assets.sh 2>/dev/null || true; pip3 install --user -q -r $DEST/requirements.txt; sudo cp $DEST/portia-nginx-security.conf /etc/nginx/conf.d/portia.conf && sudo nginx -t && sudo systemctl reload nginx; sudo systemctl restart portia-audit; sleep 2; bash $DEST/scripts/smoke-check.sh --on-server"

echo "OK — déployé sur $HOST (sans suppression distante)"

PUBLIC_DOMAIN="${PUBLIC_DOMAIN:-audit.skydeen.ai}" bash "$SRC/scripts/smoke-check.sh" || {
  echo "ÉCHEC — smoke-check externe après déploiement (site ou API inaccessible)" >&2
  exit 1
}
echo "OK — smoke-check externe"
