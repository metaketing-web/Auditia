/**
 * Extensions mission — documents éditables, affectations auditeurs, import ZIP, aperçu AO
 */
(function () {
  "use strict";

  function saveState() {
    if (window.portiaApi && portiaApi.saveState) return portiaApi.saveState();
    Store.save();
    return Promise.resolve();
  }

  function defaultMissionDocs() {
    return {
      cadrage: {
        finalite:
          "Qualifier le contexte technique et métier (infrastructures, processus, données, contraintes juridiques) avant le déploiement de la plateforme PNIPM (dashboard ministériel + portail jeunes/opérateurs).",
        methode:
          "Trois axes d'analyse (Politique · Programmatique · Technique), entretiens structurés en 3 phases, Data Room probante, matrice d'écart CDC, instances COPIL.",
        agendaComplement:
          "Agenda 4 semaines : S1 cadrage stratégique · S2 programmatique · S3 volet B & SI · S4 terrain régional.",
      },
      charte: {
        mpjipsc:
          "Désigner les interlocuteurs, valider l'agenda, verser les pièces A→F, faciliter l'accès graduel aux données, participer au COPIL.",
        skydeen:
          "Confidentialité, avancement hebdomadaire via le cockpit, documentation systématique des entretiens, signalement des blocages.",
        principes:
          "Approche graduelle NNI/RGPD · traçabilité des pièces · triangulation des sources · transparence via la vue Cabinet.",
      },
      cdc: {
        synthese:
          "L'audit ne remplace pas le marché plateforme (HP-01) : il alimente une feuille de route réaliste pour le dashboard Cabinet et le portail terrain.",
      },
      updatedAt: null,
    };
  }

  function getMissionDocs() {
    if (!Store.state) return defaultMissionDocs();
    if (!Store.state.missionDocs || !Store.state.missionDocs.cadrage) {
      Store.state.missionDocs = defaultMissionDocs();
    }
    return Store.state.missionDocs;
  }

  function auditorCode() {
    return window.PortiaAuditors ? PortiaAuditors.auditorCodeFromUser(App.user) : null;
  }

  function myEntretiensFilter(list) {
    const code = auditorCode();
    if (!code) return list;
    const match = window.PortiaAuditors
      ? (e) => PortiaAuditors.audMatches(e.aud, code)
      : (e) => e.aud === code || e.aud === "A+L";
    return list.filter(match);
  }

  function registerViews() {
    VIEWS.docs_mission = function () {
      const v = el("div", { class: "view" });
      let md = getMissionDocs();
      const PMD = window.PortiaMissionDocs;
      if (PMD && window.PortiaMissionDocsBuild) {
        md = PortiaMissionDocsBuild.ensure(md, Store.state);
      }
      const tabs = PMD ? PMD.TABS : [
        { k: "cadrage", lbl: "Cadrage" },
        { k: "agenda", lbl: "Agenda S1–S4" },
        { k: "charte", lbl: "Charte COPIL" },
        { k: "cdc", lbl: "Cahier des charges" },
      ];
      let tab = "cadrage";
      if (App.navCtx && App.navCtx.docTab) tab = App.navCtx.docTab;

      const ready = tabs.filter((t) => !PMD || PMD.hasContent(md, t.k)).length;

      v.innerHTML =
        pageHead(
          "Documents de mission",
          "Cadrage · Charte · CDC",
          "Références officielles de la mission — consultation interactive (sommaire, recherche, impression). Lecture seule.",
          `<span class="bdg ${ready === tabs.length ? "ok" : "warn"}">${ready}/${tabs.length} documents</span>`
        ) +
        `<div class="tabs" id="dmTabs" style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">${tabs
          .map(
            (t) =>
              `<button class="tag ${t.k === tab ? "on" : ""}" data-t="${t.k}">${esc(t.lbl)}${
                PMD && PMD.hasContent(md, t.k) ? "" : ' <span style="opacity:.5">·</span>'
              }</button>`
          )
          .join("")}</div>
        <div id="dmPanel"></div>`;

      const panelEl = v.querySelector("#dmPanel");
      const isAdmin = App.user && (App.user.role === "admin" || App.user.serverRole === "juliana");

      function show() {
        v.querySelectorAll("#dmTabs .tag").forEach((b) => b.classList.toggle("on", b.dataset.t === tab));
        if (PMD) {
          PMD.renderReader(panelEl, md, tab, { adminHint: isAdmin, state: Store.state });
        } else {
          panelEl.innerHTML = `<div class="note slate">Module lecteur indisponible.</div>`;
        }
      }

      v.querySelector("#dmTabs").onclick = (e) => {
        const b = e.target.closest("[data-t]");
        if (!b) return;
        tab = b.dataset.t;
        show();
      };
      show();
      return v;
    };

    VIEWS.affectations = function () {
      const v = el("div", { class: "view" });
      const canPilot =
        App.user &&
        !App.user.readOnly &&
        (App.user.role === "admin" || App.user.serverRole === "admin" || App.user.serverRole === "juliana");
      const ro = !canPilot;
      const ents = Store.get("entretiens").slice().sort((a, b) => a.sem - b.sem || a.j - b.j);
      const PA = window.PortiaAuditors;
      const norm = (a) => (PA ? PA.normAud(a) : a);
      function countFromRows() {
        const rows = ro
          ? ents
          : [...body.querySelectorAll("tr[data-id]")].map((tr) => ({
              aud: tr.querySelector(".af-aud")?.value || "A",
            }));
        const src = ro ? ents.map((e) => ({ aud: norm(e.aud) })) : rows.map((r) => ({ aud: norm(r.aud) }));
        return {
          total: src.length,
          onlyA: src.filter((r) => r.aud === "A").length,
          onlyL: src.filter((r) => r.aud === "L").length,
          both: src.filter((r) => r.aud === "A+L").length,
        };
      }

      v.innerHTML =
        pageHead(
          "Équipe d'audit",
          "Affectation des entretiens",
          "Répartition entre Asse (A) et Laetitia (L) — " + ents.length + " entretiens au total.",
          ro ? "" : `<button class="btn terra" id="afSave">${svgI('<path d="M20 6 9 17l-5-5"/>')} Enregistrer les affectations</button>`
        ) +
        `<div class="kpis" style="margin-bottom:16px" id="afKpis">
          <div class="kpi"><div class="val" id="afKpiTot">${ents.length}</div><div class="lbl">Total entretiens</div></div>
          <div class="kpi"><div class="val" id="afKpiA">0</div><div class="lbl">Asse seul (A)</div></div>
          <div class="kpi"><div class="val" id="afKpiL">0</div><div class="lbl">Laetitia seule (L)</div></div>
          <div class="kpi"><div class="val" id="afKpiBoth">0</div><div class="lbl">Communs (A+L)</div></div>
        </div>
        <div class="note slate" style="margin-bottom:12px;font-size:12px">Compteurs mis à jour selon la colonne <b>Auditeur</b> (sélections en cours). La colonne <b>Lead</b> indique qui conduit l'entretien. Les entretiens <b>A+L</b> sont conduits à deux.</div>
        ${ro ? "" : `<div class="fbar" style="margin-bottom:12px">
          <button class="btn ghost sm" id="afAllA">Tout assigner à Asse (A)</button>
          <button class="btn ghost sm" id="afAllL">Tout assigner à Laetitia (L)</button>
          <button class="btn ghost sm" id="afBalance">Équilibrer A/L par semaine</button>
        </div>`}
        <div class="card"><table class="tbl"><thead><tr><th>Entretien</th><th>Structure</th><th>Sem.</th><th>Auditeur</th><th>Lead</th></tr></thead><tbody id="afBody"></tbody></table></div>`;

      const body = v.querySelector("#afBody");
      function row(e) {
        const audDisp = PA ? PA.audLabel(e.aud) : esc(e.aud);
        const lead = e.leadAuditor || "";
        return `<tr data-id="${esc(e.id)}">
          <td><b style="font-size:12px">${esc(e.n)}</b></td>
          <td class="muted">${esc(e.struct)}</td>
          <td class="mono">S${e.sem}</td>
          <td>${ro ? audDisp : `<select class="fselect af-aud" data-id="${esc(e.id)}">${PA ? PA.audOptions(e.aud) : ""}</select>`}</td>
          <td>${ro ? esc(lead || "—") : `<select class="fselect af-lead" data-id="${esc(e.id)}">${PA ? PA.leadOptions(lead) : ""}</select>`}</td>
        </tr>`;
      }
      body.innerHTML = ents.map(row).join("");

      function refreshKpis() {
        const c = countFromRows();
        const el = (id, val) => {
          const n = v.querySelector(id);
          if (n) n.textContent = val;
        };
        el("#afKpiTot", c.total);
        el("#afKpiA", c.onlyA);
        el("#afKpiL", c.onlyL);
        el("#afKpiBoth", c.both);
      }
      refreshKpis();
      body.addEventListener("change", (e) => {
        if (e.target.matches(".af-aud,.af-lead")) refreshKpis();
      });

      function collect() {
        return [...body.querySelectorAll("tr[data-id]")].map((tr) => ({
          id: tr.dataset.id,
          aud: tr.querySelector(".af-aud")?.value || "A",
          lead: tr.querySelector(".af-lead")?.value?.trim() || "",
        }));
      }

      function applyAssignmentsLocally(assignments) {
        assignments.forEach((a) => {
          const o = Store.find("entretiens", a.id);
          if (!o) return;
          o.aud = a.aud;
          if (a.lead) o.leadAuditor = a.lead;
          else delete o.leadAuditor;
        });
        if (Store._origSave) Store._origSave();
        else Store.save();
      }

      function persist(assignments) {
        if (window.PORTIA_SERVER_MODE && portiaApi.fetch) {
          if (portiaApi.cancelPendingServerSave) portiaApi.cancelPendingServerSave();
          return portiaApi
            .fetch("/api/entretiens/bulk-assign", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ assignments }),
            })
            .then((r) => {
              if (!r.ok) {
                const msg =
                  r.status === 403
                    ? "Réservé au pilotage (admin) — terminez la 2FA si l'écran de configuration s'affiche"
                    : r.status === 401
                      ? "Session expirée — reconnectez-vous"
                      : "assign " + r.status;
                throw new Error(msg);
              }
              return r.json();
            })
            .then((res) => {
              applyAssignmentsLocally(assignments);
              if (window.portiaReloadServer) {
                return window.portiaReloadServer({ force: true }).catch(() => res);
              }
              return res;
            });
        }
        assignments.forEach((a) => {
          Store.patch("entretiens", a.id, { aud: a.aud, leadAuditor: a.lead || undefined });
        });
        return saveState();
      }

      if (!ro) {
        v.querySelector("#afSave").onclick = () => {
          persist(collect())
            .then(() => {
              toast("Affectations", "Enregistrées", "ok");
              App.refresh();
            })
            .catch((e) => {
              toast("Affectations", (e && e.message) || "Enregistrement impossible", "err");
            });
        };
        v.querySelector("#afAllA").onclick = () => {
          body.querySelectorAll(".af-aud").forEach((s) => {
            s.value = "A";
          });
          body.querySelectorAll(".af-lead").forEach((s) => {
            s.value = "Asse";
          });
          refreshKpis();
        };
        v.querySelector("#afAllL").onclick = () => {
          body.querySelectorAll(".af-aud").forEach((s) => {
            s.value = "L";
          });
          body.querySelectorAll(".af-lead").forEach((s) => {
            s.value = "Laetitia";
          });
          refreshKpis();
        };
        v.querySelector("#afBalance").onclick = () => {
          body.querySelectorAll("tr[data-id]").forEach((tr) => {
            const sem = parseInt(tr.querySelector(".mono")?.textContent?.replace("S", "") || "1", 10);
            const selAud = tr.querySelector(".af-aud");
            const selLead = tr.querySelector(".af-lead");
            if (sem % 2 === 1) {
              if (selAud) selAud.value = "A";
              if (selLead) selLead.value = "Asse";
            } else {
              if (selAud) selAud.value = "L";
              if (selLead) selLead.value = "Laetitia";
            }
          });
          refreshKpis();
        };
      }
      return v;
    };

    CRUMB.docs_mission = "Documents mission";
    CRUMB.affectations = "Affectations auditeurs";
  }

  function patchMissionViews() {
    if (window.PortiaMission && VIEWS.cadrage && !VIEWS._cadrageDocs) {
      const origC = VIEWS.cadrage;
      VIEWS.cadrage = function () {
        const v = origC();
        const md = getMissionDocs().cadrage;
        const note = v.querySelector(".card .card-b p");
        if (note && md.finalite) {
          const box = document.createElement("div");
          box.className = "note sage";
          box.style.marginBottom = "14px";
          box.innerHTML = `<b>Texte de cadrage (éditable)</b><p style="margin-top:8px;font-size:13px;line-height:1.6">${esc(md.finalite)}</p>`;
          v.querySelector(".card").prepend(box);
        }
        const actions = v.querySelector(".ph .actions");
        if (actions && !document.getElementById("lnkDocs")) {
          const b = document.createElement("button");
          b.id = "lnkDocs";
          b.className = "btn ghost";
          b.textContent = "Éditer les textes";
          b.onclick = () => App.go("docs_mission");
          actions.prepend(b);
        }
        return v;
      };
      VIEWS._cadrageDocs = true;
    }

    if (VIEWS.ref_pnipm && !VIEWS._refEmbed) {
      const origR = VIEWS.ref_pnipm;
      VIEWS.ref_pnipm = function () {
        const v = origR();
        const card = document.createElement("div");
        card.className = "card";
        card.style.marginTop = "18px";
        card.innerHTML = `<div class="card-h"><h3>Aperçu intégré — Dashboard ministériel (AO)</h3></div>
          <div class="card-b" style="padding:0"><iframe src="${window.PortiaMission?.REF_BASE || "http://13.63.156.32"}/dashboard" style="width:100%;height:min(520px,60vh);border:0;border-radius:0 0 var(--r) var(--r)" title="Dashboard PNIPM" loading="lazy"></iframe>
          <p class="muted" style="padding:12px 16px;font-size:11px">Si l'aperçu est vide, le site de référence bloque l'intégration — utilisez les liens « Ouvrir » ci-dessus.</p></div>`;
        v.appendChild(card);
        return v;
      };
      VIEWS._refEmbed = true;
    }
  }

  function patchNav() {
    if (!NAV.admin || !NAV.admin[0]) return;
    const extra = [
      { k: "docs_mission", lbl: "Documents mission", ic: "library" },
      { k: "affectations", lbl: "Affectations A/L", ic: "user_check" },
    ];
    extra.forEach((it) => {
      if (!NAV.admin[0].items.some((x) => x.k === it.k)) NAV.admin[0].items.splice(2, 0, it);
    });
  }

  function patchImportZip() {
    const foot = document.querySelector(".nav-foot");
    if (!foot || document.getElementById("navImportZip")) return;
    const btn = document.createElement("button");
    btn.id = "navImportZip";
    btn.className = "nav-act";
    btn.title = "Import ZIP mission";
    btn.innerHTML = `${svgI('<path d="M12 21V9m0 0 4 4m-4-4-4 4"/>', "")}<span class="nav-lbl">Import ZIP</span>`;
    btn.onclick = () => {
      if (App.user && App.user.role !== "admin") {
        toast("Import", "Réservé au pilotage", "err");
        return;
      }
      const inp = document.createElement("input");
      inp.type = "file";
      inp.accept = ".zip,application/zip";
      inp.onchange = () => {
        const f = inp.files[0];
        if (!f) return;
        if (!confirm("Importer cette archive remplacera/ fusionnera l'état mission sur le serveur. Continuer ?")) return;
        const fd = new FormData();
        fd.append("file", f);
        const fetchFn = window.portiaApi ? portiaApi.fetch : fetch;
        fetchFn("/api/import/mission.zip", { method: "POST", body: fd })
          .then((r) => {
            if (!r.ok) throw new Error(r.status);
            return r.json();
          })
          .then((res) => {
            toast("Import ZIP", res.entretiens + " entretiens · " + res.filesRestored + " fichiers", "ok");
            if (window.portiaReloadServer) return portiaReloadServer();
          })
          .then(() => App.refresh())
          .catch((e) => toast("Import ZIP", e.message || "Échec", "err"));
      };
      inp.click();
    };
    const mini = foot.querySelector(".nav-foot-tools") || foot.querySelector(".nav-mini");
    if (mini) mini.appendChild(btn);
  }

  function patchAuditorFilter() {
    window.PortiaMission = window.PortiaMission || {};
    window.PortiaMission.myEntretiens = function () {
      return myEntretiensFilter(Store.get("entretiens"));
    };
  }

  function init() {
    registerViews();
    patchNav();
    patchMissionViews();
    setTimeout(patchImportZip, 500);
    patchAuditorFilter();
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }

  window.PortiaMissionExt = { getMissionDocs, defaultMissionDocs, init };
})();
