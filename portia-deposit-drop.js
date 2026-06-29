/**
 * Glisser-déposer Data Room — zone de dépôt réutilisable (depot + dataroom).
 */
(function () {
  "use strict";

  function userCanDeposit() {
    const u = window.App && App.user;
    if (!u) return false;
    if (u.canDeposit) return true;
    if (window.PortiaEnterprise && PortiaEnterprise.userCanDeposit) {
      return PortiaEnterprise.userCanDeposit(u);
    }
    return !u.readOnly;
  }

  function depositFiles(fileList, opts) {
    opts = opts || {};
    const files = [...(fileList || [])].filter(function (f) {
      return f && (f.size > 0 || f.name) && f.name !== ".DS_Store";
    });
    if (!files.length) {
      toast("Dépôt", "Aucun fichier détecté — glissez un document (PDF, Word, Excel…)", "err");
      return;
    }
    if (!userCanDeposit()) {
      toast("Lecture seule", "Le versement n'est pas autorisé pour ce profil", "err");
      return;
    }
    if (typeof depositModal !== "function") {
      toast("Dépôt", "Module de versement indisponible", "err");
      return;
    }
    const modalOpts = {};
    if (opts.defaultRep) modalOpts.defaultRep = opts.defaultRep;
    files.forEach(function (f, i) {
      setTimeout(function () {
        depositModal(f, modalOpts);
      }, i * 80);
    });
  }

  function bindDepositDropzone(el, opts) {
    if (!el || el.dataset.dropBound === "1") return;
    opts = opts || {};
    el.dataset.dropBound = "1";

    let inp = el.querySelector('input[type="file"]');
    if (!inp) {
      inp = document.createElement("input");
      inp.type = "file";
      inp.multiple = true;
      inp.style.display = "none";
      inp.accept =
        window.DEPOSIT_ACCEPT ||
        ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.text,.csv,.md,.json,.xml,.html,.rtf,.odt,.ods,.zip,.png,.jpg,.jpeg,.gif,.webp,.mp4,.mp3,.wav";
      el.appendChild(inp);
    }

    let dragDepth = 0;

    function resolveRep() {
      if (typeof opts.getDefaultRep === "function") {
        const r = opts.getDefaultRep();
        if (r && r !== "all") return r;
      }
      return opts.defaultRep || null;
    }

    function onFiles(list) {
      depositFiles(list, { defaultRep: resolveRep() });
    }

    el.addEventListener("click", function (e) {
      if (e.target.closest("button") || e.target.closest("a")) return;
      if (!userCanDeposit()) {
        toast("Lecture seule", "Le versement n'est pas autorisé pour ce profil", "err");
        return;
      }
      inp.click();
    });

    inp.addEventListener("change", function () {
      onFiles(inp.files);
      inp.value = "";
    });

    ["dragenter", "dragover"].forEach(function (ev) {
      el.addEventListener(ev, function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
        dragDepth++;
        el.classList.add("drag");
      });
    });

    el.addEventListener("dragleave", function (e) {
      e.preventDefault();
      e.stopPropagation();
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) el.classList.remove("drag");
    });

    el.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();
      dragDepth = 0;
      el.classList.remove("drag");
      onFiles(e.dataTransfer && e.dataTransfer.files);
    });
  }

  function dropzoneHtml(id, compact) {
    id = id || "dz";
    const accept =
      window.DEPOSIT_ACCEPT ||
      ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.text,.csv,.md,.json,.xml,.html,.rtf,.odt,.ods,.zip,.png,.jpg,.jpeg,.gif,.webp,.mp4,.mp3,.wav";
    const icon =
      typeof svgI === "function"
        ? svgI('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>')
        : "";
    const sub = compact
      ? "Glissez-déposez ou cliquez · classement et nommage normalisé"
      : "PDF, Word, Excel, PowerPoint (.ppt/.pptx), texte (.txt/.text), CSV, images, archives…";
    return (
      '<div class="dz dz-deposit" id="' +
      id +
      '" style="margin-bottom:18px"><input type="file" id="' +
      id +
      'Input" multiple accept="' +
      accept +
      '" style="display:none">' +
      icon +
      "<b>Glissez vos fichiers ici</b><span>" +
      sub +
      "</span></div>"
    );
  }

  if (!window._portiaDropGuard) {
    window._portiaDropGuard = true;
    document.addEventListener(
      "dragover",
      function (e) {
        if (!e.target.closest(".dz-deposit, .dz")) return;
        e.preventDefault();
      },
      false
    );
    document.addEventListener(
      "drop",
      function (e) {
        if (e.target.closest(".dz-deposit, .dz")) return;
        e.preventDefault();
      },
      false
    );
  }

  window.bindDepositDropzone = bindDepositDropzone;
  window.depositDropzoneHtml = dropzoneHtml;
  window.PortiaDepositDrop = { bind: bindDepositDropzone, html: dropzoneHtml, depositFiles: depositFiles };
})();
