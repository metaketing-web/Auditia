#!/usr/bin/env bash
# Durcissement réseau kernel (Amazon Linux 2023)
set -euo pipefail
CONF="/etc/sysctl.d/99-portia-hardening.conf"
sudo tee "$CONF" >/dev/null <<'EOF'
# Skydeen Audit — sysctl
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.icmp_ignore_bogus_error_responses = 1
EOF
sudo sysctl --system >/dev/null 2>&1 || sudo sysctl -p "$CONF"
echo "OK — sysctl"
