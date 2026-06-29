# Cloudflare devant audit.skydeen.ai (étape 2)

> **État origin (juin 2026)** : nginx real IP Cloudflare déjà installé sur le serveur (`/etc/nginx/conf.d/cloudflare-realip.conf`). Il reste à activer le proxy DNS chez Cloudflare.

## 1. Compte et zone DNS

1. [cloudflare.com](https://dash.cloudflare.com) → **Add a site** → `skydeen.ai`
2. Plan **Free** suffit pour WAF de base + CDN + HTTPS edge
3. Cloudflare affiche 2 nameservers (ex. `ada.ns.cloudflare.com`) → les mettre chez le registrar du domaine `skydeen.ai`
4. Attendre propagation (souvent 15 min – 24 h)

## 2. Enregistrement audit

Dans **DNS → Records** :

| Type | Name  | Content        | Proxy   |
|------|-------|----------------|---------|
| A    | audit | 13.51.252.61   | Proxied (orange) |

Ne pas laisser d’enregistrement **A** `audit` en « DNS only » (gris) en parallèle.

## 3. SSL/TLS

**SSL/TLS → Overview** : mode **Full (strict)**  
(Let’s Encrypt est déjà actif sur l’origin.)

**SSL/TLS → Edge Certificates** :
- Always Use HTTPS : **On**
- Minimum TLS Version : **1.2**
- Automatic HTTPS Rewrites : **On**

## 4. WAF (gratuit)

**Security → WAF** :
- Managed rules → **Cloudflare Managed Ruleset** : **On**
- **Bot Fight Mode** : **On** (si disponible sur le plan)

**Security → Settings** :
- Security Level : **Medium** ou **High**
- Challenge Passage : 30 min

## 5. Origin — déjà fait sur EC2

```bash
sudo bash /opt/portia-audit/scripts/nginx-cloudflare-realip.sh
```

Ce script est déjà exécuté ; à relancer seulement si Cloudflare met à jour ses plages IP.

## 6. Vérification

```bash
curl -sI https://audit.skydeen.ai/ | grep -i cf-ray
```

Présence de `cf-ray` = trafic passe par Cloudflare.

Sur le serveur :

```bash
bash /opt/portia-audit/scripts/security-status.sh
```

## 7. Restriction SSH (AWS CloudShell, séparé)

Une fois Cloudflare OK, restreindre SSH dans le security group :

```bash
# IPv4 admin
ADMIN_IP=90.7.166.87 bash restrict-ssh-sg.sh

# ou IPv6 (exemple)
ADMIN_IP6=2a01:cb00:1976:2a00:cd4a:2555:74b8:c0ef bash restrict-ssh-sg.sh
```

Télécharger le script depuis le repo ou copier depuis `/opt/portia-audit/scripts/restrict-ssh-sg.sh` sur une machine avec credentials AWS (CloudShell région **eu-north-1**).

**Attention** : vérifiez votre IP publique avant (`curl -4 ifconfig.me` / `curl -6 ifconfig.me`) pour ne pas vous couper l’accès SSH.
