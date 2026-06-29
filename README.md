# Auditia — Plateforme Portia Audit (PNIPM)

Plateforme d'audit et de pilotage mission pour le **PNIPM** (Plateforme Numérique Intégrée de Pilotage Ministériel), développée par **Skydeen**.

- **Stack :** FastAPI (`server.py`) + SPA (`index.html`, modules `portia-*.js`) + SQLite
- **Production :** https://audit.skydeen.ai/

## Fonctionnalités principales

- Cockpit de pilotage mission (entretiens, constats, risques, livrables)
- Data Room (répertoires R1→R11, statuts dont *À valider*)
- **Collecte externe** — liens par entretien, dépôt public `/collecte/{token}`, campagne mail J-14 / relance J-7
- Arborescence ministère 00→10
- Auth entreprise, 2FA pilotage (TOTP), rôles auditeurs / cabinet
- Prévisualisation documents, export livrables, assistant IA (serveur)

## Démarrage local

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # renseigner les secrets localement
./start.sh
```

Ouvrir http://127.0.0.1:3080/

## Déploiement

```bash
bash scripts/deploy-safe.sh
bash scripts/smoke-check.sh
python3 scripts/verify-collecte-prod.py   # sur le serveur
```

Voir `ENTERPRISE.md`, `docs/ACTIONS-MANUELLES.md` et `CORRECTIFS.md`.

## Structure

| Dossier / fichier | Rôle |
|-------------------|------|
| `server.py` | API FastAPI |
| `collecte_db.py` | Collecte externe (tokens, échéances, export CSV) |
| `dataroom_db.py` | Documents mission |
| `enterprise_*.py` | Auth, sécurité, uploads |
| `portia-*.js` | Modules front |
| `collecte.html` / `collecte.js` | Page publique de dépôt |
| `scripts/` | Déploiement, durcissement, vérifications |

## Sécurité

Ne jamais committer `.env`, `team-users.json` ni les fichiers `*.pem`. Utiliser `.env.example` et `team-users.example.json` comme modèles.
