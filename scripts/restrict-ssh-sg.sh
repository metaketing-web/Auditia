#!/usr/bin/env bash
# Restreint SSH (port 22) à une IP — AWS CloudShell, région eu-north-1
# Usage:
#   ADMIN_IP=90.7.166.87 bash restrict-ssh-sg.sh
#   ADMIN_IP6=2a01:cb00:... bash restrict-ssh-sg.sh   # IPv6 (/128)
set -euo pipefail
REGION="${AWS_REGION:-eu-north-1}"
SG="${SECURITY_GROUP_ID:-sg-09460936aef1fb4a4}"

if [[ -z "${ADMIN_IP:-}" && -z "${ADMIN_IP6:-}" ]]; then
  echo "Définir ADMIN_IP (IPv4) et/ou ADMIN_IP6 (IPv6)" >&2
  exit 1
fi

echo "SG $SG — restriction SSH"

# Supprimer anciennes règles SSH ouvertes
aws ec2 revoke-security-group-ingress --region "$REGION" --group-id "$SG" \
  --ip-permissions IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges='[{CidrIp=0.0.0.0/0}]' \
  2>/dev/null || true
aws ec2 revoke-security-group-ingress --region "$REGION" --group-id "$SG" \
  --ip-permissions IpProtocol=tcp,FromPort=22,ToPort=22,Ipv6Ranges='[{CidrIpv6=::/0}]' \
  2>/dev/null || true

if [[ -n "${ADMIN_IP:-}" ]]; then
  CIDR="${ADMIN_IP}/32"
  aws ec2 authorize-security-group-ingress --region "$REGION" --group-id "$SG" \
    --ip-permissions IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges="[{CidrIp=${CIDR},Description=SSH admin Portia IPv4}]" \
    2>/dev/null && echo "SSH IPv4 $CIDR ajouté." || echo "Règle IPv4 déjà présente ou erreur (vérifier SG et compte AWS)."
fi

if [[ -n "${ADMIN_IP6:-}" ]]; then
  CIDR6="${ADMIN_IP6}/128"
  aws ec2 authorize-security-group-ingress --region "$REGION" --group-id "$SG" \
    --ip-permissions IpProtocol=tcp,FromPort=22,ToPort=22,Ipv6Ranges="[{CidrIpv6=${CIDR6},Description=SSH admin Portia IPv6}]" \
    2>/dev/null && echo "SSH IPv6 $CIDR6 ajouté." || echo "Règle IPv6 déjà présente."
fi
