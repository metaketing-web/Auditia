# Skydeen Audit — mode entreprise (finalisé)

## Authentification & RBAC

| Email | Rôle | Mot de passe |
|-------|------|--------------|
| ac@metaketing.io | admin | voir `team-users.json` (serveur, non versionné) |
| jc@metaketing.io | juliana | idem |
| diopasse.pro@gmail.com / lbaoka@gmail.com | auditeurs | idem |
| cabinet@mpjipsc.local | cabinet (lecture seule) | idem |

Code mission : `MISSION_ACCESS_CODE` dans `/home/ec2-user/.env` (obligatoire si défini). `apply-env.sh` renforce automatiquement un code faible.

### Comptes nominatifs (équipe)

Copiez et personnalisez `team-users.example.json` → `/opt/portia-audit/team-users.json`, puis :

```bash
bash /home/ec2-user/portia-audit/scripts/init-team-users.sh
```

Ou variable `MISSION_TEAM_JSON` dans `.env` (tableau JSON email / name / role / password).

## Fonctionnalités livrées

| Module | Description |
|--------|-------------|
| **Cockpit** | KPIs, alertes, lacunes collecte, workflows en revue |
| **Entretiens** | 48+ entretiens, trames classiques + terrain S4 + volet B + RSSI/DPO |
| **Conduire entretien** | Questionnaires structurés 3 phases, sync serveur |
| **Data Room** | 11 répertoires, dépôt serveur, patch statut API |
| **Matrice CDC** | 45+ écarts + G-46–48 |
| **Checklist CDC technique** | Vérification des besoins techniques du CDC (48 exigences SI) — couverture, preuves, export CSV |
| **Cartographie** | Organigramme, interactions SVG, projets croisés |
| **Lacunes collecte** | 4 sujets suivis, marquage couvert |
| **Qualité données** | Grille 10 sources éditable |
| **Prog./Non-prog.** | 7 domaines structurés + édition |
| **Volet B** | Checklist RH/flotte/GED/marchés + édition statuts |
| **Flux données** | Cartographie flux + filtre par statut |
| **Workflows** | Constats & livrables (brouillon → revue → validé) |
| **Gouvernance** | COPIL, PV, charte signée, pièces jointes |
| **Export** | JSON local + ZIP serveur (état, extras, fichiers, questionnaires, journal) |
| **IA** | OpenAI côté serveur (`OPENAI_API_KEY`) |
| **Brouillons rapports** | Enregistrement serveur (`reportDrafts` + `livrables.contenu`) |
| **Documents mission** | Cadrage, agenda, charte COPIL et CDC — import DOCX → lecteur interactif (sommaire, recherche, impression), lecture seule |
| **Navigation** | Barre contextuelle inter-onglets (`portia-nav-connect.js`) |
| **Planning 4 semaines** | Frise éditable, événements, rebuild depuis entretiens, sync Google/Outlook, flux ICS |
| **Export unitaire** | Chaque entretien, constat, ligne matrice CDC et livrable — JSON, Markdown ou HTML ; matrice et constats en lot (CSV/MD/JSON) |
| **Questionnaires entretiens** | Grille complète 3 phases pour les 48 entretiens (Cabinet, DSI, directions, tutelles, programmes, technique, bailleurs, terrain S4, volet B, RSSI/DPO) — menu **Conduire un entretien** |
| **Journal audit** | Actions authentifiées (pilotage) |

## Déploiement complet

```bash
bash /home/ec2-user/portia-audit/install-ec2.sh
bash /home/ec2-user/portia-audit-config/apply-env.sh
sudo systemctl restart portia-audit
```

Audit automatique post-install + manuel :

```bash
bash /home/ec2-user/portia-audit/scripts/audit-platform.sh
```

Sauvegarde SQLite + uploads :

```bash
bash /home/ec2-user/portia-audit/scripts/backup-portia.sh
```

Enrichissement données (matrice 45 lignes, volet B, flux, lacunes, carto) :

```bash
cd /opt/portia-audit && node seed-enterprise-data.js
```

Réinitialisation mission vide (localhost uniquement) :

```bash
node /opt/portia-audit/seed-db.js
```

## Sécurité API

Avec `REQUIRE_AUTH=true` (défaut), les routes `/api/*` exigent le header `X-Portia-Token` (sauf `POST /api/auth/login`, `GET /api/health`, `PUT /api/bootstrap/state` depuis localhost pour seed).

## Antivirus

```bash
sudo bash /home/ec2-user/portia-audit/scripts/setup-clamav.sh
# Production stricte : REQUIRE_AV_SCAN=1 dans .env
```

Sinon `SKIP_AV_SCAN=true` dans `.env` (déconseillé en production).

## TLS / HTTPS

```bash
sudo bash /home/ec2-user/portia-audit/scripts/setup-https.sh audit.votredomaine.ci
```

(Nécessite un nom de domaine — pas possible avec la seule IP publique.)

## Sauvegarde automatique (cron)

```bash
bash /home/ec2-user/portia-audit/scripts/install-backup-cron.sh
```

## PostgreSQL

`DATABASE_URL` affiché dans `/api/health` ; moteur actuel = **SQLite** (`/opt/portia-audit/data/portia.db`).

## Planning & calendriers externes

Onglet **Planning 4 sem.** (pilotage et auditeurs ; Cabinet en lecture seule).

| Variable `.env` | Rôle |
|-----------------|------|
| `PLANNING_ICS_SECRET` | Token pour l’URL d’abonnement ICS (Gmail / Outlook « Ajouter un calendrier par URL ») |
| `CALENDAR_PUBLIC_BASE_URL` | URL publique de la plateforme (ex. `http://13.51.252.61`) — callbacks OAuth |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Connexion Google Calendar |
| `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` | Connexion Outlook (Microsoft Graph) |

**Abonnement ICS** (sans OAuth) : après déploiement, copiez l’URL depuis l’onglet Planning ou :

`http://<hôte>/api/planning/feed.ics?token=<PLANNING_ICS_SECRET>`

**OAuth** — enregistrez les redirect URI :

- `http://<hôte>/api/calendar/oauth/google/callback`
- `http://<hôte>/api/calendar/oauth/microsoft/callback`

Puis **Connecter Google Calendar** / **Connecter Outlook** → **Synchroniser vers calendriers connectés** (pilotage Juliana/admin).
