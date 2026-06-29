#!/usr/bin/env bash
# Étape 1 — Durcissement SSH + fail2ban
set -euo pipefail

echo "==> SSH hardening"
SSHD="/etc/ssh/sshd_config.d/99-portia-hardening.conf"
sudo tee "$SSHD" >/dev/null <<'EOF'
# Skydeen Audit — durcissement SSH
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
MaxAuthTries 3
LoginGraceTime 30
AllowUsers ec2-user
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
sudo sshd -t
sudo systemctl reload sshd

echo "==> fail2ban"
sudo dnf install -y fail2ban 2>/dev/null || sudo yum install -y fail2ban
sudo tee /etc/fail2ban/jail.d/portia.conf >/dev/null <<'EOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled  = true
port     = ssh
logpath  = %(sshd_log)s
backend  = %(sshd_backend)s
maxretry = 3
bantime  = 7200

[nginx-http-auth]
enabled  = true
filter   = nginx-http-auth
port     = http,https
logpath  = /var/log/nginx/error.log
maxretry = 5

[nginx-limit-req]
enabled  = true
filter   = nginx-limit-req
port     = http,https
logpath  = /var/log/nginx/error.log
maxretry = 10
EOF
sudo systemctl enable fail2ban
sudo systemctl restart fail2ban
sudo fail2ban-client status sshd 2>/dev/null || true
echo "OK — SSH durci + fail2ban actif"
