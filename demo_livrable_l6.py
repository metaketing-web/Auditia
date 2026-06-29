"""Contenu L6 — Feuille de route de déploiement (version démo ~10 pages)."""


def l6_feuille_route() -> str:
    return r"""
<!-- pagebreak -->

# FEUILLE DE ROUTE DE DÉPLOIEMENT PNIPM

## Trajectoire séquencée, prérequis, jalons et conditions de réussite

| | |
|---|---|
| **Commanditaire** | MPJIPSC |
| **Prestataire** | Cabinet Skydeen |
| **Référence livrable** | L6 — Jalon J+28 |
| **Version** | 1.0 — Projet consolidé |
| **Date** | 20 avril 2026 |
| **Horizon** | 24 mois (T0 = lancement marché développement) |

> **VERSION DÉMO** — Trajectoire recommandée post-audit ; à valider par le Comité Stratégique.

<!-- pagebreak -->

## Synthèse exécutive

La feuille de route propose une trajectoire en **4 phases sur 24 mois**, conditionnée par **8 prérequis bloquants** identifiés dans L4. Le scénario **recommandé** privilégie un MVP fonctionnel à M+12 (consolidation + drill-down + traçabilité primes) avant les intégrations lourdes (SIGFIP, NNI, UXP).

**Investissement relatif estimé :** 100 % répartis 15 % / 45 % / 30 % / 10 % (phases 0 à 3).

**Facteurs clés de succès :** Cellule PNIPM opérationnelle, sponsor Cabinet actif, protocole NNI signé, qualité data DPSD.

<!-- pagebreak -->

## 1. Principes de la trajectoire

1. **Valeur politique d'abord** — livrer visible au Cabinet avant perfection technique ;
2. **Intégrer plutôt que remplacer** — API depuis SI existants ;
3. **Identité et data avant IA** — pas de module prédictif avant M+18 ;
4. **Offline by design** — terrain ivoirien dès le MVP ;
5. **Gouvernance continue** — COPIL mensuel + Comité Strat. trimestriel.

<!-- pagebreak -->

## 2. Prérequis bloquants (Phase 0)

| # | Prérequis | Owner | Échéance T0 | Statut audit |
|---|-----------|-------|-------------|--------------|
| P0-1 | Arbitrage NNI / clé bénéficiaire | Comité Strat. | T0-1 mois | Acté 06/04 |
| P0-2 | Cellule PNIPM (MOA) | Cabinet | T0 | Proposé |
| P0-3 | Révision périmètre MVP CDC | CT PNIPM | T0-2 mois | En cours |
| P0-4 | Protocole accès NNI (DPO) | DPO / ANRMP | T0+1 mois | Négociation |
| P0-5 | Référentiel dispositifs v1 | DAJIP | T0+2 mois | 60 % |
| P0-6 | Grille qualité data v1 | DPSD | T0+2 mois | 40 % |
| P0-7 | SSO / IAM cible défini | DSI | T0+1 mois | Esquisse |
| P0-8 | Marché développement lancé | DMP | T0 | Post-audit |

<!-- pagebreak -->

## 3. Phases de déploiement

### Phase 0 — Fondations (M0–M3)

| Lot | Livrables | Jalons |
|-----|-----------|--------|
| Gouvernance | Cellule, RACI, charte data | COPIL mensuel |
| Référentiels | Dispositifs, territoires, indicateurs | Ref v1 |
| IAM | SSO pilote 2 apps | 50 % users |
| Infra | Environnement dev/recette | Go dev |

### Phase 1 — MVP consolidation (M3–M12)

| Lot | Fonctionnalités | KPI |
|-----|-----------------|-----|
| F1 | Tableau de bord Cabinet | 5 KPI live |
| F2 | Drill-down programme → bénéficiaire (pilote AEJ) | 1 programme |
| F3 | Traçabilité primes THIMO | Chaîne complète 1 dispositif |
| F4 | PWA saisie offline DR pilote | 2 DR |
| F5 | Intégration AEJ + DPSD (API) | Flux auto F1 |

**Jalon clé M+12 :** Go-live MVP — restitution COPIL + Comité Strat.

### Phase 2 — Intégrations & scale (M12–M18)

| Lot | Intégrations | Dépendances |
|-----|--------------|-------------|
| I1 | NNI (identité) | P0-4 |
| I2 | SIGFIP (budget) | Convention DAF |
| I3 | 2e vague programmes (PEJEDEC, PACE) | Ref dispositifs |
| I4 | UXP / X-Road (1er service) | RQ-05 résolu |
| I5 | Volet B (RH, patrimoine) | Entretiens S3 |

### Phase 3 — Optimisation & IA (M18–M24)

| Lot | Contenu | Condition |
|-----|---------|-----------|
| O1 | Conteneurisation progressive | Phase 2 stable |
| O2 | Module IA prédictif (si data OK) | RQ-06 fermé |
| O3 | Extension 10 DR + tutelles | Adoption >70 % |
| O4 | SLA 99,9 % | Charge réelle mesurée |

<!-- pagebreak -->

## 4. Jalons et instances

| Date | Jalon | Instance | Critère succès |
|------|-------|----------|----------------|
| T0 | Lancement marché | Comité Strat. | AO publié |
| M+3 | Fondations OK | COPIL | Ref + SSO pilote |
| M+6 | Alpha MVP | COPIL | Demo Cabinet |
| M+12 | Go-live MVP | Comité Strat. | 5 KPI + drill-down |
| M+18 | Intégrations v1 | COPIL | NNI + 1 bailleur auto |
| M+24 | Bilan phase 3 | Comité Strat. | Roadmap 2 |

<!-- pagebreak -->

## 5. Scénarios alternatifs

| Scénario | Description | Durée MVP | Coût relatif | Risque |
|----------|-------------|-----------|--------------|--------|
| **A — Recommandé** | MVP allégé → intégrations | 12 mois | 100 % | Maîtrisé |
| B — Accéléré | Big-bang intégrations M+6 | 6 mois | 130 % | Élevé |
| C — Minimal | Dashboard seul, pas NNI | 9 mois | 70 % | Redevabilité limitée |
| D — CDC strict | Toutes exigences lot 1 | 18 mois | 150 % | Blocages |

**Recommandation Skydeen :** Scénario A — meilleur ratio valeur / risque.

<!-- pagebreak -->

## 6. Gouvernance du déploiement

| Rôle | Responsabilité | Fréquence |
|------|----------------|-----------|
| Sponsor Cabinet | Arbitrages politiques | Mensuel |
| CT PNIPM | MOA fonctionnel | Hebdo |
| DSI | MOA technique | Hebdo |
| Cellule PNIPM | Coordination | Quotidien |
| COPIL | Suivi, déblocage | Mensuel |
| Comité Strat. | Jalons majeurs | Trimestriel |
| DPO | Conformité data | Continu |

## 7. Conditions de réussite

1. Maintien du sponsor politique post-audit ;
2. Budget pluriannuel sécurisé (État + cofinancements) ;
3. Intégrateur avec références interop Afrique de l'Ouest ;
4. Transfert compétences DSI (3 agents formés architecture) ;
5. Plan conduite du changement DR (formation, quick wins).

## 8. Annexes

### Annexe A — Diagramme de Gantt (description)

- M0–M3 : Phase 0 (barre bleue)
- M3–M12 : Phase 1 MVP (barre verte)
- M12–M18 : Phase 2 (barre orange)
- M18–M24 : Phase 3 (barre grise)

### Annexe B — Lien livrables audit → marché

| Livrable audit | Input marché |
|----------------|--------------|
| L2 Besoins | CCTP fonctionnel |
| L3 Carto | Architecture cible |
| L4 Matrice | Périmètre MVP |
| L5 Risques | Clauses contractuelles |
| L6 Roadmap | Planning contractuel |
"""
