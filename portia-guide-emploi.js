/**
 * Guide d'emploi complet — 5 colonnes (objet audité / questions / mode d'emploi)
 */
(function () {
  "use strict";

  const GUIDE = [
    {
      section: "Section « Pilotage » — collecte & conformité",
      rows: [
        ["Pilotage (titre de section)", "—",
          "Regroupe les vues d'administration 360° : suivi opérationnel de la mission 4 semaines, pas le contenu métier lui-même.",
          "Où en est-on globalement ? Quelles rubriques ouvrir en priorité pour le COPIL ou le pilotage ?",
          "Menu gauche, section du haut. Parcourir de haut en bas avant chaque COPIL. Sidebar réductible (flèche) : pictos seuls sur petit écran."],
        ["Cockpit", "KPIs temps réel",
          "Avancement consolidé : entretiens, Data Room, constats, livrables, couverture des 3 axes (Politique / Programmatique / Technique), triangulation des preuves, alertes (relances, risques, entretiens reportés), frise 4 semaines.",
          "La mission est-elle dans les clous ? Quels axes sont sous-investigés ? Quelles alertes escalader au COPIL ? Faut-il une note hebdo (IA) ?",
          "Ouvrir chaque matin. Cliquer une alerte → source (constat, doc, entretien). Bandeau risques ouverts en haut. Tags bas de page : Entretiens, Data Room, Matrice, Lacunes, COPIL…"],
        ["Tâches équipe", "Relances + mission",
          "Vue pilotage : relances Data Room et tâches mission créées manuellement (ex. préparer entretien DSI) — création, réouverture, filtre en retard.",
          "Quelles actions sont ouvertes pour l'équipe ? Qui est en retard sur une échéance ?",
          "Menu Tâches équipe (admin). Bouton « Nouvelle tâche » ou depuis Entretiens / Planning. Filtre « En retard ». Réouvrir une tâche terminée si besoin."],
        ["Affectations A/L", "48 entretiens",
          "Répartition de charge entre auditeur B, auditeur T et binômes B+T ; lead par entretien.",
          "La couverture est-elle équilibrée ? Qui conduit quel entretien ? Y a-t-il surcharge d'un auditeur sur un axe ou une semaine ?",
          "Menu Documents mission → Affectations. Filtrer par semaine/axe. Assigner B, T ou B+T. Enregistrer. Revenir après replanification COPIL."],
        ["Documents mission", "Cadrage · Charte · CDC",
          "Textes contractuels de mission éditables : finalité, méthode, agenda, engagements MPJIPSC/Skydeen, synthèse alignement CDC/AO (import .docx possible).",
          "Le mandat est-il formalisé et partagé ? Périmètre, méthode et engagements COPIL sont-ils à jour et diffusables ?",
          "Onglets Cadrage / Agenda S1–S4 / Charte COPIL / CDC. Éditer et sauvegarder. Import ZIP (pied de menu admin). Diffuser avant lancement officiel."],
        ["Entretiens", "8/48",
          "Programme des 48 entretiens & focus groups : statut, axe, semaine, auditeur, qualification (déclaratif / documenté / observé), triangulation, CR, grille questionnaire (3 phases).",
          "Quelles structures ont été entendues ? Avec quel niveau de preuve ? Quels entretiens restent à faire / replanifier ? Quelle trame utiliser (Cabinet, DSI, terrain S4, volet B, RSSI/DPO…) ?",
          "Filtrer par statut ou structure. Clic ligne → fiche. « Conduire » pour questionnaire. Qualifier après chaque séance. Liens contextuels vers Data Room, constats, matrice."],
        ["Data Room", "17/34",
          "Pièces probantes : 11 répertoires (R1→R11), statuts versé / attendu / relance, checklists documentaires A→F, nommage normalisé, dépôt serveur.",
          "Les preuves sont-elles là ? Quels documents manquent pour trancher un écart CDC ? Quelles relances lancer ? La collecte est-elle traçable pour l'audit trail ?",
          "Filtrer par répertoire ou statut « attendu ». Dépôt via auditeurs (menu Dépôt) ou modale versement. Ouvrir le fichier. Relancer depuis checklists A–F du Cockpit."],
        ["Constats", "10",
          "Findings formalisés : faits observés, criticité, axe, structure, sources triangulées, lien avec écarts CDC ; workflow brouillon → validé.",
          "Qu'a-t-on appris de factuel ? Quels problèmes sont confirmés par plusieurs sources ? Quels constats alimentent L2, la matrice et les risques ?",
          "« Nouveau constat » ou depuis fiche entretien. Renseigner axe, structure, criticité, lien gap. Valider workflow avant restitution. Exporter pour annexe rapport."],
        ["Lacunes collecte", "4",
          "4 sujets méthodologiques non couverts au départ : volet B (RH/GED/flotte/marchés), RSSI/DPO séparé du DSI, grille qualité données, module prog./non-prog.",
          "Qu'est-ce qui manquait dans la méthode initiale ? Ces lacunes sont-elles comblées (trames, entretiens, pièces) ? Lien direct avec G-14, G-46, G-47, G-48 et livrable L3.",
          "Profil Cabinet ou lien depuis Carto. Cocher « comblée » quand trame + entretien + doc OK. Sauter vers Volet B, Qualité données, Prog./Non-prog."],
        ["Matrice d'écart", "48 exigences",
          "Confrontation CDC ↔ terrain : chaque exigence du cahier des charges vs réalité observée ; verdict Confirmé / À ajuster / À compléter / Caduc.",
          "Le CDC est-il réaliste ? Quelles exigences tenir, reformuler ou reporter ? Quels prérequis construire avant le déploiement PNIPM ? Base du L4.",
          "Filtrer par verdict. Clic ligne → fiche + Preuves liées (entretiens, docs, constats). Colonne Preuves = nb sources. Exporter matrice pour L4."],
        ["Checklist CDC tech.", "48 points SI",
          "Vérification technique point par point (architecture, données, interop, sécurité, perf, IA, UX, legacy…) : coche, preuve, couverture conforme/partielle/non.",
          "Les besoins SI du CDC sont-ils vérifiables et prouvés ? Quels points restent à démontrer (entretien, démo, doc) ? Vue opérationnelle complémentaire à la matrice.",
          "Parcourir les 48 lignes. Renseigner preuve, couverture, notes. « Matrice & preuves liées » pour croiser G-xx. Exporter en Markdown ou Word."],
        ["Journal audit", "Actions loguées",
          "Traçabilité des actions sur la plateforme : qui a modifié quoi, quand (connexions, patches, exports…).",
          "Qui a fait quoi sur la mission ? Preuve de gouvernance et d'intégrité de la collecte (réservé administrateur).",
          "Menu Journal audit (admin). Consulter après sessions de collecte. Vérifier auteur et date en cas de litige sur une pièce."],
      ],
    },
    {
      section: "Section « Cartographies »",
      rows: [
        ["Écosystème", "~30 entités",
          "Acteurs institutionnels : Cabinet, directions (DSI, DPSD, DAF…), tutelles (AEJ, OSCN…), programmes, bailleurs, intégrations (SIGFIP, NNI, X-Road) ; statut couvert / planifié / hors entretien.",
          "Tout l'écosystème pertinent est-il cartographié et entendu ? Quelles entités manquent ? Où sont les sponsors et les interfaces SI critiques ? Alimente L3.",
          "Cliquer un nœud → entretiens liés. Colonnes par type d'acteur. Passer à Carto interactive pour le graphe détaillé."],
        ["Carto interactive", "Graphe flux",
          "Vue graphe des nœuds et liens (données, projets, intégrations) avec filtres catégorie, criticité et surbrillance.",
          "Quelles dépendances et ruptures entre acteurs ? Où concentrer les entretiens restants ?",
          "Filtrer par catégorie/lien. Zoom cluster DSI ou programmes. Clic nœud → modale + liens entretiens/lacunes."],
        ["Géographie", "10 entretiens S4",
          "Déploiement territorial : Abidjan (central) + échantillon régional S4 (Centre, Nord…) ; entretiens terrain par site.",
          "La réalité régionale est-elle représentée ? Faut-il un mode déconnecté / mobile ? Les DR sont-elles alignées avec le pilotage central ?",
          "Repérer régions auditées vs planifiées. Clic ville → entretiens terrain. Croiser avec gap G-06 (PWA offline)."],
      ],
    },
    {
      section: "Section « Analyse & restitution »",
      rows: [
        ["Risques", "8 (4 ouverts)",
          "Registre des risques : mission (interlocuteurs, Data Room, délais, accès données) et solution (X-Road, qualité data/IA, doublons, adoption) ; probabilité × impact, mitigation, statut ouvert / surveillé / maîtrisé.",
          "Qu'est-ce qui peut faire dérailler l'audit ou la plateforme ? Quelles mitigations activer ? Quels risques porter au Comité Stratégique ? Base du L5.",
          "Prioriser statuts « ouvert ». Mettre à jour mitigation après COPIL. Lier aux constats/gaps (RQ-05 ↔ G-03). Exporter pour L5."],
        ["Livrables", "18% (L1–L7)",
          "7 livrables contractuels L1→L7 : cadrage, diagnostic, carto données, matrice, risques, feuille de route, rapport final ; rédaction assistée IA, validation humaine.",
          "Peut-on restituer et décider de lancer le marché plateforme ? Quels livrables sont en retard ? Le contenu est-il prêt pour COPIL / restitution ?",
          "Ouvrir chaque Lx → Générer brouillon IA → relire → valider. Suivre %. Ne pas valider sans données Cockpit à jour."],
        ["Gouvernance", "8 instances",
          "Instances de pilotage : lancement, COPIL hebdo, Comité Stratégique, remise, restitution ; PV, décisions, actions, charte signée.",
          "Le COPIL fonctionne-t-il ? Quelles décisions et actions sont actées ? La charte réciproque est-elle respectée ?",
          "Avant COPIL : PV + actions. Après : statut « tenu ». Charte dans Documents mission → Charte COPIL."],
        ["Vue Cabinet", "Synthèse exéc.",
          "Restitution condensée pour le Cabinet MPJIPSC : KPIs, axes, constats saillants, livrables, prochaine instance — format imprimable / confidentiel.",
          "En 2 minutes : où en est l'audit ? Quels messages clés pour le Sponsor sans entrer dans le détail opérationnel ?",
          "Profil cabinet ou admin en présentation. Imprimer / PDF navigateur. Chiffres issus du Cockpit — ne pas saisir à la main."],
        ["Assistant IA", "Chat + discussions",
          "Copilote d'analyse alimenté par l'état live de la mission : synthèses, zones grises, préparation d'entretiens. Colonne gauche : historique des discussions conservées ; bouton « Nouvelle discussion » pour repartir à zéro.",
          "Qu'investiguer en priorité ? Rédiger plus vite un CR, une note ou des questions DSI ? Conserver plusieurs fils de travail (ex. entretien DSI vs synthèse sécurité) ?",
          "Questions précises. Colonne Discussions : cliquer un fil pour le rouvrir, « Nouvelle » pour un chat vierge. Toujours vérifier dans Data Room / entretiens avant de formaliser un constat."],
        ["Rapports IA", "Brouillons Lx",
          "Génération et persistance des brouillons de livrables et notes (synthèses COPIL, rapports L7) via IA dual (Claude + contrôle OpenAI).",
          "Peut-on accélérer la rédaction sans perdre la relecture humaine ? Les placeholders mission sont-ils corrects ?",
          "Depuis Livrables ou menu Rapports. Générer → « Vérifier avec une 2ème IA » → appliquer suggestions → sauvegarder brouillon. Relecture obligatoire avant validation."],
      ],
    },
    {
      section: "Rubriques complémentaires — collecte & données",
      rows: [
        ["Qualité données", "10 sources",
          "Grille par source (DPSD, AEJ, SIGFIP, RH, NNI…) : complétude %, fraîcheur, lineage (traçabilité source → Cabinet).",
          "Les données existent-elles, sont-elles fiables et traçables ? Quelles sources bloquent la consolidation et le drill-down Cabinet ? Cœur du L3.",
          "Renseigner après chaque échantillon. Marquer « critique » si bloquant NNI/drill-down. Lien gap G-47. Menu Cabinet ou Lacunes."],
        ["Volet B", "4 domaines",
          "Fonctions non-programmatiques exigées par le CDC : RH, patrimoine & flotte, GED, marchés publics — statut, source, priorité, écarts.",
          "Le volet B du CDC est-il outillé ou restera-t-il en silos Excel/papier ? Quels quick wins pour la phase construction ?",
          "Mettre à jour après entretiens DRH/Patrimoine/Marchés S3. Lier G-14. Prioriser domaines « non couvert »."],
        ["Prog./Non-prog.", "7 domaines",
          "Comparaison structurée des périmètres programmatiques (dispositifs, bailleurs) vs non-programmatiques (RH, GED, flotte, marchés) : indicateurs, outils, fréquence, consolidation Cabinet, doublons.",
          "Pourquoi le Cabinet ne consolide pas en temps réel ? Où sont les doublons de bénéficiaires / reporting ? Répond au constat « Excel par mail » — alimente L2/L3.",
          "Compléter après entretiens DPSD/Cabinet. Croiser Risque RQ-07. Menu Cabinet → Prog./Non-prog."],
        ["Flux données", "Cartographie flux",
          "Flux actuels et cibles entre applications : protocole, PII, statut (existant / absent / planifié), criticité.",
          "Comment circulent les données aujourd'hui ? Où sont les ruptures (pas d'API SIGFIP, pas de NNI, silos AEJ) ? Quelles interfaces construire en phase 1 ?",
          "Documenter après entretiens DSI/DAF. Marquer « absent » pour priorisation. Lien Carto interactive."],
        ["Charte COPIL", "Signée",
          "Engagements réciproques MPJIPSC / Skydeen : périmètre, méthode, gouvernance, accès données, jalons — version signée au lancement.",
          "Les règles du jeu sont-elles actées et partagées ? Le COPIL peut-il s'y référer en cas de blocage ?",
          "Documents mission → onglet Charte. Lecture avant chaque COPIL. Signature tracée dans Gouvernance → Lancement."],
        ["Synthèse CDC", "Alignement AO",
          "Résumé structuré du cahier des charges plateforme ministérielle : exigences clés, périmètre, liens matrice et checklist technique.",
          "Le CDC est-il maîtrisé par l'équipe ? Quels chapitres sont les plus critiques pour l'audit ?",
          "Documents mission → CDC ou menu Cadrage. Croiser avec Matrice d'écart et Checklist CDC tech."],
        ["Référence AO", "Maquettes",
          "Aperçu du dashboard ministériel et de l'app jeunes tels que proposés à l'AO — hors périmètre construction, utile pour cadrage.",
          "Quelle cible visuelle le ministère attend-il ? L'audit pré-déploiement est-il aligné sur cette ambition ?",
          "Consulter les liens/iframe. Ne pas confondre avec le périmètre audit (HP-01 : construction = marché ultérieur)."],
      ],
    },
    {
      section: "Collecte terrain — Asse (A) / Laetitia (L)",
      rows: [
        ["Mon agenda", "S1–S4",
          "Vue personnelle des entretiens assignés à l'auditeur connecté, par semaine.",
          "Quels entretiens dois-je conduire aujourd'hui / cette semaine ?",
          "Connexion auditeur B ou T. Filtrer par semaine. Clic → Conduire l'entretien."],
        ["Conduire un entretien", "Questionnaire",
          "Saisie terrain du questionnaire 3 phases (investigation / confrontation / co-construction) avec persistance serveur.",
          "Ai-je couvert toutes les questions de la trame ? Le CR est-il sauvegardé ?",
          "Choisir entretien planifié. Remplir phase par phase. Sauvegarder souvent. Qualifier niveau de preuve en fin de séance."],
        ["Déposer des documents", "Versement",
          "Versement de pièces probantes avec nommage normalisé et stockage serveur (Data Room).",
          "La preuve collectée est-elle classée et traçable ?",
          "Glisser-déposer ou parcourir. Répertoire R1–R11, source, description. Vérifier aperçu nom de fichier avant validation."],
        ["Constats & observations", "Findings",
          "Saisie des constats terrain par l'auditeur (même logique que Constats, vue collecte).",
          "Qu'ai-je observé de factuel à formaliser avant la fin de semaine ?",
          "Créer dès qu'un fait est confirmé par ≥2 sources. Structure + axe. Brouillon si triangulation incomplète."],
      ],
    },
  ];

  /** Guide restreint — profil Auditeur (menus Collecte terrain + Analyse) */
  const GUIDE_AUDITEUR = [
    {
      section: "Collecte terrain — votre menu principal",
      rows: [
        ["Mon espace", "Hub auditeur",
          "Point d'entrée après connexion : KPIs personnels (entretiens réalisés / planifiés), prochain entretien, raccourci Conduire.",
          "Par où commencer ma journée ? Quel est mon prochain entretien ?",
          "Ouvrir à chaque connexion (arrivée par défaut). Bouton « Conduire un entretien » pour aller directement au questionnaire."],
        ["Mes tâches", "Relances + mission",
          "Actions assignées par le pilotage : relances documentaires Data Room (mail, checklist) et tâches mission libres (ex. « Préparer entretien DSI ») avec échéance optionnelle.",
          "Quelles relances ou actions mission dois-je traiter ? Une échéance est-elle dépassée ?",
          "Consulter en début de semaine. Filtrer Mission / Relances. Marquer terminée (✓). Escalader au pilotage si blocage. Badge rouge si en retard."],
        ["Documents mission", "Cadrage · Charte · CDC",
          "Textes de référence regroupés : cadrage, charte COPIL, alignement CDC — lecture seule (pas d'édition admin).",
          "Quel est le périmètre et les engagements de la mission ?",
          "Menu Documents mission — onglets Cadrage, Charte COPIL, CDC. Relire avant S1 et avant chaque COPIL."],
        ["Alignement CDC", "Synthèse thèmes",
          "Vue synthétique des thèmes CDC et de leur couverture par la mission (lecture seule).",
          "Où situer mon entretien dans le périmètre CDC ?",
          "Consulter avant un entretien structurant. Croiser avec la matrice d'écart et la checklist technique."],
        ["Mon agenda", "S1–S4",
          "Entretiens assignés à votre code auditeur (A ou L), filtrables par semaine.",
          "Quels entretiens dois-je conduire aujourd'hui / cette semaine ?",
          "Filtrer par semaine. Clic ligne → Conduire. Signaler tout report au pilotage."],
        ["Conduire un entretien", "Questionnaire",
          "Saisie du questionnaire 3 phases (investigation / confrontation / co-construction) avec persistance serveur.",
          "Ai-je couvert toutes les questions ? Le CR est-il sauvegardé ?",
          "Choisir entretien planifié. Remplir phase par phase. Qualifier niveau de preuve en fin de séance."],
        ["Data Room", "R1→R11",
          "Pièces probantes : liste complète (attendus + versés), filtres par répertoire, consultation et dépôt de nouvelles pièces.",
          "Quelles preuves sont disponibles ? Comment verser une pièce collectée en entretien ?",
          "Menu Data Room. Filtrer par statut. Zone de dépôt en haut de page ou glisser-déposer. Convention de nommage avant validation."],
      ],
    },
    {
      section: "Analyse — confrontation CDC & preuves",
      rows: [
        ["Matrice d'écart", "48 exigences G-xx",
          "Confrontation CDC ↔ réalité : exigence, réalité observée, verdict (lecture seule côté auditeur).",
          "Quel écart sur l'exigence que je viens de documenter en entretien ?",
          "Consulter après chaque entretien structurant. Les verdicts sont consolidés par le pilotage — pas de modification ici."],
        ["Checklist CDC tech.", "48 points SI",
          "Vérification technique point par point : architecture, données, interop, sécurité, perf, IA…",
          "Les exigences SI du CDC sont-elles démontrées par mes entretiens et pièces ?",
          "Renseigner preuve et couverture après chaque entretien DSI / RSSI. Lier entretien + doc."],
        ["Lacunes collecte", "4 sujets",
          "Lacunes méthodologiques initiales : volet B, RSSI/DPO, qualité données, prog./non-prog.",
          "Ces sujets sont-ils couverts par mes entretiens et trames ?",
          "Cocher « comblée » quand trame + entretien + doc OK. Sauter vers Volet B ou Qualité données."],
        ["Qualité données", "10 sources",
          "Grille par source (DPSD, AEJ, SIGFIP, RH, NNI…) : complétude, fraîcheur, lineage.",
          "Les données citées en entretien sont-elles fiables et traçables ?",
          "Mettre à jour après chaque échantillon reçu. Marquer « critique » si bloquant."],
        ["Constats & observations", "Findings",
          "Saisie des constats terrain : fait, axe, structure, criticité, sources triangulées.",
          "Qu'ai-je observé de factuel à formaliser avant la fin de semaine ?",
          "Créer dès qu'un fait est confirmé par ≥2 sources. Brouillon si triangulation incomplète."],
        ["Prog./Non-prog.", "7 domaines",
          "Comparaison périmètres programmatiques vs non-programmatiques : indicateurs, outils, consolidation Cabinet.",
          "Le périmètre programmatique de mon entretien est-il couvert ?",
          "Mettre à jour après entretiens DPSD / Cabinet. Croiser avec Lacunes collecte."],
        ["Volet B", "4 domaines",
          "Fonctions non-programmatiques CDC : RH, patrimoine & flotte, GED, marchés publics.",
          "Le volet B est-il outillé ou en silos Excel/papier ?",
          "Mettre à jour après entretiens DRH, Patrimoine, Marchés. Prioriser domaines « non couvert »."],
        ["Assistant IA", "Discussions",
          "Copilote : préparation d'entretiens, synthèses, questions confrontation. Colonne gauche pour conserver et rouvrir plusieurs discussions ; « Nouvelle discussion » pour un fil vierge.",
          "Comment préparer plus vite mon entretien DSI ? Garder un fil de travail séparé par sujet ?",
          "Questions précises. Colonne Discussions à gauche. Toujours vérifier dans questionnaire et Data Room avant de formaliser un constat."],
      ],
    },
    {
      section: "Profil auditeur — rappels",
      rows: [
        ["Menus visibles", "2 sections",
          "Collecte terrain : Mon espace · Documents mission · Alignement CDC · Mes tâches · Agenda · Conduire un entretien · Data Room. Analyse : Lacunes · Qualité données · Checklist CDC tech. · Matrice d'écart (lecture seule) · Constats · Prog./Non-prog. · Volet B · Assistant IA.",
          "Quelles rubriques puis-je utiliser ? Où est l'aide ?",
          "Pas de Cockpit admin, Planning éditable, Corbeille, livrables L1–L7, affectations ni gouvernance COPIL. Pied de menu : Tutoriel auditeur et Guide d'emploi."],
        ["Mes tâches — qui crée quoi ?", "—",
          "Relances : créées par le pilotage depuis la Data Room. Tâches mission : créées par le pilotage (ex. préparer un entretien) — vous les exécutez et marquez terminées.",
          "Puis-je créer une tâche moi-même ?",
          "Non — consultation et clôture uniquement. Demander au pilotage une nouvelle affectation si besoin."],
        ["Connexion", "Profil Auditeur",
          "Écran d'accueil : choisir la carte Auditeur, puis code mission + email + mot de passe (+ 2FA si activé).",
          "Comment me connecter correctement ?",
          "Ne pas utiliser le profil Administrateur ou Cabinet. Comptes nominatifs équipe (Asse / Laetitia)."],
        ["Hors périmètre", "—",
          "Modification des verdicts matrice CDC, livrables L1–L7, journal audit, affectations, planning, corbeille, gouvernance COPIL : réservés au pilotage.",
          "Puis-je valider un livrable ou arbitrer la matrice ?",
          "Non pour les verdicts — consultation matrice autorisée. Votre rôle : collecte, confrontation et formalisation terrain."],
      ],
    },
  ];

  /** Guide restreint — profil Cabinet (7 vues menu + lecture seule) */
  const GUIDE_CABINET = [
    {
      section: "Synthèse & preuves — vos 3 vues prioritaires",
      rows: [
        ["Cockpit", "KPIs temps réel",
          "Avancement consolidé de l'audit : entretiens, Data Room, constats, couverture des 3 axes (Politique / Programmatique / Technique), alertes (relances, risques, retards), frise 4 semaines.",
          "Où en est l'audit ? Quels axes sont sous-investigés ? Quelles alertes porter au Sponsor ou au COPIL ?",
          "Ouvrir à chaque connexion. Cliquer une alerte pour accéder à la source (constat, document, entretien). Liens rapides en bas de page vers Constats, Data Room ou Risques. Lecture seule — ne pas ressaisir les chiffres."],
        ["Constats", "10",
          "Findings formalisés : faits observés, criticité, axe, structure, sources triangulées ; workflow brouillon → validé côté auditeurs.",
          "Qu'a-t-on appris de factuel ? Quels problèmes sont confirmés ? Quels messages clés pour une instance de pilotage ?",
          "Filtrer par axe ou criticité. Ouvrir une fiche pour le détail et les sources. Exporter une ligne si le secrétariat le demande. Ne pas interpréter un brouillon comme validé."],
        ["Data Room", "17/34",
          "Pièces probantes versées par les structures : 11 répertoires (R1→R11), statuts versé / attendu / relance, aperçu et téléchargement.",
          "Les preuves citées dans un constat sont-elles versées ? Quels documents manquent encore pour trancher un sujet sensible ?",
          "Filtrer par répertoire (ex. R2 Cabinet, R4 DSI). Ouvrir ou télécharger un fichier. Pour toute relance documentaire, passer par le pilotage Skydeen / MPJIPSC."],
      ],
    },
    {
      section: "Cartographies & risques — vision système et territoriale",
      rows: [
        ["Écosystème", "~30 entités",
          "Acteurs institutionnels : Cabinet, directions (DSI, DPSD, DAF…), tutelles (AEJ, OSCN…), programmes, bailleurs ; statut couvert / planifié / hors entretien.",
          "L'écosystème pertinent est-il cartographié et entendu ? Quelles entités manquent encore avant restitution ?",
          "Parcourir les colonnes par type d'acteur. Cliquer un nœud pour voir les entretiens liés. Compléter avec la Carto interactive pour le graphe détaillé."],
        ["Carto interactive", "Graphe flux",
          "Graphe des nœuds et liens (données, projets, intégrations DSI, AEJ, SIGFIP…) avec filtres catégorie et criticité.",
          "Quelles dépendances et ruptures entre acteurs ? Où se concentrent les interfaces critiques pour le PNIPM ?",
          "Filtrer par catégorie ou lien. Zoomer sur un cluster (interop, NNI, X-Road). Clic nœud → fiche et entretiens associés."],
        ["Géographie", "10 entretiens S4",
          "Déploiement territorial : Abidjan (central) + échantillon régional S4 ; entretiens terrain par site.",
          "La réalité régionale est-elle représentée dans l'audit ? Les territoires stratégiques sont-ils couverts ?",
          "Repérer régions auditées vs planifiées. Clic ville / DR → entretiens terrain. Préparer une question COPIL si un territoire clé manque."],
        ["Risques", "8 (4 ouverts)",
          "Registre des risques mission (collecte, délais, accès données) et solution (interop, qualité data, adoption) ; probabilité × impact, mitigation, statut ouvert / surveillé / maîtrisé.",
          "Qu'est-ce qui peut faire dérailler l'audit ou le futur déploiement ? Quels risques porter au Comité Stratégique ?",
          "Prioriser les statuts « ouvert ». Lire la mitigation proposée. Croiser avec Constats et Cockpit avant instance. Demander une mise à jour au pilotage si besoin — pas de modification directe."],
      ],
    },
    {
      section: "Profil Cabinet — rappels",
      rows: [
        ["Menus visibles", "7 vues",
          "Cockpit, Constats, Écosystème, Carto interactive, Géographie, Risques, Data Room — aucun autre menu (pas de collecte, livrables, matrice, assistant IA).",
          "Quelles rubriques puis-je consulter ? Où trouver l'aide (tutoriel / guide) ?",
          "Menu gauche : uniquement ces 7 entrées. Pied de page : Tutoriel Cabinet et Guide d'emploi Cabinet. Connexion : cabinet@mpjipsc.local + code mission."],
        ["Lecture seule", "Dépôt autorisé",
          "Consultation des vues mission sans modification des constats, entretiens ou livrables — versement de pièces en Data Room autorisé.",
          "Puis-je verser un document officiel du Cabinet ?",
          "Oui — menu Data Room → Déposer un document (glisser-déposer ou parcourir). Les autres saisies restent réservées au pilotage Skydeen."],
      ],
    },
  ];

  function liveCounters() {
    const m = typeof metrics === "function" ? metrics() : {};
    const risques = Store.get("risques");
    return {
      entretiens: m.real != null ? m.real + "/" + m.tot : "8/48",
      dataroom: m.docCollecteRecu != null ? m.docCollecteRecu + "/" + m.docCollecteTot : "0/17",
      constats: String(Store.get("constats").length),
      gaps: Store.get("gaps").length + " exigences",
      risques: risques.length + " (" + risques.filter((r) => r.statut === "ouvert").length + " ouverts)",
      liv: (m.livAvg != null ? m.livAvg : 18) + "% (L1–L7)",
    };
  }

  function resolveCounter(label, fallback, live) {
    const L = label.toLowerCase();
    if (L.includes("entretien") && !L.includes("observation")) return live.entretiens;
    if (L.includes("data room")) return live.dataroom;
    if (L === "constats") return live.constats;
    if (L.includes("matrice")) return live.gaps;
    if (L === "risques") return live.risques;
    if (L === "livrables") return live.liv;
    return fallback;
  }

  function renderGuide() {
    const v = el("div", { class: "view" });
    const live = liveCounters();
    const role = window.App && App.user && App.user.role;
    const isCabinet = role === "cabinet";
    const isAuditeur = role === "auditeur";
    const sections = isCabinet ? GUIDE_CABINET : isAuditeur ? GUIDE_AUDITEUR : GUIDE;
    let html = pageHead(
      "Aide",
      isCabinet
        ? "Guide d'emploi Cabinet — lecture seule"
        : isAuditeur
          ? "Guide d'emploi Auditeur — collecte terrain"
          : "Guide d'emploi du Cockpit — tableau complet",
      isCabinet
        ? "7 vues autorisées · Rubrique · Compteur · Ce que ça audite · Questions clés · Comment consulter (sans modification)."
        : isAuditeur
          ? "Menus auditeur uniquement · Rubrique · Compteur · Objet audité · Questions clés · Mode d'emploi terrain."
          : "Rubrique · Compteur · Ce que ça audite · Ce que cela permet de répondre · Comment s'en servir. Compteurs dynamiques au chargement.",
      isCabinet
        ? `<span class="bdg neutral">${live.entretiens} entretiens · ${live.dataroom} docs · ${live.constats} constats · ${live.risques} risques</span>`
        : isAuditeur
          ? `<span class="bdg neutral">${live.entretiens} entretiens · ${live.dataroom} docs · ${live.constats} constats</span>`
          : `<span class="bdg neutral">${live.entretiens} entretiens · ${live.dataroom} docs · ${live.constats} constats · ${live.gaps.split(" ")[0]} gaps</span>`
    );
    if (isCabinet) {
      html += `<div class="note terra" style="margin-bottom:16px;font-size:13px"><b>Profil Ministère (Cabinet)</b> — consultation uniquement des vues Cockpit, Constats, Data Room, cartographies et registre des risques. Pour toute action opérationnelle, contactez le pilotage Skydeen.</div>`;
    }
    if (isAuditeur) {
      html += `<div class="note terra" style="margin-bottom:16px;font-size:13px"><b>Profil Auditeur terrain</b> — collecte, entretiens, versement de preuves et saisie des constats. Les vues pilotage (matrice, livrables, cockpit admin) sont réservées au Directeur de Projet Audit.</div>`;
    }
    sections.forEach((sec) => {
      html += `<div class="card guide-sec" style="margin-bottom:20px"><div class="card-h"><h3>${esc(sec.section)}</h3></div><div class="card-b guide-scroll"><table class="tbl guide-tbl"><thead><tr>
        <th>Rubrique</th><th>Compteur</th>
        <th>Ce que ça audite (objet précis)</th>
        <th>Ce que cela permet de répondre</th>
        <th>Comment s'en servir</th>
      </tr></thead><tbody>`;
      sec.rows.forEach((row) => {
        const ctr = resolveCounter(row[0], row[1], live);
        html += `<tr>
          <td><b>${esc(row[0])}</b></td>
          <td class="mono ctr">${esc(ctr)}</td>
          <td class="c-audit">${esc(row[2])}</td>
          <td class="c-repond">${esc(row[3])}</td>
          <td class="c-servir"><b>${esc(row[4])}</b></td>
        </tr>`;
      });
      html += `</tbody></table></div></div>`;
    });
    html += `<div class="note slate" style="font-size:12px;margin-top:8px">${isCabinet ? "Guide Cabinet · 7 vues · lecture seule" : isAuditeur ? "Guide auditeur · collecte terrain" : "Guide complet · compteurs dynamiques"} · ${typeof todayISO === "function" ? todayISO() : ""} · Skydeen Audit Cockpit PNIPM</div>`;
    v.innerHTML = html;
    if (window.PortiaA11y && PortiaA11y.applyTips) setTimeout(() => PortiaA11y.applyTips(v), 50);
    return v;
  }

  function patchNav() {
    CRUMB.guide = "Guide d'emploi";
  }

  function init() {
    VIEWS.guide = renderGuide;
    patchNav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(init, 100));
  } else {
    setTimeout(init, 100);
  }

  window.PortiaGuide = { GUIDE, GUIDE_CABINET, GUIDE_AUDITEUR, renderGuide, liveCounters };
})();
