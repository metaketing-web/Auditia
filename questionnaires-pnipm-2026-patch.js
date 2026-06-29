/** Généré par scripts/pnipm_trames_import.py — ne pas éditer à la main */
(function () {
  "use strict";
  const PNIPM_PATCH = {
  "meta": {
    "auteur": "Skydeen",
    "objet": "Compléments d'audit PNIPM — trames spécialisées, ajouts aux trames existantes et réaffectations",
    "date": "2026-06-19",
    "mission": "PNIPM — Audit de Cadrage Stratégique & Blueprint de Réalisation",
    "convention_reference": "{prefixe}_{phase}_{section}{num} — phase: i=Investigation, c=Confrontation, cc=Co-construction. Confirmée d'après la trame cabinet (cab_i_a1, cab_c_1, cab_cc_1).",
    "phases_modele": [
      "Investigation",
      "Confrontation",
      "Co-construction"
    ],
    "statistiques": {
      "nouvelles_trames": 8,
      "questions_nouvelles_trames": 104,
      "questions_ajoutees_trames_existantes": 15,
      "total_questions_ajoutees": 119,
      "reaffectations": 8,
      "nouvelles_entites": 1
    }
  },
  "newTrames": {
    "flotte": {
      "label": "Patrimoine, Flotte automobile & Entretien des véhicules",
      "dur": "90 min",
      "phases": {
        "invest": {
          "duration": "45-55 min",
          "sections": [
            {
              "title": "Parc & inventaire",
              "items": [
                {
                  "id": "flot_i_a1",
                  "q": "Combien de véhicules compte le parc, par structure et par statut (en service, maintenance, hors service, réformé), et comment l'inventaire est-il tenu aujourd'hui (Excel, papier, logiciel) ?",
                  "hint": ""
                },
                {
                  "id": "flot_i_a2",
                  "q": "Quelles informations détenez-vous par véhicule (immatriculation, marque/modèle, date et valeur d'acquisition, kilométrage, affectation, documents) ?",
                  "hint": ""
                },
                {
                  "id": "flot_i_a3",
                  "q": "Comment suivez-vous les documents réglementaires (carte grise, assurance, visite technique) et leurs échéances ?",
                  "hint": ""
                }
              ]
            },
            {
              "title": "Maintenance & réparations",
              "items": [
                {
                  "id": "flot_i_b1",
                  "q": "Comment planifiez-vous la maintenance préventive (vidanges, révisions, pneumatiques) et selon quels déclencheurs (kilométrage, date) ?",
                  "hint": ""
                },
                {
                  "id": "flot_i_b2",
                  "q": "Comment enregistrez-vous les interventions curatives (pannes, accidents) et l'historique par véhicule ?",
                  "hint": ""
                },
                {
                  "id": "flot_i_b3",
                  "q": "Avec quels prestataires travaillez-vous (garages agréés, contrats cadres) et comment suivez-vous les coûts d'intervention ?",
                  "hint": ""
                }
              ]
            },
            {
              "title": "Carburant & coûts",
              "items": [
                {
                  "id": "flot_i_c1",
                  "q": "Comment gérez-vous l'approvisionnement en carburant (bons, cartes, stations) et le relevé des consommations ?",
                  "hint": ""
                },
                {
                  "id": "flot_i_c2",
                  "q": "Calculez-vous une consommation moyenne et détectez-vous les anomalies ? Comment ?",
                  "hint": ""
                },
                {
                  "id": "flot_i_c3",
                  "q": "Disposez-vous d'un coût total de possession (TCO) ou d'un coût au kilomètre par véhicule ?",
                  "hint": ""
                }
              ]
            }
          ]
        },
        "confront": {
          "duration": "15-20 min",
          "sections": [
            {
              "title": "Confrontation CDC / réalité flotte",
              "items": [
                {
                  "id": "flot_c_1",
                  "q": "Le module flotte du CDC (TCO, alertes automatiques d'échéances, suivi conso) est-il alimentable avec vos données actuelles, et à quelle fréquence ?",
                  "hint": ""
                },
                {
                  "id": "flot_c_2",
                  "q": "Les alertes automatiques (assurance / visite technique expirant, maintenance due) sont-elles fiables au regard de la qualité de vos données de référence ?",
                  "hint": ""
                }
              ]
            }
          ]
        },
        "coconstruct": {
          "duration": "10-15 min",
          "sections": [
            {
              "title": "Co-construction",
              "items": [
                {
                  "id": "flot_cc_1",
                  "q": "Quel quick win flotte aurait le plus d'impact immédiat (tableau de bord disponibilité, alertes échéances) ?",
                  "hint": ""
                },
                {
                  "id": "flot_cc_2",
                  "q": "Quelles pièces (état du parc, contrats d'entretien, relevés de conso) pouvez-vous verser en Data Room sous 72h ?",
                  "hint": ""
                },
                {
                  "id": "flot_cc_3",
                  "q": "Quel référent flotte / patrimoine associer aux ateliers de construction ?",
                  "hint": ""
                }
              ]
            }
          ]
        }
      }
    },
    "drh": {
      "label": "Direction des Ressources Humaines — Effectifs, paie & carrières",
      "dur": "90 min",
      "phases": {
        "invest": {
          "duration": "45-55 min",
          "sections": [
            {
              "title": "Effectifs & organisation",
              "items": [
                {
                  "id": "drh_i_a1",
                  "q": "Quel est l'effectif total et sa répartition (structure, grade, statut, ancienneté), et comment le tenez-vous à jour ?",
                  "hint": ""
                },
                {
                  "id": "drh_i_a2",
                  "q": "Disposez-vous d'un SIRH ou d'un logiciel de paie (nom, éditeur, version) ? Sinon, comment gérez-vous ces fonctions ?",
                  "hint": ""
                },
                {
                  "id": "drh_i_a3",
                  "q": "Comment l'organigramme est-il maintenu et partagé aujourd'hui ?",
                  "hint": ""
                }
              ]
            },
            {
              "title": "Processus RH",
              "items": [
                {
                  "id": "drh_i_b1",
                  "q": "Comment gérez-vous les absences (congés, permissions, maladies) et leur validation ?",
                  "hint": ""
                },
                {
                  "id": "drh_i_b2",
                  "q": "Comment se déroulent les évaluations de performance et leur historisation ?",
                  "hint": ""
                },
                {
                  "id": "drh_i_b3",
                  "q": "Comment suivez-vous les formations continues des agents ?",
                  "hint": ""
                }
              ]
            },
            {
              "title": "Données & douleurs",
              "items": [
                {
                  "id": "drh_i_c1",
                  "q": "Quelles données RH produisez-vous pour le Cabinet ou la tutelle, à quelle fréquence et sous quel format ?",
                  "hint": ""
                },
                {
                  "id": "drh_i_c2",
                  "q": "Quels processus RH sont les plus manuels et chronophages ?",
                  "hint": ""
                },
                {
                  "id": "drh_i_c3",
                  "q": "Quels indicateurs RH suivez-vous (pyramide des âges, taux d'encadrement, turnover) ?",
                  "hint": ""
                }
              ]
            }
          ]
        },
        "confront": {
          "duration": "15-20 min",
          "sections": [
            {
              "title": "Confrontation CDC / attentes RH",
              "items": [
                {
                  "id": "drh_c_1",
                  "q": "Quelles données RH partageriez-vous dans une plateforme centralisée, et lesquelles posent un problème de confidentialité ?",
                  "hint": ""
                },
                {
                  "id": "drh_c_2",
                  "q": "L'interfaçage avec un SIRH existant ou la solde (Fonction publique) est-il envisageable techniquement et juridiquement ?",
                  "hint": ""
                }
              ]
            }
          ]
        },
        "coconstruct": {
          "duration": "10-15 min",
          "sections": [
            {
              "title": "Co-construction",
              "items": [
                {
                  "id": "drh_cc_1",
                  "q": "Quel quick win RH améliorerait immédiatement votre quotidien ?",
                  "hint": ""
                },
                {
                  "id": "drh_cc_2",
                  "q": "Quelles pièces (organigramme, états d'effectifs anonymisés, procédures) verser en Data Room sous 72h ?",
                  "hint": ""
                },
                {
                  "id": "drh_cc_3",
                  "q": "Quel référent RH associer à la construction ?",
                  "hint": ""
                }
              ]
            }
          ]
        }
      }
    },
    "marches": {
      "label": "Cellule Passation des Marchés Publics",
      "dur": "75-90 min",
      "phases": {
        "invest": {
          "duration": "45-55 min",
          "sections": [
            {
              "title": "Processus & outils",
              "items": [
                {
                  "id": "mp_i_a1",
                  "q": "Quel est le circuit de passation actuel (de l'expression de besoin à l'attribution) et quels outils l'appuient (SIGOMAP, Excel, papier) ?",
                  "hint": ""
                },
                {
                  "id": "mp_i_a2",
                  "q": "Quel volume annuel de marchés gérez-vous, par type (fournitures, services, travaux) et par procédure ?",
                  "hint": ""
                },
                {
                  "id": "mp_i_a3",
                  "q": "Comment suivez-vous l'avancement et les délais de chaque marché ?",
                  "hint": ""
                }
              ]
            },
            {
              "title": "Articulation & reporting",
              "items": [
                {
                  "id": "mp_i_b1",
                  "q": "Comment vous articulez-vous avec le budget (DAF) et l'exécution (engagements, paiements) ?",
                  "hint": ""
                },
                {
                  "id": "mp_i_b2",
                  "q": "Quelles obligations de reporting (national, bailleurs) pèsent sur la passation ?",
                  "hint": ""
                },
                {
                  "id": "mp_i_b3",
                  "q": "Quels points de friction ou délais récurrents observez-vous ?",
                  "hint": ""
                }
              ]
            }
          ]
        },
        "confront": {
          "duration": "15-20 min",
          "sections": [
            {
              "title": "Confrontation CDC / réalité marchés",
              "items": [
                {
                  "id": "mp_c_1",
                  "q": "Quelle articulation souhaitez-vous entre un module marchés de la plateforme, SIGOMAP et SIGFIP ?",
                  "hint": ""
                },
                {
                  "id": "mp_c_2",
                  "q": "Quelles données de passation peuvent être consolidées sans risque (confidentialité, mise en concurrence) ?",
                  "hint": ""
                }
              ]
            }
          ]
        },
        "coconstruct": {
          "duration": "10-15 min",
          "sections": [
            {
              "title": "Co-construction",
              "items": [
                {
                  "id": "mp_cc_1",
                  "q": "Quel quick win sur le suivi des marchés serait le plus utile ?",
                  "hint": ""
                },
                {
                  "id": "mp_cc_2",
                  "q": "Quelles pièces (plan de passation, tableau de bord marchés) verser en Data Room sous 72h ?",
                  "hint": ""
                },
                {
                  "id": "mp_cc_3",
                  "q": "Quel référent marchés associer à la construction ?",
                  "hint": ""
                }
              ]
            }
          ]
        }
      }
    },
    "daf": {
      "label": "Direction des Affaires Financières — Budget, SIGFIP & circuit de paiement des primes",
      "dur": "120 min",
      "phases": {
        "invest": {
          "duration": "45-55 min",
          "sections": [
            {
              "title": "Budget & exécution",
              "items": [
                {
                  "id": "daf_i_a1",
                  "q": "Quels outils utilisez-vous pour l'exécution budgétaire (SIGFIP, autres) et le suivi des engagements / liquidations ?",
                  "hint": ""
                },
                {
                  "id": "daf_i_a2",
                  "q": "Comment gérez-vous les régies d'avances et leur justification ?",
                  "hint": ""
                },
                {
                  "id": "daf_i_a3",
                  "q": "Quels états financiers produisez-vous, pour qui, à quelle fréquence ?",
                  "hint": ""
                }
              ]
            },
            {
              "title": "Circuit de paiement des primes",
              "items": [
                {
                  "id": "daf_i_b1",
                  "q": "Qui est le payeur de référence des primes (stages, formations, THIMO) par dispositif, et par quel canal (Trésor, banque, mobile money) ?",
                  "hint": ""
                },
                {
                  "id": "daf_i_b2",
                  "q": "Comment se fait aujourd'hui la réconciliation prime versée ↔ bénéficiaire ↔ écriture comptable ?",
                  "hint": ""
                },
                {
                  "id": "daf_i_b3",
                  "q": "Quel est le délai moyen réel de paiement et le taux de rejet / d'anomalie ?",
                  "hint": ""
                }
              ]
            },
            {
              "title": "Intégration SIGFIP",
              "items": [
                {
                  "id": "daf_i_c1",
                  "q": "Quel est l'état du raccordement à SIGFIP (habilitations, périmètre, propriétaire de l'interface) ?",
                  "hint": ""
                },
                {
                  "id": "daf_i_c2",
                  "q": "La réconciliation automatique plateforme ↔ SIGFIP est-elle techniquement envisageable ? Avec quelles limites ?",
                  "hint": ""
                },
                {
                  "id": "daf_i_c3",
                  "q": "Quels écarts fréquents constatez-vous entre données opérationnelles et données comptables ?",
                  "hint": ""
                }
              ]
            }
          ]
        },
        "confront": {
          "duration": "15-20 min",
          "sections": [
            {
              "title": "Confrontation CDC / réalité financière",
              "items": [
                {
                  "id": "daf_c_1",
                  "q": "La traçabilité de paiement « par bénéficiaire et par mois » exigée au CDC est-elle alimentable depuis vos systèmes ?",
                  "hint": ""
                },
                {
                  "id": "daf_c_2",
                  "q": "L'alerte « retard de paiement > 30 jours » est-elle calculable de façon fiable aujourd'hui ?",
                  "hint": ""
                }
              ]
            }
          ]
        },
        "coconstruct": {
          "duration": "10-15 min",
          "sections": [
            {
              "title": "Co-construction",
              "items": [
                {
                  "id": "daf_cc_1",
                  "q": "Quel niveau d'automatisation de la réconciliation est réaliste en phase 1 ?",
                  "hint": ""
                },
                {
                  "id": "daf_cc_2",
                  "q": "Quelles pièces (nomenclature budgétaire, états de paiement anonymisés, doc SIGFIP) verser en Data Room sous 72h ?",
                  "hint": ""
                },
                {
                  "id": "daf_cc_3",
                  "q": "Quel référent finances / SIGFIP associer à la construction ?",
                  "hint": ""
                }
              ]
            }
          ]
        }
      }
    },
    "dpsd": {
      "label": "Planification, Statistique & Documentation — Référentiels, indicateurs & GED",
      "dur": "90-120 min",
      "phases": {
        "invest": {
          "duration": "45-55 min",
          "sections": [
            {
              "title": "Référentiels & indicateurs",
              "items": [
                {
                  "id": "dps_i_a1",
                  "q": "Existe-t-il un dictionnaire d'indicateurs ministériel et un référentiel territorial normalisé (région, département, commune) ? Qui en est propriétaire ?",
                  "hint": ""
                },
                {
                  "id": "dps_i_a2",
                  "q": "Comment sont définis, calculés et harmonisés les indicateurs entre structures et programmes ?",
                  "hint": ""
                },
                {
                  "id": "dps_i_a3",
                  "q": "Quelle est l'articulation avec l'appareil statistique national (INS) et les obligations PND / PJGOUV ?",
                  "hint": ""
                }
              ]
            },
            {
              "title": "Données & qualité",
              "items": [
                {
                  "id": "dps_i_b1",
                  "q": "Quelles données consolidez-vous aujourd'hui et selon quelle gouvernance de qualité (stewardship, contrôles) ?",
                  "hint": ""
                },
                {
                  "id": "dps_i_b2",
                  "q": "Comment gérez-vous les doublons et les écarts de définition entre sources ?",
                  "hint": ""
                },
                {
                  "id": "dps_i_b3",
                  "q": "Quels processus de production statistique sont manuels et chronophages ?",
                  "hint": ""
                }
              ]
            },
            {
              "title": "Gestion documentaire & archivage",
              "items": [
                {
                  "id": "dps_i_c1",
                  "q": "Comment sont gérés aujourd'hui les courriers, notes, rapports et leur archivage (outil, versioning, normes) ?",
                  "hint": ""
                },
                {
                  "id": "dps_i_c2",
                  "q": "Quelles obligations légales d'archivage s'appliquent aux documents du Ministère ?",
                  "hint": ""
                },
                {
                  "id": "dps_i_c3",
                  "q": "La recherche documentaire (plein texte, métadonnées) est-elle possible aujourd'hui ?",
                  "hint": ""
                }
              ]
            }
          ]
        },
        "confront": {
          "duration": "15-20 min",
          "sections": [
            {
              "title": "Confrontation CDC / gouvernance de la donnée",
              "items": [
                {
                  "id": "dps_c_1",
                  "q": "Qui doit porter la gouvernance du référentiel maître bénéficiaire et du dictionnaire d'indicateurs dans la plateforme ?",
                  "hint": ""
                },
                {
                  "id": "dps_c_2",
                  "q": "Le module GED + signature électronique du CDC est-il compatible avec vos normes d'archivage ?",
                  "hint": ""
                }
              ]
            }
          ]
        },
        "coconstruct": {
          "duration": "10-15 min",
          "sections": [
            {
              "title": "Co-construction",
              "items": [
                {
                  "id": "dps_cc_1",
                  "q": "Quel quick win statistique ou documentaire aurait le plus de valeur ?",
                  "hint": ""
                },
                {
                  "id": "dps_cc_2",
                  "q": "Quelles pièces (dictionnaire d'indicateurs, référentiel territorial, plan d'archivage) verser en Data Room sous 72h ?",
                  "hint": ""
                },
                {
                  "id": "dps_cc_3",
                  "q": "Quel référent data / statistique associer à la construction ?",
                  "hint": ""
                }
              ]
            }
          ]
        }
      }
    },
    "dajc": {
      "label": "Affaires Juridiques & Coopération — Instruments juridiques, partage de données & signature électronique",
      "dur": "75-90 min",
      "phases": {
        "invest": {
          "duration": "45-55 min",
          "sections": [
            {
              "title": "Cadre juridique du partage de données",
              "items": [
                {
                  "id": "daj_i_a1",
                  "q": "Quels instruments (conventions de tutelle, décrets, protocoles) encadrent ou permettraient le partage de données entre le Ministère, les structures sous tutelle (AEJ, OSCN, BCP) et les bailleurs ?",
                  "hint": ""
                },
                {
                  "id": "daj_i_a2",
                  "q": "Quelles clauses de confidentialité et de propriété des données s'appliquent dans les conventions existantes ?",
                  "hint": ""
                },
                {
                  "id": "daj_i_a3",
                  "q": "Quel cadre national de protection des données personnelles s'applique (autorité, obligations) ?",
                  "hint": ""
                }
              ]
            },
            {
              "title": "Signature électronique & valeur probante",
              "items": [
                {
                  "id": "daj_i_b1",
                  "q": "Quelle est la valeur juridique de la signature électronique en Côte d'Ivoire pour les documents officiels du Ministère ?",
                  "hint": ""
                },
                {
                  "id": "daj_i_b2",
                  "q": "Quels actes pourraient être dématérialisés et signés électroniquement, et lesquels exigent encore le papier ?",
                  "hint": ""
                }
              ]
            },
            {
              "title": "Coopération & propriété intellectuelle",
              "items": [
                {
                  "id": "daj_i_c1",
                  "q": "Comment sécuriser les droits de propriété sur les livrables et les données vis-à-vis d'un prestataire (cf. §9 du CDC) ?",
                  "hint": ""
                },
                {
                  "id": "daj_i_c2",
                  "q": "Quelles obligations de coopération internationale (bailleurs) impactent la plateforme ?",
                  "hint": ""
                }
              ]
            }
          ]
        },
        "confront": {
          "duration": "15-20 min",
          "sections": [
            {
              "title": "Confrontation CDC / sécurisation juridique",
              "items": [
                {
                  "id": "daj_c_1",
                  "q": "Quels instruments juridiques manquent pour rendre opposable le partage de données vers la plateforme centrale ?",
                  "hint": ""
                },
                {
                  "id": "daj_c_2",
                  "q": "Le partage de données nominatives avec les bailleurs est-il juridiquement sécurisable ? À quelles conditions ?",
                  "hint": ""
                }
              ]
            }
          ]
        },
        "coconstruct": {
          "duration": "10-15 min",
          "sections": [
            {
              "title": "Co-construction",
              "items": [
                {
                  "id": "daj_cc_1",
                  "q": "Quel acte juridique prioritaire faut-il préparer pour débloquer la construction (convention-cadre, arrêté) ?",
                  "hint": ""
                },
                {
                  "id": "daj_cc_2",
                  "q": "Quelles pièces (conventions, textes applicables) verser en Data Room sous 72h ?",
                  "hint": ""
                },
                {
                  "id": "daj_cc_3",
                  "q": "Quel référent juridique associer à la construction ?",
                  "hint": ""
                }
              ]
            }
          ]
        }
      }
    },
    "carte_jeunes": {
      "label": "Coordination Carte Jeunes — Identité, NNI & écosystème d'avantages",
      "dur": "90-120 min",
      "phases": {
        "invest": {
          "duration": "45-55 min",
          "sections": [
            {
              "title": "Système d'émission & identité",
              "items": [
                {
                  "id": "cj_i_a1",
                  "q": "Comment fonctionne aujourd'hui l'émission de la Carte Jeunes (enrôlement, support, système d'information) ?",
                  "hint": ""
                },
                {
                  "id": "cj_i_a2",
                  "q": "Quelle est la relation entre la Carte Jeunes et le NNI (Numéro National d'Identification) ? Une réconciliation existe-t-elle ?",
                  "hint": ""
                },
                {
                  "id": "cj_i_a3",
                  "q": "Combien de cartes émises, par localité, et quel taux de couverture de la cible ?",
                  "hint": ""
                }
              ]
            },
            {
              "title": "Données & services",
              "items": [
                {
                  "id": "cj_i_b1",
                  "q": "Quelles données bénéficiaire la Carte Jeunes détient-elle, et avec quelle fiabilité / unicité ?",
                  "hint": ""
                },
                {
                  "id": "cj_i_b2",
                  "q": "Quels services et avantages sont associés, et quels partenaires sont activés ?",
                  "hint": ""
                },
                {
                  "id": "cj_i_b3",
                  "q": "Quelle utilisation réelle (taux d'activation, transactions) mesurez-vous ?",
                  "hint": ""
                }
              ]
            }
          ]
        },
        "confront": {
          "duration": "15-20 min",
          "sections": [
            {
              "title": "Confrontation CDC / rôle d'identité maître",
              "items": [
                {
                  "id": "cj_c_1",
                  "q": "La Carte Jeunes peut-elle servir de référentiel d'identité maître (clé bénéficiaire unique) pour la plateforme ? Quelles limites ?",
                  "hint": ""
                },
                {
                  "id": "cj_c_2",
                  "q": "Le rapprochement Carte Jeunes ↔ bases programmes (AEJ, OSCN, PEJEDEC…) est-il faisable pour dédoublonner ?",
                  "hint": ""
                }
              ]
            }
          ]
        },
        "coconstruct": {
          "duration": "10-15 min",
          "sections": [
            {
              "title": "Co-construction",
              "items": [
                {
                  "id": "cj_cc_1",
                  "q": "Quelle articulation cible entre Carte Jeunes, NNI et plateforme (qui est maître de quoi) ?",
                  "hint": ""
                },
                {
                  "id": "cj_cc_2",
                  "q": "Quelles données prioritaires consolider en premier via la Carte Jeunes ?",
                  "hint": ""
                },
                {
                  "id": "cj_cc_3",
                  "q": "Quelles pièces (specs techniques, volumétrie, conventions partenaires) verser en Data Room sous 72h ?",
                  "hint": ""
                }
              ]
            }
          ]
        }
      }
    },
    "dajip": {
      "label": "Autonomisation des Jeunes & Insertion Pro — Dispositifs & données marché du travail",
      "dur": "90-120 min",
      "phases": {
        "invest": {
          "duration": "45-55 min",
          "sections": [
            {
              "title": "Dispositifs & parcours",
              "items": [
                {
                  "id": "daji_i_a1",
                  "q": "Quels dispositifs d'insertion (stages, formations, THIMO, entrepreneuriat) pilotez-vous et avec quels volumes ?",
                  "hint": ""
                },
                {
                  "id": "daji_i_a2",
                  "q": "Comment suivez-vous le parcours bénéficiaire de l'entrée à la sortie, et le suivi post-programme ?",
                  "hint": ""
                },
                {
                  "id": "daji_i_a3",
                  "q": "Comment mesurez-vous les taux de conversion (stage → emploi, formation → insertion) ?",
                  "hint": ""
                }
              ]
            },
            {
              "title": "Captation des données du marché du travail",
              "items": [
                {
                  "id": "daji_i_b1",
                  "q": "Quelles sources de données marché du travail exploitez-vous (offres d'emploi, secteurs porteurs, statistiques macro) et via quels partenaires (observatoire emploi, AEJ, secteur privé) ?",
                  "hint": ""
                },
                {
                  "id": "daji_i_b2",
                  "q": "Ces données sont-elles structurées, actualisées et exploitables pour orienter la décision ?",
                  "hint": ""
                },
                {
                  "id": "daji_i_b3",
                  "q": "Quel usage en faites-vous aujourd'hui pour cibler les dispositifs ?",
                  "hint": ""
                }
              ]
            },
            {
              "title": "Outils & douleurs",
              "items": [
                {
                  "id": "daji_i_c1",
                  "q": "Quels outils de suivi / reporting utilisez-vous et quelles données produisez-vous pour le Cabinet / les bailleurs ?",
                  "hint": ""
                },
                {
                  "id": "daji_i_c2",
                  "q": "Quels processus sont manuels et chronophages ?",
                  "hint": ""
                },
                {
                  "id": "daji_i_c3",
                  "q": "Quels points de douleur opérationnels majeurs rencontrez-vous ?",
                  "hint": ""
                }
              ]
            }
          ]
        },
        "confront": {
          "duration": "15-20 min",
          "sections": [
            {
              "title": "Confrontation CDC / captation marché du travail",
              "items": [
                {
                  "id": "daji_c_1",
                  "q": "La fonctionnalité « captation des données du marché du travail » du CDC est-elle alimentable par des sources fiables existantes ?",
                  "hint": ""
                },
                {
                  "id": "daji_c_2",
                  "q": "Quelles données partageriez-vous et lesquelles posent un obstacle (juridique, technique) ?",
                  "hint": ""
                }
              ]
            }
          ]
        },
        "coconstruct": {
          "duration": "10-15 min",
          "sections": [
            {
              "title": "Co-construction",
              "items": [
                {
                  "id": "daji_cc_1",
                  "q": "Quel indicateur consolidé d'insertion serait le plus utile au pilotage ?",
                  "hint": ""
                },
                {
                  "id": "daji_cc_2",
                  "q": "Quelles pièces (référentiel dispositifs, sources marché du travail) verser en Data Room sous 72h ?",
                  "hint": ""
                },
                {
                  "id": "daji_cc_3",
                  "q": "Quel référent métier / data associer à la construction ?",
                  "hint": ""
                }
              ]
            }
          ]
        }
      }
    }
  },
  "additions": [
    {
      "trame": "cabinet",
      "phase": "invest",
      "newSection": {
        "title": "D. IA & aide à la décision",
        "items": [
          {
            "id": "cab_i_d1",
            "q": "Parmi vos décisions récurrentes, lesquelles gagneraient à être anticipées par une analyse prédictive (risque de non-atteinte d'objectifs, retards de paiement) ?",
            "hint": ""
          },
          {
            "id": "cab_i_d2",
            "q": "Quel niveau de confiance accorderiez-vous à une recommandation automatique, et qui devrait la valider avant action ?",
            "hint": ""
          },
          {
            "id": "cab_i_d3",
            "q": "Pour l'assistant conversationnel (chatbot), quels usages prioritaires et quelles limites (langue, sujets sensibles) ?",
            "hint": ""
          }
        ]
      }
    },
    {
      "trame": "cabinet",
      "phase": "invest",
      "newSection": {
        "title": "E. Conduite du changement & antécédents",
        "items": [
          {
            "id": "cab_i_e1",
            "q": "Quels projets numériques antérieurs du Ministère ont réussi ou échoué, et quelles leçons en tirez-vous ?",
            "hint": ""
          },
          {
            "id": "cab_i_e2",
            "q": "Quelle capacité interne (équipe, budget) pour reprendre et maintenir la plateforme après le transfert du prestataire ?",
            "hint": ""
          },
          {
            "id": "cab_i_e3",
            "q": "Quel budget et quelle source de financement sont sécurisés pour la construction puis le fonctionnement (run) ?",
            "hint": ""
          }
        ]
      }
    },
    {
      "trame": "cabinet",
      "phase": "confront",
      "appendQuestions": [
        {
          "id": "cab_c_4",
          "q": "Le calendrier accéléré (2-3 mois) du CDC est-il tenable au regard de l'ambition IA et d'interopérabilité, ou faut-il un MVP resserré ?",
          "hint": ""
        }
      ],
      "sectionMatch": ""
    },
    {
      "trame": "dsi",
      "phase": "invest",
      "newSection": {
        "title": "E. IA, données d'entraînement & socle décisionnel",
        "items": [
          {
            "id": "dsi_i_e1",
            "q": "Quelle profondeur et qualité d'historique de données existe pour entraîner des modèles ML (années disponibles, complétude, format) ?",
            "hint": ""
          },
          {
            "id": "dsi_i_e2",
            "q": "Les données sont-elles centralisées et exploitables pour de l'analytique, ou dispersées et hétérogènes ?",
            "hint": ""
          },
          {
            "id": "dsi_i_e3",
            "q": "Quel datacenter national / cloud gouvernemental est disponible (opérateur, capacité, SLA, conditions), et avez-vous un contact identifié ?",
            "hint": ""
          },
          {
            "id": "dsi_i_e4",
            "q": "Quelle équipe data / MLOps pourrait opérer la couche IA côté Ministère après transfert ?",
            "hint": ""
          }
        ]
      }
    },
    {
      "trame": "tutelle",
      "phase": "invest",
      "appendQuestions": [
        {
          "id": "tut_i_c4",
          "q": "Qui est le payeur de référence de vos primes et par quel canal (Trésor, banque, mobile money) ?",
          "hint": ""
        },
        {
          "id": "tut_i_c5",
          "q": "Comment réconciliez-vous aujourd'hui paiement ↔ bénéficiaire ↔ comptabilité ?",
          "hint": ""
        }
      ],
      "sectionMatch": "C"
    },
    {
      "trame": "programme",
      "phase": "invest",
      "appendQuestions": [
        {
          "id": "prg_i_c3",
          "q": "Par quel canal vos primes sont-elles décaissées et la traçabilité va-t-elle jusqu'au bénéficiaire individuel ?",
          "hint": ""
        }
      ],
      "sectionMatch": "C"
    },
    {
      "trame": "terrain_dr",
      "phase": "invest",
      "appendQuestions": [
        {
          "id": "dr_i_a5",
          "q": "Au-delà du régional, quelle est la réalité des Directions Départementales de votre ressort (connectivité, équipement, remontées) ?",
          "hint": ""
        }
      ],
      "sectionMatch": "A"
    }
  ],
  "snowball": {
    "suffix": "_cc_snowball",
    "text": "Qui d'autre devrions-nous impérativement interroger pour compléter ce cadrage (personnes, structures, points focaux) ?"
  },
  "newTrameKeys": [
    "flotte",
    "drh",
    "marches",
    "daf",
    "dpsd",
    "dajc",
    "carte_jeunes",
    "dajip"
  ],
  "deprecated": "volet_b_np"
};

  const NEW_KEYS = PNIPM_PATCH.newTrameKeys || [];

  function snowballId(trameKey) {
    const prefixMap = {
      cabinet: "cab",
      dsi: "dsi",
      tutelle: "tut",
      programme: "prg",
      terrain_dr: "dr",
      flotte: "flot",
      drh: "drh",
      marches: "mp",
      daf: "daf",
      dpsd: "dps",
      dajc: "daj",
      carte_jeunes: "cj",
      dajip: "daji",
      technique: "tec",
      rssi: "rssi",
      dpo: "dpo",
    };
    const p = prefixMap[trameKey] || String(trameKey || "gen").slice(0, 4);
    return p + (PNIPM_PATCH.snowball.suffix || "_cc_snowball");
  }

  function ensureSnowball(tr) {
    if (!tr || !tr.phases || !tr.phases.coconstruct) return;
    const secs = tr.phases.coconstruct.sections;
    if (!secs.length) return;
    const last = secs[secs.length - 1];
    const sid = snowballId(tr._key);
    if ((last.items || []).some((it) => it.id === sid)) return;
    last.items.push({
      id: sid,
      q: PNIPM_PATCH.snowball.text,
      hint: "",
    });
  }

  function mergeAddition(trameKey, tr, add) {
    const ph = tr.phases[add.phase];
    if (!ph) return;
    if (add.newSection) {
      ph.sections.push(add.newSection);
      return;
    }
    if (add.appendQuestions && add.appendQuestions.length) {
      const match = (add.sectionMatch || "").toLowerCase();
      let target = ph.sections[ph.sections.length - 1];
      if (match) {
        target =
          ph.sections.find((s) => (s.title || "").toLowerCase().includes(match.toLowerCase())) ||
          target;
      }
      if (!target.items) target.items = [];
      add.appendQuestions.forEach((q) => {
        if (!target.items.some((it) => it.id === q.id)) target.items.push(q);
      });
    }
  }

  function patchTramesComplets() {
    if (!window.PortiaQuestionnairesComplets) return;
    const TC = PortiaQuestionnairesComplets.TRAMES_COMPLETS;
    if (!TC || TC._pnipmPatched) return;

    Object.keys(PNIPM_PATCH.newTrames || {}).forEach((k) => {
      const tr = JSON.parse(JSON.stringify(PNIPM_PATCH.newTrames[k]));
      tr._key = k;
      ensureSnowball(tr);
      TC[k] = tr;
    });

    (PNIPM_PATCH.additions || []).forEach((add) => {
      const tr = TC[add.trame];
      if (tr) mergeAddition(add.trame, tr, add);
    });

    Object.keys(TC).forEach((k) => {
      if (TC[k] && TC[k].phases) {
        TC[k]._key = k;
        ensureSnowball(TC[k]);
      }
    });

    if (PNIPM_PATCH.deprecated && TC[PNIPM_PATCH.deprecated]) {
      delete TC[PNIPM_PATCH.deprecated];
    }

    TC._pnipmPatched = true;
  }

  function patchTerrainTrames() {
    if (!window.TRAMES || !TRAMES.terrain_dr) return;
    const add = (PNIPM_PATCH.additions || []).find((a) => a.trame === "terrain_dr");
    if (!add || !add.appendQuestions) return;
    const tr = TRAMES.terrain_dr;
    if (!tr.phases || !tr.phases.invest) return;
    const secs = tr.phases.invest.sections || [];
    let target = secs.find((s) => /périmètre|organisation/i.test(s.title || "")) || secs[0];
    if (!target) return;
    if (!target.items) target.items = [];
    add.appendQuestions.forEach((q) => {
      if (!target.items.some((it) => it.id === q.id)) target.items.push(q);
    });
  }

  function patchResolve() {
    if (!window.PortiaQuestionnaires || !PortiaQuestionnaires.resolveTrameEntretien) return;
    if (PortiaQuestionnaires._pnipmResolvePatched) return;
    const orig =
      PortiaQuestionnaires._origResolveComplet ||
      PortiaQuestionnaires.resolveTrameEntretien.bind(PortiaQuestionnaires);

    PortiaQuestionnaires.resolveTrameEntretien = function (e) {
      const tr = e && e.trame;
      if (tr && NEW_KEYS.includes(tr)) return tr;
      const explicit = [
        "carte_jeunes",
        "daf",
        "dpsd",
        "dajc",
        "dajip",
        "flotte",
        "drh",
        "marches",
      ];
      if (explicit.includes(tr)) return tr;
      if (e.struct === "DRH") return "drh";
      if (e.struct === "Patrimoine") return "flotte";
      if (e.struct === "Marchés") return "marches";
      return orig(e);
    };
    PortiaQuestionnaires._pnipmResolvePatched = true;
  }

  function apply() {
    patchTramesComplets();
    patchTerrainTrames();
    patchResolve();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(apply, 50));
  } else {
    setTimeout(apply, 50);
  }

  window.PNIPMQuestionnairePatch = { apply, PNIPM_PATCH };

})();
