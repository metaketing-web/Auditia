/**
 * Contenus démo L1–L8 — injection cockpit Livrables + brouillons reportDrafts
 */
(function () {
  "use strict";

  const DATA = window.PortiaDemoLivrablesData || {};
  const VERSION = DATA.version || 1;

  function data() {
    return window.PortiaDemoLivrablesData || { content: {}, meta: {} };
  }

  function saveState() {
    if (window.portiaApi && portiaApi.saveState) return portiaApi.saveState();
    if (window.Store) Store.save();
    return Promise.resolve();
  }

  function applyDemoContents(opts) {
    opts = opts || {};
    const d = data();
    const content = d.content || {};
    const meta = d.meta || {};
    if (!Object.keys(content).length) {
      toast("Contenus démo", "Fichier portia-demo-livrables-data.js absent", "err");
      return Promise.resolve(0);
    }
    const refs = opts.refs || Object.keys(content);
    const force = !!opts.force;
    let n = 0;
    const now = new Date().toISOString();
    refs.forEach((ref) => {
      const text = content[ref];
      if (!text || !String(text).trim()) return;
      const livs = Store.get("livrables") || [];
      const l = livs.find((x) => x.ref === ref);
      if (!l) return;
      if (!force && l.contenu && String(l.contenu).trim()) return;
      const m = meta[ref] || {};
      const patch = {
        contenu: text,
        updated: now,
      };
      if (m.statut) patch.statut = m.statut;
      if (typeof m.progress === "number") patch.progress = m.progress;
      if (m.statut === "valide" || m.statut === "redige") patch.workflow = m.statut === "valide" ? "valide" : "en_revue";
      Store.patch("livrables", l.id, patch);
      if (!Store.state.reportDrafts) Store.state.reportDrafts = {};
      Store.state.reportDrafts[ref] = { text, savedAt: now, by: "démo Skydeen" };
      n++;
    });
    if (!Store.state.meta) Store.state.meta = {};
    Store.state.meta.demoLivrablesVersion = VERSION;
    Store.state.meta.demoLivrablesAt = now;
    return saveState().then(() => n);
  }

  function previewLivrable(ref) {
    const d = data();
    const text = (d.content && d.content[ref]) || "";
    const liv = (Store.get("livrables") || []).find((x) => x.ref === ref);
    const body = (liv && liv.contenu && String(liv.contenu).trim()) || text;
    if (!body) {
      toast("Aperçu", "Aucun contenu pour " + ref, "err");
      return;
    }
    Modal.open(
      `<div class="modal-h"><h2>${esc(ref)} — ${esc((liv && liv.titre) || ref)}</h2><button class="x" onclick="Modal.close()">${svgI('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div>
      <div class="modal-b"><div class="ai-stream" style="white-space:pre-wrap;max-height:70vh;overflow:auto">${aiFormat(body)}</div></div>
      <div class="modal-f"><button class="btn ghost" onclick="Modal.close()">Fermer</button><button class="btn terra" id="pvCopy">Copier</button></div>`,
      true
    );
    const cp = document.getElementById("pvCopy");
    if (cp) cp.onclick = () => {
      if (navigator.clipboard) navigator.clipboard.writeText(body);
      toast("Copié", "", "ok");
    };
  }

  function patchLivrablesView() {
    const orig = VIEWS.livrables;
    if (!orig || VIEWS._demoLivrables) return;
    VIEWS.livrables = function () {
      const v = orig();
      const head = v.querySelector(".page-head .actions");
      if (head && !head.querySelector("#btnDemoLiv")) {
        const btn = el("button", {
          class: "btn ghost",
          id: "btnDemoLiv",
          type: "button",
        });
        btn.innerHTML = `${svgI(ICON.livrables)} Charger contenus démo L1–L8`;
        btn.onclick = () => {
          const ro = App.user && App.user.readOnly;
          if (ro) {
            toast("Lecture seule", "Import démo non autorisé", "err");
            return;
          }
          applyDemoContents({ force: true }).then((n) => {
            toast("Contenus démo", n + " livrable(s) chargé(s)", "ok");
            App.refresh();
          });
        };
        head.insertBefore(btn, head.firstChild);
      }
      const note = el("div", { class: "note sage", style: "margin-bottom:18px" });
      const seeded = Store.state.meta && Store.state.meta.demoLivrablesVersion >= VERSION;
      note.innerHTML = seeded
        ? `<b>Contenus démo disponibles</b> — L1 à L8 (Word + texte cockpit). Utilisez « Voir le projet » sur chaque carte ou exportez en .doc.`
        : `<b>Contenus démo prêts</b> — Cliquez « Charger contenus démo L1–L8 » pour injecter les projets rédigés (simulation cabinet Skydeen).`;
      const grid = v.querySelector(".grid");
      if (grid && !v.querySelector(".note.sage")) v.insertBefore(note, grid);
      return v;
    };
    VIEWS._demoLivrables = true;
  }

  function patchOpenLivrable() {
    if (window._openLivrableDemo) return;
    const orig = window.openLivrable;
    if (!orig) return;
    window.openLivrable = function (id) {
      orig(id);
      setTimeout(() => {
        const l = Store.find("livrables", id);
        if (!l) return;
        const foot = document.querySelector(".modal-f");
        if (!foot || foot.querySelector("#lvPreview")) return;
        const prev = el("button", { class: "btn ghost", id: "lvPreview", type: "button" });
        prev.textContent = "Prévisualiser";
        prev.onclick = () => previewLivrable(l.ref);
        const ai = foot.querySelector("#lvAi");
        if (ai) foot.insertBefore(prev, ai);
        else foot.insertBefore(prev, foot.firstChild);
      }, 0);
    };
    window._openLivrableDemo = true;
  }

  function seedIfNeeded() {
    if (!window.Store || !Store.state) return;
    const cur = (Store.state.meta && Store.state.meta.demoLivrablesVersion) || 0;
    if (cur >= VERSION) return;
    const empty = (Store.get("livrables") || []).some((l) => {
      if (l.ref === "L1") return false;
      const d = data();
      return d.content && d.content[l.ref] && !(l.contenu && String(l.contenu).trim());
    });
    if (!empty) return;
    applyDemoContents({ refs: Object.keys(data().content || {}).filter((r) => r !== "L1"), force: false }).then((n) => {
      if (n > 0) console.info("[PortiaDemoLivrables] auto-seed:", n);
    });
  }

  function init() {
    patchLivrablesView();
    patchOpenLivrable();
    seedIfNeeded();
  }

  window.PortiaDemoLivrables = {
    apply: applyDemoContents,
    preview: previewLivrable,
    version: VERSION,
    init,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(init, 100));
  } else {
    setTimeout(init, 100);
  }
})();
