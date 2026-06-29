# Sécurité — Skydeen Audit Cockpit

## Configuration production obligatoire

| Variable | Recommandation |
|----------|----------------|
| `MISSION_ACCESS_CODE` | ≥ 16 caractères aléatoires (pas la valeur d'exemple) |
| `BOOTSTRAP_SECRET` | Généré par `install-ec2.sh` ou `openssl rand -hex 32` |
| `REQUIRE_AUTH` | `true` |
| `UVICORN_HOST` | `127.0.0.1` (accès public uniquement via nginx) |
| `OPENAI_API_KEY` | Uniquement côté serveur, jamais dans le navigateur |
| `SKIP_AV_SCAN` | `0` ou absent si ClamAV installé |
| `REQUIRE_AV_SCAN` | `1` en production |
| `DISABLE_DEFAULT_USER_SEED` | `1` après création des comptes réels |
| `FORCE_HSTS` | `1` une fois HTTPS activé |

## Mesures implémentées

- **Auth** : PBKDF2-SHA256 (120k itérations), tokens 256 bits, sessions révoquées au logout
- **RBAC** : permissions par rôle, cabinet en lecture seule
- **Bootstrap** : secret header `X-Portia-Bootstrap-Secret` (plus de confiance sur l'IP client derrière nginx)
- **Rate limit** : login (8 échecs / 15 min par IP), assistant IA (60 req/h/utilisateur)
- **Uploads** : taille max, quota journalier, scan AV sur tous les chemins d'upload
- **Téléchargements** : chemins confinés sous `DATA_DIR/uploads`
- **État mission** : sanitization des IDs (anti-injection DOM)
- **En-têtes** : CSP, X-Frame-Options, nosniff (FastAPI + nginx)
- **CORS** : désactivé par défaut ; liste blanche via `CORS_ORIGINS` si besoin
- **Health/config** : réponses minimales sans chemins système

## TLS

Configurer un certificat (Let's Encrypt) devant nginx et définir `FORCE_HSTS=1`.

## Rotation des secrets

1. Changer `MISSION_ACCESS_CODE` dans `.env` et communiquer à l'équipe
2. Régénérer `BOOTSTRAP_SECRET` si compromis (seeds locaux uniquement)
3. Révoquer les sessions : redémarrage ou purge table `sessions`
4. Régénérer `OPENAI_API_KEY` si exposée

## Comptes par défaut

Au premier démarrage, des comptes démo peuvent être créés (`DISABLE_DEFAULT_USER_SEED=0`).
En production : mots de passe forts via variables `ADMIN_PASSWORD`, `JULIANA_PASSWORD`, etc., puis `DISABLE_DEFAULT_USER_SEED=1`.
