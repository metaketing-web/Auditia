"""Contenu L7 — Rapport final d'audit & restitution (version démo ~25 pages)."""


def l7_rapport_final() -> str:
    return r"""
<!-- pagebreak -->

# RAPPORT FINAL D'AUDIT & RESTITUTION

## Synthèse exécutive — Mission de cadrage stratégique PNIPM (MPJIPSC)

| | |
|---|---|
| **Commanditaire** | Ministère de la Promotion de la Jeunesse, de l'Insertion Professionnelle et du Service Civique (MPJIPSC) |
| **Prestataire** | Cabinet Skydeen — Mission d'audit et de conseil |
| **Référence** | AO-MPJIPSC-PNIPM-2026 / L7 — Jalon J+30 |
| **Version** | 2.0 — Projet de rapport final consolidé |
| **Date de restitution** | 22 avril 2026 |
| **Instance** | Comité Stratégique MPJIPSC |
| **Classification** | Confidentiel — Diffusion restreinte |
| **Période mission** | 23 mars — 22 avril 2026 (30 jours ouvrés) |

> **VERSION DÉMO** — Rapport de synthèse consolidant L1 à L6 et renvoyant à L8 (chiffrage). Support slides (25 diapositives) décrit en annexe B.

<!-- pagebreak -->

## Note au Comité Stratégique

Madame le Ministre, Monsieur le Directeur de Cabinet, Mesdames et Messieurs les Membres du Comité Stratégique,

La mission de cadrage stratégique conduite par le cabinet Skydeen sur **30 jours** confirme la **pertinence politique** du projet PNIPM et la **nécessité impérieuse** d'une plateforme de consolidation ministérielle. Elle révèle en parallèle un **écart structurel** entre les ambitions du cahier des charges (version 2.3) et la maturité actuelle du MPJIPSC en matière de données, d'intégration SI, de gouvernance et de capacité opérationnelle à absorber un big-bang technologique.

### Message central (3 points)

1. **Le projet PNIPM doit être lancé** — la fragmentation informationnelle actuelle limite la capacité d'arbitrage du Cabinet et expose le ministère à des risques de redevabilité vis-à-vis des bailleurs (BAD, BM, AFD, UNICEF) ;
2. **Le périmètre MVP doit être resserré** — 62 % des exigences CDC sont « à compléter » au regard du terrain ; 10 % sont caduques (IA prédictive, chatbot, gamification) ;
3. **La trajectoire doit être séquencée** — identité bénéficiaire (NNI) et socle data avant intégrations lourdes (SIGFIP, UXP) ; MVP opérationnel réaliste à **M+12** (scénario Cible, cf. L8).

### Décision recommandée

**Autoriser la publication du marché de développement** sous 30 jours, sur la base du MVP allégé (L4 §5.1), avec création immédiate d'une **Cellule PNIPM** et sécurisation du **protocole d'accès NNI** avant notification.

### Chiffres clés de la mission

| Indicateur | Valeur |
|------------|--------|
| Entretiens réalisés | 48 / 48 (100 %) |
| Constats structurants | 10 (C-01 à C-10) |
| Besoins qualifiés | 47 (L2) |
| Écarts CDC analysés | 50 (G-01 à G-50) |
| Risques identifiés | 18 (8 mission + 10 solution) |
| Documents Data Room versés | 24 / 72 attendus (33 %) |
| Maturité SI globale | 2,1 / 5 vs cible 4 / 5 |

<!-- pagebreak -->

## 1. Rappel de mission et méthodologie

### 1.1 Objectifs contractuels

| Objectif | Statut | Livrable |
|----------|--------|----------|
| Diagnostic indépendant P / G / T | Atteint | L2, L3 |
| Confrontation CDC ↔ réalité | Atteint | L4 |
| Registre risques et recommandations | Atteint | L5 |
| Feuille de route déploiement | Atteint | L6 |
| Restitution décisionnelle | Présent document | L7 |
| Chiffrage scénarios (annexe) | Atteint | L8 |

### 1.2 Périmètre et exclusions

**Inclus :** Cabinet, directions centrales, tutelles (AEJ, OSCN, BCP-Emploi), 12 dispositifs, SI et data, volet B (interfaces), terrain régional S4.

**Exclus (HP-01 à HP-03) :** développement PNIPM, audit financier approfondi, refonte SI tutelles.

### 1.3 Méthode — Trois axes et triangulation

| Axe | Question directrice | Couverture entretiens | Complétude |
|-----|---------------------|----------------------|------------|
| **Politique** | Que doit voir le Cabinet pour arbitrer ? | 10 / 10 | 100 % |
| **Programmatique** | Comment circulent les données entre programmes ? | 18 / 18 | 100 % |
| **Technique** | Le SI peut-il porter la cible CDC ? | 20 / 20 | 100 % |

**Triangulation :** chaque constat C-01 à C-10 documenté selon Déclaratif / Documenté / Observé. Taux de constats « confirmés » (≥2 piliers) : **7 / 10**.

### 1.4 Moyens de collecte mobilisés

| Moyen | Volume | Exploitation |
|-------|--------|--------------|
| Entretiens structurés (3 phases) | 48 | CR + qualification + pièces |
| Data Room (11 répertoires) | 24 docs versés | Analyse continue |
| Checklists A–F + CDC G-01–G-50 | 7 + 50 | Matrice L4 |
| Démonstrations SI | 6 (DSI, AEJ, DR) | Constats C-01, C-09 |
| Focus groups terrain S4 | 3 (Abidjan, Bouaké, Korhogo) | Constats C-09, C-03 |
| Cockpit mission Skydeen | Temps réel | Traçabilité, relances |

<!-- pagebreak -->

## 2. Déroulement de la mission — Bilan semaine par semaine

### 2.1 Semaine 1 — Cadrage stratégique (23–27 mars)

| Jour | Activité | Résultat clé |
|------|----------|--------------|
| J0 | Lancement COPIL, entretiens Cabinet | Commande politique confirmée |
| J+1 | DSI, DAJIP, IG | Fragmentation SI, lacunes primes |
| J+2 | DPSD, DVA | Qualité data hétérogène |
| J+3 | CT PNIPM, DAF | Reporting manuel, SIGFIP absent |
| J+4 | COPIL #1 | L1 validé, plan S2 acté |

**Livrable :** L1 validé · **Constats émergents :** C-01, C-04, C-06.

### 2.2 Semaine 2 — Deep-dive programmatique (30 mars – 3 avril)

| Focus | Entretiens | Découverte majeure |
|-------|------------|-------------------|
| Programmes jeunesse | AEJ, PEJEDEC, PACE | Silos, pas de clé commune |
| Bailleurs | DAF, templates BAD/BM | Formats multiples, délais serrés |
| Coordination | DAJIP, DPSD | 47 besoins qualifiés (L2) |
| COPIL #2 | 03/04 | Arbitrage NNI en préparation |

**Livrable :** L2 à 85 % · **Constats :** C-02, C-03 renforcés.

### 2.3 Semaine 3 — Volet B & intégrations (6–10 avril)

| Focus | Entretiens | Découverte majeure |
|-------|------------|-------------------|
| RH, patrimoine, marchés | DRH, DMP, patrimoine | Volet B dispersé (G-14) |
| Sécurité | RSSI, DPO | SSO absent, audit trail partiel |
| Interop | DSI, NNI (doc.), ADETIC | UXP/X-Road = 0 % opérationnel |
| Comité Stratégique | 06/04 | NNI + clé transition actés |
| COPIL #3 | 10/04 | Matrice L4 présentée |

**Livrables :** L3, L4 · **Constats :** C-05, C-07, C-08.

### 2.4 Semaine 4 — Terrain régional (13–17 avril)

| Site | Activités | Constats terrain |
|------|-----------|------------------|
| DR Abidjan | Démo SI, agents, focus group | Connectivité OK, saisie lente |
| DR Bouaké | Entretiens coordinateurs | Offline nécessaire (C-09) |
| DR Korhogo | Focus group jeunes | Parcours fragmenté perçu |
| COPIL #4 | 17/04 | Risques L5, roadmap L6 |

**Livrables :** L5, L6 · **Constats :** C-09 confirmé, C-10 (MVP caduc).

### 2.5 Clôture (20–22 avril)

| Date | Instance | Contenu |
|------|----------|---------|
| 20/04 | Remise dossier | L1–L7 + L8 annexe |
| 22/04 | Restitution Comité Strat. | Présent document + 25 slides |

<!-- pagebreak -->

## 3. Synthèse des constats majeurs — Analyse détaillée

### 3.1 Tableau récapitulatif

| # | Constat | Axe | Criticité | Piliers | Réf. |
|---|---------|-----|-----------|---------|------|
| 1 | Fragmentation SI — 14 apps sans intégration | Technique | Élevée | D+Doc+Obs | C-01 |
| 2 | Absence identifiant unique bénéficiaire | Programmatique | **Critique** | D+Doc | C-02 |
| 3 | Doublons inter-programmes probables | Programmatique | Élevée | D+Doc | C-03 |
| 4 | Reporting Cabinet manuel (Excel) | Programmatique | Moyenne | D+Obs | C-04 |
| 5 | Pas d'intégration UXP / X-Road | Technique | Élevée | Doc | C-05 |
| 6 | Traçabilité primes insuffisante | Politique | Élevée | D+Doc+Obs | C-06 |
| 7 | Pas de SSO / 2FA centralisé | Technique | Moyenne | Obs | C-07 |
| 8 | Territoires non normalisés | Technique | Moyenne | Doc | C-08 |
| 9 | Connectivité régionale hétérogène | Technique | Moyenne | Obs | C-09 |
| 10 | Fonctions MVP CDC partiellement caduques | Politique | Faible | D+Doc | C-10 |

### 3.2 Analyse approfondie par constat

#### C-01 — Fragmentation du système d'information

**Constat :** 14 applications métier en silos, aucun bus d'échange, consolidation par Excel et e-mail.

**Preuves :** Entretien DSI (24/03, démo observée) · Cartographie R7 · Matrice G-01, G-03.

**Implication :** La PNIPM ne peut pas « remplacer » ces SI en phase 1 ; une stratégie **API-first** et intégration progressive est obligatoire.

**Recommandation :** Lot 1 = socle + API Gateway + 2 intégrations pilotes (AEJ, DPSD).

#### C-02 — Absence d'identifiant unique bénéficiaire (CRITIQUE)

**Constat :** Chaque programme gère sa propre clé ; NNI non exploité opérationnellement.

**Preuves :** DAJIP, DPSD, AEJ · Comité Strat. 06/04 · Gap G-07.

**Implication :** Drill-down Cabinet, déduplication et traçabilité bailleurs **impossibles** sans arbitrage NNI.

**Décision actée :** NNI + clé interne de transition sur 12 mois.

#### C-03 — Doublons inter-programmes probables

**Constat :** Même individu inscrit AEJ + PEJEDEC sans rapprochement ; estimation 8–15 % doublons (échantillon non statistique).

**Preuves :** Entretiens DAJIP, focus group Bouaké · Échantillon DPSD 600 lignes.

**Implication :** Indicateurs PJGOUV et reporting bailleurs potentiellement faussés.

**Recommandation :** Règles dédup provisoires (QW-04) en attendant NNI.

#### C-04 — Reporting Cabinet manuel

**Constat :** Consolidation mensuelle Excel, délai 15–20 jours, pas de drill-down temps réel.

**Preuves :** Entretiens Cabinet, DPSD · Modèles R10.

**Implication :** Arbitrages retardés ; quick win prioritaire = 5 KPI live.

#### C-05 — Pas d'intégration UXP / X-Road

**Constat :** Spécifications attendues en R7 non versées ; aucun service en production.

**Preuves :** DSI, relances Data Room · Gap G-03 · Risque RQ-05.

**Implication :** Interopérabilité gouvernementale reportée phase 2 ; option Auditeur X-Road.

#### C-06 — Traçabilité primes insuffisante

**Constat :** Chaîne inscription → paiement prime non tracée bout-en-bout (THIMO, stages).

**Preuves :** IG (24/03), DCEC · Exigence bailleurs · Gap G-10.

**Implication :** Risque contentieux et signalements IG ; cœur du MVP politique.

#### C-07 à C-10 — Synthèse

| Constat | Synthèse one-liner | Action |
|---------|-------------------|--------|
| C-07 SSO | Comptes locaux, pas de 2FA | Lot 1 — G-05 |
| C-08 Territoires | Codes région/district incohérents | Référentiel DPSD |
| C-09 Offline | Réseau instable en DR | PWA G-06 confirmé |
| C-10 MVP caduc | IA, chatbot, gamification non demandés | Retirer G-13, G-49, G-50 |

<!-- pagebreak -->

## 4. Conclusions consolidées par axe

### 4.1 Axe Politique — Capacité d'arbitrage du Cabinet

#### 4.1.1 Vision et attentes

Le Cabinet et le CT PNIPM partagent une vision **claire et légitime** : tableau de bord consolidé, drill-down jusqu'au bénéficiaire, traçabilité des primes, redevabilité bailleurs. Cette vision est **alignée** avec le PJGOUV 2026-2030 (4 millions d'emplois) et les conventions de financement.

#### 4.1.2 Écart vision / moyens

| Capacité attendue | Moyen actuel | Écart |
|-------------------|--------------|-------|
| Vision temps réel | Reporting Excel mensuel | Critique |
| Drill-down bénéficiaire | Données silotées | Critique |
| Traçabilité primes | Outils THIMO isolés | Élevé |
| Arbitrage data-driven | Intuition + pièces partielles | Élevé |

#### 4.1.3 KPI Cabinet recommandés (MVP)

| # | Indicateur | Source | Fréquence |
|---|------------|--------|-----------|
| 1 | Bénéficiaires actifs (consolidé) | EDM PNIPM | Hebdo |
| 2 | Taux d'exécution programmatique | DPSD + SIGFIP (phase 2) | Mensuel |
| 3 | Primes versées / engagées | THIMO pilote | Mensuel |
| 4 | Taux de sortie positive (emploi) | AEJ pilote | Trimestriel |
| 5 | Alertes data quality | Grille DPSD | Continu |

#### 4.1.4 Conclusion politique

**Go confirmé** — ajuster le périmètre MVP (retirer fonctions caduques), concentrer sur 5 KPI et traçabilité primes THIMO. Sponsor Cabinet doit rester engagé post-audit (COPIL mensuel).

### 4.2 Axe Programmatique — Écosystème des dispositifs

#### 4.2.1 Cartographie des 12 dispositifs

| Dispositif | Bailleur principal | Maturité data | Priorité intégration |
|------------|-------------------|---------------|---------------------|
| AEJ | État | Moyenne | **P1 — pilote** |
| PEJEDEC | BAD | Faible | **P1** |
| PACE / Enable Youth | BM | Moyenne | **P1** |
| USEP | UNICEF | Faible | P2 |
| THIMO | État | Faible | P1 (primes) |
| OSCN / Service civique | État | Moyenne | P2 |
| Carte Jeunes | État | Pilote | P2 |
| BCP-Emploi | État | Faible | P3 |
| PSIE, PNBV, C2D, UGP-CSC | Divers | Variable | P3 |

#### 4.2.2 Parcours bénéficiaire — État constaté

```
Inscription programme A → [pas de lien] → Inscription programme B
         ↓                                        ↓
   Clé interne A                            Clé interne B
         ↓                                        ↓
   Prime versée                             Prime versée (?)
         ↓                                        ↓
              [Aucune vue consolidée Cabinet]
```

**Conséquence :** double comptage possible, parcours invisible, reporting bailleur manuel.

#### 4.2.3 Stratégie identité recommandée

| Phase | Clé | Usage |
|-------|-----|-------|
| M0–M6 | Clé interne + rapprochement flou | Transition, QW-04 |
| M6–M12 | NNI pilote AEJ + PEJEDEC | Golden record v1 |
| M12–M18 | NNI généralisé | Dédup inter-programmes |
| M18+ | NNI seul (clé interne archivée) | Conformité CDC G-07 |

#### 4.2.4 Conclusion programmatique

Prioriser **AEJ + PEJEDEC + PACE + THIMO** comme vagues d'intégration. Finaliser référentiel dispositifs (P0-5) et grille qualité data (P0-6) avant marché.

### 4.3 Axe Technique — Maturité SI et prérequis

#### 4.3.1 Score de maturité (CMMI simplifié)

| Domaine | Score actuel | Cible CDC | Écart |
|---------|--------------|-----------|-------|
| Architecture | 2/5 | 4/5 | -2 |
| Intégration | 1/5 | 4/5 | -3 |
| Sécurité | 2/5 | 4/5 | -2 |
| Data | 2/5 | 4/5 | -2 |
| Exploitation | 3/5 | 4/5 | -1 |
| **Moyenne** | **2,0/5** | **4/5** | **-2** |

#### 4.3.2 Prérequis bloquants (8)

| # | Prérequis | Statut audit | Délai recommandé |
|---|-----------|--------------|------------------|
| P0-1 | Arbitrage NNI | Acté 06/04 | Fait |
| P0-2 | Cellule PNIPM | Proposé | T0 |
| P0-3 | Révision MVP CDC | En cours | T0-2 mois |
| P0-4 | Protocole NNI (DPO) | Négociation | T0+1 mois |
| P0-5 | Référentiel dispositifs | 60 % | T0+2 mois |
| P0-6 | Grille qualité data | 40 % | T0+2 mois |
| P0-7 | SSO / IAM cible | Esquisse | T0+1 mois |
| P0-8 | Marché lancé | Post-audit | T0 |

#### 4.3.3 Conclusion technique

Marché en **2 lots minimum** : Lot 1 socle + MVP (M0–M12), Lot 2 intégrations NNI/SIGFIP/UXP (M12–M18). Ne pas exiger microservices full dès le lot 1 (G-01 à ajuster).

<!-- pagebreak -->

## 5. Matrice des écarts CDC — Synthèse décisionnelle

### 5.1 Distribution des verdicts (50 exigences)

| Verdict | Nombre | % | Interprétation pour le marché |
|---------|--------|---|-------------------------------|
| Confirmé | 8 | 16 % | Intégrer tel quel au MVP |
| À ajuster | 6 | 12 % | Reformuler au CCTP |
| À compléter | 31 | 62 % | Prérequis ou phase 2 |
| Caduc | 5 | 10 % | **Retirer** du MVP |

### 5.2 Top 12 écarts bloquants

| Ref | Exigence | Criticité | Vague traitement |
|-----|----------|-----------|------------------|
| G-07 | NNI bénéficiaire | Critique | Vague 2 (M12+) |
| G-09 | Drill-down Cabinet | Critique | Vague 1 — MVP |
| G-10 | Traçabilité primes | Critique | Vague 1 — MVP |
| G-05 | SSO + 2FA | Critique | Vague 0 |
| G-03 | UXP / X-Road | Critique | Vague 2 |
| G-08 | SIGFIP | Critique | Vague 2 |
| G-01 | Microservices | Majeur | Vague 3 |
| G-47 | Qualité data | Majeur | Vague 0 |
| G-06 | PWA offline | Majeur | Vague 1 |
| G-14 | Volet B | Majeur | Vague 2 |
| G-02 | Bases PostgreSQL/Mongo | Modéré | Vague 1–2 |
| G-11 | Chiffrement | Majeur | Vague 0–1 |

### 5.3 Exigences caduques — Retrait recommandé

| Ref | Exigence | Motif |
|-----|----------|-------|
| G-13 | Module IA prédictif | Data immature (RQ-06, C-10) |
| G-49 | Chatbot NLP jeunes | Non demandé Cabinet |
| G-50 | Gamification portail | Non demandé |
| G-04 | IPv6 natif | Priorité basse |
| G-12 (partiel) | SLA 99,9 % immédiat | Progressif |

### 5.4 Périmètre MVP validé (synthèse L4)

**Inclus lot 1 :** consolidation 5 KPI, drill-down AEJ, primes THIMO, SSO/RBAC, PWA offline 2 DR, référentiel dispositifs, intégration AEJ + DPSD.

**Reporté lot 2 :** NNI, SIGFIP, UXP, volet B complet, microservices.

**Retiré :** IA, chatbot, gamification.

<!-- pagebreak -->

## 6. Risques, recommandations et quick wins

### 6.1 Registre consolidé — Vue heatmap

| Niveau | Risques mission | Risques solution |
|--------|-----------------|------------------|
| **Critique (>12)** | — | — |
| **Élevé (9–12)** | RQ-02 Data Room | RQ-05 X-Road, RQ-06 Data/IA, RQ-07 NNI, RS-01 Dérive, RS-03 DSI |
| **Moyen (5–8)** | RQ-01, RQ-03, RQ-04 | RQ-08, RS-02, RS-04, RS-05, RS-06 |
| **Faible (<5)** | — | — |

### 6.2 Risques résiduels post-mission

| Ref | Risque | Statut | Action post-restitution |
|-----|--------|--------|-------------------------|
| RQ-02 | Data Room incomplète (33 %) | Ouvert | Relances cockpit — opérationnel |
| RQ-05 | X-Road non documenté | Ouvert | Décision Auditeur ou différé |
| RQ-06 | IA prématurée | Maîtrisé | Roadmap phase 3 actée |
| RQ-07 | Doublons bénéficiaires | Arbitré | Protocole NNI en cours |
| RS-03 | Surcharge DSI | Ouvert | Cellule + 2 ETP projet |

### 6.3 Recommandations stratégiques (R-STR)

| ID | Recommandation | Priorité | Owner | Horizon |
|----|----------------|----------|-------|---------|
| R-STR-01 | MVP allégé (L4 §5.1) | P0 | Comité Strat. | 22/04 |
| R-STR-02 | Cellule PNIPM | P0 | Cabinet | T0 |
| R-STR-03 | NNI clé bénéficiaire | P0 | DAJIP/DPO | Acté |
| R-STR-04 | Protocole NNI + SIGFIP | P0 | DPO/DAF | T0+3 mois |
| R-STR-05 | Révision CDC (retirer caduc) | P1 | CT PNIPM | M1 |
| R-STR-06 | Marché lots séquencés | P0 | DMP | T0 |
| R-STR-07 | Cofinancement bailleurs 40 % | P1 | DAF | T0+2 mois |

### 6.4 Quick wins (0–6 mois post-marché)

| # | Quick win | Impact | Effort | KPI J+90 |
|---|-----------|--------|--------|----------|
| QW-01 | Tableau de bord Cabinet | Très élevé | M | 5 KPI live |
| QW-02 | Portail Data Room unifié | Moyen | F | 80 % docs |
| QW-03 | SSO pilote 2 apps | Moyen | M | -50 % comptes locaux |
| QW-04 | Règles dédup provisoires | Élevé | M | -15 % doublons |
| QW-05 | Relances documentaires | Moyen | F | 100 % tracées |
| QW-06 | Formation agents DR (PWA) | Élevé | M | 200 agents |

<!-- pagebreak -->

## 7. Feuille de route et chiffrage — Synthèse

### 7.1 Trajectoire recommandée (L6 scénario A)

| Phase | Horizon | Objectif | Budget relatif |
|-------|---------|----------|------------------|
| 0 — Fondations | M0–M3 | Gouvernance, ref, SSO | 15 % |
| 1 — MVP | M3–M12 | Consolidation, drill-down, primes | 45 % |
| 2 — Intégrations | M12–M18 | NNI, SIGFIP, UXP | 30 % |
| 3 — Optimisation | M18–M24 | IA (si data OK), scale | 10 % |

**Jalon clé :** Go-live MVP **M+12** — restitution COPIL + Comité Stratégique.

### 7.2 Scénarios chiffrés (renvoi L8)

| Scénario | MVP | Coût 24 mois (Md FCFA) | Recommandation |
|----------|-----|------------------------|----------------|
| Minimal | M+9 | 2,1 – 2,6 | Transition seulement |
| **Cible** | M+12 | **3,0 – 3,8** | **Retenir** |
| Accéléré | M+6 | 3,9 – 4,9 | Si contrainte date |

**Plan financement indicatif (Cible) :** 35 % État · 40 % bailleurs · 15 % fonds numérique · 10 % réserves.

### 7.3 Gouvernance post-audit

| Instance | Fréquence | Rôle |
|----------|-----------|------|
| Comité Stratégique | Trimestriel | Jalons majeurs, budget |
| COPIL PNIPM | Mensuel | Déblocage, suivi |
| Cellule PNIPM | Quotidien | MOA opérationnel |
| DPO | Continu | Conformité NNI/data |

<!-- pagebreak -->

## 8. Décisions demandées au Comité Stratégique

### 8.1 Tableau des décisions

| # | Décision | Options | Recommandation Skydeen | Délai | Impact si non tranché |
|---|----------|---------|----------------------|-------|----------------------|
| D1 | Périmètre MVP | CDC strict / Allégé | **Allégé** (L4 §5.1) | 22/04 | Retard 6–12 mois |
| D2 | Clé bénéficiaire | NNI / Interne / Hybride | **NNI + transition** | Acté | — |
| D3 | Lancement marché | Oui / Report 6 mois | **Oui sous 30 j** | Mai 2026 | Perte momentum |
| D4 | Cellule PNIPM | Créer / Différer | **Créer T0** | Juin 2026 | Échec MOA |
| D5 | Auditeur X-Road | Oui / Non / Différé | **Oui si blocage** | Juin 2026 | Retard UXP |
| D6 | Budget quick wins | 150 M / 0 | **150 M FCFA** | T0 | Pas de visibilité M+3 |
| D7 | Scénario chiffrage | Minimal / Cible / Accéléré | **Cible (L8)** | 22/04 | Arbitrage budget flou |
| D8 | Accompagnement MOA | Skydeen 12 mois / Interne | **Skydeen ou équivalent** | T0 | Risque RS-03 |

### 8.2 Formulation proposée des résolutions

1. *« Le Comité Stratégique valide le périmètre MVP allégé tel que décrit au §5.4 du présent rapport et au livrable L4. »*
2. *« Le Comité autorise la publication du marché de développement PNIPM sous 30 jours calendaires, en deux lots séquencés. »*
3. *« Le Comité acte la création de la Cellule PNIPM (6 ETP) et l'enveloppe de 150 M FCFA pour les quick wins de phase 0. »*
4. *« Le Comité retient le scénario de déploiement Cible (3,0–3,8 Md FCFA / 24 mois) et charge la DAF de mobiliser 40 % de cofinancement bailleurs. »*

<!-- pagebreak -->

## 9. Bilan de la mission d'audit

### 9.1 Indicateurs de performance

| Indicateur | Cible contractuelle | Réalisé | Écart | Commentaire |
|------------|---------------------|---------|-------|-------------|
| Entretiens | 48 | 48 | 0 | 100 % — toutes trames |
| Data Room | 70 % docs | 33 % | -37 pts | Relances actives fin mission |
| Constats | ≥ 8 | 10 | +2 | Triangulation OK |
| Livrables L1–L7 | 7 | 7 | 0 | 100 % |
| Matrice G-01–G-50 | 48 min. | 50 | +2 | L4 complet |
| Satisfaction sponsor | ≥ 4/5 | 4,2/5 | OK | Sondage CT PNIPM |
| Restitution | J+30 | J+30 | 0 | Respect délai |

### 9.2 Points forts de la mission

- **Couverture entretiens** exhaustive (48/48) malgré calendrier serré ;
- **Cockpit Skydeen** : traçabilité temps réel, relances Data Room, exports ;
- **Arbitrage NNI** obtenu au Comité Stratégique mi-parcours ;
- **Matrice d'écarts** opérationnelle et liée aux constats ;
- **Quick wins** identifiés et chiffrables.

### 9.3 Points de vigilance et limites

| Limite | Impact conclusions | Atténuation |
|--------|-------------------|-------------|
| Data Room 33 % seulement | Conclusions prudentes sur SIGFIP, UXP | Relances post-mission |
| Pas d'audit financier (HP-02) | Pas de chiffrage programmes | Hors périmètre |
| Pas de pentest | Recommandations sécurité génériques | Audit sécurité marché |
| Échantillon data 600 lignes | Doublons = estimation | Mission data ciblée |
| Terrain S4 partiel | Constats C-09 confirmés Abidjan/Bouaké | Extension S4 si besoin |

### 9.4 Engagements réciproques — Bilan

| Engagement | MPJIPSC | Skydeen |
|------------|---------|--------|
| Disponibilité référents | Partiel (S2 chargé) | Respecté |
| Data Room 72 h | Partiel (33 %) | Relances formalisées |
| Validation livrables 5 j | L1 validé, autres en cours | Livrés à J+30 |
| Confidentialité | Respectée | Respectée |
| COPIL hebdo | 4/4 tenus | 4/4 |

### 9.5 Suite recommandée post-mission

| Option | Durée | Objectif | Budget indicatif |
|--------|-------|----------|------------------|
| Accompagnement MOA Skydeen | 12 mois | Pilotage marché, COPIL | 450–550 M FCFA |
| Auditeur X-Road | 15 jours | Specs UXP, faisabilité | 45–65 M FCFA |
| Audit qualité data DPSD | 10 jours | Golden record, dédup | 35–50 M FCFA |
| Extension terrain S4 | 5 jours | 3 DR supplémentaires | 20 M FCFA |

<!-- pagebreak -->

## 10. Restitution — Support et format

### 10.1 Structure de la présentation (25 slides)

| Bloc | Slides | Contenu |
|------|--------|---------|
| Contexte | 1–3 | PJGOUV, enjeux, périmètre mission |
| Constats | 4–10 | C-01 à C-10, 1 slide / constat majeur |
| Écarts CDC | 11–14 | Verdicts, MVP, retrait caduc |
| Risques | 15–17 | Top 5, heatmap, mitigations |
| Roadmap | 18–21 | 4 phases, jalons, prérequis |
| Chiffrage | 22–23 | 3 scénarios L8, recommandation |
| Décisions | 24–25 | 8 décisions, prochaines étapes |

### 10.2 Documents remis au Comité Stratégique

| Document | Format | Destinataire |
|----------|--------|--------------|
| Rapport final L7 | Word/PDF | Comité Strat. |
| Livrables L1–L6 | Word | COPIL, directions |
| Annexe L8 chiffrage | Word | DAF, Cabinet |
| Matrice écarts L4 | Excel + Word | DSI, CT PNIPM |
| Support slides | PPT/PDF | Restitution 22/04 |
| Export cockpit ZIP | ZIP | Archives mission |

<!-- pagebreak -->

## 11. Annexes

### Annexe A — Index des livrables remis

| Ref | Titre | Pages | Statut | Date |
|-----|-------|-------|--------|------|
| L1 | Note de cadrage validée | ~15 | Validé COPIL | 22/03 |
| L2 | Inventaire besoins qualifiés | ~12 | Projet revu | 06/04 |
| L3 | Cartographie données & SI | ~12 | Projet revu | 10/04 |
| L4 | Matrice écarts CDC G-01–G-50 | ~12 | Projet revu | 10/04 |
| L5 | Risques & recommandations | ~12 | Projet revu | 17/04 |
| L6 | Feuille de route 24 mois | ~12 | Projet revu | 17/04 |
| L7 | Rapport final (présent) | ~25 | Projet restitution | 22/04 |
| L8 | Chiffrage scénarios | ~12 | Annexe disponible | 22/04 |

### Annexe B — Décisions COPIL et Comité Stratégique (extrait PV)

| Date | Instance | Décision |
|------|----------|----------|
| 22/03 | Lancement | Charte COPIL, L1 validé, HP confirmés |
| 27/03 | COPIL #1 | Plan S2, relances Data Room A–F |
| 03/04 | COPIL #2 | Priorisation programmes AEJ/PEJEDEC |
| 06/04 | Comité Strat. | **NNI + clé transition actés** |
| 10/04 | COPIL #3 | Matrice L4, option Auditeur X-Road |
| 17/04 | COPIL #4 | Roadmap L6, registre risques L5 |

### Annexe C — Correspondance constats / gaps / risques / livrables

| Constat | Gaps | Risques | Livrable détail |
|---------|------|---------|-----------------|
| C-01 | G-01, G-03 | RS-02 | L3 |
| C-02 | G-07 | RQ-07 | L2, L4 |
| C-03 | G-07 | RQ-07 | L2 |
| C-04 | G-09 | — | L2 |
| C-05 | G-03 | RQ-05 | L3, L5 |
| C-06 | G-10 | RS-04 | L4, L5 |
| C-07 | G-05 | — | L4 |
| C-08 | G-47 | RQ-06 | L2 |
| C-09 | G-06 | RS-05 | L3, L6 |
| C-10 | G-13, G-49, G-50 | RQ-06 | L4 |

### Annexe D — Liste des 48 entretiens (synthèse)

| Semaine | Politique | Programmatique | Technique | Total |
|---------|-----------|----------------|-----------|-------|
| S1 | 8 | 2 | 4 | 14 |
| S2 | 2 | 10 | 4 | 16 |
| S3 | 0 | 4 | 10 | 14 |
| S4 | 0 | 2 | 2 | 4 |
| **Total** | **10** | **18** | **20** | **48** |

*Détail nominatif : cockpit mission → Entretiens → Export.*

### Annexe E — Data Room — État des lieux clôture

| Répertoire | Attendus | Versés | Taux | Bloquant |
|------------|----------|--------|------|----------|
| R1 Gouvernance | 8 | 6 | 75 % | Non |
| R2 Politique | 6 | 5 | 83 % | Non |
| R3 Données | 12 | 4 | 33 % | **Oui** |
| R4 Programmes | 10 | 3 | 30 % | **Oui** |
| R5 Budget/SIGFIP | 8 | 2 | 25 % | **Oui** |
| R6 Juridique | 6 | 4 | 67 % | Non |
| R7 SI/Architecture | 10 | 2 | 20 % | **Oui** |
| R8 Sécurité | 4 | 2 | 50 % | Non |
| R9 Terrain | 4 | 0 | 0 % | Non |
| R10 Reporting | 4 | 2 | 50 % | Non |
| **Total** | **72** | **24** | **33 %** | — |

### Annexe F — Remerciements

Skydeen remercie chaleureusement le Directeur de Cabinet, le Conseiller Technique référent PNIPM, les directeurs centraux (DAJIP, DPSD, DSI, DAF, DRH), les tutelles (AEJ, OSCN), les équipes des directions régionales d'Abidjan, Bouaké et Korhogo, ainsi que le secrétariat du COPIL pour leur disponibilité et leur franchise dans un calendrier exigeant de 30 jours.

---

**Pour le cabinet Skydeen**

| Rôle | Nom | Signature |
|------|-----|-----------|
| Directeur de mission | Mme Laurent P. | [simulation démo] |
| Manager Programmatique | M. Asse | [simulation démo] |
| Manager Technique | Mme Laetitia | [simulation démo] |
| Analyste data | M. Koné | [simulation démo] |

*Abidjan, le 22 avril 2026*

---

*Document L7 — Version démo 2.0 — Cabinet Skydeen — Confidentiel — Usage interne MPJIPSC / Skydeen*
"""
