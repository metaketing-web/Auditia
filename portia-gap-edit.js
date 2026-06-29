/**
 * Consolidation matrice d'écart — réalité & verdict (pilotage Juliana / admin).
 * Journal des modifications (état mission + audit serveur).
 */
(function () {
  "use strict";

  function canConsolidateGap() {
    const u = window.App && App.user;
    if (!u || u.readOnly) return false;
    if (u.role === "admin" || u.role === "juliana") return true;
    const sr = u.serverRole || u.role || "";
    return sr === "juliana" || sr === "admin";
  }

  function userLabel() {
    const u = (window.App && App.user) || {};
    return u.name || "Pilotage";
  }

  function userRole() {
    const u = (window.App && App.user) || {};
    return u.serverRole || u.role || "admin";
  }

  function verdictLbl(key) {
    return (window.VERDICTS && VERDICTS[key] && VERDICTS[key].lbl) || key || "—";
  }

  function ensureGapJournal() {
    if (!Store.state) Store.state = Store.defaults();
    if (!Array.isArray(Store.state.gapJournal)) Store.state.gapJournal = [];
  }

  function appendLocalJournal(entry) {
    ensureGapJournal();
    Store.state.gapJournal.unshift(entry);
    if (Store.state.gapJournal.length > 500) Store.state.gapJournal.length = 500;
  }

  function appendGapEditLog(gap, entry) {
    if (!gap.editLog) gap.editLog = [];
    gap.editLog.unshift(entry);
    if (gap.editLog.length > 20) gap.editLog.length = 20;
  }

  function syncChecklistCouverture(ref, verdict) {
    if (!Store.state || !ref) return;
    const map = { confirme: "oui", ajuster: "partiel", completer: "non", caduc: "na" };
    const cov = map[verdict] || "a_verifier";
    if (!Store.state.cdcChecklistTech) Store.state.cdcChecklistTech = {};
    const row = Store.state.cdcChecklistTech[ref] || {};
    Store.state.cdcChecklistTech[ref] = Object.assign({}, row, {
      couverture: cov,
      updated: new Date().toISOString(),
    });
  }

  async function persistGap(gap, payload, logEntry) {
    Store.upsert("gaps", gap);
    appendGapEditLog(gap, logEntry);
    appendLocalJournal(logEntry);
    syncChecklistCouverture(gap.ref, gap.verdict);

    if (window.portiaApi && portiaApi.fetch) {
      try {
        const r = await portiaApi.fetch("/api/gaps/" + encodeURIComponent(gap.id), {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (r.ok) {
          const data = await r.json();
          if (data.gap) {
            const i = Store.get("gaps").findIndex((x) => x.id === gap.id);
            if (i >= 0) Store.state.gaps[i] = data.gap;
          }
        }
      } catch (_) {
        /* hors-ligne ou mode local — état déjà en Store */
      }
    }

    if (window.portiaApi && portiaApi.saveState) await portiaApi.saveState();
    else Store.save();
  }

  function editLogHtml(g) {
    const log = (g.editLog || []).slice(0, 8);
    if (!log.length) return "";
    const rows = log
      .map((e) => {
        const vCh =
          e.verdictBefore !== e.verdictAfter
            ? ` · ${esc(verdictLbl(e.verdictBefore))} → <b>${esc(verdictLbl(e.verdictAfter))}</b>`
            : "";
        const note = e.note ? `<div class="muted" style="font-size:11px;margin-top:2px">${esc(e.note)}</div>` : "";
        const src = e.sourceRefs
          ? `<div class="muted" style="font-size:11px">Sources : ${esc(e.sourceRefs)}</div>`
          : "";
        return `<div style="padding:8px 0;border-bottom:1px solid var(--line)">
          <div style="font-size:12px"><b>${esc(e.by || "—")}</b> <span class="muted">${esc((e.at || "").slice(0, 16).replace("T", " "))}</span>${vCh}</div>
          ${note}${src}
        </div>`;
      })
      .join("");
    return `<div class="eyebrow" style="margin:16px 0 8px;color:var(--terra-deep);font-family:var(--font-mono);font-size:10.5px;letter-spacing:.14em">JOURNAL DES MODIFICATIONS</div><div>${rows}</div>`;
  }

  function gapForm(id) {
    if (!canConsolidateGap()) {
      toast("Accès refusé", "Réservé au profil pilotage (Juliana / admin)", "err");
      return;
    }
    const g = Store.find("gaps", id);
    if (!g) return;

    const proofN =
      window.PortiaGapTrace && PortiaGapTrace.proofCount ? PortiaGapTrace.proofCount(g) : 0;
    const verdictOpts = Object.keys(window.VERDICTS || {}).map(
      (k) =>
        `<option value="${k}" ${g.verdict === k ? "selected" : ""}>${esc(VERDICTS[k].lbl)}</option>`
    );

    Modal.open(
      `<div class="modal-h"><div class="ic" style="background:var(--slate-soft);color:var(--info)">${typeof svgI === "function" ? svgI(ICON.ecart) : ""}</div>
        <div><div class="eyebrow">Consolidation pilotage · ${esc(g.ref)}</div><h2 style="font-size:16px">${esc(g.exig)}</h2></div>
        <button class="x" onclick="Modal.close()" aria-label="Fermer">${typeof svgI === "function" ? svgI('<path d="M18 6 6 18M6 6l12 12"/>') : "×"}</button></div>
      <div class="modal-b">
        <div class="note slate" style="font-size:12px;margin-bottom:14px">Verrouillez la confrontation CDC pour le livrable L4. Les auditeurs alimentent les faits (entretiens, docs, constats) ; le pilotage consolide ici la <b>réalité</b> et le <b>verdict</b>.</div>
        <div class="frow"><label>Exigence CDC <span class="muted">(lecture seule)</span></label><input value="${esc(g.exig)}" disabled></div>
        <div class="frow"><label>Réalité observée <span class="req">*</span></label><textarea id="gfRealite" style="min-height:100px">${esc(g.realite || "")}</textarea></div>
        <div class="f2">
          <div class="frow"><label>Verdict <span class="req">*</span></label><select id="gfVerdict">${verdictOpts}</select></div>
          <div class="frow"><label>Preuves auto-liées</label><input value="${proofN} entretien(s) / doc(s) / constat(s)" disabled></div>
        </div>
        <div class="frow"><label>Justification / note de consolidation</label><textarea id="gfNote" style="min-height:56px" placeholder="Ex. Arbitrage COPIL, synthèse post-entretien DRH…"></textarea></div>
        <div class="frow"><label>Sources citées <span class="muted">(constats, entretiens, docs — optionnel)</span></label><input id="gfSrc" placeholder="Ex. C-02, ent_fs236bt, R7 architecture DSI"></div>
        <div id="gfWarn" class="note warn" style="display:none;margin-top:8px;font-size:12px"></div>
      </div>
      <div class="modal-f"><button class="btn ghost" onclick="Modal.close()">Annuler</button><button class="btn terra" id="gfSave">${typeof svgI === "function" ? svgI('<path d="M20 6 9 17l-5-5"/>') : ""} Enregistrer</button></div>`,
      true
    );

    const warn = document.getElementById("gfWarn");
    const verdictEl = document.getElementById("gfVerdict");
    function checkWarn() {
      const v = verdictEl.value;
      const src = (document.getElementById("gfSrc").value || "").trim();
      const changed = v !== g.verdict;
      if (changed && !src && proofN === 0) {
        warn.style.display = "block";
        warn.innerHTML =
          "<b>Attention :</b> verdict modifié sans source citée ni preuve auto-liée. Ajoutez une référence (constat, entretien, doc) pour défendre l'arbitrage.";
      } else warn.style.display = "none";
    }
    verdictEl.addEventListener("change", checkWarn);
    document.getElementById("gfSrc").addEventListener("input", checkWarn);
    checkWarn();

    document.getElementById("gfSave").onclick = async () => {
      const realite = document.getElementById("gfRealite").value.trim();
      const verdict = verdictEl.value;
      const note = document.getElementById("gfNote").value.trim();
      const sourceRefs = document.getElementById("gfSrc").value.trim();
      if (!realite) {
        toast("Champ requis", "Renseignez la réalité observée", "err");
        return;
      }
      const before = { realite: g.realite, verdict: g.verdict };
      const at = new Date().toISOString();
      const logEntry = {
        at,
        by: userLabel(),
        role: userRole(),
        gapId: g.id,
        gapRef: g.ref,
        realiteBefore: before.realite,
        realiteAfter: realite,
        verdictBefore: before.verdict,
        verdictAfter: verdict,
        note,
        sourceRefs,
      };

      g.realite = realite;
      g.verdict = verdict;
      g.updated = at;
      g.consolidatedBy = userLabel();

      const btn = document.getElementById("gfSave");
      btn.disabled = true;
      try {
        await persistGap(
          g,
          { realite, verdict, note, source_refs: sourceRefs },
          logEntry
        );
        Modal.close();
        toast("Matrice consolidée", g.ref + " — " + verdictLbl(verdict), "ok");
        if (window.App && App.refresh) App.refresh();
      } catch (err) {
        toast("Erreur", (err && err.message) || "Enregistrement impossible", "err");
        btn.disabled = false;
      }
    };
  }

  function openGapConsolidated(gapOrId) {
    const g = typeof gapOrId === "string" ? Store.find("gaps", gapOrId) : gapOrId;
    if (!g) return;
    const v = VERDICTS[g.verdict] || { lbl: g.verdict, cls: "neutral" };
    const proof =
      window.PortiaGapTrace && PortiaGapTrace.proofSection
        ? PortiaGapTrace.proofSection(g)
        : "";
    const editBtn = canConsolidateGap()
      ? `<button class="btn terra" onclick="PortiaGapEdit.gapForm('${g.id}')">${typeof svgI === "function" ? svgI('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>') : ""} Modifier</button>`
      : "";
    const updated =
      g.updated || g.consolidatedBy
        ? `<div class="kv" style="margin-top:12px"><span class="k">Dernière consolidation</span><span class="v">${g.updated ? new Date(g.updated).toLocaleString("fr-FR") : "—"}${g.consolidatedBy ? " · " + esc(g.consolidatedBy) : ""}</span></div>`
        : "";

    Modal.open(
      `<div class="modal-h"><div class="ic" style="background:var(--slate-soft);color:var(--info)">${typeof svgI === "function" ? svgI(ICON.ecart) : ""}</div>
        <div style="min-width:0"><div class="eyebrow">${esc(g.theme || "")} · ${esc(g.cdc)}</div><h2 style="font-size:17px">${esc(g.ref)} — ${esc(g.exig)}</h2></div>
        <button class="x" onclick="Modal.close()" aria-label="Fermer">${typeof svgI === "function" ? svgI('<path d="M18 6 6 18M6 6l12 12"/>') : "×"}</button></div>
      <div class="modal-b">
        <div class="chiprow" style="margin-bottom:14px"><span class="bdg ${v.cls}">${esc(v.lbl)}</span><span class="tag">${esc(g.theme || "")}</span></div>
        <div class="eyebrow" style="font-family:var(--font-mono);font-size:10.5px;letter-spacing:.14em;color:var(--terra-deep);margin-bottom:7px">RÉALITÉ OBSERVÉE</div>
        <p style="font-size:14px;line-height:1.6" class="tip-full">${esc(g.realite)}</p>
        ${updated}
        ${editLogHtml(g)}
        ${proof}
      </div>
      <div class="modal-f">
        ${typeof PortiaExport !== "undefined" ? `<button class="btn ghost" onclick="PortiaExport.pick('gap','${g.id}')">${typeof svgI === "function" ? svgI('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>') : ""} Exporter</button>` : ""}
        <button class="btn ghost" onclick="Modal.close();App.go('cdc_tech')">Checklist tech.</button>
        <button class="btn ghost" onclick="Modal.close()">Fermer</button>
        ${editBtn}
      </div>`,
      true
    );

    if (window.PortiaGapTrace && PortiaGapTrace.wireProofClicks) PortiaGapTrace.wireProofClicks(g);
    if (window.PortiaA11y && PortiaA11y.applyTips) PortiaA11y.applyTips(document.getElementById("ovBox"));
  }

  function patchEcartView() {
    if (!window.VIEWS || VIEWS._gapEditEcart) return;
    const orig = VIEWS.ecart;
    VIEWS.ecart = function () {
      const v = orig();
      if (canConsolidateGap()) {
        setTimeout(() => {
          const note = document.createElement("div");
          note.className = "note sage";
          note.style.marginBottom = "14px";
          note.style.fontSize = "12.5px";
          note.innerHTML =
            "<b>Profil pilotage</b> — cliquez une ligne pour ouvrir la fiche, puis <b>Modifier</b> pour consolider réalité et verdict (journalisé). Les auditeurs consultent en lecture seule.";
          const anchor = v.querySelector(".kpis") || v.firstChild;
          if (anchor) v.insertBefore(note, anchor);
        }, 0);
      }
      return v;
    };
    VIEWS._gapEditEcart = true;
  }

  function init() {
    if (window._gapEditInit) return;
    window._gapEditInit = true;
    window.PortiaGapEdit = { canConsolidateGap, gapForm, openGapConsolidated };
    window.gapForm = gapForm;
    window.openGapConsolidated = openGapConsolidated;
    window.openGap = openGapConsolidated;
    patchEcartView();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(init, 320));
  } else {
    setTimeout(init, 320);
  }
})();
