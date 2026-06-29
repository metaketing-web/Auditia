(function () {
  "use strict";

  const ACCEPT =
    ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.md,.zip,.png,.jpg,.jpeg,.gif,.webp";

  function tokenFromPath() {
    const m = location.pathname.match(/\/collecte\/([^/]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (_) {
      return iso.slice(0, 10);
    }
  }

  async function loadInfo(token) {
    const r = await fetch("/api/collecte/" + encodeURIComponent(token) + "/info");
    if (!r.ok) throw new Error("Lien invalide");
    return r.json();
  }

  function render(info, token) {
    const app = document.getElementById("app");
    const closed = !info.depositOpen;
    let html =
      '<div class="card"><h1>Dépôt de documents</h1>' +
      '<p class="sub">Transmettez vos pièces en préparation de l\'entretien d\'audit PNIPM.</p>' +
      '<div class="meta"><b>' +
      esc(info.interviewee) +
      "</b><br>" +
      esc(info.structure) +
      "<br>Entretien prévu le <b>" +
      fmtDate(info.interviewDate) +
      "</b>" +
      (info.interviewHeure ? " à " + esc(info.interviewHeure) : "") +
      "<br>Date limite de dépôt : <b>" +
      fmtDate(info.deadlineAt) +
      "</b> (23h59, heure d'Abidjan)</div>";

    if (closed) {
      html +=
        '<div class="closed">Le délai de dépôt est expiré (J-3 avant l\'entretien). Contactez l\'équipe mission si vous devez encore transmettre un document.</div>';
    } else {
      html +=
        '<div class="dz" id="dz"><input type="file" id="fileIn" multiple accept="' +
        ACCEPT +
        '" style="display:none"><b>Glissez vos fichiers ici</b><span>ou cliquez pour sélectionner · PDF, Office, images, ZIP</span></div>' +
        '<div class="field"><label>Description courte (optionnel)</label><input id="descIn" placeholder="Ex. fiche de poste, organigramme, workflow SIGFIP…"></div>' +
        '<div class="field"><label>Type de document</label><select id="typeIn"><option value="DOC">Document</option><option value="FICHE">Fiche de poste</option><option value="ORG">Organigramme</option><option value="WORKFLOW">Workflow / procédure</option><option value="OUTIL">Outil / capture</option><option value="BASE">Export / base de données</option></select></div>' +
        '<button class="btn" id="upBtn" disabled>Sélectionnez un fichier</button>' +
        '<p class="note">Vos fichiers ne sont visibles que par l\'équipe d\'audit. Ils seront relus avant intégration définitive à la Data Room.</p>';
    }

    if (info.documents && info.documents.length) {
      html += '<div class="files"><h3>Vos dépôts (' + info.documents.length + ")</h3>";
      info.documents.forEach(function (d) {
        const st = d.statut === "verse" ? "Validé" : "En relecture";
        const cls = d.statut === "verse" ? "bdg" : "bdg wait";
        html +=
          '<div class="file-row"><span>' +
          esc(d.originalName || d.name || "Document") +
          '</span><span class="' +
          cls +
          '">' +
          st +
          "</span></div>";
      });
      html += "</div>";
    }

    html += "</div>";
    app.innerHTML = html;
    app.style.display = "";

    if (closed) return;

    const dz = document.getElementById("dz");
    const fileIn = document.getElementById("fileIn");
    const upBtn = document.getElementById("upBtn");
    let pending = [];

    function setFiles(files) {
      pending = Array.from(files || []);
      upBtn.disabled = !pending.length;
      upBtn.textContent = pending.length
        ? "Envoyer " + pending.length + " fichier(s)"
        : "Sélectionnez un fichier";
    }

    dz.onclick = function () {
      fileIn.click();
    };
    fileIn.onchange = function () {
      setFiles(fileIn.files);
    };
    dz.ondragover = function (e) {
      e.preventDefault();
      dz.classList.add("drag");
    };
    dz.ondragleave = function () {
      dz.classList.remove("drag");
    };
    dz.ondrop = function (e) {
      e.preventDefault();
      dz.classList.remove("drag");
      setFiles(e.dataTransfer.files);
    };

    upBtn.onclick = async function () {
      if (!pending.length) return;
      upBtn.disabled = true;
      upBtn.textContent = "Envoi en cours…";
      const desc = document.getElementById("descIn").value.trim();
      const docType = document.getElementById("typeIn").value;
      let ok = 0;
      for (const f of pending) {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("description", desc);
        fd.append("doc_type", docType);
        try {
          const r = await fetch("/api/collecte/" + encodeURIComponent(token) + "/deposit", {
            method: "POST",
            body: fd,
          });
          if (r.ok) ok++;
        } catch (_) {}
      }
      if (ok) {
        const fresh = await loadInfo(token);
        render(fresh, token);
      } else {
        upBtn.disabled = false;
        upBtn.textContent = "Échec — réessayez";
        alert("L'envoi a échoué. Vérifiez le format ou la date limite.");
      }
    };
  }

  async function boot() {
    const token = tokenFromPath();
    const load = document.getElementById("statusLoad");
    if (!token) {
      load.innerHTML = '<div class="err">Lien de collecte invalide.</div>';
      return;
    }
    try {
      const info = await loadInfo(token);
      load.style.display = "none";
      render(info, token);
    } catch (_) {
      load.innerHTML = '<div class="err">Ce lien de collecte est invalide ou a expiré.</div>';
    }
  }

  boot();
})();
