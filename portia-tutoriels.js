/**
 * Tutoriels visuels — Auditeurs & Administrateurs (mission CDC PNIPM)
 */
(function () {
  "use strict";

  const IMG = "tutoriels/captures";
  const IMG_V = "?v=skydeen-20260605c";

  const TUTO_AUDITEUR = {
    title: "Tutoriel Auditeur",
    subtitle: "Collecte terrain · entretiens · preuves · confrontation CDC",
    intro:
      "Ce parcours est réservé aux auditeurs terrain (profils A et L) : menus Collecte terrain + Analyse (checklist CDC, matrice d'écart en lecture seule, lacunes, qualité données, constats, prog./non-prog., volet B). Chaque action alimente la confrontation CDC ↔ réalité.",
    steps: [
      {
        n: 1,
        title: "Se connecter (profil Auditeur)",
        cdc: "Accès sécurisé à la mission confidentielle MPJIPSC / Skydeen.",
        img: IMG + "/auditeur/01-connexion.png" + IMG_V,
        cap: "Connexion — choisir « Auditeur », puis code mission, email et mot de passe.",
        faire: [
          "Sur l'écran d'accueil, sélectionner la carte **Auditeur** (pas Administrateur ni Cabinet).",
          "Cliquer Continuer, puis saisir le code mission, votre email et mot de passe.",
          "Saisir le code 2FA (6 chiffres) si votre compte l'exige — obligatoire après activation dans Réglages.",
        ],
        eviter: [
          "Ne pas utiliser le profil Administrateur (menus et droits différents).",
          "Ne pas partager le code mission hors canal sécurisé.",
        ],
        go: null,
      },
      {
        n: 2,
        title: "Mon espace — point d'entrée",
        cdc: "Vue d'accueil auditeur : prochain entretien, KPIs personnels, raccourcis collecte.",
        img: IMG + "/auditeur/02-menu-auditeur.png" + IMG_V,
        cap: "Espace auditeur A ou L — entretiens réalisés / planifiés, bouton Conduire.",
        faire: [
          "À chaque connexion, vous arrivez sur **Mon espace** (hub auditeur).",
          "Repérer le prochain entretien planifié et le compteur de réalisations.",
          "Utiliser le bouton « Conduire un entretien » pour accéder directement au questionnaire.",
        ],
        eviter: ["Ne pas ignorer les alertes lacunes affichées avant un entretien."],
        go: "hub_auditeur",
      },
      {
        n: 3,
        title: "Mes tâches — relances & actions mission",
        cdc: "Suivi des relances documentaires et des tâches assignées par le pilotage (ex. préparer un entretien).",
        img: IMG + "/auditeur/03-agenda.png" + IMG_V,
        cap: "Mes tâches — relances Data Room et tâches mission avec échéance et statut.",
        faire: [
          "Consulter **Mes tâches** chaque matin (badge si actions ouvertes).",
          "Filtrer **Mission** (actions libres) ou **Relances** (docs Data Room).",
          "Marquer **terminée** (✓) une fois l'action faite — alerte rouge si échéance dépassée.",
          "Escalader au pilotage en cas de blocage (vous ne créez pas de tâches vous-même).",
        ],
        eviter: ["Ne pas laisser une tâche en retard sans signalement au pilotage."],
        go: "taches",
      },
      {
        n: 4,
        title: "Documents mission — Cadrage & Charte",
        cdc: "Mandat, méthode et engagements réciproques MPJIPSC / Skydeen — référence avant chaque entretien.",
        img: IMG + "/admin/13-documents-mission.png" + IMG_V,
        cap: "Documents mission — onglets Cadrage, Charte COPIL, alignement CDC.",
        faire: [
          "Lire le **Cadrage** et la **Charte COPIL** avant la première semaine terrain.",
          "Consulter **Documents mission** pour le périmètre et les engagements de la mission.",
          "Revenir sur la Charte en cas de blocage accès données ou délai.",
        ],
        eviter: ["Ne pas improviser un entretien hors périmètre cadré sans validation COPIL."],
        go: "docs_mission",
      },
      {
        n: 5,
        title: "Mon agenda (S1 → S4)",
        cdc: "L'agenda matérialise le planning 4 semaines — chaque entretien couvre une exigence ou un acteur du CDC.",
        img: IMG + "/auditeur/03-agenda.png" + IMG_V,
        cap: "Vos entretiens assignés par semaine — filtrés sur votre code auditeur A ou L.",
        faire: [
          "Filtrer par semaine (S1, S2, S3, S4 terrain).",
          "Noter l'heure, la structure et la trame (Cabinet, DSI, terrain DR…).",
          "Cliquer un entretien → **Conduire** pour ouvrir le questionnaire.",
        ],
        eviter: ["Ne pas mélanger les entretiens de l'auditeur A et L si vous êtes seul connecté."],
        go: "agenda",
      },
      {
        n: 6,
        title: "Synchroniser son Google Agenda (ICS)",
        cdc: "Recevoir les créneaux mission (entretiens, COPIL, jalons) sur son calendrier Google personnel.",
        img: IMG + "/admin/02-planning.png" + IMG_V,
        cap: "Abonnement ICS — lien sécurisé fourni par le pilotage (pas de menu Planning côté auditeur).",
        faire: [
          "Demander au **pilotage** le lien ICS sécurisé de la mission (confidentiel).",
          "Dans Google Agenda → **+** → **À partir de l'URL** → coller le lien → valider.",
          "Le calendrier importé doit s'intituler **J0 06/07/2026** — si dates obsolètes, supprimer l'ancien abonnement puis réimporter.",
          "Renommer le calendrier (ex. « Mission PNIPM ») et vérifier vos entretiens A ou L aux bonnes dates.",
        ],
        eviter: [
          "Ne pas partager le lien ICS (jeton confidentiel).",
          "Ne pas déplacer un créneau uniquement dans Google — tout report passe par le pilotage.",
          "Le menu **Planning** éditable est réservé au pilotage ; utilisez **Mon agenda** sur la plateforme.",
        ],
        go: "agenda",
      },
      {
        n: 7,
        title: "Conduire un entretien — choisir la trame",
        cdc: "Les questionnaires 3 phases traduisent les exigences CDC en questions terrain.",
        img: IMG + "/auditeur/04-conduire-liste.png" + IMG_V,
        cap: "Liste des entretiens — sélectionner l'entretien du jour (statut planifié).",
        faire: [
          "Ouvrir **Conduire un entretien** depuis le menu ou Mon espace.",
          "Sélectionner l'entretien planifié du jour.",
          "Vérifier la trame affichée (DSI, terrain S4, volet B, RSSI/DPO…).",
        ],
        eviter: ["Ne pas mélanger les réponses de deux entretiens différents."],
        go: "conduct",
      },
      {
        n: 8,
        title: "Remplir le questionnaire 3 phases",
        cdc: "Investigation = comprendre · confrontation = écart CDC · co-construction = pistes de solution.",
        img: IMG + "/auditeur/05-questionnaire.png" + IMG_V,
        cap: "Saisie terrain — compléter chaque section pendant ou juste après l'entretien.",
        faire: [
          "Remplir phase par phase sans sauter de questions critiques.",
          "Citer les documents montrés (nom, répertoire R1–R11).",
          "Sauvegarder régulièrement (persistance serveur).",
          "En fin de séance : qualifier le niveau de preuve (déclaratif / documenté / observé).",
        ],
        eviter: [
          "Ne pas inventer de chiffres — utiliser [à confirmer] si besoin.",
          "Ne pas valider « observé » sans pièce ou démo.",
        ],
        go: "conduct",
      },
      {
        n: 9,
        title: "Data Room — verser et consulter",
        cdc: "Chaque exigence CDC doit être tranchée par une preuve versée et consultable en Data Room.",
        img: IMG + "/auditeur/06-depot.png" + IMG_V,
        cap: "Data Room — liste des documents, filtres, bouton Consulter sur les pièces versées.",
        faire: [
          "Ouvrir **Data Room** dans le menu Collecte terrain.",
          "Filtrer par répertoire R1→R11 ou par statut (Versés / Attendus).",
          "Cliquer **Consulter** sur un document versé pour l'aperçu.",
          "Verser une nouvelle pièce via la **zone de dépôt** en haut de la page Data Room (glisser-déposer).",
        ],
        eviter: [
          "Ne pas verser sans répertoire ni description.",
          "Les documents « Attendus » n'ont pas encore de fichier — normal tant qu'ils ne sont pas collectés.",
        ],
        go: "dataroom",
      },
      {
        n: 10,
        title: "Constats & observations",
        cdc: "Un constat = fait vérifiable alimentant la matrice d'écart — triangulation ≥ 2 sources.",
        img: IMG + "/auditeur/07-constats.png" + IMG_V,
        cap: "Constats terrain — créer ou compléter un finding après l'entretien.",
        faire: [
          "Créer un constat dès qu'un fait est confirmé.",
          "Indiquer axe (Politique / Programmatique / Technique), structure, criticité.",
          "Mentionner les sources (entretien + doc Data Room).",
          "Laisser en brouillon si la triangulation est incomplète.",
        ],
        eviter: ["Ne pas transformer une opinion en constat sans preuve."],
        go: "consaud",
      },
      {
        n: 11,
        title: "Lacunes collecte & Qualité données",
        cdc: "4 lacunes méthodologiques initiales + grille qualité des sources de données (L3).",
        img: IMG + "/admin/09-lacunes.png" + IMG_V,
        cap: "Lacunes (volet B, RSSI/DPO, qualité data, prog./non-prog.) et grille par source.",
        faire: [
          "Consulter **Lacunes collecte** avant les entretiens sensibles (DSI, DPSD, DRH).",
          "Cocher « comblée » quand trame + entretien + doc sont OK.",
          "Mettre à jour **Qualité données** après chaque échantillon ou export reçu.",
        ],
        eviter: ["Ne pas fermer une lacune sans preuve associée en Data Room."],
        go: "lacunes",
      },
      {
        n: 12,
        title: "Checklist CDC technique & Volet B",
        cdc: "48 points SI vérifiables + 4 domaines non-programmatiques (RH, GED, flotte, marchés).",
        img: IMG + "/admin/07-checklist-cdc.png" + IMG_V,
        cap: "Checklist technique point par point et tableau Volet B.",
        faire: [
          "Après un entretien DSI : renseigner les lignes **Checklist CDC tech.** concernées.",
          "Lier chaque point à une preuve (entretien, doc, démo).",
          "Mettre à jour **Volet B** après entretiens DRH, Patrimoine ou Marchés.",
        ],
        eviter: ["Ne pas cocher « conforme » sans preuve consultable."],
        go: "cdc_tech",
      },
      {
        n: 13,
        title: "Matrice d'écart CDC (lecture seule)",
        cdc: "48 exigences G-xx : confrontez ce que vous avez collecté au texte CDC et aux verdicts consolidés.",
        img: IMG + "/admin/05-matrice-ecart.png" + IMG_V,
        cap: "Matrice d'écart — consultation des exigences et écarts (sans modification des verdicts).",
        faire: [
          "Ouvrir **Matrice d'écart** après chaque entretien structurant.",
          "Repérer l'exigence G-xx liée à votre entretien et lire réalité observée / verdict.",
          "Croiser avec vos constats brouillons et la checklist technique.",
        ],
        eviter: ["Ne pas tenter de modifier un verdict — réservé au pilotage."],
        go: "ecart",
      },
      {
        n: 14,
        title: "Prog./Non-prog. & module programmatique",
        cdc: "Couverture des 7 domaines programmatiques du CDC — complément aux entretiens DPSD / Cabinet.",
        img: IMG + "/admin/09-lacunes.png" + IMG_V,
        cap: "Tableau programmatique — domaines couverts / à documenter.",
        faire: [
          "Consulter après entretiens sur l'offre de service et les politiques publiques.",
          "Mettre à jour les lignes concernées par vos observations terrain.",
          "Croiser avec **Lacunes collecte** (lacune prog./non-prog.).",
        ],
        eviter: ["Ne pas valider un domaine sans preuve en Data Room ou entretien."],
        go: "prognonprog",
      },
      {
        n: 15,
        title: "Assistant IA — discussions conservées",
        cdc: "L'IA aide à préparer questions, résumer un CR ou croiser constats/CDC — validation humaine obligatoire.",
        img: IMG + "/auditeur/08-assistant-ia.png" + IMG_V,
        cap: "Assistant IA — colonne Discussions à gauche, chat à droite, bouton Nouvelle discussion.",
        faire: [
          "Colonne **Discussions** : retrouver vos fils précédents (titre = première question).",
          "Cliquer **Nouvelle discussion** pour repartir sur un sujet vierge (ex. entretien DSI vs synthèse sécurité).",
          "Demander : « Questions confrontation DSI sur SSO et 2FA » ou « Synthèse des écarts sécurité ».",
          "Recouper systématiquement avec Data Room et questionnaire avant tout constat.",
        ],
        eviter: [
          "Ne jamais copier-coller une réponse IA comme constat validé sans vérification.",
          "Ne pas tout mélanger dans un seul fil — créer une nouvelle discussion par sujet si besoin.",
        ],
        go: "assistant",
      },
    ],
    recap: [
      "Chaque semaine : Mon espace → Mes tâches → Agenda → Entretiens conduits → Pièces versées (Data Room) → Constats brouillons.",
      "Mes tâches = relances docs + actions mission du pilotage — marquer terminée, alerter si échéance dépassée.",
      "Calendrier Google : lien ICS fourni par le pilotage (pas de menu Planning auditeur).",
      "Assistant IA : plusieurs discussions conservées — « Nouvelle discussion » pour un fil vierge.",
      "Menus auditeur : Collecte terrain (7 entrées) + Analyse (8 entrées) — matrice en lecture seule, pas de Cockpit ni Corbeille.",
      "En cas de blocage : escalader via pilotage (risque mission RQ-03).",
    ],
  };

  const TUTO_CABINET = {
    title: "Tutoriel Cabinet MPJIPSC",
    subtitle: "Lecture seule · synthèse mission · 7 vues autorisées",
    intro:
      "Ce parcours est réservé au Ministère (profil Cabinet) : consultation des indicateurs, constats, pièces probantes, cartographies et risques de la mission d'audit PNIPM. Aucune saisie ni modification n'est possible — utilisez ces vues pour préparer vos instances de pilotage et arbitrages.",
    steps: [
      {
        n: 1,
        title: "Se connecter (vue Ministère)",
        cdc: "Accès lecture seule aux livrables intermédiaires de l'audit de cadrage.",
        img: IMG + "/cabinet/01-connexion.png" + IMG_V,
        cap: "Connexion — choisir « Cabinet ministériel », puis code mission, email et mot de passe.",
        faire: [
          "Sur l'écran d'accueil, sélectionner la carte **Cabinet ministériel** (pas Administrateur ni Auditeur).",
          "Cliquer Continuer, puis saisir le code mission et le compte ministère (ex. rplurielles@gmail.com).",
          "Cliquer « Se connecter » — vous arrivez sur le Cockpit en lecture seule.",
        ],
        eviter: [
          "Ne pas utiliser un compte auditeur ou admin (menus et droits différents).",
          "Ne pas partager le code mission hors canal sécurisé.",
        ],
        go: null,
      },
      {
        n: 2,
        title: "Cockpit — synthèse exécutive",
        cdc: "Vue consolidée : où en est l'audit sur les 3 axes et la collecte de preuves ?",
        img: IMG + "/admin/01-cockpit.png" + IMG_V,
        cap: "KPIs mission, couverture Politique / Programmatique / Technique, alertes, frise 4 semaines.",
        faire: [
          "Ouvrir le Cockpit à chaque connexion.",
          "Lire les compteurs : entretiens réalisés, documents versés, constats, livrables.",
          "Repérer les alertes (docs attendus, risques ouverts, retards).",
          "Utiliser les liens rapides en bas de page vers Constats, Data Room ou Risques.",
        ],
        eviter: [
          "Ne pas ressaisir les chiffres ailleurs — exporter ou imprimer si besoin.",
          "Les boutons de saisie et d'édition sont désactivés (lecture seule).",
        ],
        go: "cockpit",
      },
      {
        n: 3,
        title: "Constats — faits établis",
        cdc: "Findings formalisés alimentant la restitution et le registre des risques.",
        img: IMG + "/admin/08-constats.png" + IMG_V,
        cap: "Liste des constats — criticité, axe, structure, sources triangulées.",
        faire: [
          "Filtrer par axe (Politique, Programmatique, Technique) si besoin.",
          "Ouvrir un constat pour lire le détail et les sources.",
          "Repérer les constats « majeurs » pour vos messages au Sponsor / COPIL.",
          "Exporter une ligne si votre secrétariat le demande (bouton export sur fiche).",
        ],
        eviter: ["Ne pas interpréter un brouillon auditeur comme validé — vérifier le workflow."],
        go: "constats",
      },
      {
        n: 4,
        title: "Data Room — pièces probantes",
        cdc: "Preuves versées par les structures (organigrammes, procédures, exports…) classées R1→R11.",
        img: IMG + "/admin/04-dataroom.png" + IMG_V,
        cap: "Répertoires documentaires — statuts versé / attendu, aperçu et téléchargement.",
        faire: [
          "Filtrer par répertoire (ex. R2 Cabinet, R4 DSI, R6 processus).",
          "Ouvrir un document pour lecture ou téléchargement.",
          "Croiser avec un constat : la pièce citée est-elle bien versée ?",
          "Consulter les checklists A–F depuis le Cockpit si relance en cours.",
        ],
        eviter: ["Ne pas demander de versement direct — passer par le pilotage Skydeen / MPJIPSC."],
        go: "dataroom",
      },
      {
        n: 5,
        title: "Écosystème — acteurs & interfaces",
        cdc: "Cartographie institutionnelle : Cabinet, directions, tutelles, programmes, bailleurs.",
        img: IMG + "/admin/01-cockpit.png" + IMG_V,
        cap: "Nœuds par type d'acteur — statut couvert / planifié / hors entretien.",
        faire: [
          "Parcourir les colonnes (Cabinet, directions, tutelles, programmes…).",
          "Cliquer un acteur pour voir les entretiens et liens associés.",
          "Identifier les entités encore « non couvertes » avant restitution.",
        ],
        eviter: ["Ne pas confondre avec la cartographie graphe (vue suivante)."],
        go: "eco",
      },
      {
        n: 6,
        title: "Carto interactive — graphe des flux",
        cdc: "Visualisation des dépendances données, projets et intégrations (DSI, AEJ, SIGFIP…).",
        img: IMG + "/admin/01-cockpit.png" + IMG_V,
        cap: "Graphe zoomable — filtres catégorie, criticité, liens entre nœuds.",
        faire: [
          "Utiliser les filtres pour isoler DSI, programmes ou tutelles.",
          "Zoomer sur un cluster (ex. interop, NNI, X-Road).",
          "Cliquer un nœud pour la fiche et les entretiens liés.",
        ],
        eviter: ["Lecture seule — pas de déplacement permanent des nœuds pour la mission."],
        go: "carto_graph",
      },
      {
        n: 7,
        title: "Géographie — déploiement territorial",
        cdc: "Représentation des entretiens terrain S4 (Abidjan + régions échantillon).",
        img: IMG + "/admin/01-cockpit.png" + IMG_V,
        cap: "Carte ou liste territoriale — sites audités et planifiés.",
        faire: [
          "Vérifier que les régions clés de la mission sont représentées.",
          "Cliquer une ville / DR pour lister les entretiens terrain.",
          "Préparer une question COPIL si un territoire stratégique manque.",
        ],
        eviter: ["Ne pas extrapoler au-delà des sites effectivement audités."],
        go: "geo",
      },
      {
        n: 8,
        title: "Risques — registre mission & solution",
        cdc: "Risques sur la collecte et le futur déploiement PNIPM — base arbitrages Comité Stratégique.",
        img: IMG + "/admin/10-risques.png" + IMG_V,
        cap: "Probabilité × impact, mitigation, statut ouvert / surveillé / maîtrisé.",
        faire: [
          "Prioriser les risques « ouverts » (ex. interop, qualité données, délais).",
          "Lire la mitigation proposée par le cabinet Skydeen.",
          "Croiser avec les constats et le Cockpit avant instance de pilotage.",
        ],
        eviter: ["Ne pas modifier le registre — demander une mise à jour au pilotage si besoin."],
        go: "risques",
      },
    ],
    recap: [
      "À chaque connexion : Cockpit → Constats saillants → Risques ouverts → Data Room si pièce citée.",
      "Cartographies (Écosystème, Carto interactive, Géographie) pour la vision système et territoriale.",
      "Profil lecture seule : pour toute correction ou relance, contacter le Directeur de Projet Audit (Skydeen).",
    ],
  };

  const TUTO_ADMIN = {
    title: "Tutoriel Administrateur / Pilotage",
    subtitle: "Pilotage 360° · confrontation CDC · COPIL · livrables",
    intro:
      "Ce parcours guide le Directeur de Projet Audit et l'équipe de pilotage pour mener la mission 4 semaines : de la collecte à la restitution, en lien direct avec le cahier des charges PNIPM et les 7 livrables contractuels.",
    steps: [
      {
        n: 1,
        title: "Cockpit — tableau de bord mission",
        cdc: "Vue consolidée : la mission avance-t-elle vers une réponse fiable au CDC ?",
        img: IMG + "/admin/01-cockpit.png" + IMG_V,
        cap: "KPIs, couverture 3 axes, alertes, frise 4 semaines.",
        faire: [
          "Ouvrir le Cockpit chaque matin.",
          "Lire les alertes (entretiens reportés, docs attendus, risques ouverts).",
          "Cliquer une alerte pour aller à la source.",
          "Préparer le COPIL avec les KPIs affichés.",
        ],
        eviter: ["Ne pas piloter sans regarder la couverture des 3 axes."],
        go: "cockpit",
      },
      {
        n: 2,
        title: "Planning 4 semaines",
        cdc: "Le CDC impose un cadrage accéléré — le planning verrouille S1→S4, COPIL et terrain.",
        img: IMG + "/admin/02-planning.png" + IMG_V,
        cap: "Frise opérationnelle — jalons, événements, export ICS.",
        faire: [
          "Vérifier la semaine courante et les jalons COPIL.",
          "Ajouter / modifier un événement si replanification.",
          "Exporter ICS pour convocations officielles.",
        ],
        eviter: ["Ne pas décaler un COPIL sans mise à jour ici et dans Gouvernance."],
        go: "planning",
      },
      {
        n: 3,
        title: "Piloter les 48 entretiens",
        cdc: "Chaque exigence CDC doit être confrontée à au moins une source terrain (entretien ou focus group).",
        img: IMG + "/admin/03-entretiens.png" + IMG_V,
        cap: "Programme complet — statut, axe, qualification, triangulation.",
        faire: [
          "Filtrer par statut « planifié » / « réalisé ».",
          "Vérifier qualification et triangulation après chaque séance.",
          "Replanifier les reportés avant le COPIL.",
          "Utiliser les liens contextuels vers Data Room et constats.",
        ],
        eviter: ["Ne pas clôturer S2 si des entretiens structurants DSI/Cabinet manquent."],
        go: "entretiens",
      },
      {
        n: 4,
        title: "Data Room — exiger les preuves",
        cdc: "Sans pièce versée, un écart CDC reste « À compléter » — la Data Room est le chaînon audit trail.",
        img: IMG + "/admin/04-dataroom.png" + IMG_V,
        cap: "Répertoires R1→R11 — statuts versé / attendu / relance.",
        faire: [
          "Filtrer les documents « attendus ».",
          "Relancer les structures depuis les checklists A–F.",
          "Ouvrir chaque pièce versée pour contrôle qualité.",
          "Lier mentalement chaque doc aux gaps G-xx concernés.",
        ],
        eviter: ["Ne pas valider un gap « Confirmé » sans preuve Data Room ou entretien documenté."],
        go: "dataroom",
      },
      {
        n: 5,
        title: "Matrice d'écart CDC ↔ réalité",
        cdc: "Cœur de l'audit : chaque exigence du cahier des charges confrontée au terrain — base du livrable L4.",
        img: IMG + "/admin/05-matrice-ecart.png" + IMG_V,
        cap: "48 exigences — verdicts Confirmé / À ajuster / À compléter / Caduc + colonne Preuves.",
        faire: [
          "Filtrer par verdict « À compléter » en priorité.",
          "Mettre à jour la réalité observée après chaque COPIL.",
          "Attribuer un verdict argumenté (pas de défaut).",
          "Exporter la matrice pour L4.",
        ],
        eviter: ["Ne pas laisser 100 % des gaps en « À compléter » en fin S3."],
        go: "ecart",
      },
      {
        n: 6,
        title: "Traçabilité preuve sur un gap",
        cdc: "Chaque ligne G-xx doit renvoyer vers entretiens, documents et constats — sinon l'écart n'est pas auditable.",
        img: IMG + "/admin/06-matrice-preuves.png" + IMG_V,
        cap: "Fiche gap — section PREUVES & SOURCES avec liens cliquables.",
        faire: [
          "Cliquer une ligne de la matrice.",
          "Vérifier les preuves auto-détectées.",
          "Compléter par un versement ou entretien si vide.",
          "Utiliser « Data Room filtrée » ou « Déposer une preuve ».",
        ],
        eviter: ["Ne pas porter un écart au Comité Stratégique sans sources listées."],
        go: "ecart",
      },
      {
        n: 7,
        title: "Checklist technique CDC (48 points SI)",
        cdc: "Vue opérationnelle complémentaire : architecture, données, interop, sécurité, perf, IA…",
        img: IMG + "/admin/07-checklist-cdc.png" + IMG_V,
        cap: "Vérification point par point — couverture, preuve, notes.",
        faire: [
          "Parcourir les 48 points avant restitution.",
          "Renseigner preuve (doc, entretien DSI, démo).",
          "Marquer couverture : conforme / partiel / non / N/A.",
          "Croiser avec la matrice via « Matrice & preuves liées ».",
        ],
        eviter: ["Ne pas cocher « conforme » sans démonstration."],
        go: "cdc_tech",
      },
      {
        n: 8,
        title: "Constats & triangulation",
        cdc: "Les constats formalisent ce que la matrice résume — alimentent L2 et le registre des risques.",
        img: IMG + "/admin/08-constats.png" + IMG_V,
        cap: "Findings validés — criticité, axe, sources, lien gap.",
        faire: [
          "Relire les constats brouillons des auditeurs chaque vendredi.",
          "Exiger ≥ 2 sources pour validation.",
          "Lier explicitement au gap CDC (G-xx) si applicable.",
          "Passer en workflow « validé » avant restitution.",
        ],
        eviter: ["Ne pas dupliquer un constat déjà couvert par un gap confirmé."],
        go: "constats",
      },
      {
        n: 9,
        title: "Lacunes collecte (méthode)",
        cdc: "4 sujets initialement absents : volet B, RSSI/DPO, qualité données, prog./non-prog. — liés G-14, G-46, G-47, G-48.",
        img: IMG + "/admin/09-lacunes.png" + IMG_V,
        cap: "Suivi des lacunes méthodologiques comblées ou en cours.",
        faire: [
          "Cocher « comblée » quand trame + entretien + doc OK.",
          "Vérifier entretiens S3 DRH / Patrimoine / Marchés.",
          "Orienter les auditeurs vers les trames dédiées.",
        ],
        eviter: ["Ne pas oublier le volet B (exigence CDC § Fonc. 3.9)."],
        go: "lacunes",
      },
      {
        n: 10,
        title: "Registre des risques",
        cdc: "Risques mission (collecte) et solution (déploiement PNIPM) — base livrable L5.",
        img: IMG + "/admin/10-risques.png" + IMG_V,
        cap: "8 risques — probabilité × impact, mitigation, statut.",
        faire: [
          "Prioriser les statuts « ouvert » (ex. RQ-05 X-Road, RQ-02 Data Room).",
          "Mettre à jour mitigation après chaque COPIL.",
          "Lier aux gaps (RQ-05 ↔ G-03 interop UXP).",
        ],
        eviter: ["Ne pas présenter un risque critique sans mitigation actuelle."],
        go: "risques",
      },
      {
        n: 11,
        title: "Livrables L1 → L7",
        cdc: "Chaîne de restitution contractuelle — du cadrage au rapport final et feuille de route.",
        img: IMG + "/admin/11-livrables.png" + IMG_V,
        cap: "Avancement % — génération IA + validation humaine.",
        faire: [
          "Générer brouillon IA quand les données Cockpit sont à jour.",
          "Utiliser « Contrôle IA » (OpenAI) pour relecture.",
          "Valider humainement avant statut « Validé ».",
          "Prioriser L4 (matrice) et L5 (risques) avant Comité Stratégique.",
        ],
        eviter: ["Ne pas valider L7 si la matrice ou la Data Room est incomplète."],
        go: "livrables",
      },
      {
        n: 12,
        title: "Gouvernance & COPIL",
        cdc: "Instances de pilotage — charte signée, PV, décisions, actions réciproques MPJIPSC/Skydeen.",
        img: IMG + "/admin/12-gouvernance.png" + IMG_V,
        cap: "Lancement, COPIL hebdo, Comité Stratégique, remise.",
        faire: [
          "Avant COPIL : mettre à jour PV et liste d'actions.",
          "Après COPIL : statut « tenu », décisions actées.",
          "Tracer les relances Data Room comme actions.",
        ],
        eviter: ["Ne pas tenir un COPIL sans mise à jour préalable du Cockpit."],
        go: "gouv",
      },
      {
        n: 13,
        title: "Documents mission & CDC source",
        cdc: "Référentiel contractuel — cadrage, agenda, charte, texte CDC importé.",
        img: IMG + "/admin/13-documents-mission.png" + IMG_V,
        cap: "Onglets Cadrage, Agenda, Charte, CDC — base de toute confrontation.",
        faire: [
          "Consulter le CDC avant de trancher un gap.",
          "Vérifier que l'agenda S1–S4 est aligné avec le planning.",
          "Diffuser la charte COPIL aux nouveaux intervenants.",
        ],
        eviter: ["Ne pas modifier le CDC sans versionner (import .docx)."],
        go: "docs_mission",
      },
    ],
    recap: [
      "Boucle hebdomadaire : Cockpit → COPIL → Entretiens/Data Room → Matrice → Risques → Livrables.",
      "Règle d'or CDC : pas de verdict sans preuve · pas de livrable sans données · pas de restitution sans matrice.",
      "Exporter régulièrement (matrice, constats, risques) pour archivage mission.",
    ],
  };

  function stepHtml(s, role) {
    const canGo = s.go && (!window.App || !App.allowed || App.allowed(s.go));
    const goBtn = canGo
      ? `<button type="button" class="btn terra sm tuto-go" data-go="${esc(s.go)}">Ouvrir cette vue →</button>`
      : "";
    const faire = s.faire.map((x) => `<li>${esc(x)}</li>`).join("");
    const eviter = s.eviter.map((x) => `<li>${esc(x)}</li>`).join("");
    return `<article class="tuto-step" id="tuto-step-${s.n}">
      <div class="tuto-step-hd">
        <span class="tuto-num">${s.n}</span>
        <div><h3>${esc(s.title)}</h3>
          <div class="tuto-cdc"><b>Lien CDC :</b> ${esc(s.cdc)}</div></div>
      </div>
      <figure class="tuto-fig">
        <img src="${esc(s.img)}" alt="${esc(s.title)}" loading="lazy" />
        <figcaption>${esc(s.cap)}</figcaption>
      </figure>
      <div class="tuto-cols">
        <div class="tuto-box ok"><div class="tuto-box-h">À faire</div><ul>${faire}</ul></div>
        <div class="tuto-box warn"><div class="tuto-box-h">À éviter</div><ul>${eviter}</ul></div>
      </div>
      ${goBtn}
    </article>`;
  }

  function renderTuto(data, role) {
    const v = el("div", { class: "view tuto-view" });
    const toc = data.steps.map((s) => `<a href="#tuto-step-${s.n}" class="tuto-toc-i">${s.n}. ${esc(s.title)}</a>`).join("");
    const steps = data.steps.map((s) => stepHtml(s, role)).join("");
    const recap = data.recap.map((x) => `<li>${esc(x)}</li>`).join("");
    const recapTitle =
      role === "cabinet"
        ? "Récapitulatif — consulter efficacement la mission"
        : role === "auditeur"
          ? "Récapitulatif — exécuter la collecte terrain"
          : "Récapitulatif — exécuter la mission parfaitement";
    v.innerHTML =
      pageHead("Formation", data.title, data.intro, "") +
      `<div class="tuto-layout">
        <nav class="tuto-toc card"><div class="card-h"><h3>Sommaire</h3></div><div class="card-b">${toc}</div></nav>
        <div class="tuto-main">
          <div class="note terra tuto-banner"><b>Mission PNIPM · audit de cadrage CDC</b> — ${esc(data.subtitle)}</div>
          ${steps}
          <div class="card tuto-recap"><div class="card-h"><h3>${esc(recapTitle)}</h3></div><div class="card-b"><ul class="tuto-recap-list">${recap}</ul></div></div>
        </div>
      </div>`;
    v.querySelectorAll(".tuto-go").forEach((b) => {
      b.onclick = () => App.go(b.dataset.go);
    });
    v.querySelectorAll(".tuto-toc a").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const id = (a.getAttribute("href") || "").replace(/^#/, "");
        const target = v.querySelector("#" + CSS.escape(id)) || document.getElementById(id);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    if (window.PortiaA11y && PortiaA11y.applyTips) setTimeout(() => PortiaA11y.applyTips(v), 50);
    return v;
  }

  const FOOT_HELP = {
    admin: [
      { k: "tuto_admin", lbl: "Tutoriel", title: "Tutoriel pilotage" },
      { k: "guide", lbl: "Guide", title: "Guide d'emploi" },
    ],
    auditeur: [
      { k: "tuto_auditeur", lbl: "Tutoriel", title: "Tutoriel auditeur" },
      { k: "guide", lbl: "Guide", title: "Guide d'emploi auditeur" },
    ],
    cabinet: [
      { k: "tuto_cabinet", lbl: "Tutoriel", title: "Tutoriel Cabinet" },
      { k: "guide", lbl: "Guide", title: "Guide d'emploi Cabinet" },
    ],
  };

  function stripHelpFromNav() {
    if (!window.NAV) return;
    ["tuto_auditeur", "tuto_admin", "tuto_cabinet", "guide"].forEach((key) => {
      Object.keys(NAV).forEach((role) => {
        (NAV[role] || []).forEach((sec) => {
          if (sec.items) sec.items = sec.items.filter((x) => x.k !== key);
        });
      });
    });
  }

  function patchNavFooter() {
    if (!window.App || App._tutoFootPatched) return;
    const orig = App.renderNav.bind(App);
    App.renderNav = function () {
      orig();
      const help = document.querySelector(".nav-foot-help");
      if (!help || !this.user) return;
      help.innerHTML = "";
      const entries = FOOT_HELP[this.user.role] || [];
      entries.forEach((e) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "nav-act";
        btn.dataset.help = e.k;
        btn.title = e.title || e.lbl;
        btn.innerHTML = `${svgI(ICON.assistant)}<span class="nav-lbl">${esc(e.lbl)}</span>`;
        btn.onclick = () => App.go(e.k);
        help.appendChild(btn);
      });
    };
    App._tutoFootPatched = true;
  }

  function patchAllowed() {
    if (!window.App || App._tutoAllowedPatched) return;
    const orig = App.allowed.bind(App);
    App.allowed = function (k) {
      const role = this.user && this.user.role;
      if (k === "guide") return role === "admin" || role === "auditeur" || role === "cabinet";
      if (k === "tuto_admin") return role === "admin";
      if (k === "tuto_auditeur") return role === "auditeur";
      if (k === "tuto_cabinet") return role === "cabinet";
      return orig(k);
    };
    App._tutoAllowedPatched = true;
  }

  function patchNav() {
    stripHelpFromNav();
    CRUMB.tuto_auditeur = "Tutoriel auditeur";
    CRUMB.tuto_admin = "Tutoriel pilotage";
    CRUMB.tuto_cabinet = "Tutoriel Cabinet";
  }

  function init() {
    VIEWS.tuto_auditeur = () => renderTuto(TUTO_AUDITEUR, "auditeur");
    VIEWS.tuto_admin = () => renderTuto(TUTO_ADMIN, "admin");
    VIEWS.tuto_cabinet = () => renderTuto(TUTO_CABINET, "cabinet");
    patchNav();
    patchAllowed();
    patchNavFooter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(init, 120));
  } else {
    setTimeout(init, 120);
  }

  window.PortiaTutoriels = { TUTO_AUDITEUR, TUTO_ADMIN, TUTO_CABINET };
})();
