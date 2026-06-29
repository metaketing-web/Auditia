# Cloudflare + PlanetHoster — audit.skydeen.ai

Guide pas à pas pour le domaine hébergé chez **PlanetHoster** (`hybrid2468*.planethoster.net`).

## Étape A — Cloudflare (15 min)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Add a site** → `skydeen.ai` → plan **Free**
2. Cloudflare scanne les DNS existants — vérifier qu’il voit `audit` → `13.51.252.61`
3. Noter les **2 nameservers** Cloudflare (ex. `xxx.ns.cloudflare.com`)

## Étape B — PlanetHoster (nameservers)

1. Connexion **PlanetHoster** → domaine `skydeen.ai`
2. Section **Nameservers / Serveurs DNS** (pas seulement « Zone DNS »)
3. Remplacer les NS PlanetHoster par ceux de Cloudflare
4. Enregistrer — propagation : 15 min à 24 h

> Tant que les NS restent PlanetHoster, Cloudflare ne protège pas le site.

## Étape C — Cloudflare DNS

Une fois la zone active chez Cloudflare :

| Type | Name  | Content      | Proxy status |
|------|-------|--------------|--------------|
| A    | audit | 13.51.252.61 | **Proxied** (orange) |

Supprimer ou désactiver tout doublon `audit` en gris (DNS only).

## Étape D — SSL/TLS Cloudflare

- Overview : **Full (strict)**
- Edge Certificates : **Always Use HTTPS** = On

## Étape E — Vérifier (depuis votre Mac ou le serveur)

```bash
curl -sI https://audit.skydeen.ai/ | grep -i cf-ray
```

Si `cf-ray` apparaît :

```bash
ssh -i ~/Downloads/clef_vha.pem ec2-user@13.51.252.61 \
  'bash /opt/portia-audit/scripts/post-cloudflare-verify.sh'
```

## Étape F — SSH restreint (AWS CloudShell, eu-north-1)

```bash
curl -4 ifconfig.me   # ou curl -6 ifconfig.me
ADMIN_IP=VOTRE_IP bash restrict-ssh-sg.sh
```

Script : `/opt/portia-audit/scripts/restrict-ssh-sg.sh` (copier le contenu en CloudShell si besoin).

## Étape G — 2FA pilotage

1. https://audit.skydeen.ai → connexion admin ou juliana
2. **Réglages** → **Configurer la 2FA** → scan QR → code 6 chiffres

---

**Serveur déjà prêt** : nginx real IP Cloudflare, HTTPS Let's Encrypt, fail2ban, backups, monitoring.
