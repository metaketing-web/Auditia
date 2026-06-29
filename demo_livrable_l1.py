"""Contenu L1 — Note de cadrage validée (version démo ~10 pages)."""


def l1_note_cadrage() -> str:
    return r"""
<!-- pagebreak -->

# NOTE DE CADRAGE VALIDÉE

## Audit de cadrage stratégique — Plateforme Numérique Intégrée de Pilotage Ministériel (PNIPM)

| | |
|---|---|
| **Commanditaire** | Ministère de la Promotion de la Jeunesse, de l'Insertion Professionnelle et du Service Civique (MPJIPSC) |
| **Prestataire** | Cabinet Skydeen — Mission d'audit et de conseil |
| **Référence** | AO-MPJIPSC-PNIPM-2026 / LC-2026-014 |
| **Version** | 1.0 — Document validé |
| **Date de validation** | 22 mars 2026 |
| **Classification** | Confidentiel — Usage interne MPJIPSC / Skydeen |
| **J0 mission** | 23 mars 2026 |
| **Durée** | 30 jours ouvrés (4 semaines) |

> **VERSION DÉMO** — Document généré en simulation. Le contenu est réaliste et structuré comme un livrable de cabinet d'audit (Big Four) ; il illustre le niveau attendu du L1, sans valeur de validation officielle.

<!-- pagebreak -->

## Synthèse exécutive

Le Ministère de la Promotion de la Jeunesse, de l'Insertion Professionnelle et du Service Civique (MPJIPSC) s'apprête à lancer la Plateforme Numérique Intégrée de Pilotage Ministériel (PNIPM), outil stratégique visant à doter le Cabinet d'une vision consolidée de l'action ministérielle, depuis les orientations politiques jusqu'au suivi individualisé des bénéficiaires des dispositifs publics.

Avant tout lancement d'un marché de développement, le ministère a retenu le cabinet Skydeen pour conduire une **mission de cadrage stratégique** sur **30 jours**, fondée sur une approche d'audit structurée en **trois axes** (Politique, Programmatique, Technique) et une **triangulation systématique** des sources (Déclaratif, Documenté, Observé).

Les premiers travaux (Semaine 1) confirment un **écart structurel** entre la vision cible portée par le cahier des charges et la réalité opérationnelle observée :

- Fragmentation du système d'information (14 applications métier, absence de bus d'échange) ;
- Absence d'identifiant unique bénéficiaire partagé entre programmes ;
- Reporting bailleur et consolidation Cabinet encore largement manuels ;
- Prérequis d'interopérabilité (NNI, SIGFIP, UXP/X-Road) non opérationnels ;
- Gouvernance des données et sécurité (SSO, audit trail) immatures.

La présente note de cadrage fixe le **périmètre**, la **méthodologie**, la **gouvernance**, l'**agenda**, les **livrables** et les **engagements réciproques** de la mission. Elle constitue le document de référence validé par le COPIL de lancement et sert de base contractuelle pour l'exécution des quatre semaines de mission.

**Décision actée :** le COPIL de lancement du 22 mars 2026 valide la note de cadrage et autorise le démarrage opérationnel au J0 (23 mars 2026).

<!-- pagebreak -->

## 1. Contexte et enjeux stratégiques

### 1.1 Contexte institutionnel

Le MPJIPSC occupe une place centrale dans la mise en œuvre du Programme Jeunesse Gouvernement (PJGOUV 2026-2030), qui vise la création de **4 millions d'emplois** et le renforcement de l'insertion professionnelle des jeunes. Le ministère coordonne un écosystème complexe :

- **Directions centrales** (DAJIP, DPSD, DSI, DAF, DRH, DAJC, etc.) ;
- **Structures sous tutelle** (AEJ, OSCN, BCP-Emploi) ;
- **12 programmes et dispositifs** financés par des bailleurs internationaux ;
- **Directions régionales** et antennes déconcentrées sur l'ensemble du territoire.

Chaque entité dispose de sa propre logique de gestion, de ses outils de suivi et de ses obligations de reporting. Cette autonomie, légitime sur le plan opérationnel, génère aujourd'hui une **fragmentation informationnelle** qui limite la capacité du Cabinet à arbitrer en temps réel.

### 1.2 Enjeux identifiés au lancement

| Enjeu | Description | Impact si non traité |
|-------|-------------|---------------------|
| **Consolidation Cabinet** | Vision transversale programmatique et budgétaire | Arbitrages retardés, décisions sur bases partielles |
| **Redevabilité bailleurs** | Reporting trimestriel multi-formats | Risque réputationnel et contractual |
| **Traçabilité des primes** | Suivi individuel des paiements (stages, THIMO, formations) | Signalements IG, contentieux potentiels |
| **Identité bénéficiaire** | Déduplication inter-programmes | Double comptage, fraudes, indicateurs faussés |
| **Interopérabilité SI** | Raccordements NNI, SIGFIP, UXP | Coûts de reprise, délais de déploiement |
| **Données de qualité** | Référentiels, normalisation territoriale | Drill-down impossible, KPI non fiables |

### 1.3 Commande politique

L'entretien d'ouverture avec le Directeur de Cabinet (J0, 23/03/2026) confirme la commande centrale :

> « Doter le Cabinet d'une lecture consolidée permettant l'arbitrage — avec un drill-down jusqu'au bénéficiaire et une traçabilité des primes exigée par les bailleurs. »

Le Conseiller Technique référent PNIPM (sponsor politique) a remis la note de cadrage interne ministérielle (Data Room R2) et validé une approche **graduelle d'accès aux données sensibles**, sous contrôle du DPO et du COPIL.

### 1.4 État des lieux préliminaire (instantané J+2)

Sur la base des huit premiers entretiens réalisés et des pièces versées en Data Room :

| Domaine | Constat préliminaire | Source |
|---------|---------------------|--------|
| SI ministériel | Infrastructure on-premise, pas de SSO, pas de X-Road actif | Entretien DSI — démo observée |
| Données | Pas de référentiel commun ; échantillon DPSD ≈ 600 lignes, qualité hétérogène | Entretien DPSD — pièce R3 |
| Programmes | Doublons bénéficiaires probables inter-programmes | Entretiens Cabinet, DAJIP |
| Reporting | Consolidation manuelle Excel + e-mail | Entretiens Cabinet |
| Sécurité | Audit trail partiel ; pas de journalisation centralisée | Entretien IG, DSI |

Ces éléments ne préjugent pas des conclusions finales ; ils justifient le cadrage méthodologique retenu.

<!-- pagebreak -->

## 2. Objets et finalités de la mission

### 2.1 Objectif général

Fournir au MPJIPSC un **diagnostic indépendant, structuré et actionnable** de la situation actuelle (politique, programmatique, technique, données, SI) et des **conditions de réussite** du déploiement de la PNIPM, afin de sécuriser les arbitrages avant lancement du marché de développement.

### 2.2 Objectifs spécifiques

1. **Qualifier les besoins** métier, data et SI par axe, en s'appuyant sur une collecte triangulée (48 entretiens, Data Room, terrain).
2. **Cartographier l'écosystème** des structures, flux de données, intégrations et référentiels existants ou manquants.
3. **Confronter systématiquement** les exigences du cahier des charges (G-01 à G-48) à la réalité observée (matrice d'écarts).
4. **Identifier et prioriser** les risques mission et solution, ainsi que les recommandations et quick wins.
5. **Proposer une feuille de route** séquencée, avec prérequis bloquants, jalons et conditions de gouvernance.
6. **Restituer au Comité Stratégique** une synthèse exécutive permettant la décision de lancement.

### 2.3 Questions de cadrage auxquelles la mission répond

| N° | Question de cadrage | Livrable associé |
|----|---------------------|------------------|
| Q1 | Le périmètre fonctionnel du CDC est-il réaliste et priorisable ? | L4 — Matrice écarts |
| Q2 | Quels prérequis data/SI doivent être levés avant le lot 1 ? | L3, L6 |
| Q3 | Quelle trajectoire de déploiement est soutenable par l'organisation ? | L6 — Feuille de route |
| Q4 | Quels risques majeurs menacent la réussite ? | L5 — Risques |
| Q5 | Quelles décisions le Cabinet doit-il arbitrer en priorité ? | L7 — Rapport final |

<!-- pagebreak -->

## 3. Périmètre de la mission

### 3.1 Périmètre inclus

#### Axe Politique

- Attentes du Cabinet et sponsors PNIPM ;
- Niveaux de drill-down requis (structure → programme → bénéficiaire) ;
- Exigences de redevabilité bailleurs et traçabilité des primes ;
- Arbitrages attendus et format des restitutions.

#### Axe Programmatique

- Cartographie des 12 dispositifs (AEJ, PEJEDEC, PACE, OSCN, USEP, PSIE, PNBV, Carte Jeunes, BCP-Emploi, C2D-EMPLOI, UGP-CSC, etc.) ;
- Parcours bénéficiaire, continuité inter-programmes, risques de doublons ;
- Indicateurs de performance et logiques de reporting ;
- Volet B (RH, patrimoine/flotte, marchés, GED) — interfaces avec la PNIPM.

#### Axe Technique

- Architecture SI, hébergement, réseau, connectivité régionale ;
- Intégrations : SIGFIP, UXP/X-Road, NNI, bus/API ;
- Sécurité : SSO, habilitations, RSSI/DPO, audit trail ;
- Qualité et gouvernance des données (référentiels, dictionnaire, normalisation territoriale).

#### Moyens de collecte

- **48 entretiens** structurés (grilles investigation / confrontation / co-construction) ;
- **Checklists Data Room** A à F + checklist technique CDC (G-01 à G-48) ;
- **Démonstrations terrain** S4 (Abidjan, Centre, Nord) ;
- **Analyse documentaire** continue (Data Room R1 à R7).

### 3.2 Périmètre exclu

| Réf. | Exclusion | Justification | Décision |
|------|-----------|---------------|----------|
| HP-01 | Développement / paramétrage de la PNIPM | Marché ultérieur distinct | Confirmé — lancement |
| HP-02 | Audit financier et comptable des programmes | Mandat cadrage org/data/SI | Confirmé — lancement |
| HP-03 | Refonte SI interne des tutelles (AEJ, OSCN) | Seules les interfaces PNIPM sont étudiées | Confirmé — lancement |
| — | Pentest, tests de charge exhaustifs | Hors mandat ; préconisations en L5 | Acté COPIL |

### 3.3 Limites de la mission

- La mission ne se substitue pas à une **due diligence technique** du futur intégrateur ;
- Les conclusions sont fondées sur les **éléments disponibles** dans le délai de 30 jours ;
- Les chiffres d'affluence, volumes exacts de bénéficiaires et coûts de déploiement ne seront produits qu'en **L8 (annexe chiffrage)** si demandé ;
- Toute information non vérifiée reste explicitement signalée comme **point à investiguer**.

<!-- pagebreak -->

## 4. Méthodologie d'audit et de conseil

### 4.1 Référentiel méthodologique

Skydeen applique une méthodologie inspirée des standards des cabinets d'audit et de conseil (ISACA, IIA, bonnes pratiques Big Four) adaptée au contexte ministériel ivoirien :

- **Planification** basée sur les risques ;
- **Collecte** multi-canal (entretiens, documents, observation) ;
- **Analyse** par axes et triangulation ;
- **Confrontation** CDC vs réalité ;
- **Restitution** graduée (COPIL hebdo, Comité Stratégique, rapport final).

### 4.2 Triangulation systématique

Chaque constat structurant (réf. C-xxx) est documenté selon trois piliers :

| Pilier | Description | Exemples de preuves |
|--------|-------------|---------------------|
| **Déclaratif** | Propos recueillis en entretien | CR entretien DSI, Cabinet |
| **Documenté** | Pièces Data Room, conventions, procédures | Checklist C, note R2, échantillon R3 |
| **Observé** | Démos, captures, constats directs | Captures R7, démo DR Abidjan |

En l'absence d'un pilier, le constat reste en statut **« à confirmer »** et figure au registre des points ouverts.

### 4.3 Qualification des sources

| Qualification | Définition | Traitement |
|---------------|------------|------------|
| Confirmé | Triple preuve ou double preuve convergente | Intégré aux conclusions |
| Observé | Preuve directe (démo, pièce) sans contradiction | Intégré avec réserve si partiel |
| Déclaratif | Propos unique non contredit | Signalé comme tel |
| Contredit | Sources divergentes | Entretien complémentaire sous 48 h |
| À vérifier | Information incomplète | Point ouvert + plan de collecte |

### 4.4 Grille d'analyse par axe

| Axe | Questions types | Outils |
|-----|-----------------|--------|
| Politique | Que doit voir le Cabinet ? Quels arbitrages ? | Trame cabinet, entretiens S1 |
| Programmatique | Comment circulent les données entre programmes ? | Trames tutelle/programme, S2 |
| Technique | Le SI peut-il supporter la cible CDC ? | Trames DSI/RSSI/technique, S3-S4 |

### 4.5 Matrice CDC (aperçu)

La confrontation systématique porte sur **48 exigences techniques** (G-01 à G-48) du cahier des charges. Verdicts possibles : Confirmé, À ajuster, À compléter, Caduc. Livrable consolidé : **L4**.

<!-- pagebreak -->

## 5. Organisation, gouvernance et équipe

### 5.1 Instances de gouvernance

| Instance | Présidence | Membres clés | Rôle | Fréquence |
|----------|------------|--------------|------|-----------|
| **Comité Stratégique** | Directeur de Cabinet | Sponsors, DAF, DSI, CT PNIPM | Arbitrage majeur, validation finale | J+14, J+30 |
| **COPIL opérationnel** | CT référent PNIPM | Référents data/SI/prog., Skydeen | Pilotage, validation livrables | Hebdomadaire (vendredi) |
| **Équipe mission Skydeen** | Directeur de mission | Auditeurs B+T, analyste data | Production, analyse | Continu |
| **Secrétariat COPIL** | Chargé d'études PNIPM | — | Convocations, PV, actions | Continu |

### 5.2 Référents MPJIPSC

| Rôle | Nom (démo) | Structure | Responsabilités mission |
|------|------------|-----------|-------------------------|
| Sponsor politique | M. Koné A. | Cabinet / CT PNIPM | Arbitrages, escalade |
| Référent données | Mme Traoré F. | DPSD | Référentiels, indicateurs, qualité |
| Référent SI | M. Diabaté S. | DSI | Architecture, démos, intégrations |
| Référent sécurité | M. Ouattara K. | RSSI | SSO, audit trail, conformité |
| DPO | Mme Koné B. | DSI / DPO | Accès NNI, RGPD, protocoles |
| Référent programmatique | M. Bamba L. | AEJ | Base bénéficiaires, parcours |
| Point focal NNI | Mme Coulibaly A. | Cellule NNI | API identité nationale |
| Point focal SIGFIP | M. Yao P. | DAF | Exécution budgétaire |

### 5.3 Équipe Skydeen

| Rôle | Profil | Affectation |
|------|--------|-------------|
| Directeur de mission | Partner — Secteur public | Supervision, restitution Comité Stratégique |
| Manager | Senior manager — Data & SI | Coordination, L3, L4, L6 |
| Auditeur B | Manager — Programmatique | Entretiens S2, L2 |
| Auditeur T | Consultant — Technique | Entretiens S3-S4, L4, L5 |
| Analyste data | Consultant | Qualité données, échantillons DPSD |

### 5.4 Matrice RACI (extrait)

| Activité | MPJIPSC | Skydeen | COPIL | Comité Strat. |
|----------|---------|--------|-------|---------------|
| Alimentation Data Room | R/A | C | I | I |
| Entretiens | C | R/A | I | — |
| Production livrables | I | R/A | C | I |
| Validation livrables | C | R | A | I |
| Arbitrages majeurs | C | R | C | A |

*R = Responsible, A = Accountable, C = Consulted, I = Informed*

### 5.5 Charte COPIL

Signée le 22 mars 2026. Pièce : `charte-copil-signee.pdf` (Data Room R1). La charte formalise les engagements réciproques, les règles de confidentialité et le processus de validation des livrables.

<!-- pagebreak -->

## 6. Planning, jalons et instances

### 6.1 Vue d'ensemble (30 jours)

| Phase | Semaine | Dates | Objectif principal |
|-------|---------|-------|-------------------|
| Cadrage stratégique | S1 | 23–27 mars | Commande politique, directions centrales, L1 |
| Deep-dive programmatique | S2 | 30 mars – 3 avril | Programmes, bailleurs, L2 |
| Volet B & intégrations | S3 | 6–10 avril | Transverses, SIGFIP/NNI/UXP, L3-L4 |
| Terrain régional | S4 | 13–17 avril | DR, focus groups, L5-L6 |
| Clôture | — | 20–22 avril | Remise L7, restitution |

### 6.2 Calendrier des instances

| Date | Instance | Objectif |
|------|----------|----------|
| 22/03/2026 | Réunion de lancement | Charte COPIL, validation L1, agenda |
| 27/03/2026 | COPIL #1 | Bilan S1, plan S2, accès Data Room |
| 03/04/2026 | COPIL #2 | Constats programmatiques, NNI |
| 06/04/2026 | Comité Stratégique | Mi-parcours, arbitrage identité bénéficiaire |
| 10/04/2026 | COPIL #3 | Matrice écarts, cartographie flux |
| 17/04/2026 | COPIL #4 | Risques, feuille de route |
| 20/04/2026 | Remise rapport | Livraison L1–L7 |
| 22/04/2026 | Restitution finale | Présentation Comité Stratégique |

### 6.3 Jalons livrables

| Jalon | Date cible | Livrable | Critère d'acceptation |
|-------|------------|----------|----------------------|
| J+0 | 22/03 | L1 validé | COPIL — présent document |
| J+14 | 06/04 | L2 ≥ 70 % | Diagnostic triangulé par axe |
| J+18 | 10/04 | L3, L4 | Cartographie + matrice G-01–G-48 |
| J+25 | 17/04 | L5, L6 | Risques priorisés + feuille de route |
| J+30 | 22/04 | L7 validé | Restitution Comité Stratégique |

<!-- pagebreak -->

## 7. Livrables contractuels

| Ref | Titre | Description | Format | Pages cible |
|-----|-------|-------------|--------|-------------|
| L1 | Note de cadrage validée | Périmètre, méthode, gouvernance, engagements | Word/PDF | 10–15 |
| L2 | Inventaire des besoins qualifiés | Diagnostic triangulé P/G/T | Word/PDF | 25–35 |
| L3 | Cartographie données & systèmes | Écosystème, flux, intégrations | Word + schémas | 20–30 |
| L4 | Matrice écarts CDC / réalité | G-01 à G-48, verdicts, implications | Word/Excel | 15–25 |
| L5 | Analyse risques & recommandations | Registre risques, quick wins | Word/PDF | 15–20 |
| L6 | Feuille de route déploiement | Trajectoire, prérequis, jalons | Word/PDF | 12–18 |
| L7 | Rapport final & restitution | Synthèse exécutive, conclusions | Word/PDF + slides | 20–30 + 25 slides |

## 8. Engagements réciproques

### 8.1 Engagements Skydeen

1. Produire une analyse **indépendante, factuelle et prudente** ;
2. Appliquer la triangulation et documenter les sources ;
3. Signaler sous **24 h** tout blocage nécessitant arbitrage ;
4. Respecter la confidentialité et le protocole d'accès aux données sensibles ;
5. Participer aux COPIL et préparer les supports de restitution ;
6. Maintenir le cockpit mission à jour (avancement, constats, risques).

### 8.2 Engagements MPJIPSC

1. Désigner les référents et assurer leur **disponibilité** ;
2. Alimenter la Data Room sous **72 h** après relance ;
3. Faciliter l'accès graduel NNI / SIGFIP selon protocole DPO ;
4. Valider ou commenter chaque livrable sous **5 jours ouvrés** ;
5. Participer aux COPIL et au Comité Stratégique ;
6. Communiquer sans délai tout changement de périmètre ou calendrier.

### 8.3 Liste de pièces prioritaires (S1)

| Lot | Référent | Document | Échéance | Statut démo |
|-----|----------|----------|----------|-------------|
| Gouvernance | Cabinet | Charte COPIL signée | J-1 | Reçu |
| Politique | CT PNIPM | Note cadrage interne | J0 | Reçu |
| Données | DPSD | Référentiel indicateurs + échantillon | J+2 | Reçu |
| SI | DSI | Cartographie applicative, schéma réseau | J+1 | Reçu |
| Identité | NNI | Modalités accès API | J+3 | Reçu |
| Bénéficiaires | AEJ | Extrait base anonymisée, règles dédup | J+5 | En cours |
| Bailleurs | DAF | Conventions PEJEDEC, PACE, USEP | J-1 | Reçu |
| Juridique | DAJC | Clauses protection données | J+4 | Reçu |

<!-- pagebreak -->

## 9. Registre des risques mission (extrait)

| Id | Risque | Prob. | Impact | Niveau | Mitigation | Owner |
|----|--------|-------|--------|--------|------------|-------|
| R-M01 | Retard accès NNI | M | É | **Élevé** | Protocole DPO, escalade sponsor J+3 | DPO / Skydeen |
| R-M02 | Indisponibilité terrain S4 | M | M | Moyen | Plan B visio + captures | DR / Skydeen |
| R-M03 | Divergence CDC / additifs bailleurs | M | M | Moyen | Matrice L4 sourcée | Manager Skydeen |
| R-M04 | Résistance partage données tutelles | F | É | Moyen | COPIL + cadre juridique DAJC | Sponsor |
| R-M05 | Surcharge équipe référents | É | M | Moyen | Priorisation COPIL, relances ciblées | Secrétariat COPIL |
| R-M06 | Qualité insuffisante échantillons data | M | É | **Élevé** | Grille qualité DPSD, compléments S2 | DPSD |

## 10. Hypothèses, déontologie et acceptation

### 10.1 Hypothèses de travail

- Les interlocuteurs désignés sont habilités à s'exprimer au nom de leur structure ;
- La Data Room sera alimentée de façon continue ;
- Aucune modification majeure du CDC ne sera opérée en cours de mission sans notification ;
- Le calendrier de 30 jours est maintenu sauf décision Comité Stratégique.

### 10.2 Déontologie et indépendance

Skydeen confirme son **indépendance** vis-à-vis des futurs intégrateurs et éditeurs candidats au marché PNIPM. La mission est conduite exclusivement dans l'intérêt du MPJIPSC. Les données collectées ne seront pas réutilisées à d'autres fins.

### 10.3 Acceptation

La validation de la présente note de cadrage vaut acceptation du périmètre, de la méthodologie, du planning et des engagements réciproques.

<!-- pagebreak -->

## Annexes

### Annexe A — Plan d'entretiens S1 (extrait)

| Date | Heure | Interlocuteur | Structure | Trame | Statut |
|------|-------|---------------|-----------|-------|--------|
| 23/03 | 09:30 | Directeur de Cabinet | Cabinet | cabinet | Réalisé |
| 23/03 | 11:30 | DC Adjoint + Chef de Cabinet | Cabinet | cabinet | Réalisé |
| 23/03 | 14:30 | CT référent PNIPM | Cabinet | cabinet | Réalisé |
| 23/03 | 16:30 | Chargé d'études PNIPM | Cabinet | cabinet | Réalisé |
| 24/03 | 09:30 | Directeur DSI | DSI | dsi | Réalisé |
| 24/03 | 14:00 | Directeur DAJIP | DAJIP | direction | Réalisé |
| 24/03 | 16:30 | Inspecteur Général | IG | direction | Réalisé |
| 25/03 | 09:30 | Directeur DPSD | DPSD | direction | Réalisé |
| 25/03 | 11:30 | Directeur DVA | DVA | direction | Planifié |
| 25/03 | 14:30 | Directeur DCEC | DCEC | direction | Planifié |
| 26/03 | 09:30 | Directeur DISE | DISE | direction | Planifié |
| 27/03 | 11:30 | Directeur DCRP | DCRP | direction | Planifié |

*Plan complet : 48 entretiens S1 à S4 — voir cockpit mission et backup papier.*

### Annexe B — Décisions actées au lancement

1. Périmètre HP-01 à HP-03 confirmé ;
2. Méthode trois axes + triangulation adoptée ;
3. Agenda 4 semaines validé ;
4. Accès cockpit Skydeen ouvert aux référents (lecture) ;
5. L1 validé — démarrage J0 autorisé.

### Annexe C — Signatures

| Pour le MPJIPSC | Pour Skydeen |
|-----------------|-------------|
| M. Diallo M. — Directeur de Cabinet | Mme Laurent P. — Directeur de mission |
| Date : 22 mars 2026 | Date : 22 mars 2026 |
| Signature : [simulation démo] | Signature : [simulation démo] |

---

*Document L1 — Version démo 2.0 — Cabinet Skydeen — Confidentiel*
"""
