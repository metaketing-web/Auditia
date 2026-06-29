/**
 * Résumé IA des documents versés — Data Room / Dépôt
 */
(function () {
  "use strict";

  function apiFetch(url, opts) {
    opts = opts || {};
    const headers = Object.assign({}, opts.headers || {});
    if (window.PortiaEnterprise && PortiaEnterprise.authHeaders) {
      Object.assign(headers, PortiaEnterprise.authHeaders(headers));
    }
    return fetch(url, Object.assign({}, opts, { headers }));
  }

  function aiReady() {
    return window.AI && AI.ready;
  }

  function fmtDate(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch (_) {
      return iso.slice(0, 16);
    }
  }

  function summaryPreview(text, max) {
    const t = (text || "").replace(/^#+\s+/gm, "").replace(/\*\*/g, "").trim();
    if (t.length <= (max || 180)) return t;
    return t.slice(0, max || 180).trim() + "…";
  }

  function showSummaryModal(doc, summary, opts) {
    opts = opts || {};
    const title = doc ? docName(doc) : "Document";
    const hasSummary = !!(summary && String(summary).trim());
    Modal.open(
      `<div class="modal-h"><div class="ic" style="background:linear-gradient(140deg,var(--terra),var(--terra-deep));color:#fff">${svgI(ICON.assistant)}</div>
      <div style="min-width:0"><div class="eyebrow">Couche IA · Data Room</div><h2 style="font-size:16px">Résumé — ${esc(title)}</h2></div>
      <button class="x" onclick="Modal.close()">${svgI('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div>
      <div class="modal-b">
        ${doc ? `<div class="note slate" style="font-size:12px;margin-bottom:12px"><b>${esc(doc.rep || "")}</b> · ${esc(doc.source || "")}${doc.aiSummaryAt || opts.generatedAt ? " · " + fmtDate(doc.aiSummaryAt || opts.generatedAt) : ""}</div>` : ""}
        <div id="docAiSummaryBody" class="prose" style="font-size:13px;line-height:1.55">${summary ? aiFormat(summary) : '<span class="typing"><i></i><i></i><i></i></span> Analyse en cours…'}</div>
      </div>
      <div class="modal-f">
        ${doc && doc.id && hasSummary ? `<button class="btn ghost" id="docAiDownload" style="margin-right:auto">${svgI('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>')} Télécharger</button>` : ""}
        ${doc && doc.id ? `<button class="btn ghost" id="docAiRegen">${svgI(ICON.assistant)} Régénérer</button>` : ""}
        <button class="btn ghost" onclick="Modal.close()">Fermer</button>
      </div>`,
      true
    );
    const dl = $("#docAiDownload");
    if (dl && doc && doc.id) dl.onclick = () => downloadSummary(doc.id);
    const regen = $("#docAiRegen");
    if (regen && doc && doc.id) {
      regen.onclick = async () => {
        regen.disabled = true;
        const body = $("#docAiSummaryBody");
        if (body) body.innerHTML = '<span class="typing"><i></i><i></i><i></i></span> Régénération…';
        try {
          const sum = await requestSummary(doc.id, { force: true });
          if (body) body.innerHTML = aiFormat(sum.summary || "");
          mergeSummary(doc.id, sum.summary, sum.generatedAt);
          toast("Résumé IA", "Document re-analysé", "ok");
          if (App.route === "depot" || App.route === "dataroom") App.refresh();
        } catch (e) {
          if (body) body.innerHTML = `<div class="note crit">${esc(String(e.message || e))}</div>`;
          toast("Résumé IA", String(e.message || e), "err");
        }
        regen.disabled = false;
      };
    }
  }

  function mergeSummary(docId, summary, at) {
    const patch = { aiSummary: summary || "", aiSummaryAt: at || new Date().toISOString() };
    if (Store.find("docs", docId)) Store.patch("docs", docId, patch);
  }

  async function requestSummary(docId, opts) {
    opts = opts || {};
    if (!window.PORTIA_SERVER_MODE) {
      throw new Error("Résumé IA disponible en mode serveur");
    }
    const r = await apiFetch("/api/dataroom/docs/" + encodeURIComponent(docId) + "/summarize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ force: !!opts.force }),
    });
    if (!r.ok) {
      let msg = "Erreur " + r.status;
      try {
        const err = await r.json();
        msg = err.detail || msg;
      } catch (_) {}
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
    return r.json();
  }

  async function pollSummary(docId, attempts) {
    attempts = attempts || 0;
    if (attempts > 25) return null;
    try {
      const r = await apiFetch("/api/dataroom/docs/" + encodeURIComponent(docId));
      if (r.ok) {
        const doc = await r.json();
        if (doc.aiSummary) return doc;
      }
    } catch (_) {}
    await new Promise((res) => setTimeout(res, 2000));
    return pollSummary(docId, attempts + 1);
  }

  async function afterDeposit(doc, options) {
    options = options || {};
    if (!doc || !doc.id) return;
    if (!aiReady()) return;
    if (!window.PORTIA_SERVER_MODE) return;

    if (doc.aiSummary) {
      if (options.openModal) showSummaryModal(doc, doc.aiSummary);
      return;
    }

    if (options.openModal !== false) showSummaryModal(doc, "");

    try {
      if (options.aiSummaryPending) {
        const polled = await pollSummary(doc.id);
        if (polled && polled.aiSummary) {
          mergeSummary(doc.id, polled.aiSummary, polled.aiSummaryAt);
          const body = $("#docAiSummaryBody");
          if (body) body.innerHTML = aiFormat(polled.aiSummary);
          if (App.route === "depot" || App.route === "dataroom") App.refresh();
          toast("Document versé", "Fichier enregistré — résumé IA disponible", "ok");
          return;
        }
      }
      const result = await requestSummary(doc.id);
      mergeSummary(doc.id, result.summary, result.generatedAt);
      const body = $("#docAiSummaryBody");
      if (body) body.innerHTML = aiFormat(result.summary || "");
      if (App.route === "depot" || App.route === "dataroom") App.refresh();
      toast("Document versé", result.cached ? "Fichier enregistré — résumé IA" : "Fichier enregistré — analyse IA terminée", "ok");
    } catch (e) {
      const body = $("#docAiSummaryBody");
      if (body) body.innerHTML = `<div class="note crit">${esc(String(e.message || e))}</div>`;
      toast("Document versé", "Fichier OK — résumé IA indisponible : " + (e.message || e), "warn");
    }
  }

  function openSummaryForDoc(docId) {
    const doc = Store.find("docs", docId);
    if (!doc) {
      toast("Résumé IA", "Document introuvable", "err");
      return;
    }
    if (doc.aiSummary) {
      showSummaryModal(doc, doc.aiSummary);
      return;
    }
    afterDeposit(doc, { openModal: true, aiSummaryPending: false });
  }

  function downloadSummary(docId) {
    const doc = Store.find("docs", docId);
    if (!doc) {
      toast("Résumé IA", "Document introuvable", "err");
      return;
    }
    if (!doc.aiSummary || !String(doc.aiSummary).trim()) {
      toast("Résumé IA", "Aucune synthèse enregistrée — lancez « Analyser IA »", "warn");
      return;
    }
    const fname =
      (typeof docName === "function" ? docName(doc) : doc.desc || doc.id).replace(/[^\w.-]+/g, "_") +
      "_resume_IA.txt";
    const header = [
      "RÉSUMÉ IA — DATA ROOM PNIPM",
      "Document : " + (typeof docName === "function" ? docName(doc) : doc.id),
      "Répertoire : " + (doc.rep || "—"),
      "Source : " + (doc.source || "—"),
      "Versé par : " + (doc.par || "—"),
      "Généré le : " + fmtDate(doc.aiSummaryAt) || doc.aiSummaryAt || "—",
      "",
      "---",
      "",
    ].join("\n");
    const blob = new Blob([header + doc.aiSummary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Téléchargement", fname, "ok");
  }

  function renderSummaryActions(doc) {
    if (!doc || !doc.id) return "";
    const has = !!(doc.aiSummary && doc.aiSummary.trim());
    const dlIcon =
      typeof svgI === "function"
        ? svgI('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>', "")
        : "";
    const aiIcon = typeof svgI === "function" ? svgI(ICON.assistant, "") : "";
    if (has) {
      return (
        `<span style="display:inline-flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">` +
        `<button type="button" class="btn ghost sm doc-ai-btn" onclick="event.stopPropagation();PortiaDocAI.openSummaryForDoc('${doc.id}')" title="Consulter la synthèse IA">${aiIcon} Voir</button>` +
        `<button type="button" class="btn ghost sm doc-ai-dl" onclick="event.stopPropagation();PortiaDocAI.downloadSummary('${doc.id}')" title="Télécharger la synthèse (.txt)">${dlIcon} Télécharger</button>` +
        `</span>`
      );
    }
    if (doc.fileId || doc.statut === "verse") {
      return `<button type="button" class="btn ghost sm doc-ai-btn" onclick="event.stopPropagation();PortiaDocAI.openSummaryForDoc('${doc.id}')" title="Générer une synthèse IA">${aiIcon} Analyser IA</button>`;
    }
    return `<span class="muted" style="font-size:11px">—</span>`;
  }

  function renderSummaryButton(doc) {
    return renderSummaryActions(doc);
  }

  function docIdFromRow(tr) {
    if (tr.dataset.docId) return tr.dataset.docId;
    const sel = tr.querySelector(".dr-st");
    if (sel && sel.dataset.id) return sel.dataset.id;
    const oc = tr.getAttribute("onclick") || "";
    const m = oc.match(/id:'([^']+)'/);
    return m ? m[1] : null;
  }

  function ensureDataroomAiColumn(v) {
    const thead = v.querySelector(".tbl thead tr");
    if (thead && !thead.querySelector("th[data-ai-col]")) {
      const th = document.createElement("th");
      th.dataset.aiCol = "1";
      th.textContent = "Synthèse IA";
      th.style.whiteSpace = "nowrap";
      const last = thead.querySelector("th[data-rel]");
      if (last) thead.insertBefore(th, last);
      else thead.appendChild(th);
    }
    const body = v.querySelector("#drBody");
    if (!body) return;
    const decorate = () => {
      body.querySelectorAll("tr").forEach((tr) => {
        if (tr.querySelector("td[data-ai-cell]") || tr.querySelector(".empty")) return;
        const docId = docIdFromRow(tr);
        const td = document.createElement("td");
        td.dataset.aiCell = "1";
        td.style.textAlign = "right";
        td.style.whiteSpace = "nowrap";
        td.onclick = (e) => e.stopPropagation();
        if (!docId) {
          td.innerHTML = '<span class="muted">—</span>';
        } else {
          const doc = Store.find("docs", docId);
          td.innerHTML = renderSummaryActions(doc);
        }
        tr.appendChild(td);
      });
    };
    decorate();
    if (!body.dataset.aiObs) {
      body.dataset.aiObs = "1";
      new MutationObserver(decorate).observe(body, { childList: true });
    }
  }

  function patchDataroomView() {
    const orig = VIEWS.dataroom;
    if (!orig || VIEWS._docAiDataroom) return;
    VIEWS.dataroom = function () {
      const v = orig();
      ensureDataroomAiColumn(v);
      return v;
    };
    VIEWS._docAiDataroom = true;
  }

  function patchDepotView() {
    const orig = VIEWS.depot;
    if (!orig || VIEWS._docAiDepot) return;
    VIEWS.depot = function () {
      const v = orig();
      v.querySelectorAll(".alert-i").forEach((row) => {
        const mono = row.querySelector("b.mono");
        if (!mono) return;
        const label = mono.textContent.trim();
        const doc = Store.get("docs").find((d) => docName(d) === label);
        if (!doc) return;
        const actions = row.querySelector('[style*="margin-left:auto"]');
        if (actions && !actions.querySelector(".doc-ai-btn")) {
          actions.insertAdjacentHTML("afterbegin", renderSummaryButton(doc));
        }
        if (doc.aiSummary) {
          const bd = row.querySelector(".bd");
          if (bd && !bd.querySelector(".doc-ai-prev")) {
            const prev = document.createElement("span");
            prev.className = "doc-ai-prev muted";
            prev.style.cssText = "display:block;font-size:11px;margin-top:4px;line-height:1.4";
            prev.textContent = "IA · " + summaryPreview(doc.aiSummary, 140);
            bd.appendChild(prev);
          }
        }
      });
      return v;
    };
    VIEWS._docAiDepot = true;
  }

  function init() {
    patchDepotView();
    patchDataroomView();
    window.PortiaDocAI = {
      init,
      afterDeposit,
      openSummaryForDoc,
      showSummaryModal,
      requestSummary,
      downloadSummary,
      renderSummaryActions,
    };
  }

  window.PortiaDocAI = { init };
})();
