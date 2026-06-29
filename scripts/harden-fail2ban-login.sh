#!/usr/bin/env bash
# fail2ban — bannir IP après échecs login API (401)
set -euo pipefail

sudo tee /etc/fail2ban/filter.d/portia-login.conf >/dev/null <<'EOF'
[Definition]
failregex = ^<HOST> -.*"POST /api/auth/login HTTP/[0-9.]+" 401
ignorereg =
EOF

sudo tee /etc/fail2ban/jail.d/portia-login.conf >/dev/null <<'EOF'
[portia-login]
enabled  = true
filter   = portia-login
port     = http,https
logpath  = /var/log/nginx/access.log
maxretry = 8
findtime = 600
bantime  = 3600
EOF

sudo fail2ban-client reload 2>/dev/null || sudo systemctl restart fail2ban
sudo fail2ban-client status portia-login 2>/dev/null || echo "Jail portia-login — actif au prochain reload"
echo "OK — fail2ban portia-login"
