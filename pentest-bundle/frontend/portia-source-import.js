/**
 * Import manuel de fichier avec qualification de source (qui / quoi / comment).
 */
(function () {
  "use strict";

  const SOURCE_TYPES = {
    entretien: "Entretien / témoignage",
    document: "Document officiel",
    export_si: "Export SI / base",
    demo: "Démonstration / capture écran",
    photo: "Photo terrain",
    enregistrement: "Enregistrement audio",
    observation: "Observation directe",
    autre: "Autre",
  };

  function ensureQualityRows() {
    if (!Store.state.dataQualitySources) Store.state.dataQualitySources = [];
    return Store.state.dataQualitySources;
  }

  function addQualityRow(meta, fileName) {
    const rows = ensureQualityRows();
    const id = typeof uid === "function" ? uid("dq") : "dq_" + Date.now();
    rows.push({
      id: id,
      source: meta.quoi || fileName || "Import manuel",
      owner: meta.qui || "—",
      completude: meta.qual === "documente" ? 70 : meta.qual === "observe" ? 85 : 40,
      fraicheurJours: 0,
      lineage: meta.qual === "observe" ? "documente" : meta.qual === "documente" ? "partiel" : "absent",
      lineageNote:
        (SOURCE_TYPES[meta.sourceType] || meta.sourceType) +
        " — " +
        (meta.comment || "") +
        (meta.linkedEntretienId ? " · lié entretien " + meta.linkedEntretienId : ""),
      critique: false,
      importFile: fileName,
      importAt: new Date().toISOString(),
      importMeta: {
        sourceType: meta.sourceType,
        qual: meta.qual,
        qui: meta.qui,
        quoi: meta.quoi,
        comment: meta.comment,
        triang: meta.triang,
        fileId: meta.fileId,
      },
    });
    Store.state.dataQualitySources = rows;
  }

  function open(file, opts) {
    opts = opts || {};
    if (!file) return;
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const sizeKb = file.size / 1024;
    const sizeStr = sizeKb > 1024 ? (sizeKb / 1024).toFixed(1) + " Mo" : Math.round(sizeKb) + " Ko";
    const qualOpts = window.QUAL || {
      declaratif: { lbl: "Déclaratif" },
      documente: { lbl: "Documenté" },
      observe: { lbl: "Observé" },
    };

    Modal.open(
      '<div class="modal-h"><div class="ic" style="background:var(--sage-soft);color:var(--sage-deep)">' +
        (typeof svgI === "function"
          ? svgI('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>')
          : "") +
        '</div><div><div class="eyebrow">Import qualifié</div><h2 style="font-size:16px">Qualifier la source</h2></div>' +
        '<button class="x" onclick="Modal.close()">' +
        (typeof svgI === "function" ? svgI('<path d="M18 6 6 18M6 6l12 12"/>') : "×") +
        "</button></div>" +
        '<div class="modal-b">' +
        '<div class="file-i" style="margin-bottom:14px"><div class="bd"><b>' +
        esc(file.name) +
        "</b><span>" +
        esc(sizeStr) +
        " · ." +
        esc(ext) +
        "</span></div></div>" +
        '<div class="f2"><div class="frow"><label>Type de source</label><select id="siType">' +
        Object.keys(SOURCE_TYPES)
          .map(
            (k) =>
              '<option value="' +
              k +
              '"' +
              (opts.defaultType === k ? " selected" : "") +
              ">" +
              esc(SOURCE_TYPES[k]) +
              "</option>"
          )
          .join("") +
        '</select></div><div class="frow"><label>Qualité / nature</label><select id="siQual">' +
        Object.keys(qualOpts)
          .map(
            (k) =>
              '<option value="' +
              k +
              '">' +
              esc(qualOpts[k].lbl || k) +
              "</option>"
          )
          .join("") +
        '</select></div></div><div class="frow"><label>Qui (auteur / structure / interlocuteur)</label><input id="siQui" placeholder="Ex. DSI — M. Koné" value="' +
        esc(opts.qui || "") +
        '"></div><div class="frow"><label>Quoi (objet de la preuve)</label><input id="siQuoi" placeholder="Ex. export SIGFIP mars 2026" value="' +
        esc(opts.quoi || "") +
        '"></div><div class="frow"><label>Comment (contexte, méthode, limites)</label><textarea id="siComment" rows="3" placeholder="Ex. reçu par mail, non signé, extrait partiel…">' +
        esc(opts.comment || "") +
        '</textarea></div><div class="frow"><label>Triangulation (0-3)</label><select id="siTriang">' +
        [0, 1, 2, 3]
          .map((n) => '<option value="' + n + '">' + n + " source(s)</option>")
          .join("") +
        '</select></div><label style="display:flex;gap:8px;align-items:center;font-size:12px;margin-top:8px"><input type="checkbox" id="siDataroom" checked> Verser aussi en Data Room</label><label style="display:flex;gap:8px;align-items:center;font-size:12px"><input type="checkbox" id="siQualGrid" checked> Ajouter à la grille qualité données</label></div>' +
        '<div class="modal-f"><button class="btn ghost" onclick="Modal.close()">Annuler</button><button class="btn terra" id="siSave">Importer</button></div>',
      true
    );

    document.getElementById("siSave").onclick = async () => {
      const meta = {
        sourceType: document.getElementById("siType").value,
        qual: document.getElementById("siQual").value,
        qui: document.getElementById("siQui").value.trim(),
        quoi: document.getElementById("siQuoi").value.trim(),
        comment: document.getElementById("siComment").value.trim(),
        triang: parseInt(document.getElementById("siTriang").value, 10) || 0,
        linkedEntretienId: opts.entretienId || "",
      };
      if (!meta.qui || !meta.quoi) {
        toast("Champs requis", "Renseignez Qui et Quoi", "err");
        return;
      }
      const btn = document.getElementById("siSave");
      btn.disabled = true;
      try {
        const fileId =
          typeof uid === "function" ? uid("src") : "src_" + Date.now().toString(36);
        let uploadOk = false;
        if (window.Files && Files.put) {
          const toDataroom = document.getElementById("siDataroom").checked;
          if (toDataroom && typeof depositModal === "function") {
            Modal.close();
            window._sourceImportPending = { file, meta, opts };
            depositModal(file);
            return;
          }
          const res = await Files.put(fileId, file, {
            name: file.name,
            mime: file.type,
            source: meta.qui,
            type: meta.sourceType.toUpperCase(),
            desc: slugDesc(meta.quoi, 48),
          });
          uploadOk = !!(res && res.ok !== false);
          meta.fileId = (res && (res.fileId || res.id)) || fileId;
        }
        if (document.getElementById("siQualGrid").checked) addQualityRow(meta, file.name);
        Store.save();
        if (window.portiaApi && portiaApi.saveState) await portiaApi.saveState();
        if (opts.onDone) opts.onDone(meta);
        Modal.close();
        toast(
          "Import qualifié",
          uploadOk ? file.name + " enregistré" : "Métadonnées enregistrées",
          "ok"
        );
        if (opts.refreshView) App.go(opts.refreshView);
        else App.refresh();
      } catch (e) {
        toast("Échec import", e.message || String(e), "err");
      } finally {
        btn.disabled = false;
      }
    };
  }

  function pick(opts) {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = opts.accept || "image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.text,.csv,.md,.json,.zip,audio/*";
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (f) open(f, opts || {});
    };
    inp.click();
  }

  function pickPhoto(opts) {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "image/*";
    inp.setAttribute("capture", "environment");
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (f)
        open(f, Object.assign({ defaultType: "photo" }, opts || {}));
    };
    inp.click();
  }

  function patchDepot() {
    if (!window.VIEWS || VIEWS._sourceDepot) return;
    const orig = VIEWS.depot;
    VIEWS.depot = function () {
      const v = orig();
      setTimeout(() => {
        const dz = v.querySelector("#dz");
        if (!dz || dz.querySelector("#dzQualBtn")) return;
        const b = document.createElement("button");
        b.className = "btn ghost sm";
        b.id = "dzQualBtn";
        b.style.marginTop = "10px";
        b.style.marginRight = "8px";
        b.innerHTML =
          (typeof svgI === "function"
            ? svgI('<path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"/>')
            : "") + " Import avec qualification source";
        b.onclick = () => pick({ refreshView: "depot" });
        const wrap = document.createElement("div");
        wrap.style.cssText = "display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px";
        wrap.appendChild(b);
        if (!dz.querySelector("#dzQualPhotoBtn")) {
          const p = document.createElement("button");
          p.className = "btn terra sm";
          p.id = "dzQualPhotoBtn";
          p.innerHTML =
            (typeof svgI === "function"
              ? svgI('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>')
              : "") + " Photo qualifiée";
          p.onclick = () => pickPhoto({ refreshView: "depot" });
          wrap.appendChild(p);
        }
        dz.insertAdjacentElement("afterend", wrap);
      }, 30);
      return v;
    };
    VIEWS._sourceDepot = true;
  }

  function patchQualdata() {
    if (!window.VIEWS || !VIEWS.qualdata || VIEWS._sourceQual) return;
    const orig = VIEWS.qualdata;
    VIEWS.qualdata = function () {
      const v = orig();
      setTimeout(() => {
        const head = v.querySelector(".page-actions, .between");
        const actions = v.querySelector(".actions");
        const target = actions || head;
        if (!target || target.querySelector("#dqImportBtn")) return;
        const b = document.createElement("button");
        b.className = "btn ghost sm";
        b.id = "dqImportBtn";
        b.textContent = "Importer une source";
        b.onclick = () => pick({ refreshView: "qualdata" });
        target.insertBefore(b, target.firstChild);
      }, 60);
      return v;
    };
    VIEWS._sourceQual = true;
  }

  function init() {
    patchDepot();
    patchQualdata();
  }

  window.PortiaSourceImport = {
    SOURCE_TYPES,
    open,
    pick,
    pickPhoto,
    addQualityRow,
    init,
  };

  if (typeof Store !== "undefined") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
