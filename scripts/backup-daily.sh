#!/usr/bin/env bash
# Étape 3 — Backup quotidien local (+ option S3 si BACKUP_S3_URI défini)
set -euo pipefail

APP_DIR="${PORTIA_APP_DIR:-/opt/portia-audit}"
BACKUP_ROOT="${BACKUP_ROOT:-/opt/portia-audit/backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
NAME="portia-daily-${STAMP}"
DEST="${BACKUP_ROOT}/${NAME}"
RETAIN_DAYS="${BACKUP_RETAIN_DAYS:-14}"

mkdir -p "$BACKUP_ROOT"
mkdir -p "$DEST/app" "$DEST/infra/nginx"

rsync -a --exclude='node_modules' --exclude='__pycache__' --exclude='backups' \
  "$APP_DIR/" "$DEST/app/"
sudo cp /etc/nginx/conf.d/portia.conf "$DEST/infra/nginx/portia.conf" 2>/dev/null || true
sudo chown -R ec2-user:ec2-user "$DEST/infra" 2>/dev/null || true

cd "$BACKUP_ROOT"
zip -rq "${NAME}.zip" "$NAME"
rm -rf "$NAME"

find "$BACKUP_ROOT" -name 'portia-daily-*.zip' -mtime +"$RETAIN_DAYS" -delete 2>/dev/null || true

if [[ -n "${BACKUP_S3_URI:-}" ]] && command -v aws >/dev/null; then
  aws s3 cp "${BACKUP_ROOT}/${NAME}.zip" "${BACKUP_S3_URI%/}/${NAME}.zip" --sse AES256 2>/dev/null && \
    echo "Uploaded to ${BACKUP_S3_URI}/${NAME}.zip"
fi

echo "OK ${BACKUP_ROOT}/${NAME}.zip ($(du -h "${BACKUP_ROOT}/${NAME}.zip" | awk '{print $1}'))"
