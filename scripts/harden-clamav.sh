#!/usr/bin/env bash
# Étape 4 — ClamAV + signatures à jour
set -euo pipefail

echo "==> Installation ClamAV"
sudo dnf install -y clamav clamav-update 2>/dev/null || sudo yum install -y clamav clamav-update

echo "==> Mise à jour signatures"
sudo freshclam 2>/dev/null || sudo freshclam --no-warnings || true

echo "==> Timer freshclam"
sudo systemctl enable clamav-freshclam 2>/dev/null || sudo systemctl enable freshclam 2>/dev/null || true
sudo systemctl start clamav-freshclam 2>/dev/null || sudo systemctl start freshclam 2>/dev/null || true

echo "==> Test scan"
TEST="/tmp/portia-clamav-test.txt"
echo "clean test" > "$TEST"
clamscan "$TEST" && rm -f "$TEST"
echo "OK — ClamAV opérationnel"
