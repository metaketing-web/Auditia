/**
 * Registre des risques — édition prob/impact/mitigation, liens cockpit, création.
 */
(function () {
  "use strict";

  const CATS = ["Mission", "Solution"];
  const STATUTS = window.RISK_STATUT || {
    ouvert: { lbl: "Ouvert", cls: "crit" },
    surveille: { lbl: "Surveillé", cls: "warn" },
    maitrise: { lbl: "Maîtrisé", cls: "ok" },
  };

  function canEditRisque() {
    return canCreateRisque();
  }

  function canCreateRisque() {
    const u = window.App && App.user;
    if (!u || u.readOnly) return false;
    if (u.role === "admin" || u.role === "juliana") return true;
    const sr = u.serverRole || u.role || "";
    return sr === "juliana" || sr === "admin";
  }

  function userLabel() {
    return ((window.App && App.user) || {}).name || "Équipe";
  }

  function userRole() {
    const u = (window.App && App.user) || {};
    return u.serverRole || u.role || "";
  }

  function niveau(n) {
    return typeof niveauRisque === "function" ? niveauRisque(n) : { lbl: "—", cls: "neutral" };
  }

  function shortRef(ref) {
    return String(ref || "").replace(/^(RQ|RS)-/, "");
  }

  function refPrefix(cat) {
    return cat === "Solution" ? "RS" : "RQ";
  }

  function nextRiskRef(cat) {
    const prefix = refPrefix(cat || "Mission");
    const nums = (Store.get("risques") || [])
      .map((r) => {
        const m = String(r.ref || "").match(new RegExp("^" + prefix + "-(\\d+)$"));
        return m ? parseInt(m[1], 10) : 0;
      })
      .filter((n) => n > 0);
    const n = (nums.length ? Math.max.apply(null, nums) : 0) + 1;
    return prefix + "-" + String(n).padStart(2, "0");
  }

  function ensureRiskJournal() {
    if (!Store.state) Store.state = Store.defaults();
    if (!Array.isArray(Store.state.riskJournal)) Store.state.riskJournal = [];
  }

  function appendLocalJournal(entry) {
    ensureRiskJournal();
    Store.state.riskJournal.unshift(entry);
    if (Store.state.riskJournal.length > 500) Store.state.riskJournal.length = 500;
  }

  function appendRiskEditLog(risk, entry) {
    if (!risk.editLog) risk.editLog = [];
    risk.editLog.unshift(entry);
    if (risk.editLog.length > 20) risk.editLog.length = 20;
  }

  function recalcNiveau(r) {
    r.niveau = (parseInt(r.prob, 10) || 1) * (parseInt(r.impact, 10) || 1);
    return r.niveau;
  }

  function isDataroomRisk(r) {
    return r.ref === "RQ-02" || (r.links && (r.links.type === "dataroom" || r.links.dataroom));
  }

  function isUxpRisk(r) {
    return r.ref === "RQ-05" || (r.links && (r.links.type === "uxp" || r.links.uxp));
  }

  function dataroomMetrics() {
    const m = typeof metrics === "function" ? metrics() : {};
    const tot = m.docCollecteTot || 0;
    const recu = m.docCollecteRecu || 0;
    const pct = tot ? Math.round((recu / tot) * 100) : 0;
    return { tot, recu, pct, relance: m.relance || 0, verse: m.verse || 0 };
  }

  function suggestProbFromCollecte(pct) {
    if (pct >= 80) return 2;
    if (pct >= 55) return 3;
    return 4;
  }

  function findUxpEntretien() {
    return (Store.get("entretiens") || []).find(
      (e) => /UXP|X-Road/i.test(e.n || "") || /UXP|X-Road/i.test(e.struct || "")
    );
  }

  function findByRef(coll, ref) {
    return (Store.get(coll) || []).find((x) => x.ref === ref);
  }

  function findXroadDoc() {
    return (Store.get("docs") || []).find((d) => /xroad|x-road|uxp/i.test((d.desc || "") + " " + (d.source || "")));
  }

  function dataroomPanelHtml() {
    const dm = dataroomMetrics();
    const sug = suggestProbFromCollecte(dm.pct);
    const barW = dm.tot ? dm.pct : 0;
    return `<div class="note slate" style="margin-bottom:14px;font-size:13px">
      <div class="between" style="margin-bottom:8px"><b>Signal Data Room (collecte ministère)</b>
        <button type="button" class="btn ghost sm" id="rqLkDr">Ouvrir Data Room</button></div>
      <div class="between" style="margin-bottom:6px"><span>Attendus ministère (hors annexes CDC)</span><span class="mono"><b>${dm.recu}</b> / ${dm.tot} versés</span></div>
      <div class="pline" style="height:7px;margin-bottom:8px"><i style="width:${barW}%;background:${dm.pct >= 55 ? "var(--sage)" : "var(--terra)"}"></i></div>
      <div class="chiprow" style="margin-bottom:6px">
        <span class="tag">${dm.pct}% couverture</span>
        <span class="tag">${dm.relance} relance(s)</span>
        <span class="tag muted">Suggestion prob. : ${sug}/4 si collecte &lt; 55%</span>
      </div>
      <div class="muted" style="font-size:11.5px">RQ-02 est alimenté par le compteur « Attendus ministère » (lignes référentiel hors 3 annexes R1). Mettez à jour probabilité / statut après chaque COPIL.</div>
    </div>`;
  }

  function uxpPanelHtml(r) {
    const ent = findUxpEntretien();
    const gap = findByRef("gaps", (r.links && r.links.gapRef) || "G-03");
    const cons = findByRef("constats", (r.links && r.links.constatRef) || "C-05");
    const doc = findXroadDoc();
    const xr = (Store.state && Store.state.governanceTrack && Store.state.governanceTrack.xroadAuditor) || {};
    const xrLbl =
      (window.PortiaLabels && PortiaLabels.fmtEnum(xr.statut, xr.statut)) || xr.statut || "—";
    let rows = "";
    if (ent) {
      rows += `<div class="alert-i clk" style="border:1px solid var(--line);border-radius:var(--r-sm);margin-bottom:8px" data-act="ent" data-id="${esc(ent.id)}">
        <div class="bd"><b>Entretien — ${esc(ent.n)}</b><span>${typeof Store.fmtDate === "function" ? Store.fmtDate(ent.j) : ""} · ${esc(ent.statut || "")}</span></div></div>`;
    } else {
      rows += `<div class="muted" style="font-size:12px;margin-bottom:8px">Entretien point focal UXP / X-Road non trouvé dans le programme.</div>`;
    }
    if (gap) {
      rows += `<div class="alert-i clk" style="border:1px solid var(--line);border-radius:var(--r-sm);margin-bottom:8px" data-act="gap" data-id="${esc(gap.id)}">
        <div class="bd"><b>Écart ${esc(gap.ref)}</b><span>${esc(gap.exig || "")}</span></div></div>`;
    }
    if (cons) {
      rows += `<div class="alert-i clk" style="border:1px solid var(--line);border-radius:var(--r-sm);margin-bottom:8px" data-act="cons" data-id="${esc(cons.id)}">
        <div class="bd"><b>Constat ${esc(cons.ref)}</b><span>${esc(cons.titre || "")}</span></div></div>`;
    }
    if (doc) {
      rows += `<div class="alert-i clk" style="border:1px solid var(--line);border-radius:var(--r-sm);margin-bottom:8px" data-act="doc" data-id="${esc(doc.id)}">
        <div class="bd"><b>Data Room — ${esc(doc.rep || "")} ${esc(doc.source || "")}</b><span>${esc(doc.statut || "")} · ${esc(doc.desc || "")}</span></div></div>`;
    }
    return `<div class="note slate" style="margin-bottom:14px;font-size:13px">
      <div class="eyebrow" style="margin-bottom:8px;color:var(--terra-deep)">ÉCOSYSTÈME UXP / X-ROAD</div>
      ${rows}
      <div class="kv" style="margin-top:8px"><span class="k">Auditeur X-Road additionnel</span><span class="v">${esc(xrLbl)}${xr.copil ? " · " + esc(xr.copil) : ""}</span></div>
      ${xr.note ? `<p class="muted" style="font-size:11.5px;margin-top:6px">${esc(xr.note)}</p>` : ""}
    </div>`;
  }

  function wireLinkPanel(root) {
    if (!root) return;
    const dr = root.querySelector("#rqLkDr");
    if (dr) dr.onclick = () => {
      Modal.close();
      App.go("dataroom");
    };
    root.querySelectorAll("[data-act]").forEach((el) => {
      el.onclick = () => {
        const act = el.getAttribute("data-act");
        const id = el.getAttribute("data-id");
        Modal.close();
        if (act === "ent" && window.openEntretien) openEntretien(id, !App.user?.readOnly);
        else if (act === "gap" && window.openGapConsolidated) openGapConsolidated(id);
        else if (act === "cons" && window.openConstat) openConstat(id);
        else if (act === "doc") {
          const doc = Store.find("docs", id);
          Modal.close();
          App.go("dataroom");
          if (doc && window.Files && Files.openDocument) {
            setTimeout(() => Files.openDocument({ id: doc.id, fileId: doc.fileId || "" }), 400);
          }
        }
      };
    });
  }

  function editLogHtml(r) {
    const log = (r.editLog || []).slice(0, 8);
    if (!log.length) return "";
    const rows = log
      .map((e) => {
        const pCh =
          e.probBefore !== e.probAfter || e.impactBefore !== e.impactAfter
            ? ` · P×I ${e.probBefore}×${e.impactBefore} → <b>${e.probAfter}×${e.impactAfter}</b>`
            : "";
        const sCh = e.statutBefore !== e.statutAfter ? ` · ${esc(e.statutBefore)} → <b>${esc(e.statutAfter)}</b>` : "";
        const note = e.note ? `<div class="muted" style="font-size:11px;margin-top:2px">${esc(e.note)}</div>` : "";
        return `<div style="padding:8px 0;border-bottom:1px solid var(--line)">
          <div style="font-size:12px"><b>${esc(e.by || "—")}</b> <span class="muted">${esc((e.at || "").slice(0, 16).replace("T", " "))}</span>${pCh}${sCh}</div>${note}</div>`;
      })
      .join("");
    return `<div class="eyebrow" style="margin:16px 0 8px;color:var(--terra-deep);font-family:var(--font-mono);font-size:10.5px;letter-spacing:.14em">JOURNAL DES MODIFICATIONS</div><div>${rows}</div>`;
  }

  async function persistRisk(risk, payload, logEntry, isCreate) {
    recalcNiveau(risk);
    risk.updated = new Date().toISOString();
    Store.upsert("risques", risk);
    if (logEntry) {
      appendRiskEditLog(risk, logEntry);
      appendLocalJournal(logEntry);
    }

    if (window.portiaApi && portiaApi.fetch) {
      try {
        const url = isCreate ? "/api/risques" : "/api/risques/" + encodeURIComponent(risk.id);
        const r = await portiaApi.fetch(url, {
          method: isCreate ? "POST" : "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (r.ok) {
          const data = await r.json();
          if (data.risk) {
            const i = Store.get("risques").findIndex((x) => x.id === risk.id);
            if (i >= 0) Store.state.risques[i] = data.risk;
          }
        }
      } catch (_) {
        /* mode local */
      }
    }

    if (window.portiaApi && portiaApi.saveState) await portiaApi.saveState();
    else Store.save();
  }

  function probImpactFields(r, prefix) {
    prefix = prefix || "rf";
    return `<div class="f2">
      <div class="frow"><label>Probabilité (1–4)</label><input type="range" id="${prefix}Prob" min="1" max="4" step="1" value="${r.prob || 3}"><div class="hint mono" id="${prefix}ProbLbl">${r.prob || 3}/4</div></div>
      <div class="frow"><label>Impact (1–4)</label><input type="range" id="${prefix}Impact" min="1" max="4" step="1" value="${r.impact || 3}"><div class="hint mono" id="${prefix}ImpactLbl">${r.impact || 3}/4</div></div>
    </div>
    <div class="frow"><label>Niveau calculé</label><input id="${prefix}Niv" disabled value="—"></div>`;
  }

  function wireProbImpact(prefix, getVals) {
    const prob = document.getElementById(prefix + "Prob");
    const impact = document.getElementById(prefix + "Impact");
    const niv = document.getElementById(prefix + "Niv");
    function refresh() {
      const p = parseInt(prob.value, 10);
      const i = parseInt(impact.value, 10);
      document.getElementById(prefix + "ProbLbl").textContent = p + "/4";
      document.getElementById(prefix + "ImpactLbl").textContent = i + "/4";
      const nv = niveau(p * i);
      niv.value = nv.lbl + " (" + p + "×" + i + " = " + p * i + ")";
      if (getVals) getVals(p, i);
    }
    prob.addEventListener("input", refresh);
    impact.addEventListener("input", refresh);
    refresh();
    return refresh;
  }

  function riskForm(id) {
    if (!canEditRisque()) {
      toast("Accès refusé", "Profil lecture seule", "err");
      return;
    }
    const r = Store.find("risques", id);
    if (!r) return;

    const statOpts = Object.keys(STATUTS).map(
      (k) => `<option value="${k}" ${r.statut === k ? "selected" : ""}>${STATUTS[k].lbl}</option>`
    );
    const linkBlock = isDataroomRisk(r) ? dataroomPanelHtml() : isUxpRisk(r) ? uxpPanelHtml(r) : "";

    Modal.open(
      `<div class="modal-h"><div class="ic" style="background:var(--bord-soft);color:var(--crit)">${typeof svgI === "function" ? svgI(ICON.risques) : ""}</div>
        <div><div class="eyebrow">Modifier · ${esc(r.ref)}</div><h2 style="font-size:16px">${esc(r.titre)}</h2></div>
        <button class="x" onclick="Modal.close()">${typeof svgI === "function" ? svgI('<path d="M18 6 6 18M6 6l12 12"/>') : "×"}</button></div>
      <div class="modal-b">
        <div class="note sage" style="font-size:12px;margin-bottom:14px">Cotation et mitigation évolutives — chaque modification est journalisée (base du livrable L5).</div>
        ${linkBlock}
        <div class="frow"><label>Titre <span class="req">*</span></label><input id="rfTitre" value="${esc(r.titre)}"></div>
        <div class="f2">
          <div class="frow"><label>Catégorie</label><select id="rfCat" disabled>${CATS.map((c) => `<option value="${c}" ${r.cat === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
          <div class="frow"><label>Statut</label><select id="rfStatut">${statOpts}</select></div>
        </div>
        ${probImpactFields(r, "rf")}
        <div class="frow"><label>Mesure de mitigation <span class="req">*</span></label><textarea id="rfMitig" style="min-height:90px">${esc(r.mitig || "")}</textarea></div>
        <div class="frow"><label>Note de mise à jour</label><textarea id="rfNote" style="min-height:48px" placeholder="Ex. COPIL #2 — relances Data Room, décision auditeur X-Road…"></textarea></div>
        ${isDataroomRisk(r) ? `<button type="button" class="btn ghost sm" id="rfSugProb" style="margin-bottom:8px">Appliquer probabilité suggérée (Data Room)</button>` : ""}
      </div>
      <div class="modal-f"><button class="btn ghost" onclick="Modal.close()">Annuler</button><button class="btn terra" id="rfSave">${typeof svgI === "function" ? svgI('<path d="M20 6 9 17l-5-5"/>') : ""} Enregistrer</button></div>`,
      true
    );

    wireLinkPanel(document.getElementById("ovBox"));
    wireProbImpact("rf");

    const sugBtn = document.getElementById("rfSugProb");
    if (sugBtn) {
      sugBtn.onclick = () => {
        const dm = dataroomMetrics();
        document.getElementById("rfProb").value = suggestProbFromCollecte(dm.pct);
        wireProbImpact("rf")();
        toast("Suggestion appliquée", "Probabilité " + suggestProbFromCollecte(dm.pct) + "/4 (collecte " + dm.pct + "%)", "info");
      };
    }

    document.getElementById("rfSave").onclick = async () => {
      const titre = document.getElementById("rfTitre").value.trim();
      const mitig = document.getElementById("rfMitig").value.trim();
      const statut = document.getElementById("rfStatut").value;
      const prob = parseInt(document.getElementById("rfProb").value, 10);
      const impact = parseInt(document.getElementById("rfImpact").value, 10);
      const note = document.getElementById("rfNote").value.trim();
      if (!titre || !mitig) {
        toast("Champs requis", "Titre et mitigation obligatoires", "err");
        return;
      }
      const before = { titre: r.titre, prob: r.prob, impact: r.impact, statut: r.statut, mitig: r.mitig };
      const at = new Date().toISOString();
      const logEntry = {
        at,
        by: userLabel(),
        role: userRole(),
        riskId: r.id,
        riskRef: r.ref,
        titreBefore: before.titre,
        titreAfter: titre,
        probBefore: before.prob,
        probAfter: prob,
        impactBefore: before.impact,
        impactAfter: impact,
        statutBefore: before.statut,
        statutAfter: statut,
        note,
      };

      r.titre = titre;
      r.prob = prob;
      r.impact = impact;
      r.statut = statut;
      r.mitig = mitig;

      const btn = document.getElementById("rfSave");
      btn.disabled = true;
      try {
        await persistRisk(
          r,
          { titre, prob, impact, statut, mitig, note },
          logEntry,
          false
        );
        Modal.close();
        toast("Risque mis à jour", r.ref + " — " + niveau(r.niveau).lbl, "ok");
        if (window.App && App.refresh) App.refresh();
      } catch (err) {
        toast("Erreur", (err && err.message) || "Enregistrement impossible", "err");
        btn.disabled = false;
      }
    };
  }

  function createRiskForm() {
    if (!canCreateRisque()) {
      toast("Accès refusé", "Création réservée au pilotage", "err");
      return;
    }
    const draft = {
      cat: "Mission",
      prob: 3,
      impact: 3,
      statut: "surveille",
      mitig: "",
    };

    function renderRef() {
      const el = document.getElementById("crRefPreview");
      if (el) el.textContent = nextRiskRef(draft.cat);
    }

    const statOpts = Object.keys(STATUTS).map((k) => `<option value="${k}">${STATUTS[k].lbl}</option>`);

    Modal.open(
      `<div class="modal-h"><h2>Nouveau risque</h2><button class="x" onclick="Modal.close()">${typeof svgI === "function" ? svgI('<path d="M18 6 6 18M6 6l12 12"/>') : "×"}</button></div>
      <div class="modal-b">
        <div class="note slate" style="font-size:12px;margin-bottom:14px"><b>Référence auto</b> — Mission → préfixe <span class="mono">RQ</span> · Solution → <span class="mono">RS</span>. Numéro suivant le dernier de la catégorie.</div>
        <div class="f2">
          <div class="frow"><label>Catégorie <span class="req">*</span></label><select id="crCat">${CATS.map((c) => `<option value="${c}">${c}</option>`).join("")}</select></div>
          <div class="frow"><label>Référence</label><input disabled value="" id="crRefPreview" class="mono"></div>
        </div>
        <div class="frow"><label>Titre <span class="req">*</span></label><input id="crTitre" placeholder="Ex. Retard validation charte données"></div>
        ${probImpactFields(draft, "cr")}
        <div class="frow"><label>Statut initial</label><select id="crStatut">${statOpts}</select></div>
        <div class="frow"><label>Mitigation prévue</label><textarea id="crMitig" style="min-height:72px" placeholder="Actions de réduction ou de surveillance…"></textarea></div>
        <div class="frow"><label>Liens cockpit <span class="muted">(optionnel)</span></label>
          <div class="f2" style="margin-top:6px">
            <label style="display:flex;gap:8px;font-size:12.5px"><input type="checkbox" id="crLkDr"> Suivre compteur Data Room (type RQ-02)</label>
            <label style="display:flex;gap:8px;font-size:12.5px"><input type="checkbox" id="crLkUx"> Lier écosystème UXP / X-Road (type RQ-05)</label>
          </div>
          <div class="f2" style="margin-top:8px">
            <input id="crGap" placeholder="Réf. écart ex. G-12" style="font-size:12px">
            <input id="crCons" placeholder="Réf. constat ex. C-08" style="font-size:12px">
          </div>
        </div>
        <div class="frow"><label>Justification création</label><textarea id="crNote" style="min-height:40px" placeholder="Pourquoi ce risque émerge (COPIL, entretien, constat…)"></textarea></div>
      </div>
      <div class="modal-f"><button class="btn ghost" onclick="Modal.close()">Annuler</button><button class="btn terra" id="crSave">Créer le risque</button></div>`,
      true
    );

    document.getElementById("crCat").onchange = (e) => {
      draft.cat = e.target.value;
      renderRef();
    };
    renderRef();
    wireProbImpact("cr");

    document.getElementById("crSave").onclick = async () => {
      const cat = document.getElementById("crCat").value;
      const titre = document.getElementById("crTitre").value.trim();
      const mitig = document.getElementById("crMitig").value.trim() || "À définir en COPIL.";
      const statut = document.getElementById("crStatut").value;
      const prob = parseInt(document.getElementById("crProb").value, 10);
      const impact = parseInt(document.getElementById("crImpact").value, 10);
      const note = document.getElementById("crNote").value.trim();
      if (!titre) {
        toast("Titre requis", "", "err");
        return;
      }
      const ref = nextRiskRef(cat);
      const links = {};
      if (document.getElementById("crLkDr").checked) links.type = "dataroom";
      else if (document.getElementById("crLkUx").checked) {
        links.type = "uxp";
        links.gapRef = (document.getElementById("crGap").value.trim() || "G-03");
        links.constatRef = (document.getElementById("crCons").value.trim() || "C-05");
      } else {
        const g = document.getElementById("crGap").value.trim();
        const c = document.getElementById("crCons").value.trim();
        if (g) links.gapRef = g;
        if (c) links.constatRef = c;
      }

      const risk = {
        id: typeof uid === "function" ? uid("r") : "r_" + Date.now(),
        ref,
        titre,
        cat,
        prob,
        impact,
        statut,
        mitig,
        links: Object.keys(links).length ? links : undefined,
        editLog: [],
      };
      recalcNiveau(risk);

      const at = new Date().toISOString();
      const logEntry = {
        at,
        by: userLabel(),
        role: userRole(),
        riskId: risk.id,
        riskRef: ref,
        action: "create",
        titreAfter: titre,
        probAfter: prob,
        impactAfter: impact,
        statutAfter: statut,
        note,
      };

      const btn = document.getElementById("crSave");
      btn.disabled = true;
      try {
        await persistRisk(
          risk,
          { ref, titre, cat, prob, impact, statut, mitig, note, links: risk.links || {} },
          logEntry,
          true
        );
        Modal.close();
        toast("Risque créé", ref + " — " + titre, "ok");
        if (window.App && App.refresh) App.refresh();
      } catch (err) {
        toast("Erreur", (err && err.message) || "Création impossible", "err");
        btn.disabled = false;
      }
    };
  }

  function openRisque(id) {
    const r = Store.find("risques", id);
    if (!r) return;
    recalcNiveau(r);
    const nv = niveau(r.niveau);
    const st = STATUTS[r.statut] || { lbl: r.statut, cls: "neutral" };
    let linkBlock = "";
    if (isDataroomRisk(r)) linkBlock = dataroomPanelHtml();
    else if (isUxpRisk(r)) linkBlock = uxpPanelHtml(r);
    else if (r.links && (r.links.gapRef || r.links.constatRef)) {
      const parts = [];
      if (r.links.gapRef) {
        const g = findByRef("gaps", r.links.gapRef);
        if (g) parts.push(`<span class="tag clk" data-act="gap" data-id="${esc(g.id)}">${esc(g.ref)}</span>`);
      }
      if (r.links.constatRef) {
        const c = findByRef("constats", r.links.constatRef);
        if (c) parts.push(`<span class="tag clk" data-act="cons" data-id="${esc(c.id)}">${esc(c.ref)}</span>`);
      }
      if (parts.length) linkBlock = `<div class="chiprow" style="margin-bottom:14px">${parts.join("")}</div>`;
    }

    const editBtn = canEditRisque()
      ? `<button class="btn terra" onclick="PortiaRiskEdit.riskForm('${r.id}')">${typeof svgI === "function" ? svgI('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>') : ""} Modifier</button>`
      : "";

    Modal.open(
      `<div class="modal-h"><div class="ic" style="background:var(--bord-soft);color:var(--crit)">${typeof svgI === "function" ? svgI(ICON.risques) : ""}</div>
        <div><div class="eyebrow">${esc(r.ref)} · ${esc(r.cat)}</div><h2 style="font-size:16px">${esc(r.titre)}</h2></div>
        <button class="x" onclick="Modal.close()">${typeof svgI === "function" ? svgI('<path d="M18 6 6 18M6 6l12 12"/>') : "×"}</button></div>
      <div class="modal-b">
        <div class="chiprow" style="margin-bottom:16px"><span class="bdg ${nv.cls}">Niveau ${nv.lbl}</span><span class="bdg ${st.cls}">${st.lbl}</span><span class="tag">Probabilité ${r.prob}/4</span><span class="tag">Impact ${r.impact}/4</span><span class="tag mono">Score ${r.niveau}</span></div>
        ${linkBlock}
        <div class="eyebrow" style="font-family:var(--font-mono);font-size:10.5px;letter-spacing:.14em;color:var(--terra-deep);margin-bottom:7px">MESURE DE MITIGATION</div>
        <p style="font-size:14px;line-height:1.6">${esc(r.mitig || "—")}</p>
        ${editLogHtml(r)}
      </div>
      <div class="modal-f">
        ${typeof PortiaExport !== "undefined" ? `<button class="btn ghost" onclick="PortiaExport.pick('risque','${r.id}')">${typeof svgI === "function" ? svgI('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>') : ""} Exporter</button>` : ""}
        <button class="btn ghost" onclick="Modal.close()">Fermer</button>
        ${editBtn}
      </div>`,
      true
    );
    wireLinkPanel(document.getElementById("ovBox"));
  }

  function patchRisquesView() {
    if (!window.VIEWS || VIEWS._riskEdit) return;
    const orig = VIEWS.risques;
    VIEWS.risques = function () {
      const v = orig();
      setTimeout(() => {
        const head = v.querySelector(".page-head .actions");
        if (head && canCreateRisque() && !head.querySelector("#btnNewRisk")) {
          const btn = el("button", { class: "btn terra", id: "btnNewRisk", type: "button" });
          btn.innerHTML = `${typeof svgI === "function" ? svgI(ICON.risques) : "+"} Nouveau risque`;
          btn.onclick = () => createRiskForm();
          head.insertBefore(btn, head.firstChild);
        }
        if (canEditRisque()) {
          const note = document.createElement("div");
          note.className = "note sage";
          note.style.cssText = "margin-bottom:14px;font-size:12.5px";
          note.innerHTML =
            "<b>Registre évolutif</b> — ouvrez un risque puis <b>Modifier</b> pour ajuster probabilité, impact et mitigation. RQ-02 suit la collecte Data Room · RQ-05 le point focal UXP.";
          const anchor = v.querySelector(".row") || v.firstChild;
          if (anchor && !v.querySelector(".risk-edit-note")) {
            note.classList.add("risk-edit-note");
            v.insertBefore(note, anchor);
          }
        }
      }, 0);
      return v;
    };
    VIEWS._riskEdit = true;
  }

  function init() {
    if (window._riskEditInit) return;
    window._riskEditInit = true;
    window.PortiaRiskEdit = {
      canEditRisque,
      canCreateRisque,
      open: openRisque,
      riskForm,
      createRiskForm,
      nextRiskRef,
      dataroomMetrics,
    };
    window.openRisque = openRisque;
    patchRisquesView();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(init, 350));
  } else {
    setTimeout(init, 350);
  }
})();
