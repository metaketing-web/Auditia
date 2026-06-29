/**
 * Finalisation — feature flags, flux, volet B éditable, export ZIP, Data Room sync
 */
(function () {
  "use strict";

  function cfg() {
    return window.PORTIA_SERVER_CONFIG || {};
  }

  function feats() {
    return (cfg().features || {});
  }

  function saveState() {
    if (window.portiaApi && portiaApi.saveState) return portiaApi.saveState();
    Store.save();
    return Promise.resolve();
  }

  function applyFeatureNav() {
    const f = feats();
    const hide = (k) => {
      document.querySelectorAll('.nav-i[data-k="' + k + '"]').forEach((a) => {
        a.style.display = "none";
      });
    };
    if (!f.voletB) hide("voletb");
    if (!f.dataFlows) hide("flux");
    if (!f.cartographie) hide("eco");
    if (!f.cartographie) hide("carto_graph");
    if (!f.collecteLacunes) hide("lacunes");
    if (!f.dataQualityGrid) hide("qualdata");
    if (!f.progNonProg) hide("prognonprog");
    if (!f.auditJournal) hide("journal");
    setTimeout(function () {
      if (window.PortiaAuditorNav && PortiaAuditorNav.ensureAuditorNav) {
        PortiaAuditorNav.ensureAuditorNav();
        if (window.App && App.user && App.user.role === "auditeur" && App.renderNav) {
          App.renderNav();
        }
      }
    }, 0);
  }

  function patchFluxView() {
    const orig = VIEWS.flux;
    if (!orig || VIEWS._fluxDone) return;
    VIEWS.flux = function () {
      const v = orig();
      const grid = v.querySelector("#fluxGrid");
      if (!grid) return v;
      let filter = "all";
      const nodes = Array.from(grid.querySelectorAll(".flux-node"));
      function apply() {
        nodes.forEach((n) => {
          const st = n.dataset.st || "";
          n.style.display = filter === "all" || filter === st ? "" : "none";
        });
      }
      const bar = document.createElement("div");
      bar.className = "chiprow";
      bar.style.marginBottom = "14px";
      bar.innerHTML =
        '<button class="tag on" data-f="all">Tous</button>' +
        '<button class="tag" data-f="actif">Actif</button>' +
        '<button class="tag" data-f="planifie">Planifié</button>' +
        '<button class="tag" data-f="absent">Absent</button>';
      bar.querySelectorAll(".tag").forEach((btn) => {
        btn.onclick = () => {
          filter = btn.dataset.f;
          bar.querySelectorAll(".tag").forEach((t) => t.classList.toggle("on", t === btn));
          apply();
        };
      });
      const card = grid.closest(".card");
      if (card && card.querySelector(".card-b")) {
        card.querySelector(".card-b").insertBefore(bar, grid);
      }
      nodes.forEach((n) => {
        n.style.cursor = "pointer";
        n.onclick = () => {
          filter = n.dataset.st;
          bar.querySelectorAll(".tag").forEach((t) => t.classList.toggle("on", t.dataset.f === filter));
          apply();
        };
      });
      VIEWS._fluxDone = true;
      return v;
    };
  }

  function patchVoletB() {
    const orig = VIEWS.voletb;
    if (!orig || VIEWS._vbEdit) return;
    VIEWS.voletb = function () {
      const v = orig();
      if (App.user && App.user.readOnly) return v;
      v.querySelectorAll(".tbl tbody tr").forEach((tr) => {
        const cells = tr.querySelectorAll("td");
        if (cells.length < 4 || tr.dataset.vbBound) return;
        tr.dataset.vbBound = "1";
        tr.style.cursor = "pointer";
        tr.onclick = () => {
          const lib = cells[0].textContent;
          const source = cells[1].textContent;
          const priorite = cells[2].textContent.trim();
          const statut = cells[3].textContent.trim().toLowerCase();
          const blockKey = tr.closest(".card")?.querySelector("h3")?.textContent || "";
          Modal.open(
            `<div class="modal-h"><h2>Volet B — ${esc(lib)}</h2><button class="x" onclick="Modal.close()">${svgI('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div>
            <div class="modal-b">
              <div class="frow"><label>Statut</label><select id="vbSt"><option value="attendu">Attendu</option><option value="a_documenter">À documenter</option><option value="ecart">Écart</option><option value="verse">Versé</option></select></div>
              <div class="frow"><label>Priorité</label><select id="vbPr"><option value="haute">haute</option><option value="moyenne">moyenne</option><option value="basse">basse</option></select></div>
              <div class="frow"><label>Source</label><input id="vbSrc" value="${esc(source)}"></div>
            </div>
            <div class="modal-f"><button class="btn ghost" onclick="Modal.close()">Annuler</button><button class="btn terra" id="vbSave">Enregistrer</button></div>`
          );
          document.getElementById("vbSt").value = statut.includes("ecart") ? "ecart" : statut.includes("doc") ? "a_documenter" : statut.includes("vers") ? "verse" : "attendu";
          document.getElementById("vbPr").value = priorite.includes("haut") ? "haute" : priorite.includes("bas") ? "basse" : "moyenne";
          document.getElementById("vbSave").onclick = () => {
            const vb = Store.state.voletB || {};
            Object.keys(vb).forEach((key) => {
              const block = vb[key];
              if (!block || !block.items) return;
              block.items.forEach((it) => {
                if (it.lib === lib) {
                  it.statut = document.getElementById("vbSt").value;
                  it.priorite = document.getElementById("vbPr").value;
                  it.source = document.getElementById("vbSrc").value.trim();
                }
              });
            });
            saveState().then(() => {
              Modal.close();
              toast("Volet B", "Élément mis à jour", "ok");
              App.go("voletb");
            });
          };
        };
      });
      return v;
    };
    VIEWS._vbEdit = true;
  }

  function exportZip(anonymize) {
    if (window.App && App.user && App.user.readOnly) {
      toast("Export ZIP", "Réservé au pilotage de mission", "warn");
      return Promise.resolve();
    }
    const url = "/api/export/mission.zip?anonymize=" + (anonymize ? "true" : "false");
    const fetchFn = window.portiaApi ? portiaApi.fetch : fetch;
    return fetchFn(url)
      .then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = anonymize ? "skydeen-export-anonymise.zip" : "skydeen-export-mission.zip";
        a.click();
        toast("Export ZIP", "Mission complète téléchargée", "ok");
      });
  }

  function patchExportUi() {
    if (!feats().exportZip) return;
    if (window.App && App.user && App.user.readOnly) return;
    const origExport = Store.exportJSON.bind(Store);
    Store.exportJSON = function () {
      origExport();
      if (!window.PORTIA_SERVER_MODE) return;
      if (!feats().exportZip) return;
      const full = confirm(
        "Télécharger l'export ZIP complet de la mission (JSON, fichiers, questionnaires, journal) ?\n\nOK = export complet\nAnnuler = ne pas exporter"
      );
      if (!full) return;
      const anon =
        feats().anonymizeExport &&
        confirm("Anonymiser les données personnelles (RGPD) dans cet export ?");
      exportZip(!!anon).catch((e) => toast("Export ZIP", e.message || "Échec", "err"));
    };

    const addZipBtn = (parent, id) => {
      if (document.getElementById(id)) return;
      const b = document.createElement("button");
      b.id = id;
      b.className = "btn ghost sm";
      b.style.marginTop = "8px";
      b.style.width = "100%";
      b.textContent = "Export ZIP serveur";
      b.onclick = () => {
        const anon = confirm("Anonymiser les données personnelles (RGPD) ?");
        exportZip(anon).catch((e) => toast("Export ZIP", e.message || "Échec", "err"));
      };
      parent.appendChild(b);
    };

    const origReg = VIEWS.reglages;
    VIEWS.reglages = function () {
      const v = origReg();
      setTimeout(() => {
        const stack = v.querySelector(".stack");
        if (stack) addZipBtn(stack, "stZip");
        const c = cfg();
        if (c.maxUploadMb) {
          const note = v.querySelector(".note.slate");
          if (note)
            note.innerHTML +=
              "<br><b>Limites serveur :</b> " +
              c.maxUploadMb +
              " Mo / fichier · " +
              (c.dailyUploadQuotaMb || 200) +
              " Mo / jour / utilisateur.";
        }
      }, 50);
      return v;
    };
  }

  function patchDataroomStatut() {
    const origPatch = Store.patch.bind(Store);
    Store.patch = function (coll, id, fields) {
      const res = origPatch(coll, id, fields);
      if (coll === "docs" && fields.statut && window.PORTIA_SERVER_MODE) {
        const fetchFn = window.portiaApi ? portiaApi.fetch : fetch;
        fetchFn("/api/dataroom/docs/" + encodeURIComponent(id), {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ statut: fields.statut }),
        }).catch(() => {});
      }
      return res;
    };
  }

  function patchConductSave() {
    if (window._conductSavePatched) return;
    window._conductSavePatched = true;
  }

  function patchCollecteSaves() {
    if (!window.PortiaCollecte) return;
  }

  function init() {
    applyFeatureNav();
    patchFluxView();
    patchVoletB();
    patchExportUi();
    patchDataroomStatut();
    const origRefresh = App.refresh.bind(App);
    App.refresh = function () {
      origRefresh();
      setTimeout(applyFeatureNav, 80);
    };
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => setTimeout(init, 0));
    } else {
      setTimeout(init, 0);
    }
  }

  window.PortiaFinalize = { init, exportZip, applyFeatureNav };
})();
