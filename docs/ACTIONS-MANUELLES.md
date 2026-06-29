# Actions manuelles — Skydeen Audit (audit.skydeen.ai)

> Tout le reste est déjà en place sur le serveur EC2.  
> Dernière mise à jour : juin 2026

---

## 1. Cloudflare + PlanetHoster (obligatoire pour le WAF/CDN)

**Pourquoi :** le trafic passe encore directement sur l’EC2 (pas de `cf-ray`). PlanetHoster gère encore les NS.

**Guide détaillé :** `docs/PLANETHOSTER-CLOUDFLARE.md`

Résumé :
1. Créer un compte Cloudflare, ajouter `skydeen.ai`
2. Chez **PlanetHoster** → remplacer les nameservers par ceux de Cloudflare
3. Cloudflare DNS : **A** `audit` → `13.51.252.61` — **Proxied** (nuage orange)
4. SSL/TLS Cloudflare : **Full (strict)**, Always HTTPS **On**

**Vérification :**
```bash
curl -sI https://audit.skydeen.ai/ | grep cf-ray
```

**Puis sur le serveur (ou demander à relancer la vérif) :**
```bash
bash /opt/portia-audit/scripts/post-cloudflare-verify.sh
```

---

## 2. Activer la 2FA (comptes pilotage — **OBLIGATOIRE**)

**Pourquoi :** `REQUIRE_TOTP_PILOTAGE=1` est actif. Admin et juliana voient un **écran bloquant** à la connexion tant que la 2FA n’est pas configurée. L’API refuse tout le reste.

**Procédure (5 min, nécessite votre téléphone) :**
1. https://audit.skydeen.ai
2. Connexion `ac@metaketing.io` (admin) ou `juliana@portia.local`
3. Cliquer **Configurer la 2FA** (ou aller dans **Réglages**)
4. Scanner le QR avec Google Authenticator ou Authy
5. Valider avec le code à 6 chiffres

---

## 3. Restreindre SSH à votre IP (AWS)

**Pourquoi :** le port 22 est encore ouvert plus largement dans le security group AWS. Nécessite vos credentials AWS (CloudShell).

**Région :** `eu-north-1`  
**Security group :** `sg-09460936aef1fb4a4` (`launch-wizard-13`)

Dans **AWS CloudShell** :
```bash
# Votre IP publique
curl -4 ifconfig.me    # IPv4
curl -6 ifconfig.me    # IPv6

# Puis (adapter l’IP)
ADMIN_IP=VOTRE_IP_V4 bash restrict-ssh-sg.sh
ADMIN_IP6=VOTRE_IP_V6 bash restrict-ssh-sg.sh
```

Script sur le serveur : `/opt/portia-audit/scripts/restrict-ssh-sg.sh`  
(Copier le contenu en CloudShell si le fichier n’y est pas.)

**Attention :** vérifiez bien votre IP fixe avant d’appliquer, pour ne pas perdre l’accès SSH.

---

## 4. Backups S3 (optionnel)

**Pourquoi :** les backups quotidiens locaux tournent (3 h UTC, 14 jours). Une copie S3 offre une protection hors serveur.

**Si vous avez un bucket AWS :**
1. Créer un bucket privé (ex. `portia-audit-backups-eu-north-1`)
2. Ajouter dans `/opt/portia-audit/.env` sur le serveur :
   ```
   BACKUP_S3_URI=s3://VOTRE-BUCKET/portia-backups
   ```
3. Attacher à l’instance EC2 un rôle IAM avec `s3:PutObject` sur ce bucket

---

## 5. Alertes e-mail monitoring (optionnel)

**Pourquoi :** le monitoring écrit dans `data/monitor.log` mais n’envoie pas d’e-mail sans configuration.

Dans `.env` :
```
MONITOR_EMAIL=votre@email.com
```
(Puis installer/configurer `mail` ou un relais SMTP sur le serveur.)

---

## 6. Conserver le backup local confidentiel

Le ZIP complet téléchargé (`portia-audit-backup-complet-*.zip`) contient mots de passe et secrets.

- Stocker hors cloud non chiffré
- Ne pas partager
- Supprimer les copies inutiles

---

## Déjà fait automatiquement (rien à refaire)

| Élément | Statut |
|---------|--------|
| HTTPS Let's Encrypt + HSTS | OK |
| nginx durci (rate limit login, headers sécurité) | OK |
| nginx real IP Cloudflare (prêt) | OK |
| SSH durci (clé uniquement, pas root) | OK |
| fail2ban (SSH + login API 401) | OK |
| ClamAV + scan uploads | OK |
| Backups quotidiens locaux + cron | OK |
| Monitoring 15 min + rapport sécurité 4 h UTC | OK |
| 2FA backend + UI déployés | OK |
| Code app synchronisé sur EC2 | OK |
| Certificat SSL — renouvellement auto (certbot) | OK |

**Commandes utiles sur le serveur :**
```bash
bash /opt/portia-audit/scripts/security-status.sh
tail -20 /opt/portia-audit/data/monitor.log
```

---

## Ordre recommandé

1. **2FA** (immédiat, 5 min) — bandeau orange à la connexion
2. **Cloudflare** (PlanetHoster NS) — voir checklist ci-dessous
3. **SSH restreint** (CloudShell)
4. S3 + e-mail (optionnel)

---

## Checklist Cloudflare (copier-coller)

```
[ ] Compte Cloudflare créé, zone skydeen.ai ajoutée
[ ] NS PlanetHoster remplacés par NS Cloudflare
[ ] Enregistrement A audit → 13.51.252.61 (Proxied orange)
[ ] SSL/TLS Full (strict) + Always HTTPS
[ ] curl -sI https://audit.skydeen.ai/ | grep cf-ray  → OK
```

Le serveur surveille automatiquement (cron horaire) : dès que Cloudflare est actif, `data/cloudflare-watch.log` enregistre `CLOUDFLARE_ACTIVE` et lance la vérification post-CF.
