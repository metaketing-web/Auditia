#!/usr/bin/env bash
# Ouvre le port HTTPS (443) sur le security group de l'instance Skydeen.
# À exécuter depuis AWS CloudShell ou une machine avec AWS CLI configuré (région eu-north-1).
set -euo pipefail

REGION="${AWS_REGION:-eu-north-1}"
INSTANCE_IP="${PORTIA_IP:-13.51.252.61}"

IID=$(aws ec2 describe-instances --region "$REGION" \
  --filters "Name=ip-address,Values=$INSTANCE_IP" \
  --query 'Reservations[0].Instances[0].InstanceId' --output text)

SG=$(aws ec2 describe-instances --instance-ids "$IID" --region "$REGION" \
  --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' --output text)

echo "Instance: $IID  SecurityGroup: $SG"

aws ec2 authorize-security-group-ingress --region "$REGION" --group-id "$SG" \
  --ip-permissions IpProtocol=tcp,FromPort=443,ToPort=443,IpRanges='[{CidrIp=0.0.0.0/0,Description=HTTPS audit.skydeen.ai}]' \
  2>/dev/null && echo "Règle 443 ajoutée." || echo "Règle 443 déjà présente ou erreur (vérifier la console AWS)."

curl -sI --max-time 10 "https://audit.skydeen.ai/api/health" | head -5
