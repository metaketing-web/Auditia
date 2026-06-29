"""Contenu L4 — Matrice écarts CDC / réalité (version démo ~10 pages)."""


def l4_matrice_ecarts() -> str:
    return r"""
<!-- pagebreak -->

# MATRICE DES ÉCARTS CDC / RÉALITÉ

## Confrontation systématique des exigences PNIPM au terrain observé (G-01 à G-50)

| | |
|---|---|
| **Commanditaire** | MPJIPSC |
| **Prestataire** | Cabinet Skydeen |
| **Référence livrable** | L4 — Jalon J+18 |
| **Version** | 1.0 — Projet consolidé |
| **Date** | 10 avril 2026 |
| **Périmètre CDC** | Cahier des charges PNIPM v2.3 + additifs bailleurs |

> **VERSION DÉMO** — Matrice alimentée par le cockpit mission (module Matrice d'écart). Verdicts : Confirmé · À ajuster · À compléter · Caduc.

<!-- pagebreak -->

## Synthèse exécutive

La matrice recense **50 exigences** extraites du CDC, confrontées à la réalité observée (entretiens, Data Room, démonstrations).

| Verdict | Nombre | % | Interprétation |
|---------|--------|---|----------------|
| **Confirmé** | 8 | 16 % | Exigence pertinente et alignée terrain |
| **À ajuster** | 6 | 12 % | Direction correcte, niveau ou périmètre à revoir |
| **À compléter** | 31 | 62 % | Écart majeur — prérequis à lever |
| **Caduc** | 5 | 10 % | Hors MVP ou redondant (C-10) |

**Écarts bloquants pour le lot 1 (12 exigences) :** G-03, G-05, G-07, G-08, G-01, G-47, G-46, G-14, G-09, G-10, G-02, G-11.

**Recommandation :** réviser le périmètre MVP du CDC pour retirer les exigences **caduc** (G-13, G-49, G-50) et séquencer le reste sur 3 vagues.

<!-- pagebreak -->

## 1. Méthodologie de confrontation

### 1.1 Grille d'analyse par exigence

| Champ | Description |
|-------|-------------|
| Ref | Identifiant G-xx |
| Exigence CDC | Libellé contractuel |
| Réf. CDC | Paragraphe |
| Réalité observée | Fait terrain sourcé |
| Verdict | confirme / ajuster / completer / caduc |
| Implication MVP | Bloquant / Important / Différé |
| Source preuve | Entretien, doc, observation |

### 1.2 Échelle de criticité d'écart

| Niveau | Définition |
|--------|------------|
| Critique | Empêche le MVP ou invalide un objectif Cabinet |
| Majeur | Retard ou surcoût significatif si non traité |
| Modéré | Contournement possible temporaire |
| Mineur | Optimisation ou nice-to-have |

<!-- pagebreak -->

## 2. Matrice détaillée — Bloc Technique & Architecture

| Ref | Exigence | Réalité | Verdict | Criticité | Implication |
|-----|----------|---------|---------|-----------|-------------|
| G-01 | Architecture microservices conteneurisée | Monolithes on-premise | À compléter | Majeur | Trajectoire progressive conteneurisation |
| G-02 | PostgreSQL + MongoDB | Bases hétérogènes | À ajuster | Modéré | Standardiser progressivement |
| G-03 | Interop UXP / X-Road | Aucune intégration | À compléter | **Critique** | Prérequis lot 2 |
| G-04 | IPv6 natif | IPv4 seul | À compléter | Mineur | Plan réseau long terme |
| G-05 | SSO + 2FA | Comptes locaux | À compléter | **Critique** | Lot 1 — sécurité |
| G-06 | PWA offline-first | Besoin confirmé terrain | Confirmé | Majeur | MVP validé |
| G-11 | Chiffrement AES-256 / TLS 1.3 | Partiel | À ajuster | Majeur | Politique sécurité |
| G-12 | 500+ users · SLA 99,9 % | Capacité limitée | À ajuster | Modéré | Dimensionnement marché |
| G-46 | RSSI / DPO distinct DSI | Entretiens S3 planifiés | À compléter | Majeur | Conformité RGPD |

<!-- pagebreak -->

## 3. Matrice détaillée — Données & Fonctionnel

| Ref | Exigence | Réalité | Verdict | Criticité | Implication |
|-----|----------|---------|---------|-----------|-------------|
| G-07 | Identifiant unique NNI | Absent inter-programmes | À compléter | **Critique** | Arbitrage Comité Strat. |
| G-08 | Intégration SIGFIP | Non raccordé | À compléter | **Critique** | Atelier DAF |
| G-09 | Drill-down Cabinet → bénéficiaire | Attente forte, data absente | Confirmé | **Critique** | Cœur MVP |
| G-10 | Traçabilité primes | Lacunes IG | Confirmé | **Critique** | Cœur MVP |
| G-13 | Module IA prédictif | Prématuré (C-10) | **Caduc** | — | Phase 3+ |
| G-14 | Volet B (RH, flotte, GED) | Dispersé, S3 à faire | À compléter | Majeur | Périmètre lot 2 |
| G-47 | Grille qualité données | Initialisée | À compléter | Majeur | DPSD owner |
| G-48 | Prog. vs non-prog. | 7 domaines renseignés | À compléter | Modéré | Validation Cabinet |
| G-49 | Chatbot NLP jeunes | Non demandé | **Caduc** | — | Retirer MVP |
| G-50 | Gamification portail | Non demandé | **Caduc** | — | Retirer MVP |

<!-- pagebreak -->

## 4. Synthèse par chapitre CDC

| Chapitre CDC | Exigences | Confirmées | À compléter | Caduc |
|--------------|-----------|------------|-------------|-------|
| § Tech. Architecture | 12 | 1 | 10 | 1 |
| § Interopérabilité | 8 | 0 | 8 | 0 |
| § Données | 10 | 2 | 8 | 0 |
| § Fonctionnel | 14 | 4 | 7 | 3 |
| § Sécurité | 6 | 1 | 5 | 0 |
| § Performance / IA | 5 | 0 | 3 | 2 |

<!-- pagebreak -->

## 5. Implications pour le MVP et le marché

### 5.1 Périmètre MVP recommandé (post-audit)

**Inclus lot 1 :**
- Consolidation indicateurs + drill-down (G-09) ;
- Traçabilité primes (G-10) ;
- SSO + RBAC (G-05) ;
- PWA offline saisie (G-06) ;
- Référentiel dispositifs + qualité data (G-47) ;
- Intégration pilote AEJ + DPSD.

**Reporté lot 2 :**
- SIGFIP, NNI, UXP (G-07, G-08, G-03) ;
- Volet B complet (G-14) ;
- Microservices full (G-01).

**Retiré MVP :**
- IA prédictive, chatbot, gamification (G-13, G-49, G-50).

### 5.2 Estimation effort de rattrapage écarts

| Vague | Écarts traités | Effort relatif | Horizon |
|-------|----------------|----------------|---------|
| Vague 0 — Prérequis | G-05, G-47, G-46 | 15 % budget | M0–M6 |
| Vague 1 — MVP | G-09, G-10, G-06 | 45 % budget | M6–M15 |
| Vague 2 — Intégrations | G-07, G-08, G-03 | 30 % budget | M12–M24 |
| Vague 3 — Optimisation | G-01, G-04, G-12 | 10 % budget | M24+ |

<!-- pagebreak -->

## 6. Arbitrages demandés au Comité Stratégique

| # | Question | Options | Recommandation Skydeen |
|---|----------|---------|----------------------|
| A1 | Clé bénéficiaire | NNI seul / NNI + clé interne | NNI + clé transition |
| A2 | Périmètre MVP | CDC strict / MVP allégé | MVP allégé (§5.1) |
| A3 | Auditeur X-Road | Oui / Non / Différé | Oui si blocage S3 |
| A4 | Hébergement | Cloud souverain / On-premise hybride | Hybride phase 1 |

## 7. Annexes

### Annexe A — Matrice complète G-01 à G-50

Export Excel disponible via cockpit → Matrice d'écart → Export.

### Annexe B — Traçabilité constats ↔ gaps

| Constat | Gaps associés |
|---------|---------------|
| C-01 Fragmentation SI | G-01, G-03 |
| C-02 Pas de NNI | G-07 |
| C-05 Pas UXP | G-03 |
| C-06 Primes | G-10 |
| C-10 MVP caduc | G-13, G-49, G-50 |

### Annexe C — Historique versions CDC

| Version | Date | Écarts nouveaux |
|---------|------|-----------------|
| v2.3 | 01/2026 | Référence audit |
| Additif BAD | 02/2026 | Reporting G-10 |
"""
