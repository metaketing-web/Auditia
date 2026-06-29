/**
 * Menu latéral auditeurs — pack minimal + collecte terrain (sans planning admin ni corbeille).
 */
(function () {
  "use strict";

  var STRIP_KEYS = { planning: 1, depot: 1, corbeille: 1 };

  function isAuditorUser() {
    var u = window.App && App.user;
    if (!u) return true;
    return (
      u.role === "auditeur" ||
      u.serverRole === "auditeur_b" ||
      u.serverRole === "auditeur_t"
    );
  }

  function navItem(k, lbl, ic, ct) {
    var o = { k: k, lbl: lbl, ic: ic || "cockpit" };
    if (ct) o.ct = ct;
    return o;
  }

  function docMetrics() {
    if (typeof metrics === "function") {
      var m = metrics();
      return m.docCollecteRecu + "/" + m.docCollecteTot;
    }
    return null;
  }

  function buildAuditorNav() {
    return [
      {
        sec: "Collecte terrain",
        items: [
          navItem("hub_auditeur", "Mon espace", "home"),
          navItem("docs_mission", "Documents mission", "library"),
          navItem("cdc", "Alignement CDC", "scale"),
          navItem("taches", "Mes tâches", "tasks"),
          navItem("agenda", "Agenda", "agenda"),
          navItem("conduct", "Conduire un entretien", "conduct"),
          navItem("dataroom", "Data Room", "dataroom", docMetrics),
        ],
      },
      {
        sec: "Analyse",
        items: [
          navItem("lacunes", "Lacunes collecte", "lacune"),
          navItem("qualdata", "Qualité données", "database"),
          navItem("cdc_tech", "Checklist CDC tech.", "clipboard"),
          navItem("ecart", "Matrice d'écart", "ecart"),
          navItem(
            "consaud",
            "Constats & observations",
            "constats",
            function () {
              return Store.get("constats").length;
            }
          ),
          navItem("prognonprog", "Prog./Non-prog.", "split"),
          navItem("voletb", "Volet B", "building"),
          navItem("assistant", "Assistant IA", "assistant"),
        ],
      },
    ];
  }

  function ensureAuditorNav() {
    if (!window.NAV || !isAuditorUser()) return;
    NAV.auditeur = buildAuditorNav();
  }

  function patchHubAuditeur() {
    if (!window.VIEWS || !VIEWS.hub_auditeur || VIEWS._hubAudNavPatch) return;
    var orig = VIEWS.hub_auditeur;
    VIEWS.hub_auditeur = function () {
      var v = orig();
      var grid = v.querySelector(".grid");
      if (!grid) return v;
      var shortcuts = [
        { k: "docs_mission", title: "Documents mission", sub: "Cadrage, charte, CDC" },
        { k: "ecart", title: "Matrice d'écart", sub: "Lecture seule — G-xx" },
        { k: "cdc_tech", title: "Checklist CDC tech.", sub: "Preuves terrain" },
        { k: "prognonprog", title: "Prog./Non-prog.", sub: "Module programmatique" },
      ];
      shortcuts.forEach(function (s) {
        if (grid.querySelector('[data-hub-k="' + s.k + '"]')) return;
        var card = document.createElement("div");
        card.className = "card clk pad";
        card.setAttribute("data-hub-k", s.k);
        card.onclick = function () {
          App.go(s.k);
        };
        card.innerHTML =
          "<b>" +
          esc(s.title) +
          '</b><p class="muted" style="font-size:12px;margin-top:6px">' +
          esc(s.sub) +
          "</p>";
        grid.appendChild(card);
      });
      return v;
    };
    VIEWS._hubAudNavPatch = true;
  }

  function wrapApp() {
    if (!window.App) return;
    var origRender = App.renderNav.bind(App);
    App.renderNav = function () {
      ensureAuditorNav();
      return origRender();
    };
    var origEnter = App.enter.bind(App);
    App.enter = function () {
      ensureAuditorNav();
      return origEnter();
    };
    var origGo = App.go.bind(App);
    App.go = function (k, params) {
      if (STRIP_KEYS[k] && isAuditorUser()) {
        toast("Accès refusé", "Cette vue est réservée au pilotage", "warn");
        return;
      }
      ensureAuditorNav();
      return origGo(k, params);
    };
  }

  function rehook() {
    wrapApp();
    ensureAuditorNav();
    if (window.App && App.user && isAuditorUser() && App.renderNav) {
      App.renderNav();
    }
  }

  function init() {
    ensureAuditorNav();
    patchHubAuditeur();
    wrapApp();
  }

  window.PortiaAuditorNav = { ensureAuditorNav, init, buildAuditorNav, rehook };

  init();
  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("load", function () {
    init();
    setTimeout(rehook, 0);
    setTimeout(rehook, 200);
  });
})();
