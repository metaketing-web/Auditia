/**
 * Corbeille Data Room — documents vides, doublons, suppression.
 */
(function () {
  "use strict";

  function canTrash() {
    return (
      window.App &&
      App.user &&
      !App.user.readOnly &&
      (App.user.role === "admin" ||
        App.user.serverRole === "admin" ||
        App.user.serverRole === "juliana")
    );
  }

  async function apiFetch(path, opts) {
    const fn = window.portiaApi && portiaApi.fetch ? portiaApi.fetch : fetch;
    return fn(path, opts);
  }

  async function loadTrash() {
    const r = await apiFetch("/api/dataroom/trash");
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  }

  async function deleteDoc(docId, label) {
    if (
      !confirm(
        "Supprimer définitivement « " +
          (label || docId) +
          " » ?\n\nLe fichier et la fiche Data Room seront retirés."
      )
    )
      return false;
    const r = await apiFetch("/api/dataroom/docs/" + encodeURIComponent(docId), {
      method: "DELETE",
    });
    if (!r.ok) {
      let msg = "HTTP " + r.status;
      try {
        const j = await r.json();
        msg = j.detail || msg;
      } catch (_) {}
      toast("Suppression impossible", msg, "err");
      return false;
    }
    Store.remove("docs", docId);
    if (window.portiaApi && portiaApi.saveState) await portiaApi.saveState();
    toast("Corbeille", "Document supprimé", "ok");
    return true;
  }

  async function purgeOrphans() {
    if (
      !confirm(
        "Supprimer tous les documents « versés » sans fichier attaché ?\n\nAction irréversible."
      )
    )
      return;
    const r = await apiFetch("/api/dataroom/trash/purge-orphans", { method: "POST" });
    if (!r.ok) {
      toast("Échec", "HTTP " + r.status, "err");
      return;
    }
    const data = await r.json();
    if (window.portiaBridgeReloadDocs) await portiaBridgeReloadDocs();
    else if (window.portiaApi && portiaApi.fetch) {
      const dr = await apiFetch("/api/dataroom/docs");
      if (dr.ok) {
        const j = await dr.json();
        if (j.docs) Store.state.docs = j.docs.map((d) => ({
          id: d.id, rep: d.rep, source: d.source, type: d.type, desc: d.desc,
          version: d.version, format: d.format, statut: d.statut, j: d.j,
          taille: d.taille, par: d.par, fileId: d.fileId || "",
        }));
        Store.save();
      }
    }
    toast("Corbeille", (data.deleted || 0) + " document(s) vide(s) supprimé(s)", "ok");
    App.go("corbeille");
  }

  function docLabel(d) {
    if (typeof docName === "function") return docName(d);
    return d.normalizedName || d.desc || d.id;
  }

  function renderDocRow(d, opts) {
    opts = opts || {};
    const hasFile = !!(d.fileId || (d.file && d.file.id));
    const label = docLabel(d);
    return (
      '<div class="ck-att-item" style="flex-wrap:wrap;align-items:flex-start">' +
      '<div style="flex:1;min-width:200px">' +
      '<b class="mono" style="font-size:11px;display:block">' +
      esc(label) +
      "</b>" +
      '<span class="muted" style="font-size:11px">' +
      esc(d.rep || "") +
      " · " +
      esc(d.source || "") +
      (d.taille ? " · " + esc(d.taille) : "") +
      (d.par ? " · " + esc(d.par) : "") +
      (hasFile ? "" : ' · <span class="tag" style="font-size:9px">sans fichier</span>') +
      (opts.duplicate ? ' · <span class="tag" style="font-size:9px">doublon</span>' : "") +
      "</span></div>" +
      '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
      (hasFile
        ? '<button type="button" class="btn ghost sm" data-open="' +
          esc(d.id) +
          '" data-fid="' +
          esc(d.fileId || "") +
          '">Ouvrir</button>'
        : "") +
      (canTrash()
        ? '<button type="button" class="btn ghost sm" style="color:var(--crit)" data-del="' +
          esc(d.id) +
          '" data-lbl="' +
          esc(label) +
          '">Supprimer</button>'
        : "") +
      "</div></div>"
    );
  }

  function registerView() {
    VIEWS.corbeille = function () {
      const v = el("div", { class: "view" });
      v.innerHTML =
        pageHead(
          "Collecte · Data Room",
          "Corbeille",
          "Retirez les fiches vides, les doublons et les documents versés par erreur.",
          '<button class="btn ghost" onclick="App.go(\'dataroom\')">' +
            svgI(ICON.dataroom) +
            " Data Room</button>" +
            (canTrash()
              ? '<button class="btn ghost" id="trRefresh">' +
                svgI('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>') +
                " Actualiser</button>"
              : "")
        ) +
        '<div id="trashBody"><div class="note slate">Chargement…</div></div>';

      async function render() {
        const box = v.querySelector("#trashBody");
        if (!box) return;
        try {
          const data = await loadTrash();
          const orphans = data.orphans || [];
          const dups = data.duplicates || [];

          let html = "";
          if (!canTrash()) {
            html +=
              '<div class="note gold">La suppression est réservée aux administrateurs (admin / Juliana).</div>';
          }

          html += '<div class="card pad" style="margin-bottom:16px">';
          html +=
            '<div class="between" style="margin-bottom:10px"><b>Documents vides (versés sans fichier)</b>';
          if (canTrash() && orphans.length) {
            html +=
              '<button class="btn ghost sm" id="trPurgeAll" style="color:var(--crit)">Tout supprimer (' +
              orphans.length +
              ")</button>";
          }
          html += "</div>";
          if (!orphans.length) {
            html += '<div class="muted" style="font-size:12px">Aucun document vide.</div>';
          } else {
            html += '<div class="ck-att-list">' + orphans.map((d) => renderDocRow(d)).join("") + "</div>";
          }
          html += "</div>";

          html += '<div class="card pad">';
          html +=
            '<b style="display:block;margin-bottom:10px">Doublons détectés (' +
            dups.length +
            " groupe(s))</b>";
          html +=
            '<div class="note slate" style="margin-bottom:12px;font-size:12px">Même nom normalisé ou même empreinte fichier. Conservez la version la plus récente, supprimez les copies.</div>';
          if (!dups.length) {
            html += '<div class="muted" style="font-size:12px">Aucun doublon détecté.</div>';
          } else {
            dups.forEach((g) => {
              html +=
                '<div style="margin-bottom:14px;padding:12px;background:var(--surface-2);border-radius:var(--r-sm);border:1px solid var(--line)">';
              html +=
                '<div class="eyebrow" style="margin-bottom:8px">' +
                (g.kind === "sha256" ? "Empreinte identique" : "Nom identique") +
                " · " +
                esc(g.key) +
                " · " +
                g.count +
                " copies</div>";
              html +=
                '<div class="ck-att-list">' +
                (g.docs || []).map((d) => renderDocRow(d, { duplicate: true })).join("") +
                "</div></div>";
            });
          }
          html += "</div>";

          box.innerHTML = html;

          box.querySelectorAll("[data-open]").forEach((btn) => {
            btn.onclick = () => {
              if (Files.openDocument)
                Files.openDocument({ id: btn.dataset.open, fileId: btn.dataset.fid });
            };
          });
          box.querySelectorAll("[data-del]").forEach((btn) => {
            btn.onclick = async () => {
              const ok = await deleteDoc(btn.dataset.del, btn.dataset.lbl);
              if (ok) render();
            };
          });
          const purge = box.querySelector("#trPurgeAll");
          if (purge) purge.onclick = () => purgeOrphans().then(() => render());
        } catch (e) {
          box.innerHTML =
            '<div class="note crit">Impossible de charger la corbeille : ' + esc(e.message) + "</div>";
        }
      }

      const ref = v.querySelector("#trRefresh");
      if (ref) ref.onclick = () => render();
      render();
      return v;
    };
    CRUMB.corbeille = "Corbeille";
  }

  function patchDataroomDeleteBtn() {
    if (!window.VIEWS || VIEWS._trashDataroom) return;
    const orig = VIEWS.dataroom;
    if (!orig) return;
    VIEWS.dataroom = function () {
      const v = orig();
      setTimeout(() => {
        const head = v.querySelector(".page-actions, .between");
        if (!head || v.querySelector("#drTrashBtn")) return;
        const b = document.createElement("button");
        b.className = "btn ghost sm";
        b.id = "drTrashBtn";
        b.style.color = "var(--crit)";
        b.innerHTML =
          svgI('<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>') +
          " Corbeille";
        b.onclick = () => App.go("corbeille");
        head.appendChild(b);
      }, 50);
      return v;
    };
    VIEWS._trashDataroom = true;
  }

  function patchNav() {
    if (!window.NAV) return;
    const item = { k: "corbeille", lbl: "Corbeille", ic: "trash" };
    const add = (sec) => {
      if (sec && !sec.items.some((i) => i.k === "corbeille")) sec.items.push(item);
    };
    if (NAV.admin) {
      const sec = NAV.admin.find((s) => s.sec === "Pilotage") || NAV.admin[0];
      add(sec);
    }
    /* Corbeille : pilotage / admin uniquement */
  }

  function patchAllowed() {
    if (!window.App || !App.allowed || App._trashAllowed) return;
    const orig = App.allowed.bind(App);
    App.allowed = function (k) {
      const u = this.user;
      const aud =
        u && (u.role === "auditeur" || u.serverRole === "auditeur_b" || u.serverRole === "auditeur_t");
      if (k === "corbeille" && aud) return false;
      if (k === "corbeille") return true;
      return orig(k);
    };
    App._trashAllowed = true;
  }

  function init() {
    registerView();
    patchDataroomDeleteBtn();
    patchNav();
    patchAllowed();
  }

  window.PortiaDataroomTrash = { deleteDoc, purgeOrphans, loadTrash, init };

  if (typeof VIEWS !== "undefined") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
