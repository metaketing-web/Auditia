/**
 * Prévisualisation de documents dans une modale (PDF, images, texte).
 */
(function () {
  "use strict";

  function kindFrom(mime, fname) {
    const m = String(mime || "").toLowerCase();
    const ext = String(fname || "").split(".").pop().toLowerCase();
    if (m === "application/pdf" || ext === "pdf") return "pdf";
    if (m.startsWith("image/")) return "image";
    if(m.startsWith("text/") || ["txt","text","csv","md","json","log","xml","html","rtf"].includes(ext)) return "text";
    return "office";
  }

  function downloadBlob(blob, fname) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fname || "document";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  function show(blob, fname, mime, opts) {
    opts = opts || {};
    const kind = kindFrom(mime, fname);
    const name = fname || "Document";
    const url = URL.createObjectURL(blob);
    const converted = !!opts.converted;
    const textExtracted = !!opts.textExtracted;

    function closeCleanup() {
      setTimeout(() => URL.revokeObjectURL(url), 120000);
    }

    if (kind === "pdf") {
      Modal.open(
        '<div class="modal-h">' +
          '<div class="ic" style="background:var(--slate-soft);color:var(--info)">' +
          (typeof svgI === "function"
            ? svgI(
                '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>'
              )
            : "") +
          "</div>" +
          '<div style="min-width:0"><div class="eyebrow">Prévisualisation</div><h2 style="font-size:15px">' +
          esc(name) +
          (converted ? ' <span class="tag" style="margin-left:6px">aperçu PDF</span>' : "") +
          "</h2></div>" +
          '<button class="x" onclick="Modal.close()">' +
          (typeof svgI === "function"
            ? svgI('<path d="M18 6 6 18M6 6l12 12"/>')
            : "×") +
          "</button></div>" +
          '<div class="modal-b" style="padding:0"><iframe class="file-preview-frame" src="' +
          url +
          '" title="' +
          esc(name) +
          '"></iframe></div>' +
          '<div class="modal-f"><button class="btn ghost" onclick="Modal.close()">Fermer</button>' +
          '<button class="btn terra" id="fpDownload">Télécharger</button></div>',
        true
      );
      const dl = document.getElementById("fpDownload");
      if (dl) dl.onclick = () => downloadBlob(blob, name);
      closeCleanup();
      return;
    }

    if (kind === "image") {
      Modal.open(
        '<div class="modal-h"><div><div class="eyebrow">Prévisualisation</div><h2 style="font-size:15px">' +
          esc(name) +
          '</h2></div><button class="x" onclick="Modal.close()">' +
          (typeof svgI === "function"
            ? svgI('<path d="M18 6 6 18M6 6l12 12"/>')
            : "×") +
          '</button></div><div class="modal-b file-preview-img-wrap"><img src="' +
          url +
          '" alt="' +
          esc(name) +
          '"></div><div class="modal-f"><button class="btn ghost" onclick="Modal.close()">Fermer</button></div>',
        true
      );
      closeCleanup();
      return;
    }

    if (kind === "text") {
      blob.text().then((text) => {
        Modal.open(
          '<div class="modal-h"><div><div class="eyebrow">Prévisualisation</div><h2 style="font-size:15px">' +
            esc(name) +
            (textExtracted
              ? ' <span class="tag" style="margin-left:6px">texte extrait</span>'
              : "") +
            '</h2></div><button class="x" onclick="Modal.close()">' +
            (typeof svgI === "function"
              ? svgI('<path d="M18 6 6 18M6 6l12 12"/>')
              : "×") +
            '</button></div><div class="modal-b"><pre class="file-preview-text">' +
            esc(text.slice(0, 200000)) +
            (text.length > 200000 ? "\n\n… (tronqué)" : "") +
            '</pre></div><div class="modal-f"><button class="btn ghost" onclick="Modal.close()">Fermer</button>' +
            (textExtracted
              ? '<button class="btn terra" id="fpDownload">Télécharger l\'original</button>'
              : "") +
            "</div>",
          true
        );
        if (textExtracted) {
          const dl = document.getElementById("fpDownload");
          if (dl) {
            dl.onclick = () => {
              if (typeof opts.onDownloadOriginal === "function") {
                opts.onDownloadOriginal();
              } else {
                downloadBlob(blob, name);
              }
            };
          }
        }
        closeCleanup();
      });
      return;
    }

    Modal.open(
      '<div class="modal-h"><div><div class="eyebrow">Document</div><h2 style="font-size:15px">' +
        esc(name) +
        '</h2></div><button class="x" onclick="Modal.close()">' +
        (typeof svgI === "function"
          ? svgI('<path d="M18 6 6 18M6 6l12 12"/>')
          : "×") +
        "</button></div>" +
        '<div class="modal-b"><div class="note slate">Ce format ne peut pas être prévisualisé directement dans le navigateur. Téléchargez-le pour l\'ouvrir dans Word, Excel ou l\'app Fichiers (iPad).</div></div>' +
        '<div class="modal-f"><button class="btn ghost" onclick="Modal.close()">Fermer</button>' +
        '<button class="btn terra" id="fpDownload">Télécharger</button></div>',
      true
    );
    const dl = document.getElementById("fpDownload");
    if (dl) dl.onclick = () => downloadBlob(blob, name);
    URL.revokeObjectURL(url);
  }

  window.PortiaFilePreview = { show, downloadBlob };
})();
