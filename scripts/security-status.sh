#!/usr/bin/env bash
# Rapport sécurité Skydeen Audit — à lancer sur le serveur ou en SSH.
set -euo pipefail

APP="${PORTIA_APP_DIR:-/opt/portia-audit}"
DOMAIN="${PORTIA_DOMAIN:-audit.skydeen.ai}"

echo "=== Skydeen Audit — état sécurité ==="
echo "Date: $(date -u '+%Y-%m-%d %H:%M UTC')"
echo ""

echo "--- Service ---"
systemctl is-active portia-audit 2>/dev/null || echo "portia-audit: inconnu"
systemctl is-active nginx 2>/dev/null || echo "nginx: inconnu"
systemctl is-active fail2ban 2>/dev/null || echo "fail2ban: inconnu"
systemctl is-active clamav-freshclam 2>/dev/null || echo "freshclam: inconnu"
echo ""

echo "--- HTTPS / Cloudflare ---"
if curl -fsSI "https://${DOMAIN}/" 2>/dev/null | grep -qi cf-ray; then
  echo "Cloudflare: ACTIF (cf-ray présent)"
else
  echo "Cloudflare: non détecté — DNS pas encore proxied ou pas configuré"
fi
if [[ -f /etc/nginx/conf.d/cloudflare-realip.conf ]]; then
  echo "nginx real_ip Cloudflare: installé"
else
  echo "nginx real_ip Cloudflare: manquant — lancer scripts/nginx-cloudflare-realip.sh"
fi
echo ""

echo "--- 2FA ---"
grep -E '^REQUIRE_TOTP_PILOTAGE=' "$APP/.env" 2>/dev/null || echo "  REQUIRE_TOTP_PILOTAGE: non défini"
cd "$APP"
python3 - <<'PY'
import sqlite3
from pathlib import Path
p = Path("data/portia.db")
if not p.is_file():
    print("DB introuvable")
else:
    c = sqlite3.connect(p)
    rows = c.execute(
        "SELECT email, role, totp_enabled FROM users WHERE role IN ('admin','juliana') AND active=1"
    ).fetchall()
    for email, role, en in rows:
        st = "activée" if en else "désactivée"
        print(f"  {email} ({role}): 2FA {st}")
PY
echo ""

echo "--- Backups ---"
if crontab -l 2>/dev/null | grep -q backup-daily; then
  echo "Cron backup quotidien: OK"
else
  echo "Cron backup quotidien: absent"
fi
ls -lt "$APP/backups/" 2>/dev/null | head -4 || echo "Aucun backup local"
echo ""

echo "--- Monitoring ---"
if crontab -l 2>/dev/null | grep -q monitor-skydeen; then
  echo "Cron monitoring 15 min: OK"
else
  echo "Cron monitoring: absent"
fi
tail -3 "$APP/data/monitor.log" 2>/dev/null || echo "Pas de monitor.log"
echo ""

echo "--- fail2ban (ssh) ---"
sudo fail2ban-client status sshd 2>/dev/null | tail -5 || echo "fail2ban sshd non disponible"
echo ""
echo "=== Fin ==="
