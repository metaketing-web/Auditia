"""Contenu L2 — Inventaire des besoins qualifiés (version démo ~10 pages)."""


def l2_inventaire_besoins() -> str:
    return r"""
<!-- pagebreak -->

# INVENTAIRE DES BESOINS QUALIFIÉS

## Audit de cadrage PNIPM — Diagnostic triangulé par axe (Politique · Programmatique · Technique)

| | |
|---|---|
| **Commanditaire** | MPJIPSC |
| **Prestataire** | Cabinet Skydeen |
| **Référence livrable** | L2 — Jalon J+14 |
| **Version** | 1.0 — Projet consolidé |
| **Date** | 6 avril 2026 (instantané J+14) |
| **Classification** | Confidentiel — Usage interne MPJIPSC / Skydeen |
| **Sources** | 22 entretiens réalisés · Data Room 11 répertoires · 10 constats C-01 à C-10 |

> **VERSION DÉMO** — Document généré en simulation. Contenu réaliste structuré comme un livrable cabinet d'audit ; sans valeur de validation officielle.

<!-- pagebreak -->

## Synthèse exécutive

À mi-parcours de la Semaine 2 (J+14), l'inventaire des besoins qualifiés consolide **47 besoins** identifiés, répartis sur les trois axes d'analyse et classés selon la grille **MoSCoW** (Must / Should / Could / Won't).

Les besoins **Must** (17) convergent vers quatre priorités transverses :

1. **Consolidation Cabinet** — vision unifiée politique / programmatique / financière avec drill-down ;
2. **Identité et traçabilité bénéficiaire** — clé NNI, déduplication, suivi des primes ;
3. **Interopérabilité gouvernementale** — SIGFIP, UXP/X-Road, référentiels partagés ;
4. **Gouvernance des données et sécurité** — SSO, audit trail, qualité des données.

L'axe **Programmatique** concentre le plus fort volume de besoins métier (21), reflétant la complexité des 12 dispositifs et des obligations bailleurs. L'axe **Technique** expose des prérequis structurants (19 besoins) dont 8 sont des **bloquants** pour le lot 1 du futur marché.

**Niveau de maturité global observé :** 2,1 / 5 (initial / repeatable) — écart significatif avec la cible CDC (4 / 5).

<!-- pagebreak -->

## 1. Méthodologie de qualification

### 1.1 Grille de qualification

| Critère | Description | Échelle |
|---------|-------------|---------|
| **Urgence politique** | Pression Cabinet / bailleurs | 1–5 |
| **Impact opérationnel** | Effet sur programmes et agents | 1–5 |
| **Faisabilité court terme** | Réalisable sous 12 mois | 1–5 |
| **Dépendances** | Nombre de prérequis externes | Faible / Moyen / Élevé |
| **Source de preuve** | D / Doc / Obs (triangulation) | 1–3 |

### 1.2 Processus

1. Extraction des besoins depuis entretiens (grilles investigation / confrontation / co-construction) ;
2. Rapprochement Data Room et constats (C-01 à C-10) ;
3. Atelier interne Skydeen de consolidation et dédoublonnage ;
4. Classification MoSCoW et priorisation par axe ;
5. Revue COPIL #2 (03/04/2026) — arbitrages partiels actés.

### 1.3 Périmètre couvert S1–S2

| Axe | Entretiens réalisés | Structures couvertes | Complétude |
|-----|---------------------|-------------------|------------|
| Politique | 8 / 10 | Cabinet, CT PNIPM, IG | 80 % |
| Programmatique | 6 / 18 | DAJIP, DPSD, AEJ (partiel) | 35 % |
| Technique | 8 / 20 | DSI, DPSD, NNI (doc.) | 40 % |

<!-- pagebreak -->

## 2. Axe Politique — Besoins qualifiés

### 2.1 Synthèse

Le Cabinet exprime une commande claire : **arbitrage consolidé** et **redevabilité bailleurs**. Les besoins politiques ne sont pas des fonctionnalités SI mais des **capacités de pilotage** que la PNIPM doit rendre possibles.

### 2.2 Inventaire (extrait)

| ID | Besoin | MoSCoW | Urgence | Source | Constats liés |
|----|--------|--------|---------|--------|---------------|
| BP-01 | Tableau de bord consolidé multi-programmes | Must | 5 | Cabinet, DPSD | C-04 |
| BP-02 | Drill-down Cabinet → programme → bénéficiaire | Must | 5 | Cabinet | C-02, C-03 |
| BP-03 | Traçabilité individuelle des primes versées | Must | 5 | IG, Cabinet | C-06 |
| BP-04 | Indicateurs stratégiques PJGOUV alignés PNIPM | Must | 4 | Cabinet | — |
| BP-05 | Reporting bailleurs automatisé (formats BAD, BM) | Should | 4 | DAF | C-04 |
| BP-06 | Alertes sur écarts d'exécution programmatique | Should | 3 | Cabinet | — |
| BP-07 | Historisation des arbitrages COPIL | Could | 2 | Secrétariat COPIL | — |
| BP-08 | Réévaluation périmètre MVP (fonctions caduques) | Must | 4 | Chargé d'études | C-10 |

### 2.3 Maturité axe Politique : **2,0 / 5**

Les attentes sont **matures et documentées** ; les moyens de les satisfaire (données, SI, gouvernance) le sont **nettement moins**.

<!-- pagebreak -->

## 3. Axe Programmatique — Besoins qualifiés

### 3.1 Synthèse

Les programmes jeunesse/emploi (AEJ, PEJEDEC, USEP, PACE, THIMO…) fonctionnent en silos. Les besoins programmatiques portent sur la **continuité de parcours**, la **déduplication** et la **qualité des données bénéficiaires**.

### 3.2 Inventaire (extrait)

| ID | Besoin | MoSCoW | Urgence | Source | Constats liés |
|----|--------|--------|---------|--------|---------------|
| BPr-01 | Identifiant unique bénéficiaire (NNI) | Must | 5 | DAJIP, DPSD | C-02 |
| BPr-02 | Règles de déduplication inter-programmes | Must | 5 | DAJIP | C-03 |
| BPr-03 | Référentiel unique des dispositifs actifs | Must | 4 | DAJIP, AEJ | — |
| BPr-04 | Suivi parcours jeune (inscription → sortie) | Must | 4 | AEJ | — |
| BPr-05 | Consolidation effectifs et indicateurs AEJ/PEJEDEC | Should | 4 | DPSD | C-04 |
| BPr-06 | Interface agents terrain (saisie mobile offline) | Must | 4 | DR-ABJ (doc.) | C-09 |
| BPr-07 | Workflow validation multi-niveaux (DR → central) | Should | 3 | DAJIP | — |
| BPr-08 | Module alertes relances bénéficiaires | Should | 3 | AEJ | — |
| BPr-09 | Cartographie conventions bailleurs ↔ programmes | Should | 3 | DAF | — |
| BPr-10 | Export standardisé pour audits bailleurs | Must | 4 | BAD (template) | C-04 |

### 3.3 Programmes prioritaires pour approfondissement S3

| Programme | Bailleur | Volume bénéf. estimé | Maturité data | Priorité audit |
|-----------|----------|---------------------|---------------|----------------|
| AEJ | État + cofinancements | > 500 000 | Moyenne | P1 |
| PEJEDEC | BAD | ~ 120 000 | Faible | P1 |
| PACE / Enable Youth | BM | ~ 80 000 | Moyenne | P1 |
| USEP | UNICEF | ~ 45 000 | Faible | P2 |
| THIMO | État | Variable | Faible | P2 |

### 3.4 Maturité axe Programmatique : **1,8 / 5**

<!-- pagebreak -->

## 4. Axe Technique — Besoins qualifiés

### 4.1 Synthèse

Le SI actuel ne supporte pas la vision PNIPM. Les besoins techniques combinent **modernisation architecture**, **intégrations** et **socle data**.

### 4.2 Inventaire (extrait)

| ID | Besoin | MoSCoW | Bloquant | Source | Constats / Gaps |
|----|--------|--------|----------|--------|-----------------|
| BT-01 | Bus d'échange / API Gateway centralisée | Must | Oui | DSI | C-01, G-01 |
| BT-02 | Raccordement UXP / X-Road | Must | Oui | DSI | C-05, G-03 |
| BT-03 | Intégration SIGFIP (budget / exécution) | Must | Oui | DAF, DSI | G-08 |
| BT-04 | SSO + 2FA ministériel | Must | Oui | DSI | C-07, G-05 |
| BT-05 | Référentiel données + dictionnaire | Must | Oui | DPSD | G-47 |
| BT-06 | PWA offline-first (terrain) | Must | Non | DSI | G-06, C-09 |
| BT-07 | Journal d'audit inviolable | Must | Oui | IG, DSI | C-06 |
| BT-08 | Hébergement conteneurisé / cloud souverain | Should | Non | DSI | G-01 |
| BT-09 | IPv6 natif | Could | Non | DSI | G-04 |
| BT-10 | Module IA prédictif | Won't (phase 1) | — | Cabinet | G-13, C-10 |

### 4.3 Maturité axe Technique : **2,4 / 5**

Capacité d'exploitation existante mais **architecture legacy** et **absence d'intégration**.

<!-- pagebreak -->

## 5. Matrice de priorisation consolidée

### 5.1 Top 10 besoins transverses

| Rang | ID | Besoin | Axe | Score | Décision COPIL #2 |
|------|-----|--------|-----|-------|-------------------|
| 1 | BPr-01 | NNI bénéficiaire | Prog. | 25 | Arbitrage Comité Strat. 06/04 |
| 2 | BP-02 | Drill-down consolidé | Pol. | 24 | Confirmé MVP |
| 3 | BT-02 | UXP / X-Road | Tech. | 23 | Trajectoire S3 |
| 4 | BP-03 | Traçabilité primes | Pol. | 23 | Confirmé MVP |
| 5 | BT-03 | SIGFIP | Tech. | 22 | Prérequis lot 1 |
| 6 | BPr-02 | Déduplication | Prog. | 22 | Lié NNI |
| 7 | BT-04 | SSO + 2FA | Tech. | 21 | Lot 1 |
| 8 | BP-01 | Tableau de bord Cabinet | Pol. | 21 | Quick win cible |
| 9 | BT-05 | Référentiel données | Tech. | 20 | DPSD lead |
| 10 | BPr-06 | Saisie offline terrain | Prog. | 19 | Confirmé S4 |

### 5.2 Répartition MoSCoW

| Catégorie | Politique | Programmatique | Technique | Total |
|-----------|-----------|----------------|-----------|-------|
| Must | 5 | 9 | 8 | **22** |
| Should | 4 | 7 | 6 | 17 |
| Could | 2 | 3 | 4 | 9 |
| Won't (phase 1) | 1 | 2 | 3 | 6 |

<!-- pagebreak -->

## 6. Synthèse transversale et implications

### 6.1 Convergence des axes

Les trois axes convergent sur un **socle identité + données + intégration** sans lequel les besoins politiques (drill-down, primes) restent **non satisfaisables**.

### 6.2 Quick wins identifiés (0–6 mois post-marché)

| Quick win | Effort | Impact | Prérequis |
|-----------|--------|--------|-----------|
| Tableau de bord Excel → PNIPM (indicateurs existants) | M | Élevé | DPSD, modèles R10 |
| Portail Data Room unifié (existant audit) | F | Moyen | Gouvernance |
| SSO sur 2 applications pilotes | M | Moyen | DSI |
| Règles dédup provisoires (rapprochement flou) | É | Élevé | Échantillon DPSD |

### 6.3 Points ouverts pour S3–S4

- Quantification des doublons bénéficiaires (échantillon statistique) ;
- Entretiens DRH, Patrimoine, Marchés (volet B) ;
- Spécifications techniques UXP et NNI ;
- Focus groups jeunes (S4 terrain).

## 7. Annexes

### Annexe A — Correspondance besoins / livrables L3–L7

| Besoin cluster | Livrable détaillé |
|----------------|-------------------|
| Intégrations, SI | L3 — Cartographie |
| Écarts CDC | L4 — Matrice |
| Risques | L5 — Registre |
| Trajectoire | L6 — Feuille de route |

### Annexe B — Liste complète des 47 besoins

Disponible dans le cockpit mission (module Livrables → L2 — annexe export).

### Annexe C — Validation

| Rôle | Nom | Date | Statut |
|------|-----|------|--------|
| Directeur de mission Skydeen | Mme Laurent P. | 06/04/2026 | Projet |
| Manager Programmatique | M. Asse | 05/04/2026 | Revu |
| Sponsor MPJIPSC | CT PNIPM | — | En attente COPIL #2 |
"""
