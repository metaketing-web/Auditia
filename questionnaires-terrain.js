/**
 * Questionnaires complets — Phase audit terrain (Semaine 4)
 * Étend TRAMES et résout la trame selon le type d'entretien.
 */
(function () {
  "use strict";

  const Q = (id, q, hint) => ({ id, q, hint: hint || "" });
  const SEC = (title, items) => ({ title, items });

  const TRAMES_TERRAIN = {
    terrain_dr: {
      label: "Direction régionale — Pilotage & gouvernance locale",
      dur: "90 min",
      phases: {
        invest: {
          duration: "40-50 min",
          sections: [
            SEC("A. Périmètre & organisation régionale", [
              Q("dr_i_a1", "Quel est le périmètre exact de votre direction régionale (structures, programmes, effectifs) ?"),
              Q("dr_i_a2", "Quels dispositifs jeunesse sont actifs dans la région et avec quels volumes (inscriptions, sorties, en cours) ?"),
              Q("dr_i_a3", "Comment s'organise la relation avec le siège (Abidjan) : arbitrages, validations, délais de réponse ?"),
              Q("dr_i_a4", "Disposez-vous d'un tableau de bord régional consolidé aujourd'hui ? Si oui, lequel ; sinon, comment pilotez-vous ?"),
            ]),
            SEC("B. Données & remontées vers le central", [
              Q("dr_i_b1", "Quels outils utilisez-vous pour la saisie et le suivi (applications, Excel, papier) ?"),
              Q("dr_i_b2", "À quelle fréquence et par quel canal les données remontent-elles au central ?"),
              Q("dr_i_b3", "Quels indicateurs régionaux suivez-vous et sont-ils alignés avec ceux du Cabinet ?"),
              Q("dr_i_b4", "Où constatez-vous des retards, ressaisies ou pertes d'information dans la chaîne ?"),
            ]),
            SEC("C. Connectivité & contraintes terrain", [
              Q("dr_i_c1", "Quelle est la qualité réelle du réseau sur vos sites (4G, fibre, coupures) ?"),
              Q("dr_i_c2", "Avez-vous déjà pratiqué un mode déconnecté ou une synchronisation différée ? Résultat ?"),
              Q("dr_i_c3", "Quels équipements (PC, tablettes, smartphones) sont disponibles pour les agents ?"),
            ]),
            SEC("D. Paiements & traçabilité locale", [
              Q("dr_i_d1", "Comment sont gérés localement les paiements de primes / indemnités (circuit, délais) ?"),
              Q("dr_i_d2", "Existe-t-il une traçabilité nominative bénéficiaire → paiement ? À quel niveau de fiabilité ?"),
              Q("dr_i_d3", "Quels litiges ou réclamations récurrents observez-vous ?"),
            ]),
          ],
        },
        confront: {
          duration: "15-20 min",
          sections: [
            SEC("Confrontation CDC / réalité régionale", [
              Q("dr_c_1", "Le CDC prévoit une vision consolidée temps réel pour le Cabinet — votre région peut-elle l'alimenter sans surcharge ?"),
              Q("dr_c_2", "L'identifiant unique bénéficiaire (NNI ou équivalent) est-il utilisable sur le terrain aujourd'hui ?"),
              Q("dr_c_3", "Le mode offline-first avec synchro est-il indispensable pour vos agents ? Pour quels cas d'usage ?"),
              Q("dr_c_4", "Quelles exigences du CDC vous semblent inadaptées à la réalité régionale ?"),
            ]),
          ],
        },
        coconstruct: {
          duration: "10-15 min",
          sections: [
            SEC("Co-construction & priorités", [
              Q("dr_cc_1", "Quels 2-3 quick wins régionaux amélioreraient immédiatement le pilotage ?"),
              Q("dr_cc_2", "Quelles conditions d'adoption par vos équipes (formation, SOP, support) ?"),
              Q("dr_cc_3", "Quels interlocuteurs centraux doivent être impliqués pour lever vos blocages ?"),
              Q("dr_cc_4", "Quelles pièces probantes pouvez-vous verser en Data Room (R11) sous 48h ?"),
            ]),
          ],
        },
      },
    },

    terrain_demo: {
      label: "Chefs de service & démonstration écran",
      dur: "90-120 min",
      phases: {
        invest: {
          duration: "50-60 min",
          sections: [
            SEC("A. Démonstration des outils en usage", [
              Q("dm_i_a1", "Quels écrans / applications démontrez-vous aujourd'hui (nom, version, éditeur) ?"),
              Q("dm_i_a2", "Parcours type : de la saisie d'un bénéficiaire jusqu'au reporting — décrivez étape par étape."),
              Q("dm_i_a3", "Où sont stockées les données (local, serveur régional, central) ?"),
              Q("dm_i_a4", "Captures d'écran ou exports possibles à verser en Data Room (R7) ?"),
            ]),
            SEC("B. Qualité des données saisies", [
              Q("dm_i_b1", "Quels champs obligatoires et contrôles de cohérence existent dans vos outils ?"),
              Q("dm_i_b2", "Quels doublons ou incohérences détectez-vous régulièrement ?"),
              Q("dm_i_b3", "Comment corrigez-vous une erreur après validation / clôture ?"),
              Q("dm_i_b4", "Existe-t-il un référentiel territorial normalisé dans la saisie ?"),
            ]),
            SEC("C. Habilitations & sécurité", [
              Q("dm_i_c1", "Comment sont créés / révoqués les comptes agents ?"),
              Q("dm_i_c2", "Y a-t-il des profils différenciés (lecture, saisie, validation) ?"),
              Q("dm_i_c3", "Avez-vous des traces d'audit (qui a modifié quoi, quand) ?"),
            ]),
            SEC("D. Performance & incidents", [
              Q("dm_i_d1", "Temps de réponse perçu, plantages, lenteurs aux heures de pointe ?"),
              Q("dm_i_d2", "Incidents majeurs des 12 derniers mois et résolution ?"),
              Q("dm_i_d3", "Procédure de support (interne DSI, prestataire) ?"),
            ]),
          ],
        },
        confront: {
          duration: "15-20 min",
          sections: [
            SEC("Écarts outils vs cible PNIPM", [
              Q("dm_c_1", "Vos outils permettent-ils un drill-down jusqu'au bénéficiaire pour le Cabinet ?"),
              Q("dm_c_2", "Interopérabilité SIGFIP / UXP / NNI : tentatives, échecs, blocages ?"),
              Q("dm_c_3", "Le SSO et la 2FA sont-ils envisageables sur votre périmètre ?"),
              Q("dm_c_4", "Quelles fonctionnalités du CDC sont absentes de vos écrans actuels ?"),
            ]),
          ],
        },
        coconstruct: {
          duration: "10-15 min",
          sections: [
            SEC("Pistes d'amélioration", [
              Q("dm_cc_1", "Quelle évolution minimale de l'existant donnerait le plus de valeur ?"),
              Q("dm_cc_2", "Quels exports automatisés vers la plateforme cible seraient acceptables ?"),
              Q("dm_cc_3", "Besoins de formation des agents sur un nouvel outil ?"),
            ]),
          ],
        },
      },
    },

    terrain_agents: {
      label: "Agents de saisie & opérateurs (collectif)",
      dur: "60-90 min",
      phases: {
        invest: {
          duration: "35-45 min",
          sections: [
            SEC("A. Pratiques quotidiennes", [
              Q("ag_i_a1", "Combien de dossiers / bénéficiaires traitez-vous en moyenne par jour ?"),
              Q("ag_i_a2", "Quelle est la durée moyenne d'une saisie complète ?"),
              Q("ag_i_a3", "Travaillez-vous plutôt sur PC, tablette ou smartphone ? En agence ou en mobilité ?"),
              Q("ag_i_a4", "Quelles étapes vous semblent inutiles ou redondantes dans le processus actuel ?"),
            ]),
            SEC("B. Difficultés & contournements", [
              Q("ag_i_b1", "Quels champs posez-vous difficilement (manque d'info, règles floues) ?"),
              Q("ag_i_b2", "Utilisez-vous des contournements (cahiers, Excel personnel, WhatsApp) ? Lesquels et pourquoi ?"),
              Q("ag_i_b3", "Que faites-vous en cas de coupure réseau ou panne outil ?"),
              Q("ag_i_b4", "Avez-vous déjà perdu des données ? Dans quel contexte ?"),
            ]),
            SEC("C. Relation bénéficiaire", [
              Q("ag_i_c1", "Comment vérifiez-vous l'identité du jeune (pièce, NNI, autre) ?"),
              Q("ag_i_c2", "Comment informez-vous le bénéficiaire du suivi de sa prime / indemnité ?"),
              Q("ag_i_c3", "Quelles questions reviennent le plus souvent des bénéficiaires ?"),
            ]),
          ],
        },
        confront: {
          duration: "10-15 min",
          sections: [
            SEC("Confrontation avec la cible PNIPM", [
              Q("ag_c_1", "Un formulaire unique mobile simplifierait-il votre travail ? Quels écrans regrouper ?"),
              Q("ag_c_2", "Accepteriez-vous une synchronisation automatique si la connexion revient ?"),
              Q("ag_c_3", "Qu'est-ce qui vous ferait refuser un nouvel outil ?"),
            ]),
          ],
        },
        coconstruct: {
          duration: "10 min",
          sections: [
            SEC("Propositions terrain", [
              Q("ag_cc_1", "Quelle amélioration prioritaire pour votre poste de travail ?"),
              Q("ag_cc_2", "Quelle formation serait nécessaire (durée, format) ?"),
              Q("ag_cc_3", "Un numéro court / support dédié serait-il utile ?"),
            ]),
          ],
        },
      },
    },

    focusgroup: {
      label: "Focus group bénéficiaires jeunes (10-15 pers.)",
      dur: "90 min",
      phases: {
        invest: {
          duration: "45-55 min",
          sections: [
            SEC("A. Parcours d'entrée dans le dispositif", [
              Q("fg_i_a1", "Comment avez-vous connu le programme (bouche-à-oreille, agence, en ligne) ?"),
              Q("fg_i_a2", "Quelles démarches administratives avez-vous dû faire (documents, délais, allers-retours) ?"),
              Q("fg_i_a3", "Avez-vous été orienté vers d'autres dispositifs en parallèle ? Lesquels ?"),
            ]),
            SEC("B. Expérience pendant le dispositif", [
              Q("fg_i_b1", "Qu'attendiez-vous au départ et qu'avez-vous réellement obtenu ?"),
              Q("fg_i_b2", "Comment évaluez-vous l'accompagnement humain (formateurs, agents) ?"),
              Q("fg_i_b3", "Avez-vous utilisé des outils numériques (Carte Jeunes, plateforme, mobile money) ? Lesquels ?"),
            ]),
            SEC("C. Primes, indemnités & transparence", [
              Q("fg_i_c1", "Avez-vous reçu les primes / indemnités prévues ? En combien de temps ?"),
              Q("fg_i_c2", "Savez-vous calculer ce qui vous est dû et comment réclamer en cas de retard ?"),
              Q("fg_i_c3", "Avez-vous connu des refus ou blocages ? Pour quelle raison affichée ?"),
            ]),
            SEC("D. Après le dispositif", [
              Q("fg_i_d1", "Bénéficiez-vous d'un suivi post-programme (emploi, insertion) ?"),
              Q("fg_i_d2", "Recommanderiez-vous le dispositif à un pair ? Pourquoi oui / non ?"),
            ]),
          ],
        },
        confront: {
          duration: "15 min",
          sections: [
            SEC("Attentes vis-à-vis d'un service numérique unique", [
              Q("fg_c_1", "Seriez-vous à l'aise pour suivre votre dossier via une application mobile ?"),
              Q("fg_c_2", "Quelles informations voudriez-vous voir en priorité (statut, paiement, prochaine étape) ?"),
              Q("fg_c_3", "Quelles craintes (fraude, données personnelles, complexité) ?"),
            ]),
          ],
        },
        coconstruct: {
          duration: "10-15 min",
          sections: [
            SEC("Propositions des bénéficiaires", [
              Q("fg_cc_1", "Quelle amélioration concrète aurait le plus d'impact pour vous ?"),
              Q("fg_cc_2", "Préférez-vous agence physique, téléphone, SMS, WhatsApp ou application ?"),
              Q("fg_cc_3", "Un numéro unique d'assistance serait-il utile ? Quels horaires ?"),
            ]),
          ],
        },
      },
    },
  };

  function resolveTrameEntretien(e) {
    if (!e) return "direction";
    if (e.trame === "focusgroup") return "focusgroup";
    const n = (e.n || "").toLowerCase();
    if (e.couche === "Terrain" || e.sem === 4) {
      if (n.includes("focus group") || e.struct === "Bénéficiaires") return "focusgroup";
      if (n.includes("démo") || n.includes("demo") || n.includes("chefs")) return "terrain_demo";
      if (n.includes("agents") || n.includes("opérateurs") || n.includes("operateurs"))
        return "terrain_agents";
      if (n.includes("directeur régional") || n.includes("regional")) return "terrain_dr";
    }
    return e.trame || "direction";
  }

  function getTrameForEntretien(e) {
    const key = resolveTrameEntretien(e);
    const base = window.TRAMES && window.TRAMES[key];
    const ext = TRAMES_TERRAIN[key];
    if (ext && ext.phases) return ext;
    return base || window.TRAMES.direction;
  }

  function isStructuredTrame(tr) {
    return !!(tr && tr.phases);
  }

  function getPhaseSections(tr, phaseKey) {
    if (!tr || !tr.phases || !tr.phases[phaseKey]) return [];
    return tr.phases[phaseKey].sections || [];
  }

  function flattenAnswersToNotes(answers) {
    let s = "";
    ["invest", "confront", "coconstruct"].forEach((ph) => {
      const block = answers[ph];
      if (!block || !Object.keys(block).length) return;
      s += `\n=== ${ph.toUpperCase()} ===\n`;
      Object.entries(block).forEach(([id, val]) => {
        if (val && String(val).trim()) s += `[${id}] ${String(val).trim()}\n`;
      });
    });
    return s.trim();
  }

  function mergeTramesIntoGlobal() {
    if (!window.TRAMES) return;
    Object.assign(window.TRAMES, TRAMES_TERRAIN);
  }

  mergeTramesIntoGlobal();

  window.PortiaQuestionnaires = {
    resolveTrameEntretien,
    getTrameForEntretien,
    isStructuredTrame,
    getPhaseSections,
    flattenAnswersToNotes,
    TRAMES_TERRAIN,
  };
})();
