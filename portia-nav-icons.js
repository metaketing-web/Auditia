/**
 * Icônes de navigation — source unique (évite doublons après patches JS).
 */
(function () {
  "use strict";

  var NAV_ICONS = {
    cockpit: "cockpit",
    cadrage: "compass",
    charte: "shield",
    cdc: "scale",
    pilotage: "layers",
    docs_mission: "library",
    planning: "agenda",
    taches_equipe: "tasks",
    taches: "inbox",
    entretiens: "entretiens",
    affectations: "user_check",
    dataroom: "dataroom",
    corbeille: "trash",
    lacunes: "lacune",
    constats: "constats",
    consaud: "constats",
    ecart: "ecart",
    cdc_tech: "clipboard",
    journal: "scroll",
    eco: "eco",
    carto_graph: "workflow",
    geo: "geo",
    qualdata: "database",
    voletb: "building",
    flux: "flow",
    risques: "risques",
    livrables: "livrables",
    rapports: "sparkles",
    ref_pnipm: "book",
    gouv: "gouv",
    cabinet: "briefcase",
    prognonprog: "split",
    assistant: "assistant",
    hub_auditeur: "home",
    agenda: "agenda",
    conduct: "conduct",
    depot: "dataroom",
    guide: "book",
    reglages: "reglages",
  };

  function normalizeNavIcons() {
    if (!window.NAV) return;
    Object.keys(NAV).forEach(function (role) {
      (NAV[role] || []).forEach(function (sec) {
        (sec.items || []).forEach(function (it) {
          if (it.k && NAV_ICONS[it.k]) it.ic = NAV_ICONS[it.k];
        });
      });
    });
  }

  function patchRenderNav() {
    if (!window.App || !App.renderNav || App._navIconsPatch) return;
    var orig = App.renderNav.bind(App);
    App.renderNav = function () {
      normalizeNavIcons();
      return orig();
    };
    App._navIconsPatch = true;
  }

  function init() {
    normalizeNavIcons();
    patchRenderNav();
  }

  window.PortiaNavIcons = { init, normalizeNavIcons, NAV_ICONS };
  init();
  document.addEventListener("DOMContentLoaded", init);
})();
