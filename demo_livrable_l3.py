"""Contenu L3 — Cartographie données & systèmes (version démo ~10 pages)."""


def l3_cartographie() -> str:
    return r"""
<!-- pagebreak -->

# CARTOGRAPHIE DES DONNÉES & DES SYSTÈMES

## Écosystème informationnel MPJIPSC — État des lieux et schéma cible PNIPM

| | |
|---|---|
| **Commanditaire** | MPJIPSC |
| **Prestataire** | Cabinet Skydeen |
| **Référence livrable** | L3 — Jalon J+18 |
| **Version** | 1.0 — Projet consolidé |
| **Date** | 10 avril 2026 (instantané J+18) |
| **Classification** | Confidentiel |

> **VERSION DÉMO** — Document généré en simulation. Schémas décrits en texte et tableaux ; version graphique dans le cockpit (carto interactive).

<!-- pagebreak -->

## Synthèse exécutive

La cartographie consolidée identifie **42 entités** (directions, tutelles, bailleurs, opérateurs SI) et **14 applications métier** en exploitation, reliées par **6 flux de données documentés** et **12 flux déclarés non formalisés** (e-mail, Excel, clés USB).

**Constats structurants :**

- Architecture **hub-and-spoke absent** — chaque programme possède son silo ;
- **Aucune MDM** (Master Data Management) bénéficiaire ;
- Intégrations **SIGFIP, NNI, UXP** : 0/3 opérationnelles ;
- Qualité data hétérogène (score moyen 2,3/5 sur grille DPSD).

Le schéma cible PNIPM repose sur une **plateforme intégrée** (API Gateway, référentiels, bus événementiel) connectant les SI existants sans big-bang.

<!-- pagebreak -->

## 1. Périmètre et méthode

### 1.1 Périmètre cartographié

| Couche | Éléments | Source |
|--------|----------|--------|
| Organisationnelle | Ministère + 8 tutelles + 12 DR | Organigrammes R2 |
| Applicative | 14 apps + 3 outils bureautiques critiques | DSI, démo |
| Données | 10 sources prioritaires | DPSD, AEJ |
| Intégrations | SIGFIP, NNI, UXP, inter-programmes | Entretiens, docs R7 |
| Infrastructure | On-premise, IPv4, sauvegardes partielles | DSI |

### 1.2 Légende flux

| Symbole | Signification |
|---------|---------------|
| → solid | Flux automatisé |
| ⇢ dashed | Flux manuel (Excel, mail) |
| ⊗ | Flux absent / bloqué |
| ○ | Référentiel manquant |

<!-- pagebreak -->

## 2. Cartographie organisationnelle

### 2.1 Niveau politique et pilotage

```
[Cabinet MPJIPSC] ──⇢ [COPIL PNIPM] ──⇢ [Comité Stratégique]
       │                      │
       ├── DPSD (data, indicateurs)
       ├── DAF (budget, SIGFIP)
       └── CT PNIPM (sponsor projet)
```

### 2.2 Niveau programmatique

| Entité | Rôle data | Outil principal | Export vers consolidation |
|--------|-----------|-----------------|---------------------------|
| DAJIP | Coordination programmes | Excel + mail | Manuel |
| AEJ | Gestion AEJ | App métier AEJ | API absente |
| PEJEDEC | Suivi PEJEDEC | Base locale | Manuel |
| USEP | Suivi USEP | Fichiers CSV | Manuel |
| OSCN | Service civique | SI OSCN | Partiel |

### 2.3 Niveau technique

| Entité | Responsabilité | Interaction PNIPM |
|--------|----------------|-------------------|
| DSI | SI, infra, sécurité | MOA technique |
| ANSUT | Réseau / connectivité | Fournisseur infra |
| NNI (ANRMP) | Identité numérique | Fournisseur API identité |
| UXP / ADETIC | Interopérabilité | Raccordement à engager |

<!-- pagebreak -->

## 3. Cartographie applicative

### 3.1 Inventaire applications (extrait)

| App | Éditeur / type | Users | Base | Intégration | Criticité PNIPM |
|-----|----------------|-------|------|-------------|-----------------|
| SIGFIP (lecture) | État | DAF | Oracle | Sortante absente | Must |
| SI RH | Interne | DRH | MySQL | Aucune | Should |
| App AEJ | Interne / legacy | AEJ | PostgreSQL | Aucune | Must |
| GED partielle | SharePoint local | DSI | Filesystem | Limitée | Should |
| Reporting DPSD | Excel + Power BI | DPSD | Fichiers | Manuel | Must |
| Outil primes THIMO | Interne | DCEC | Access | Aucune | Must |
| Portail jeunes (proto) | Prestataire externe | AEJ | Cloud | Non prod | Could |

**Total recensé :** 14 applications + 3 outils critiques non intégrés.

### 3.2 Maturité applicative

| Dimension | Score | Commentaire |
|-----------|-------|-------------|
| Couverture fonctionnelle | 3/5 | Outils existants mais silotés |
| Interopérabilité | 1/5 | Pas de bus, pas d'API standard |
| Sécurité | 2/5 | Comptes locaux, audit trail partiel |
| Scalabilité | 2/5 | On-premise saturé |
| Maintenabilité | 2/5 | Dette technique élevée |

<!-- pagebreak -->

## 4. Flux de données

### 4.1 Flux programmatiques (bénéficiaires)

| Flux | Source | Destination | Mode | Fréquence | Qualité |
|------|--------|-------------|------|-----------|---------|
| F1 | AEJ | DPSD | Excel mail | Mensuel | Moyenne |
| F2 | PEJEDEC | DAF / bailleurs | Template BAD | Trimestriel | Faible |
| F3 | DR terrain | Central | Saisie web + offline partiel | Hebdo | Variable |
| F4 | NNI | — | ⊗ Non connecté | — | — |
| F5 | Programmes → Cabinet | Consolidation | ⇢ Excel manuel | Mensuel | Faible |

### 4.2 Flux financiers

| Flux | Description | Statut | Impact PNIPM |
|------|-------------|--------|--------------|
| SIGFIP → DAF | Exécution budgétaire | Lecture seule partielle | Drill-down budget |
| Programmes → Paiement primes | Chaîne THIMO / stages | Non tracée bout-en-bout | C-06 |
| Bailleurs → Reporting | Formats multiples | Manuel | C-04 |

### 4.3 Flux cible PNIPM (description textuelle)

1. **Ingestion** — API / batch depuis SI programmes et SIGFIP ;
2. **Référentiel** — MDM bénéficiaire (clé NNI) + référentiel dispositifs ;
3. **Consolidation** — Entrepôt de données ministériel (EDM) ;
4. **Restitution** — Portails Cabinet (web) et agents (PWA offline) ;
5. **Gouvernance** — Catalogue de données, lineage, audit trail.

<!-- pagebreak -->

## 5. Référentiels et intégrations externes

### 5.1 État des raccordements

| Système | Rôle | Statut | Document R7 | Action |
|---------|------|--------|-------------|--------|
| **NNI** | Identité citoyenne | Non raccordé | modalites-acces-nni (attendu) | Protocole DPO |
| **SIGFIP** | Exécution budgétaire | Non raccordé | modalites-raccordement-sigfip (relance) | Atelier DAF S3 |
| **UXP/X-Road** | Interop. État | Non raccordé | specs-raccordement-xroad (relance) | Auditeur X-Road ? |
| **Carte Jeunes** | Portail jeune | Pilote isolé | — | Périmètre MVP |

### 5.2 Référentiels internes

| Référentiel | Existe | Qualité | Owner | Priorité création |
|-------------|--------|---------|-------|-------------------|
| Bénéficiaires | Non | — | DAJIP | P0 |
| Dispositifs / programmes | Partiel | 2/5 | DAJIP | P0 |
| Territoires | Non harmonisé | 2/5 | DPSD | P1 |
| Indicateurs | Partiel | 3/5 | DPSD | P1 |
| Structures / orga | Oui | 4/5 | DRH | P2 |

<!-- pagebreak -->

## 6. Schéma cible de circulation (narratif)

### 6.1 Principes directeurs

1. **Ne pas remplacer brutalement** les SI métier en phase 1 ;
2. **API-first** — exposer les données avant de migrer les applications ;
3. **Identité d'abord** — NNI comme clé de voûte ;
4. **Offline-ready** pour le terrain ivoirien.

### 6.2 Composants cibles

| Composant | Fonction | Technologie indicative (CDC) |
|-----------|----------|------------------------------|
| API Gateway | Routage, sécurité, throttling | Kong / équivalent |
| EDM PNIPM | Consolidation analytique | PostgreSQL + MongoDB |
| MDM Bénéficiaire | Golden record | Module dédié |
| Portail Cabinet | Dashboards drill-down | Web responsive |
| Agent PWA | Saisie terrain offline | PWA + sync |
| IAM | SSO, 2FA, RBAC 6 niveaux | Keycloak / AD |

### 6.3 Phases d'intégration

| Phase | Intégrations | Horizon |
|-------|--------------|---------|
| 0 | Référentiels, SSO pilote | M0–M3 |
| 1 | AEJ, DPSD, 1 bailleur | M3–M9 |
| 2 | SIGFIP, NNI, 2e vague programmes | M9–M18 |
| 3 | UXP, volet B, IA (si data OK) | M18+ |

## 7. Annexes

### Annexe A — Correspondance Data Room

| Répertoire | Pièces exploitées |
|------------|-------------------|
| R3 | Échantillon data, référentiel |
| R5 | Budget, SIGFIP |
| R7 | SI, architecture, UXP |
| R10 | Modèles reporting |

### Annexe B — Glossaire

| Terme | Définition |
|-------|------------|
| MDM | Master Data Management |
| EDM | Entrepôt de données |
| UXP | Unified Exchange Platform (X-Road CI) |
| NNI | Numéro National d'Identification |

### Annexe C — Prochaines mises à jour (S4)

Cartographie géographique DR, flux terrain observés, schéma graphique export PNG.
"""
