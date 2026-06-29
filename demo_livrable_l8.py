"""Contenu L8 — Annexe chiffrage par scénario (version démo ~10 pages)."""


def l8_chiffrage() -> str:
    return r"""
<!-- pagebreak -->

# ANNEXE — CHIFFRAGE PAR SCÉNARIO

## Déploiement PNIPM — Hypothèses, fourchettes de coûts et délais pour arbitrage Cabinet

| | |
|---|---|
| **Commanditaire** | MPJIPSC |
| **Prestataire** | Cabinet Skydeen |
| **Référence livrable** | L8 — Annexe au rapport final (L7) |
| **Version** | 1.0 — Projet chiffrage |
| **Date** | 22 avril 2026 |
| **Horizon budgétaire** | 24 mois (T0 = lancement marché développement) |
| **Devise** | FCFA (millions) — taux indicatif 1 EUR ≈ 655 FCFA |

> **VERSION DÉMO** — Fourchettes d'ordre de grandeur pour arbitrage Cabinet. Les montants ne constituent pas une offre commerciale ; ils s'appuient sur les benchmarks marchés publics SI en Afrique de l'Ouest et la trajectoire L6.

<!-- pagebreak -->

## Synthèse exécutive

La présente annexe chiffre **trois scénarios de déploiement** de la PNIPM, cohérents avec la feuille de route L6 :

| Scénario | MVP opérationnel | Coût total 24 mois | Profil de risque |
|----------|------------------|--------------------|------------------|
| **Minimal** | M+9 | 2,1 – 2,6 Md FCFA | Redevabilité limitée |
| **Cible (recommandé)** | M+12 | 3,0 – 3,8 Md FCFA | Maîtrisé |
| **Accéléré** | M+6 | 3,9 – 4,9 Md FCFA | Élevé |

**Recommandation Skydeen :** retenir le **scénario Cible** — meilleur équilibre entre visibilité politique (drill-down Cabinet, traçabilité primes), faisabilité technique (identité NNI séquencée) et maîtrise des risques d'intégration.

**Message Cabinet :** le scénario Minimal économise ~30 % mais ne couvre pas les exigences bailleurs sur la traçabilité individuelle ; le scénario Accéléré compresse les délais au prix d'un surcoût ~30 % et d'un risque d'échec d'intégration SIGFIP/NNI.

<!-- pagebreak -->

## 1. Périmètre et hypothèses communes

### 1.1 Périmètre chiffré

| Poste | Inclus | Exclus |
|-------|--------|--------|
| Développement plateforme | Oui (3 scénarios) | Remplacement des 14 SI existants |
| Intégrations | Variable selon scénario | Refonte complète AEJ / DPSD |
| Infra cloud / hébergement | Oui (24 mois) | Datacenter souverain dédié |
| Conduite du changement | Oui (DR pilotes) | Formation nationale 10 000 agents |
| Audit mission Skydeen | Non | Déjà réalisé (L1–L7) |
| Auditeur X-Road additionnel | Option | Hors base |

### 1.2 Hypothèses macro

| # | Hypothèse | Impact chiffrage |
|---|-----------|------------------|
| H1 | T0 = signature marché développement (juin 2026) | Base calendrier |
| H2 | Cellule PNIPM MOA = 6 ETP ministère | Coût interne non inclus |
| H3 | Intégrateur unique (marché public) | Économies d'échelle |
| H4 | Hébergement cloud zone Afrique / EU | 18–22 % du CAPEX |
| H5 | Cofinancements bailleurs mobilisables à hauteur de 40 % | Scénario Cible |
| H6 | NNI : protocole DPO signé sous 4 mois post-T0 | Bloquant scénarios Cible et Accéléré |
| H7 | Inflation matériel / licences +8 % / an | Fourchette haute |

### 1.3 Structure de coûts (répartition type — scénario Cible)

| Nature | Part | Détail |
|--------|------|--------|
| **CAPEX développement** | 55 % | Lots fonctionnels, API, PWA offline |
| **Intégrations SI** | 20 % | AEJ, DPSD, NNI, SIGFIP, UXP pilote |
| **Infra & licences** | 12 % | Cloud, SSO, monitoring, sauvegardes |
| **Conduite du changement** | 8 % | Formation DR, communication, support |
| **Gouvernance & MOE** | 5 % | AMO, recette, sécurité |

<!-- pagebreak -->

## 2. Scénario MINIMAL

### 2.1 Description

Déploiement **restreint** : tableau de bord Cabinet consolidé (5 KPI), drill-down sur **1 programme pilote** (AEJ), sans intégration NNI ni SIGFIP en phase 1. Les données bénéficiaires restent en **import batch** hebdomadaire.

**Objectif :** visibilité politique rapide à coût contenu — **non conforme** aux exigences intégrales du CDC sur l'identité unique et la traçabilité temps réel des primes.

### 2.2 Phasage et jalons

| Phase | Durée | Livrables clés |
|-------|-------|----------------|
| Phase 0 — Fondations | M0–M2 | Ref dispositifs v1, infra dev/recette |
| Phase 1 — MVP dashboard | M2–M9 | 5 KPI Cabinet, drill-down AEJ, export bailleur manuel |
| Phase 2 — Extension limitée | M9–M18 | 2e programme, PWA offline 2 DR |
| Phase 3 — Stabilisation | M18–M24 | SLA 99 %, documentation |

**Go-live MVP : M+9**

### 2.3 Chiffrage détaillé (fourchettes FCFA, millions)

| Poste | Bas | Haut |
|-------|-----|------|
| Développement MVP | 680 | 850 |
| Intégrations (AEJ API + DPSD batch) | 120 | 180 |
| Infra 24 mois | 180 | 240 |
| Conduite du changement | 90 | 120 |
| MOE / recette / sécurité | 80 | 110 |
| Contingence 10 % | 115 | 150 |
| **TOTAL** | **1 265** | **1 650** |
| + Cellule MOA externe (option) | 850 | 950 |
| **TOTAL avec MOA** | **2 115** | **2 600** |

### 2.4 Profil risques

| Risque | Probabilité | Impact |
|--------|-------------|--------|
| Insatisfaction bailleurs (pas de traçabilité prime temps réel) | Élevée | Critique |
| Double comptage bénéficiaires | Moyenne | Élevé |
| Reprise technique à M+18 pour NNI | Élevée | Moyen |

**Verdict :** scénario de **transition** uniquement — non recommandé comme cible finale.

<!-- pagebreak -->

## 3. Scénario CIBLE (recommandé)

### 3.1 Description

Trajectoire **L6 scénario A** : MVP à M+12 avec consolidation Cabinet, drill-down multi-programmes (AEJ + PEJEDEC pilotes), **traçabilité primes THIMO**, intégration **NNI en M+14–M+18**, **SIGFIP en M+16**, PWA offline 5 DR, SSO pilote.

Aligné sur les **17 besoins Must** (L2) et la levée des **8 prérequis bloquants** (L6).

### 3.2 Phasage et jalons

| Phase | Durée | Livrables clés |
|-------|-------|----------------|
| Phase 0 — Fondations | M0–M3 | Cellule, ref data, SSO pilote, IAM |
| Phase 1 — MVP consolidation | M3–M12 | 5 KPI live, drill-down, primes THIMO, 2 API |
| Phase 2 — Intégrations | M12–M18 | NNI, SIGFIP, UXP pilote, 2e vague programmes |
| Phase 3 — Optimisation | M18–M24 | IA prédictif (si data OK), extension 10 DR |

**Go-live MVP : M+12 · Intégrations v1 : M+18**

### 3.3 Chiffrage détaillé (fourchettes FCFA, millions)

| Poste | Bas | Haut |
|-------|-----|------|
| Développement (4 phases) | 1 050 | 1 320 |
| Intégrations (AEJ, DPSD, NNI, SIGFIP, UXP) | 420 | 580 |
| Infra 24 mois | 280 | 360 |
| Conduite du changement | 180 | 240 |
| MOE / recette / RSSI | 150 | 200 |
| Contingence 12 % | 246 | 324 |
| **TOTAL** | **2 326** | **3 024** |
| + AMO pluriannuel | 450 | 550 |
| + Licences & support éditeurs | 220 | 280 |
| **TOTAL avec AMO** | **2 996** | **3 854** |
| **Arrondi recommandé Cabinet** | **3 000** | **3 800** |

### 3.4 Plan de financement indicatif

| Source | Part | Montant (Md FCFA, milieu fourchette) |
|--------|------|--------------------------------------|
| Budget État MPJIPSC | 35 % | 1,2 |
| Cofinancements bailleurs (BM, AFD, BAD) | 40 % | 1,4 |
| Fonds d'équipement numérique | 15 % | 0,5 |
| Réserves / contingence mobilisée | 10 % | 0,35 |
| **Total** | **100 %** | **~3,45** |

### 3.5 Profil risques

| Risque | Mitigation | Coût résiduel |
|--------|------------|---------------|
| Retard protocole NNI | COPIL mensuel + sponsor Cabinet | Faible |
| Qualité data DPSD | Grille qualité L2, cellule data | Moyen |
| Résistance DR | Conduite changement + quick wins | Faible |

**Verdict :** **scénario recommandé** pour décision Comité Stratégique.

<!-- pagebreak -->

## 4. Scénario ACCÉLÉRÉ

### 4.1 Description

Compression du calendrier : **MVP à M+6**, intégrations NNI et SIGFIP **dès M+8** en parallèle du développement (approche big-bang partielle). Nécessite **double équipe intégration**, environnements stabilisés précocement et arbitrages COPIL hebdomadaires.

**Objectif :** satisfaire une contrainte politique de visibilité avant échéance électorale / instance internationale — **surcoût et risque technique élevés**.

### 4.2 Phasage et jalons

| Phase | Durée | Livrables clés |
|-------|-------|----------------|
| Phase 0 accélérée | M0–M1,5 | Fondations compressées |
| Phase 1 parallèle | M1,5–M6 | MVP + NNI + SIGFIP en parallèle |
| Phase 2 rattrapage | M6–M12 | Stabilisation, dette technique |
| Phase 3 | M12–M24 | Extension et optimisation |

**Go-live MVP : M+6 · Stabilisation : M+12**

### 4.3 Chiffrage détaillé (fourchettes FCFA, millions)

| Poste | Bas | Haut |
|-------|-----|------|
| Développement accéléré (+30 %) | 1 365 | 1 720 |
| Intégrations parallèles (+40 %) | 590 | 810 |
| Infra renforcée 24 mois | 340 | 430 |
| Conduite du changement renforcée | 240 | 310 |
| MOE / war room COPIL | 220 | 290 |
| Contingence 15 % | 413 | 546 |
| **TOTAL** | **3 168** | **4 106** |
| + Surcoût reprise / dette technique | 350 | 450 |
| **TOTAL avec reprise** | **3 518** | **4 556** |
| **Arrondi Cabinet** | **3 900** | **4 900** |

### 4.4 Profil risques

| Risque | Probabilité | Impact |
|--------|-------------|--------|
| Échec intégration NNI (non aboutie M+8) | Élevée | Critique |
| Instabilité MVP en production | Moyenne | Élevé |
| Burn-out cellule MOA | Moyenne | Moyen |
| Dépassement budget > 20 % | Élevée | Élevé |

**Verdict :** réservé à **impératif politique daté** — nécessite lettre de mission Cabinet explicite.

<!-- pagebreak -->

## 5. Tableau comparatif consolidé

| Critère | Minimal | Cible | Accéléré |
|---------|---------|-------|----------|
| **Délai MVP** | M+9 | M+12 | M+6 |
| **Coût total (Md FCFA)** | 2,1–2,6 | 3,0–3,8 | 3,9–4,9 |
| **NNI intégré** | Non (M+24+) | Oui M+14–18 | Oui M+8 (risqué) |
| **SIGFIP** | Non | Oui M+16 | Oui M+8 |
| **Traçabilité primes** | Partielle | Complète THIMO | Cible M+6 |
| **Drill-down bénéficiaire** | 1 programme | 2+ programmes | 2+ programmes |
| **Offline terrain** | 2 DR | 5 DR | 3 DR |
| **Conformité CDC lot 1** | ~45 % | ~75 % | ~60 % (instable) |
| **Risque global** | Moyen (redevabilité) | **Faible** | **Élevé** |
| **Recommandation** | Transition | **Retenir** | Si contrainte date |

<!-- pagebreak -->

## 6. Détail OPEX récurrent (annuel, post M+24)

| Poste | Minimal | Cible | Accéléré |
|-------|---------|-------|----------|
| Hébergement & infra | 85–110 M | 120–150 M | 140–180 M |
| Support & maintenance (15 %) | 45–60 M | 70–90 M | 90–120 M |
| Licences | 25–35 M | 40–55 M | 45–60 M |
| Équipe RUN DSI (4 ETP) | 48 M | 48 M | 52 M |
| **Total OPEX / an** | **203–253 M** | **278–343 M** | **327–412 M** |

## 7. Calendrier de décaissement (scénario Cible)

| Trimestre | % cumulé | Montant cumulé (Md) | Jalons |
|-----------|----------|---------------------|--------|
| T0–T1 | 15 % | 0,5 | Phase 0, marché signé |
| T2–T3 | 35 % | 1,2 | Alpha MVP |
| T4–T5 | 60 % | 2,1 | Go-live MVP M+12 |
| T6–T7 | 80 % | 2,8 | Intégrations NNI/SIGFIP |
| T8 | 100 % | 3,4 | Bilan M+24 |

## 8. Recommandation et prochaines étapes

### 8.1 Décision proposée au Comité Stratégique

1. **Retenir le scénario Cible** (3,0–3,8 Md FCFA / 24 mois) ;
2. **Lancer le marché développement** au T0 (juin 2026) avec périmètre MVP issu de L4 (G-01 à G-50) ;
3. **Sécuriser le protocole NNI** avant notification du marché (P0-4) ;
4. **Mobiliser 40 % cofinancement bailleurs** via dossier joint L7 ;
5. **Rejeter le scénario Minimal** comme cible finale (acceptable uniquement en phase transitoire 6 mois).

### 8.2 Options complémentaires

| Option | Surcoût | Délai | Commentaire |
|--------|---------|-------|-------------|
| Auditeur X-Road additionnel | 45–65 M | +2 mois | Recommandé si UXP critique |
| Extension portail jeunes | 180–240 M | +4 mois | Phase 3 |
| Datacenter souverain | 400–600 M | +6 mois | Non recommandé phase 1 |

### 8.3 Documents de référence

| Réf. | Document | Lien |
|------|----------|------|
| L6 | Feuille de route déploiement | Scénarios A–D |
| L4 | Matrice écarts CDC | Périmètre MVP |
| L5 | Risques RQ-01 à RQ-08 | Contingences |
| L7 | Rapport final | Synthèse décision |

---

*Document produit par le cabinet Skydeen — Mission AO-MPJIPSC-PNIPM-2026 · Annexe L8 · VERSION DÉMO*
"""
