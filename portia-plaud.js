/**
 * Plaud — import enregistrements, transcriptions et photos (entretiens & collecte).
 */
(function () {
  "use strict";

  const AUDIO_EXT = /\.(mp3|m4a|wav|aac|ogg|webm|mp4)$/i;
  const TEXT_EXT = /\.(txt|md|srt|vtt)$/i;

  function mediaId(prefix) {
    return (typeof uid === "function" ? uid(prefix) : prefix + "_" + Date.now().toString(36));
  }

  function ensureMedia(ent) {
    if (!ent.media) ent.media = [];
    return ent.media;
  }

  async function uploadFile(blob, meta) {
    const id = mediaId("plaud");
    if (!window.Files || !Files.put) throw new Error("Upload indisponible");
    const res = await Files.put(id, blob, meta);
    if (!res || res.ok === false) throw new Error("Échec upload");
    return {
      id: id,
      fileId: res.fileId || res.id || id,
      name: meta.name || blob.name || "fichier",
      mime: meta.mime || blob.type || "",
    };
  }

  function persistEntretien(ent) {
    Store.patch("entretiens", ent.id, {
      media: ent.media,
      updated: new Date().toISOString(),
    });
    if (window.portiaApi && portiaApi.saveState) portiaApi.saveState().catch(() => {});
  }

  async function importAudio(ent, file) {
    const up = await uploadFile(file, {
      name: file.name,
      mime: file.type || "audio/mpeg",
      source: "PLAUD",
    });
    ensureMedia(ent).push({
      id: up.id,
      fileId: up.fileId,
      name: up.name,
      mime: up.mime,
      kind: "audio",
      plaud: true,
      at: new Date().toISOString(),
    });
    persistEntretien(ent);
    toast("Plaud", "Enregistrement audio importé", "ok");
  }

  async function importPhoto(ent, file) {
    const up = await uploadFile(file, {
      name: file.name,
      mime: file.type || "image/jpeg",
      source: "PLAUD",
    });
    ensureMedia(ent).push({
      id: up.id,
      fileId: up.fileId,
      name: up.name,
      mime: up.mime,
      kind: "photo",
      plaud: true,
      at: new Date().toISOString(),
    });
    persistEntretien(ent);
    toast("Photo", file.name + " ajoutée", "ok");
  }

  async function importTranscript(ent, file, targetCrId) {
    const text = await file.text();
    const up = await uploadFile(file, {
      name: file.name,
      mime: file.type || "text/plain",
      source: "PLAUD",
    });
    ensureMedia(ent).push({
      id: up.id,
      fileId: up.fileId,
      name: up.name,
      mime: up.mime,
      kind: "transcript",
      plaud: true,
      transcriptText: text.slice(0, 500000),
      at: new Date().toISOString(),
    });
    if (targetCrId) {
      const ta = document.getElementById(targetCrId);
      if (ta) {
        const block = "\n\n--- Transcription Plaud (" + file.name + ") ---\n" + text.trim();
        ta.value = (ta.value || "") + block;
      }
    } else if (text.trim()) {
      const cur = ent.cr || "";
      ent.cr = cur + (cur ? "\n\n" : "") + "--- Transcription Plaud ---\n" + text.trim();
    }
    persistEntretien(ent);
    toast("Plaud", "Transcription importée", "ok");
  }

  function openMedia(att) {
    const fid = att.fileId || att.id;
    if (att.kind === "transcript" && att.transcriptText) {
      Modal.open(
        '<div class="modal-h"><h2>Transcription Plaud</h2><button class="x" onclick="Modal.close()">' +
          (typeof svgI === "function" ? svgI('<path d="M18 6 6 18M6 6l12 12"/>') : "×") +
          '</button></div><div class="modal-b"><pre class="file-preview-text">' +
          esc(att.transcriptText) +
          '</pre></div><div class="modal-f"><button class="btn ghost" onclick="Modal.close()">Fermer</button></div>',
        true
      );
      return;
    }
    if (Files.openInTab) Files.openInTab(fid);
  }

  function renderList(ent, container) {
    if (!container) return;
    const media = ent.media || [];
    if (!media.length) {
      container.innerHTML =
        '<div class="muted" style="font-size:12px">Aucun enregistrement Plaud / photo.</div>';
      return;
    }
    container.innerHTML = media
      .map(
        (m, i) =>
          `<div class="ck-att-item">
            <span class="tag" style="font-size:9px">${esc(m.kind || "fichier")}</span>
            <span class="nm" title="${esc(m.name)}">${esc(m.name)}</span>
            <button type="button" class="btn ghost sm" data-pm-open="${i}">Voir</button>
            <button type="button" class="btn ghost sm" data-pm-rm="${i}">Retirer</button>
          </div>`
      )
      .join("");
    container.querySelectorAll("[data-pm-open]").forEach((btn) => {
      btn.onclick = () => openMedia(media[parseInt(btn.dataset.pmOpen, 10)]);
    });
    container.querySelectorAll("[data-pm-rm]").forEach((btn) => {
      btn.onclick = () => {
        media.splice(parseInt(btn.dataset.pmRm, 10), 1);
        persistEntretien(ent);
        renderList(ent, container);
      };
    });
  }

  function wirePanel(ent, root, opts) {
    opts = opts || {};
    const listEl = root.querySelector("[data-plaud-list]");
    const audioIn = root.querySelector("[data-plaud-audio]");
    const photoIn = root.querySelector("[data-plaud-photo]");
    const textIn = root.querySelector("[data-plaud-text]");
    const btnA = root.querySelector("[data-plaud-btn-audio]");
    const btnP = root.querySelector("[data-plaud-btn-photo]");
    const btnT = root.querySelector("[data-plaud-btn-text]");

    if (btnA && audioIn) btnA.onclick = () => audioIn.click();
    if (btnP && photoIn) btnP.onclick = () => photoIn.click();
    if (btnT && textIn) btnT.onclick = () => textIn.click();

    async function onFile(input, handler) {
      input.onchange = async () => {
        const f = input.files && input.files[0];
        input.value = "";
        if (!f) return;
        try {
          await handler(f);
          renderList(ent, listEl);
        } catch (e) {
          toast("Plaud", e.message || String(e), "err");
        }
      };
    }
    if (audioIn) onFile(audioIn, (f) => importAudio(ent, f));
    if (photoIn) onFile(photoIn, (f) => importPhoto(ent, f));
    if (textIn)
      onFile(textIn, (f) => importTranscript(ent, f, opts.crFieldId || null));
    const btnQ = root.querySelector("[data-plaud-qual]");
    if (btnQ && window.PortiaSourceImport)
      btnQ.onclick = () =>
        PortiaSourceImport.pick({
          entretienId: ent.id,
          qui: [ent.prenom, ent.nom].filter(Boolean).join(" ") || ent.n,
          defaultType: "entretien",
        });
    renderList(ent, listEl);
  }

  function panelHTML(opts) {
    opts = opts || {};
    const mic = svgI(
      '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>'
    );
    const cam = svgI(
      '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>'
    );
    const doc = svgI('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>');
    return (
      '<div class="note slate" style="margin-bottom:10px;font-size:12px"><b>Plaud</b> — importez l\'audio, la transcription (.txt) ou une photo depuis l\'app Plaud ou votre appareil.</div>' +
      '<div data-plaud-list class="ck-att-list"></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">' +
      '<button type="button" class="btn ghost sm" data-plaud-btn-audio>' +
      mic +
      " Audio Plaud</button>" +
      '<button type="button" class="btn ghost sm" data-plaud-btn-text>' +
      doc +
      " Transcription</button>" +
      '<button type="button" class="btn ghost sm" data-plaud-btn-photo>' +
      cam +
      " Ajouter une photo</button>" +
      '<input type="file" data-plaud-audio style="display:none" accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg,.webm">' +
      '<input type="file" data-plaud-text style="display:none" accept=".txt,.md,.srt,.vtt,text/plain">' +
      '<input type="file" data-plaud-photo style="display:none" accept="image/*" capture="environment">' +
      (window.PortiaSourceImport
        ? '<button type="button" class="btn ghost sm" data-plaud-qual style="margin-left:auto">Import preuve qualifiée</button>'
        : "") +
      "</div>"
    );
  }

  function mount(ent, containerId, opts) {
    const root = document.getElementById(containerId);
    if (!root || !ent) return;
    root.innerHTML = panelHTML(opts);
    wirePanel(ent, root, opts);
  }

  function patchOpenEntretien() {
    if (!window.openEntretien || openEntretien._plaud) return;
    const orig = openEntretien;
    window.openEntretien = function (id, editable) {
      orig(id, editable);
      setTimeout(() => {
        const e = Store.find("entretiens", id);
        const slot = document.getElementById("entPlaudSlot");
        if (e && slot && editable) mount(e, "entPlaudSlot", { crFieldId: "edCR" });
        else if (e && slot && !editable && (e.media || []).length) {
          slot.innerHTML = panelHTML();
          renderList(e, slot.querySelector("[data-plaud-list]"));
        }
      }, 30);
    };
    openEntretien._plaud = true;
  }

  function patchConduct() {
    if (!window.VIEWS || !VIEWS.conduct || VIEWS._plaudConduct) return;
    const orig = VIEWS.conduct;
    VIEWS.conduct = function () {
      const v = orig();
      setTimeout(() => {
        const e = App.conductId ? Store.find("entretiens", App.conductId) : null;
        const slot = v.querySelector("#conductPlaudSlot");
        if (e && slot) mount(e, slot.id, { crFieldId: "cdCR" });
      }, 80);
      return v;
    };
    VIEWS._plaudConduct = true;
  }

  function init() {
    patchOpenEntretien();
    patchConduct();
  }

  window.PortiaPlaud = {
    panelHTML,
    mount,
    renderList,
    importAudio,
    importPhoto,
    importTranscript,
    init,
    AUDIO_EXT,
    TEXT_EXT,
  };

  if (typeof Store !== "undefined") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
