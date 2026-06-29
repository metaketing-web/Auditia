/**
 * Questionnaires complets structurés — tous types d'entretiens (S1 à S4).
 * Remplace les trames « liste de questions » par grilles 3 phases (invest / confront / coconstruct).
 */
(function () {
  "use strict";

  const Q = (id, q, hint) => ({ id, q, hint: hint || "" });
  const SEC = (title, items) => ({ title, items });

  const TRAMES_COMPLETS = {
    cabinet: {
      label: "Cabinet — Vision, commande politique & pilotage",
      dur: "75-90 min",
      phases: {
        invest: {
          duration: "40-50 min",
          sections: [
            SEC("A. Commande politique & priorités", [
              Q("cab_i_a1", "Quelle est la commande politique réelle derrière la PNIPM ? Quel problème prioritaire doit-elle résoudre ?"),
              Q("cab_i_a2", "Qui sont les sponsors et les points de friction politiques autour du projet ?"),
              Q("cab_i_a3", "Quels engagements PJGOUV 2026-2030 et bailleurs conditionnent le calendrier ?"),
              Q("cab_i_a4", "Quelles décisions récentes auraient été facilitées par une vision consolidée ?"),
            ]),
            SEC("B. Pilotage & indicateurs", [
              Q("cab_i_b1", "Qu'attendez-vous concrètement du Cabinet en matière de pilotage et drill-down ?"),
              Q("cab_i_b2", "Quels indicateurs stratégiques suivez-vous aujourd'hui, avec quelle fréquence et quelle source ?"),
              Q("cab_i_b3", "Comment circule l'information de reporting entre structures et Cabinet ?"),
              Q("cab_i_b4", "Quelles fonctionnalités du MVP vous paraissent caduques ou prioritaires ?"),
            ]),
            SEC("C. Fragmentation & gouvernance", [
              Q("cab_i_c1", "Quel niveau d'autonomie des directions et tutelles complique la consolidation ?"),
              Q("cab_i_c2", "Comment arbitrez-vous programmatique vs non-programmatique aujourd'hui ?"),
              Q("cab_i_c3", "Quels COPIL et instances de décision doivent être reproduits dans la plateforme ?"),
            ]),
          ],
        },
        confront: {
          duration: "15-20 min",
          sections: [
            SEC("Confrontation CDC / attentes Cabinet", [
              Q("cab_c_1", "Le CDC prévoit un accès 360° jusqu'au bénéficiaire — est-ce réaliste et souhaité ?"),
              Q("cab_c_2", "La traçabilité des primes au niveau individuel est-elle un attendu ferme ?"),
              Q("cab_c_3", "Comment arbitrez-vous ambition fonctionnelle vs délai accéléré (réf. 25/03) ?"),
            ]),
          ],
        },
        coconstruct: {
          duration: "10-15 min",
          sections: [
            SEC("Co-construction", [
              Q("cab_cc_1", "Quels 2-3 quick wins à fort signal politique pour les 8 premières semaines ?"),
              Q("cab_cc_2", "Quelles conditions de réussite côté gouvernance (COPIL, charte, sponsors) ?"),
              Q("cab_cc_3", "Qui doit être impérativement associé à la phase de construction ?"),
              Q("cab_cc_4", "Quelles pièces Data Room (R1, R2) manquent pour trancher ?"),
            ]),
          ],
        },
      },
    },

    dsi: {
      label: "DSI — Architecture SI, intégrations & sécurité",
      dur: "120 min",
      phases: {
        invest: {
          duration: "55-65 min",
          sections: [
            SEC("A. Architecture & applicatifs", [
              Q("dsi_i_a1", "Décrivez l'architecture SI : applications, hébergement, monolithe vs distribué."),
              Q("dsi_i_a2", "Quels projets SI en cours ou planifiés (budget, échéance, prestataire) ?"),
              Q("dsi_i_a3", "Cartographie applicative à jour ? Pièce versée en R7 ?"),
              Q("dsi_i_a4", "Démonstration écran possible aujourd'hui (parcours type bénéficiaire) ?"),
            ]),
            SEC("B. Réseau, hébergement & continuité", [
              Q("dsi_i_b1", "État IPv4/IPv6, connectivité régions, contraintes hébergeur."),
              Q("dsi_i_b2", "Sauvegardes, PRA/PCA : périmètre, RPO/RTO, dernier test ?"),
              Q("dsi_i_b3", "Incidents majeurs 12 derniers mois et résolution ?"),
            ]),
            SEC("C. Intégrations & interopérabilité", [
              Q("dsi_i_c1", "État SIGFIP, UXP/X-Road, NNI : raccordements, habilitations, documentation."),
              Q("dsi_i_c2", "Bus d'échange, ESB, API existantes — inventaire et propriétaire ?"),
              Q("dsi_i_c3", "Échanges point à point vs référentiel commun — constats ?"),
            ]),
            SEC("D. Identité, accès & journalisation", [
              Q("dsi_i_d1", "SSO, 2FA, gestion des habilitations — état et cible ?"),
              Q("dsi_i_d2", "Audit trail : quelles apps, rétention, exploitation ?"),
              Q("dsi_i_d3", "Séparation rôles exploitation / sécurité / métier ?"),
            ]),
          ],
        },
        confront: {
          duration: "15-20 min",
          sections: [
            SEC("Écarts CDC technique", [
              Q("dsi_c_1", "500+ utilisateurs simultanés et SLA 99,9 % — capacité actuelle mesurée ?"),
              Q("dsi_c_2", "Raccordement UXP/X-Road réaliste dans le délai mission ?"),
              Q("dsi_c_3", "Architecture microservices soutenable par l'exploitation actuelle ?"),
            ]),
          ],
        },
        coconstruct: {
          duration: "10-15 min",
          sections: [
            SEC("Trajectoire technique", [
              Q("dsi_cc_1", "Cloud national, on-premise ou hybride — préférence et justification ?"),
              Q("dsi_cc_2", "Trajectoire sécurisation (ISO 27001, ANSSI) recommandée ?"),
              Q("dsi_cc_3", "Prérequis techniques bloquants avant lot 1 ?"),
              Q("dsi_cc_4", "Référents techniques pour ateliers d'architecture (noms, délais) ?"),
            ]),
          ],
        },
      },
    },

    rssi: {
      label: "RSSI — Sécurité des systèmes d'information",
      dur: "90 min",
      phases: {
        invest: {
          duration: "45-50 min",
          sections: [
            SEC("Gouvernance sécurité", [
              Q("rssi_i_1", "Mandat RSSI, rattachement, moyens (équipe, budget) ?"),
              Q("rssi_i_2", "Politique de sécurité SI : date, couverture, application réelle ?"),
              Q("rssi_i_3", "Registre incidents : volume, gravité, remontée Cabinet ?"),
              Q("rssi_i_4", "Audits, pentests, conformité ISO/ANSSI — planning ?"),
              Q("rssi_i_5", "Séparation des pouvoirs DSI vs validation sécurité en production ?"),
            ]),
          ],
        },
        confront: {
          duration: "15 min",
          sections: [
            SEC("CDC sécurité", [
              Q("rssi_c_1", "SSO, 2FA, 6 niveaux d'accès — qui valide la mise en œuvre ?"),
              Q("rssi_c_2", "Hébergement souverain / cloud national — position officielle ?"),
            ]),
          ],
        },
        coconstruct: {
          duration: "10 min",
          sections: [
            SEC("Actions", [
              Q("rssi_cc_1", "Prérequis sécurité bloquants avant construction ?"),
              Q("rssi_cc_2", "Documents à fournir (politique, PRA) — délai ?"),
            ]),
          ],
        },
      },
    },

    dpo: {
      label: "DPO — Protection des données personnelles",
      dur: "75-90 min",
      phases: {
        invest: {
          duration: "40-45 min",
          sections: [
            SEC("RGPD & traitements", [
              Q("dpo_i_1", "DPO désigné ? Rattachement, indépendance, moyens ?"),
              Q("dpo_i_2", "Registre des traitements à jour ? Périmètre jeunesse / PII ?"),
              Q("dpo_i_3", "Base légale, consentement, durée conservation bénéficiaires ?"),
              Q("dpo_i_4", "Procédure droits personnes (accès, rectification, effacement) ?"),
              Q("dpo_i_5", "AIPD envisagée pour PNIPM ? Sous-traitants (IA, hébergeur) ?"),
            ]),
          ],
        },
        confront: {
          duration: "15 min",
          sections: [
            SEC("Partage & conformité", [
              Q("dpo_c_1", "Partage données avec bailleurs et tutelles : clauses et risques ?"),
              Q("dpo_c_2", "Anonymisation exports et couche IA — exigences ?"),
            ]),
          ],
        },
        coconstruct: {
          duration: "10 min",
          sections: [
            SEC("Suivi", [
              Q("dpo_cc_1", "Fréquence de revue DPO pendant la construction ?"),
              Q("dpo_cc_2", "Registre et DPIA à verser en Data Room — délai ?"),
            ]),
          ],
        },
      },
    },

    direction: {
      label: "Direction centrale / service métier",
      dur: "90 min",
      phases: {
        invest: {
          duration: "40-50 min",
          sections: [
            SEC("A. Mandat & périmètre", [
              Q("dir_i_a1", "Mandat de votre direction et périmètre de données produites ?"),
              Q("dir_i_a2", "Quels dispositifs / programmes relèvent de votre direction ?"),
              Q("dir_i_a3", "Effectifs, organisation régionale, points focaux data ?"),
            ]),
            SEC("B. Outils & reporting", [
              Q("dir_i_b1", "Quels outils utilisez-vous pour suivi et reporting (nom, version) ?"),
              Q("dir_i_b2", "Quelles données, formats, fréquences de production ?"),
              Q("dir_i_b3", "Quels processus manuels et chronophages ?"),
              Q("dir_i_b4", "Obligations de reporting internes, bailleurs, tutelle ?"),
            ]),
            SEC("C. Qualité & échanges", [
              Q("dir_i_c1", "Qualité et fraîcheur des données — auto-évaluation ?"),
              Q("dir_i_c2", "Avec quelles structures échangez-vous des données, comment ?"),
              Q("dir_i_c3", "Principaux points de douleur opérationnels ?"),
            ]),
          ],
        },
        confront: {
          duration: "15-20 min",
          sections: [
            SEC("Intégration CDC", [
              Q("dir_c_1", "Quelles fonctionnalités CDC sont utiles vs superflues pour vous ?"),
              Q("dir_c_2", "Quelles données partageriez-vous dans une plateforme centralisée ?"),
              Q("dir_c_3", "Obstacles à la centralisation (juridique, technique, politique) ?"),
            ]),
          ],
        },
        coconstruct: {
          duration: "10-15 min",
          sections: [
            SEC("Priorités", [
              Q("dir_cc_1", "Quick wins améliorant immédiatement votre quotidien ?"),
              Q("dir_cc_2", "Conditions de réussite et craintes ?"),
              Q("dir_cc_3", "Référents data et métier à associer (noms) ?"),
              Q("dir_cc_4", "Pièces Data Room à verser sous 72h ?"),
            ]),
          ],
        },
      },
    },

    direction_daf: {
      label: "DAF — Finances, budget & SIGFIP",
      dur: "90-120 min",
      phases: {
        invest: {
          duration: "45-55 min",
          sections: [
            SEC("A. Budget & programmation", [
              Q("daf_i_a1", "Structure budgétaire programmatique / non-programmatique — lisibilité ?"),
              Q("daf_i_a2", "Budget 2026 par programme — disponibilité et format ?"),
              Q("daf_i_a3", "Circuit d'engagement et de paiement des primes (étapes, délais) ?"),
            ]),
            SEC("B. SIGFIP & exécution", [
              Q("daf_i_b1", "Utilisation actuelle de SIGFIP (modules, exports) ?"),
              Q("daf_i_b2", "Modalités de raccordement API / batch envisagées ?"),
              Q("daf_i_b3", "Réconciliation programme ↔ ligne budgétaire ↔ paiement ?"),
            ]),
            SEC("C. Reporting financier", [
              Q("daf_i_c1", "Reporting Cabinet et bailleurs — formats, délais, ressaisies ?"),
              Q("daf_i_c2", "Écarts entre exécution SIGFIP et suivi programmatique ?"),
            ]),
          ],
        },
        confront: {
          duration: "15 min",
          sections: [
            SEC("CDC finances", [
              Q("daf_c_1", "Intégration SIGFIP temps réel — faisable dans le délai ?"),
              Q("daf_c_2", "Traçabilité prime individuelle exigée par le CDC — état des lieux ?"),
            ]),
          ],
        },
        coconstruct: {
          duration: "10 min",
          sections: [
            SEC("Actions", [
              Q("daf_cc_1", "Exports SIGFIP à verser en R5 — délai ?"),
              Q("daf_cc_2", "Point focal technique budget pour ateliers flux ?"),
            ]),
          ],
        },
      },
    },

    direction_dpsd: {
      label: "DPSD — Données, statistiques & référentiels",
      dur: "90 min",
      phases: {
        invest: {
          duration: "45-50 min",
          sections: [
            SEC("A. Référentiels & qualité", [
              Q("dpsd_i_a1", "Existence d'un dictionnaire / référentiel ministériel ?"),
              Q("dpsd_i_a2", "Découpage territorial normalisé — état et responsable ?"),
              Q("dpsd_i_a3", "Grille qualité données par source — pratique actuelle ?"),
            ]),
            SEC("B. Production statistique", [
              Q("dpsd_i_b1", "Indicateurs produits, fréquence, outils (Excel, BI, autre) ?"),
              Q("dpsd_i_b2", "Échantillons anonymisés disponibles (volume, fraîcheur) ?"),
              Q("dpsd_i_b3", "Lacunes de complétude connues par programme ?"),
            ]),
            SEC("C. Gouvernance data", [
              Q("dpsd_i_c1", "Rôles DPSD vs DSI vs métiers sur la donnée ?"),
              Q("dpsd_i_c2", "Processus de validation avant diffusion Cabinet ?"),
            ]),
          ],
        },
        confront: {
          duration: "15 min",
          sections: [
            SEC("CDC données", [
              Q("dpsd_c_1", "Identifiant unique bénéficiaire (NNI) — faisabilité court terme ?"),
              Q("dpsd_c_2", "Consolidation temps réel — prérequis data ?"),
            ]),
          ],
        },
        coconstruct: {
          duration: "10 min",
          sections: [
            SEC("Livrables data", [
              Q("dpsd_cc_1", "Référentiel et échantillon à verser R3 — calendrier ?"),
              Q("dpsd_cc_2", "Atelier qualité données avec programmes — qui inviter ?"),
            ]),
          ],
        },
      },
    },

    direction_ig: {
      label: "Inspection générale — Contrôle & redevabilité",
      dur: "75-90 min",
      phases: {
        invest: {
          duration: "40-45 min",
          sections: [
            SEC("A. Missions de contrôle", [
              Q("ig_i_a1", "Dernières missions IG sur programmes jeunesse / primes ?"),
              Q("ig_i_a2", "Constats récurrents sur traçabilité des paiements ?"),
              Q("ig_i_a3", "Recommandations non encore implémentées ?"),
            ]),
            SEC("B. Risques & fraude", [
              Q("ig_i_b1", "Signalements, litiges, contentieux liés aux dispositifs ?"),
              Q("ig_i_b2", "Mécanismes de contrôle interne existants ?"),
            ]),
          ],
        },
        confront: {
          duration: "15 min",
          sections: [
            SEC("Exigences CDC", [
              Q("ig_c_1", "Audit trail inviolable du CDC — écart avec la pratique ?"),
              Q("ig_c_2", "Niveau de traçabilité exigé par le Cabinet — votre lecture ?"),
            ]),
          ],
        },
        coconstruct: {
          duration: "10 min",
          sections: [
            SEC("Suivi", [
              Q("ig_cc_1", "Indicateurs de risque à intégrer au tableau de bord ?"),
              Q("ig_cc_2", "Rapports IG partageables pour la mission (anonymisés) ?"),
            ]),
          ],
        },
      },
    },

    tutelle: {
      label: "Structure sous tutelle (AEJ, OSCN, BCP…)",
      dur: "120-150 min",
      phases: {
        invest: {
          duration: "55-65 min",
          sections: [
            SEC("A. Mandat & volumes", [
              Q("tut_i_a1", "Mandat, dispositifs actifs, volumes de bénéficiaires (inscriptions, sorties) ?"),
              Q("tut_i_a2", "Autonomie de gestion vis-à-vis du ministère ?"),
              Q("tut_i_a3", "Conventions de tutelle et obligations de reporting ?"),
            ]),
            SEC("B. Systèmes & données", [
              Q("tut_i_b1", "Systèmes d'information (interne, propriétaire, bases) ?"),
              Q("tut_i_b2", "Identification des bénéficiaires — clé unique existante ?"),
              Q("tut_i_b3", "Gestion des doublons inter-programmes ?"),
            ]),
            SEC("C. Paiements & flux", [
              Q("tut_i_c1", "Flow de paiement des primes (stages, formations, THIMO) ?"),
              Q("tut_i_c2", "Reporting bailleur : formats, fréquence, charge ?"),
              Q("tut_i_c3", "Interface possible avec plateforme ministérielle (API, batch) ?"),
            ]),
          ],
        },
        confront: {
          duration: "15-20 min",
          sections: [
            SEC("Intégration CDC", [
              Q("tut_c_1", "Interface CDC avec vos bases — faisable techniquement et politiquement ?"),
              Q("tut_c_2", "Remontée automatisée vers le Cabinet — conditions ?"),
              Q("tut_c_3", "Doublons fonctionnalités CDC vs vos outils ?"),
            ]),
          ],
        },
        coconstruct: {
          duration: "10-15 min",
          sections: [
            SEC("Modèle cible", [
              Q("tut_cc_1", "Modèle d'intégration privilégié (API, batch, saisie) ?"),
              Q("tut_cc_2", "Données prioritaires à consolider en premier ?"),
              Q("tut_cc_3", "Prérequis gouvernance et confidentialité ?"),
            ]),
          ],
        },
      },
    },

    tutelle_aej: {
      label: "AEJ — Agence Emploi Jeunes (profondeur)",
      dur: "120-150 min",
      phases: {
        invest: {
          duration: "55-65 min",
          sections: [
            SEC("A. Dispositifs & bases", [
              Q("aej_i_a1", "Périmètre dispositifs AEJ et volumes par type ?"),
              Q("aej_i_a2", "Architecture base bénéficiaires (schéma, champs clés) ?"),
              Q("aej_i_a3", "Doublons avec OSCN, programmes bailleurs — constats chiffrés ?"),
            ]),
            SEC("B. Opérations & SI", [
              Q("aej_i_b1", "Applications métier et flux vers le ministère ?"),
              Q("aej_i_b2", "Carte Jeunes / outils numériques — lien avec AEJ ?"),
              Q("aej_i_b3", "Qualité données et fréquence de mise à jour ?"),
            ]),
            SEC("C. Paiements", [
              Q("aej_i_c1", "Circuit prime stage / formation — délais, litiges ?"),
              Q("aej_i_c2", "Traçabilité nominative bénéficiaire → paiement ?"),
            ]),
          ],
        },
        confront: {
          duration: "15 min",
          sections: [
            SEC("CDC & consolidation", [
              Q("aej_c_1", "Export base vers plateforme PNIPM — contraintes juridiques ?"),
              Q("aej_c_2", "NNI comme clé — état de préparation AEJ ?"),
            ]),
          ],
        },
        coconstruct: {
          duration: "10 min",
          sections: [
            SEC("Actions", [
              Q("aej_cc_1", "Échantillon base à verser R4 — format et délai ?"),
              Q("aej_cc_2", "Référent technique pour atelier interop ?"),
            ]),
          ],
        },
      },
    },

    tutelle_oscn: {
      label: "OSCN — Service civique national (profondeur)",
      dur: "120 min",
      phases: {
        invest: {
          duration: "50-60 min",
          sections: [
            SEC("A. Programme & données", [
              Q("oscn_i_a1", "Volumes volontaires / service civique par région ?"),
              Q("oscn_i_a2", "Outil de suivi et champs collectés ?"),
              Q("oscn_i_a3", "Articulation avec AEJ et ministère ?"),
            ]),
            SEC("B. Reporting & paiements", [
              Q("oscn_i_b1", "Reporting bailleur et ministère — templates ?"),
              Q("oscn_i_b2", "Indemnités et primes — circuit et délais ?"),
            ]),
          ],
        },
        confront: {
          duration: "15 min",
          sections: [
            SEC("Intégration", [
              Q("oscn_c_1", "Consolidation OSCN dans vision 360° Cabinet — données clés ?"),
            ]),
          ],
        },
        coconstruct: {
          duration: "10 min",
          sections: [
            SEC("Suite", [
              Q("oscn_cc_1", "Documentation technique à partager — délai ?"),
            ]),
          ],
        },
      },
    },

    programme: {
      label: "Coordonnateur de programme / projet",
      dur: "90-120 min",
      phases: {
        invest: {
          duration: "45-55 min",
          sections: [
            SEC("A. Flow opérationnel", [
              Q("prg_i_a1", "Flow du programme : identification → suivi → sortie ?"),
              Q("prg_i_a2", "Indicateurs suivis (cibles vs réalisé) et sources ?"),
              Q("prg_i_a3", "Géolocalisation des interventions ?"),
            ]),
            SEC("B. Outils & budget", [
              Q("prg_i_b1", "Outils de gestion et reporting bailleur ?"),
              Q("prg_i_b2", "Suivi budgétaire : dotations, engagements, décaissements ?"),
              Q("prg_i_b3", "Formats et exigences reporting bailleur ?"),
            ]),
            SEC("C. Douleurs & paiements", [
              Q("prg_i_c1", "Principales douleurs opérationnelles ?"),
              Q("prg_i_c2", "Paiements et traçabilité nominative ?"),
            ]),
          ],
        },
        confront: {
          duration: "15 min",
          sections: [
            SEC("CDC programme", [
              Q("prg_c_1", "Fonctionnalités CDC nécessaires vs optionnelles pour vous ?"),
              Q("prg_c_2", "Consolidation ministérielle — impact sur rapport bailleur ?"),
              Q("prg_c_3", "Écarts majeurs CDC vs réalité terrain ?"),
            ]),
          ],
        },
        coconstruct: {
          duration: "10 min",
          sections: [
            SEC("Consolidation", [
              Q("prg_cc_1", "Indicateurs consolidés les plus utiles ?"),
              Q("prg_cc_2", "Conditions remontée fiable et automatisée ?"),
            ]),
          ],
        },
      },
    },

    programme_bailleur: {
      label: "Programme cofinancé bailleur (BAD, BM, AFD…)",
      dur: "90-120 min",
      phases: {
        invest: {
          duration: "45-50 min",
          sections: [
            SEC("A. Conventions & reporting", [
              Q("pb_i_a1", "Convention de financement — indicateurs et échéances clés ?"),
              Q("pb_i_a2", "Templates bailleur imposés — flexibilité de mapping ?"),
              Q("pb_i_a3", "Difficultés récurrentes avec données ministérielles ?"),
            ]),
            SEC("B. Données & systèmes", [
              Q("pb_i_b1", "Bases bénéficiaires du programme — structure et volume ?"),
              Q("pb_i_b2", "Croisement avec autres programmes (doublons) ?"),
              Q("pb_i_b3", "Outils numériques utilisés par les bénéficiaires ?"),
            ]),
          ],
        },
        confront: {
          duration: "15 min",
          sections: [
            SEC("Plateforme PNIPM", [
              Q("pb_c_1", "La plateforme pourrait-elle générer vos formats bailleur ?"),
              Q("pb_c_2", "Garanties de fiabilité exigées pour adoption ?"),
            ]),
          ],
        },
        coconstruct: {
          duration: "10 min",
          sections: [
            SEC("Alignement", [
              Q("pb_cc_1", "Indicateurs prioritaires pour votre supervision ?"),
              Q("pb_cc_2", "Calendrier de partage données avec la mission ?"),
            ]),
          ],
        },
      },
    },

    technique_sigfip: {
      label: "Point focal SIGFIP — Finances publiques",
      dur: "120 min",
      phases: {
        invest: {
          duration: "50-60 min",
          sections: [
            SEC("A. Services & habilitations", [
              Q("sig_i_a1", "Services SIGFIP exposés (API, fichiers) ?"),
              Q("sig_i_a2", "Procédure d'habilitation ministère — délais, prérequis ?"),
              Q("sig_i_a3", "Documentation technique disponible ?"),
            ]),
            SEC("B. Données accessibles", [
              Q("sig_i_b1", "Données exécution budgétaire accessibles (granularité) ?"),
              Q("sig_i_b2", "Lien engagement budgétaire ↔ paiement prime possible ?"),
              Q("sig_i_b3", "SLA, disponibilité, incidents récents ?"),
            ]),
          ],
        },
        confront: {
          duration: "15 min",
          sections: [
            SEC("Délai mission", [
              Q("sig_c_1", "Raccordement réaliste avant déploiement PNIPM phase 1 ?"),
              Q("sig_c_2", "Prérequis côté ministère (DAF, DSI) ?"),
            ]),
          ],
        },
        coconstruct: {
          duration: "10 min",
          sections: [
            SEC("Planning", [
              Q("sig_cc_1", "Séquence de raccordement recommandée ?"),
              Q("sig_cc_2", "Point focal et étapes formelles ?"),
            ]),
          ],
        },
      },
    },

    technique_uxp: {
      label: "Point focal UXP / X-Road",
      dur: "120 min",
      phases: {
        invest: {
          duration: "50-60 min",
          sections: [
            SEC("A. Raccordement", [
              Q("uxp_i_a1", "État du raccordement ministère à UXP/X-Road ?"),
              Q("uxp_i_a2", "Procédure, délais, coûts, documentation OpenAPI ?"),
              Q("uxp_i_a3", "Précédents de raccordement réussis (autres ministères) ?"),
            ]),
            SEC("B. Sécurité & données", [
              Q("uxp_i_b1", "Contraintes sécurité et conformité ?"),
              Q("uxp_i_b2", "Données NNI / autres registres accessibles via X-Road ?"),
            ]),
          ],
        },
        confront: {
          duration: "15 min",
          sections: [
            SEC("Faisabilité", [
              Q("uxp_c_1", "Intégration CDC via X-Road dans délai accéléré ?"),
              Q("uxp_c_2", "Compatibilité couche IA / analytics ?"),
            ]),
          ],
        },
        coconstruct: {
          duration: "10 min",
          sections: [
            SEC("Suite", [
              Q("uxp_cc_1", "Specs à verser R7 — délai ?"),
              Q("uxp_cc_2", "Risques techniques majeurs anticipés ?"),
            ]),
          ],
        },
      },
    },

    technique_nni: {
      label: "Point focal NNI — Identification nationale",
      dur: "90-120 min",
      phases: {
        invest: {
          duration: "45-55 min",
          sections: [
            SEC("A. Accès & juridique", [
              Q("nni_i_a1", "Cadre juridique d'accès NNI pour programmes jeunesse ?"),
              Q("nni_i_a2", "Procédure d'habilitation — état côté ministère ?"),
              Q("nni_i_a3", "Modalités techniques (API, volume, quotas) ?"),
            ]),
            SEC("B. Usage terrain", [
              Q("nni_i_b1", "Utilisation NNI possible sur le terrain aujourd'hui ?"),
              Q("nni_i_b2", "Alternatives si NNI indisponible (ID interne) ?"),
            ]),
          ],
        },
        confront: {
          duration: "15 min",
          sections: [
            SEC("CDC identité", [
              Q("nni_c_1", "Référentiel unique bénéficiaire sans NNI — acceptable ?"),
              Q("nni_c_2", "Délais réalistes de mise en production NNI ?"),
            ]),
          ],
        },
        coconstruct: {
          duration: "10 min",
          sections: [
            SEC("Actions", [
              Q("nni_cc_1", "Note juridique R9 / modalités à verser — délai ?"),
              Q("nni_cc_2", "Atelier tripartite NNI–DSI–DAJIP ?"),
            ]),
          ],
        },
      },
    },

    technique: {
      label: "Point focal technique externe (générique)",
      dur: "120 min",
      phases: {
        invest: {
          duration: "50-60 min",
          sections: [
            SEC("A. Offre de service", [
              Q("tec_i_a1", "Services exposés et modalités (API, protocoles) ?"),
              Q("tec_i_a2", "Procédure d'habilitation et de raccordement ?"),
              Q("tec_i_a3", "Documentation, délais, coûts ?"),
            ]),
            SEC("B. Exploitation", [
              Q("tec_i_b1", "SLA et disponibilité réelle ?"),
              Q("tec_i_b2", "Précédents de raccordement ministère / programmes ?"),
              Q("tec_i_b3", "Données accessibles et conditions juridiques ?"),
            ]),
          ],
        },
        confront: {
          duration: "15 min",
          sections: [
            SEC("CDC", [
              Q("tec_c_1", "Intégration réaliste dans le délai accéléré ?"),
              Q("tec_c_2", "Prérequis bloquants côté ministère ?"),
            ]),
          ],
        },
        coconstruct: {
          duration: "10 min",
          sections: [
            SEC("Planning", [
              Q("tec_cc_1", "Séquence de raccordement recommandée ?"),
              Q("tec_cc_2", "Contacts et étapes formelles ?"),
            ]),
          ],
        },
      },
    },

    bailleur: {
      label: "Représentant bailleur (BAD, BM, AFD, PNUD, BOAD)",
      dur: "90 min",
      phases: {
        invest: {
          duration: "40-50 min",
          sections: [
            SEC("A. Exigences reporting", [
              Q("bai_i_a1", "Exigences reporting : format, fréquence, indicateurs ?"),
              Q("bai_i_a2", "Modèles et templates imposés aux programmes ?"),
              Q("bai_i_a3", "Évaluation qualité reporting actuel du ministère ?"),
            ]),
            SEC("B. Données & conformité", [
              Q("bai_i_b1", "Données indispensables vs problématiques ?"),
              Q("bai_i_b2", "Obligations conformité (environnement, RGPD) ?"),
              Q("bai_i_b3", "Missions de supervision — frictions récurrentes ?"),
            ]),
          ],
        },
        confront: {
          duration: "15 min",
          sections: [
            SEC("Plateforme consolidée", [
              Q("bai_c_1", "Génération automatique formats bailleur — acceptable ?"),
              Q("bai_c_2", "Garanties de fiabilité exigées ?"),
              Q("bai_c_3", "Valorisation dans vos évaluations si plateforme livrée ?"),
            ]),
          ],
        },
        coconstruct: {
          duration: "10 min",
          sections: [
            SEC("Alignement", [
              Q("bai_cc_1", "Indicateurs prioritaires pour vos besoins ?"),
              Q("bai_cc_2", "Niveau d'automatisation acceptable ?"),
              Q("bai_cc_3", "Bonnes pratiques d'autres pays à transposer ?"),
            ]),
          ],
        },
      },
    },

    bailleur_multi: {
      label: "Bailleurs groupés (AFD + PNUD + BOAD)",
      dur: "90-120 min",
      phases: {
        invest: {
          duration: "45-55 min",
          sections: [
            SEC("A. Par bailleur", [
              Q("bm_i_a1", "Synthèse par bailleur : programmes financés, indicateurs clés ?"),
              Q("bm_i_a2", "Points communs et divergences entre exigences reporting ?"),
              Q("bm_i_a3", "Coordination inter-bailleurs sur PNIPM — existe-t-elle ?"),
            ]),
            SEC("B. Données ministère", [
              Q("bm_i_b1", "Qualité perçue des données remontées par le ministère ?"),
              Q("bm_i_b2", "Données manquantes bloquant vos revues ?"),
            ]),
          ],
        },
        confront: {
          duration: "15 min",
          sections: [
            SEC("Vision consolidée", [
              Q("bm_c_1", "Une plateforme unique simplifierait-elle vos supervisions ?"),
              Q("bm_c_2", "Harmonisation indicateurs — opportunité ou risque ?"),
            ]),
          ],
        },
        coconstruct: {
          duration: "10 min",
          sections: [
            SEC("Suite", [
              Q("bm_cc_1", "Format de restitution multi-bailleur souhaité ?"),
              Q("bm_cc_2", "Calendrier de points focal avec la mission ?"),
            ]),
          ],
        },
      },
    },
  };

  function resolveTrameComplet(e) {
    if (!e) return "direction";
    const n = (e.n || "").toLowerCase();
    const struct = (e.struct || "").toLowerCase();
    const tr = e.trame || "";

    const origResolve =
      window.PortiaQuestionnaires && typeof window.PortiaQuestionnaires._origResolve === "function"
        ? window.PortiaQuestionnaires._origResolve
        : null;
    if (origResolve) {
      const terrain = origResolve(e);
      if (TRAMES_COMPLETS[terrain] && TRAMES_COMPLETS[terrain].phases) return terrain;
    }

    if (tr === "volet_b_np") return "volet_b_np";
    if (tr === "rssi_dpo") return n.includes("dpo") ? "dpo" : "rssi";

    if (tr === "cabinet") return "cabinet";
    if (tr === "dsi") return "dsi";
    if (tr === "technique" || struct.includes("sigfip")) return "technique_sigfip";
    if (struct.includes("uxp") || struct.includes("x-road")) return "technique_uxp";
    if (struct === "nni" || n.includes("nni")) return "technique_nni";
    if (tr === "technique") return "technique";

    if (tr === "bailleur") {
      if (struct.includes("afd") || struct.includes("pnud") || struct.includes("boad")) return "bailleur_multi";
      return "bailleur";
    }

    if (tr === "programme") {
      if (["bad", "banque mondiale", "afd", "pnud", "boad"].some((b) => struct.includes(b))) return "programme_bailleur";
      return "programme";
    }

    if (tr === "tutelle") {
      if (struct.includes("aej")) return "tutelle_aej";
      if (struct.includes("oscn")) return "tutelle_oscn";
      return "tutelle";
    }

    if (tr === "direction" || tr === "volet_b_np") {
      if (struct.includes("daf") || n.includes("affaires financi")) return "direction_daf";
      if (struct.includes("dpsd") || n.includes("planification")) return "direction_dpsd";
      if (struct.includes("inspection") || n.includes("inspecteur")) return "direction_ig";
      return "direction";
    }

    return tr in TRAMES_COMPLETS ? tr : "direction";
  }

  function getTrameForEntretien(e) {
    const key = resolveTrameComplet(e);
    if (TRAMES_COMPLETS[key] && TRAMES_COMPLETS[key].phases) return TRAMES_COMPLETS[key];
    if (window.TRAMES && window.TRAMES[key]) return window.TRAMES[key];
    return TRAMES_COMPLETS.direction;
  }

  function countQuestions(tr) {
    if (!tr || !tr.phases) return 0;
    let n = 0;
    ["invest", "confront", "coconstruct"].forEach((ph) => {
      (tr.phases[ph]?.sections || []).forEach((sec) => {
        n += (sec.items || []).length;
      });
    });
    return n;
  }

  function skeletonAnswers(tr, existing) {
    const out = {
      invest: Object.assign({}, existing?.invest || {}),
      confront: Object.assign({}, existing?.confront || {}),
      coconstruct: Object.assign({}, existing?.coconstruct || {}),
    };
    if (!tr || !tr.phases) return out;
    ["invest", "confront", "coconstruct"].forEach((ph) => {
      (tr.phases[ph]?.sections || []).forEach((sec) => {
        (sec.items || []).forEach((it) => {
          if (out[ph][it.id] === undefined) out[ph][it.id] = "";
        });
      });
    });
    return out;
  }

  function mergeTrames() {
    if (!window.TRAMES) return;
    Object.keys(TRAMES_COMPLETS).forEach((k) => {
      window.TRAMES[k] = TRAMES_COMPLETS[k];
    });
  }

  function patchPortiaQuestionnaires() {
    if (!window.PortiaQuestionnaires) return;
    const origResolve = window.PortiaQuestionnaires.resolveTrameEntretien;
    const origGet = window.PortiaQuestionnaires.getTrameForEntretien;
    window.PortiaQuestionnaires.resolveTrameEntretien = function (e) {
      return resolveTrameComplet(e);
    };
    window.PortiaQuestionnaires.getTrameForEntretien = function (e) {
      return getTrameForEntretien(e);
    };
    window.PortiaQuestionnaires.countQuestions = countQuestions;
    window.PortiaQuestionnaires.skeletonAnswers = skeletonAnswers;
    window.PortiaQuestionnaires.TRAMES_COMPLETS = TRAMES_COMPLETS;
    window.PortiaQuestionnaires._origResolve = origResolve;
    window.PortiaQuestionnaires._origGet = origGet;
  }

  function patchConductInit() {
    if (typeof conductInitAnswers !== "function") return;
    const orig = conductInitAnswers;
    window.conductInitAnswers = function (e) {
      const tr = getTrameForEntretien(e);
      if (tr && tr.phases) return skeletonAnswers(tr, e.questionnaire);
      return orig(e);
    };
  }

  function patchOpenEntretien() {
    if (typeof openEntretien !== "function") return;
    const orig = openEntretien;
    window.openEntretien = function (id, editable) {
      const e = Store.find("entretiens", id);
      if (e && window.PortiaQuestionnaires) {
        const tr = getTrameForEntretien(e);
        const nq = countQuestions(tr);
        window._lastEntretienQCount = nq;
      }
      return orig(id, editable);
    };
  }

  mergeTrames();
  patchPortiaQuestionnaires();
  patchConductInit();

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", patchOpenEntretien);
    } else {
      patchOpenEntretien();
    }
  }

  function questionnaireToMarkdown(tr, answers) {
    if (!tr || !tr.phases) return "";
    const lines = [];
    const phaseTitles = {
      invest: "Phase 1 — Investigation",
      confront: "Phase 2 — Confrontation",
      coconstruct: "Phase 3 — Co-construction",
    };
    Object.keys(phaseTitles).forEach((ph) => {
      const sections = tr.phases[ph]?.sections || [];
      if (!sections.length) return;
      lines.push(`### ${phaseTitles[ph]}`, "");
      sections.forEach((sec) => {
        lines.push(`#### ${sec.title}`, "");
        (sec.items || []).forEach((it) => {
          const ans = (answers && answers[ph] && answers[ph][it.id]) || "";
          lines.push(`- **${it.q}**`);
          if (it.hint) lines.push(`  - *Indication :* ${it.hint}`);
          lines.push(`  - Réponse : ${ans || "_(non renseigné)_"}`, "");
        });
      });
    });
    return lines.join("\n");
  }

  if (window.PortiaQuestionnaires) {
    window.PortiaQuestionnaires.questionnaireToMarkdown = questionnaireToMarkdown;
  }

  window.PortiaQuestionnairesComplets = {
    TRAMES_COMPLETS,
    resolveTrameComplet,
    getTrameForEntretien,
    countQuestions,
    skeletonAnswers,
    questionnaireToMarkdown,
    mergeTrames,
  };
})();
