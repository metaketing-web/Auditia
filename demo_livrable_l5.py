"""Contenu L5 — Analyse des risques & recommandations (version démo ~10 pages)."""


def l5_risques() -> str:
    return r"""
<!-- pagebreak -->

# ANALYSE DES RISQUES & RECOMMANDATIONS

## Registre consolidé mission et solution — Préconisations priorisées et quick wins

| | |
|---|---|
| **Commanditaire** | MPJIPSC |
| **Prestataire** | Cabinet Skydeen |
| **Référence livrable** | L5 — Jalon J+25 |
| **Version** | 1.0 — Projet consolidé |
| **Date** | 17 avril 2026 (instantané J+25) |
| **Classification** | Confidentiel |

> **VERSION DÉMO** — Registre aligné sur le cockpit mission (RQ-01 à RQ-08) enrichi de risques solution.

<!-- pagebreak -->

## Synthèse exécutive

Le registre consolidé compte **18 risques** (8 mission + 10 solution), dont **4 critiques** et **6 élevés**. Trois risques restent **ouverts** sans mitigation suffisante : accès Data Room (RQ-02), X-Road (RQ-05), qualité data / IA (RQ-06).

**Recommandations prioritaires (Top 5) :**

1. **Arbitrer la stratégie NNI** avant lancement marché (RQ-07) ;
2. **Séquencer l'IA** après fiabilisation data (RQ-06, G-13) ;
3. **Formaliser relances Data Room** — désormais opérationnelles dans le cockpit ;
4. **Décider Auditeur X-Road** au COPIL #3 (RQ-05) ;
5. **Quick win tableau de bord** Cabinet sous 90 jours post-marché.

<!-- pagebreak -->

## 1. Méthodologie

### 1.1 Grille d'évaluation

| Paramètre | Échelle |
|-----------|---------|
| Probabilité | 1 (Faible) à 5 (Très élevée) |
| Impact | 1 (Négligeable) à 5 (Critique) |
| Score | P × I (max 25) |
| Niveau | Faible ≤4 · Moyen ≤8 · Élevé ≤12 · Critique >12 |

### 1.2 Typologie

| Catégorie | Description |
|-----------|-------------|
| **Mission** | Risques liés à la conduite de l'audit |
| **Solution** | Risques liés au déploiement PNIPM |
| **Organisationnel** | Gouvernance, adoption, conduite du changement |
| **Externe** | Bailleurs, ANRMP, ADETIC |

<!-- pagebreak -->

## 2. Registre des risques mission

| Ref | Risque | P | I | Score | Statut | Mitigation | Owner |
|-----|--------|---|---|-------|--------|------------|-------|
| RQ-01 | Indisponibilité interlocuteurs clés | 3 | 3 | 9 | Surveillé | COPIL hebdo, relais | Secrétariat |
| RQ-02 | Versement incomplet Data Room | 3 | 4 | **12** | **Ouvert** | Checklists A-F, relances formalisées, escalade | DPA |
| RQ-03 | Accès données sensibles différé | 2 | 3 | 6 | Surveillé | Protocole DPO graduel | DPO |
| RQ-04 | Délai 4 semaines accéléré | 3 | 3 | 9 | Maîtrisé | Agenda serré, 2 auditeurs | DM Skydeen |

<!-- pagebreak -->

## 3. Registre des risques solution

| Ref | Risque | P | I | Score | Statut | Mitigation | Owner |
|-----|--------|---|---|-------|--------|------------|-------|
| RQ-05 | X-Road non documenté | 3 | 4 | **12** | **Ouvert** | Auditeur X-Road additionnel | COPIL |
| RQ-06 | Qualité data insuffisante pour IA | 4 | 3 | **12** | **Ouvert** | Séquencer IA phase 3 | DPSD |
| RQ-07 | Doublons bénéficiaires | 3 | 4 | **12** | **Ouvert** | Stratégie NNI + dédup | DAJIP |
| RQ-08 | Résistance changement terrain | 2 | 3 | 6 | Surveillé | Quick wins, formation | DRH |
| RS-01 | Dérive périmètre CDC | 3 | 4 | 12 | Surveillé | Matrice L4, comité change | CT PNIPM |
| RS-02 | Intégrateur sans expérience interop | 2 | 4 | 8 | Surveillé | Critères marché renforcés | DMP |
| RS-03 | Surcharge DSI | 4 | 3 | 12 | Ouvert | Cellule projet dédiée | DSI |
| RS-04 | Non-conformité RGPD | 2 | 5 | 10 | Surveillé | DPO, DPIA | DPO |
| RS-05 | Connectivité régions | 3 | 3 | 9 | Surveillé | PWA offline (G-06) | DSI |
| RS-06 | Dépendance prestataire unique | 2 | 4 | 8 | Surveillé | Transfert compétences | DSI |

<!-- pagebreak -->

## 4. Recommandations priorisées

### 4.1 Recommandations stratégiques (R-STR)

| ID | Recommandation | Priorité | Horizon | Effort |
|----|----------------|----------|---------|--------|
| R-STR-01 | Adopter un MVP allégé (cf. L4 §5.1) | P0 | Immédiat | Faible |
| R-STR-02 | Créer une Cellule PNIPM (MOA + MOE + DPSD) | P0 | M0 | Moyen |
| R-STR-03 | Arbitrer NNI comme clé bénéficiaire | P0 | M0 | Faible |
| R-STR-04 | Lancer protocole accès NNI / SIGFIP | P0 | M0–M3 | Élevé |
| R-STR-05 | Réviser CDC — retirer exigences caduc | P1 | M1 | Moyen |

### 4.2 Recommandations opérationnelles (R-OPE)

| ID | Recommandation | Priorité | Owner |
|----|----------------|----------|-------|
| R-OPE-01 | Finaliser référentiel dispositifs | P0 | DAJIP |
| R-OPE-02 | Grille qualité data sur 10 sources | P0 | DPSD |
| R-OPE-03 | Pilote SSO sur 2 applications | P1 | DSI |
| R-OPE-04 | Procédure relances Data Room (cockpit) | P1 | Secrétariat |
| R-OPE-05 | Charte gouvernance data (RACI) | P1 | DPO |

### 4.3 Recommandations marché (R-MAR)

| ID | Recommandation | Détail |
|----|----------------|--------|
| R-MAR-01 | Lots séquencés | Lot 1 socle + MVP, Lot 2 intégrations |
| R-MAR-02 | Critères interop | Expérience X-Road / API Gateway obligatoire |
| R-MAR-03 | SLAs progressifs | 99,5 % phase 1 → 99,9 % phase 3 |
| R-MAR-04 | Réversibilité | Clauses exit + documentation |

<!-- pagebreak -->

## 5. Quick wins (0–6 mois post-marché)

| # | Quick win | Impact | Effort | KPI succès |
|---|-----------|--------|--------|------------|
| QW-01 | Tableau de bord Cabinet (indicateurs existants) | Très élevé | M | 5 KPI live J+90 |
| QW-02 | Portail unique Data Room / GED | Moyen | F | 80 % docs centralisés |
| QW-03 | SSO pilote AEJ + DPSD | Moyen | M | -50 % comptes locaux |
| QW-04 | Règles dédup provisoires | Élevé | M | -15 % doublons échantillon |
| QW-05 | Workflow relances documentaires | Moyen | F | 100 % relances tracées |
| QW-06 | Formation agents DR (PWA) | Élevé | M | 200 agents formés S4 |

<!-- pagebreak -->

## 6. Plan de mitigation consolidé

| Risque | Action | Échéance | Statut |
|--------|--------|----------|--------|
| RQ-02 | Relances automatisées cockpit | Opérationnel | Fait |
| RQ-05 | Décision Auditeur X-Road COPIL #3 | 10/04 | En cours |
| RQ-06 | Roadmap IA phase 3 | L6 | Planifié |
| RQ-07 | Atelier NNI + DAJIP | 06/04 Comité | Arbitré |
| RS-03 | Renfort DSI (2 ETP projet) | M0 | Proposé |

## 7. Annexes

### Annexe A — Heatmap risques (description)

- **Quadrant critique (P≥3, I≥4) :** RQ-02, RQ-05, RQ-06, RQ-07, RS-01, RS-03
- **Quadrant surveillé :** RQ-01, RQ-08, RS-04, RS-05

### Annexe B — Lien risques / constats / gaps

| Risque | Constat | Gap |
|--------|---------|-----|
| RQ-07 | C-02, C-03 | G-07 |
| RQ-06 | C-10 | G-13 |
| RQ-05 | C-05 | G-03 |

### Annexe C — Validation COPIL #4

Revue registre et quick wins — 17 avril 2026 (planifié).
"""
