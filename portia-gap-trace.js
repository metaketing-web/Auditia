/**
 * Traçabilité preuve — Matrice d'écart ↔ entretiens / Data Room / constats
 */
(function () {
  "use strict";

  const STRUCT_KEYWORDS = [
    { re: /sigfip|finance|budget|daf|exécution budgétaire/i, structs: ["DAF", "SIGFIP"] },
    { re: /dsi|système d'information|socle si|architecture|microservice|conteneur|sso|2fa|uxp|x-road|interop|réseau|ipv6|pwa|offline/i, structs: ["DSI"] },
    { re: /dpsd|programme|bénéficiaire|drill-down|consolidation|reporting|excel/i, structs: ["DPSD", "Cabinet", "DAJIP"] },
    { re: /dajip|programmatique|aej|oscn|bcp|dispositif/i, structs: ["DAJIP", "AEJ", "OSCN", "BCP-Emploi"] },
    { re: /rh|drh|ressources humaines|flotte|patrimoine|ged|marché|volet b/i, structs: ["DRH", "Patrimoine", "Marchés"] },
    { re: /rssi|dpo|rgpd|sécurité|chiffrement|tls|audit trail|journal/i, structs: ["DSI", "Inspection Générale"] },
    { re: /nni|identifiant|référentiel|données|lineage|qualité/i, structs: ["DSI", "DPSD", "DAJIP"] },
    { re: /cabinet|pilotage|ministériel|sponsor/i, structs: ["Cabinet"] },
    { re: /terrain|région|focus group/i, structs: ["DPSD", "DSI"] },
    { re: /ig|inspection|prime|traçabilité/i, structs: ["Inspection Générale", "Cabinet"] },
  ];

  const DOC_KEYWORDS = [
    { re: /architecture|microservice|socle|si /i, keys: ["archi", "dsi", "socle", "technique"] },
    { re: /sigfip|finance|budget/i, keys: ["sigfip", "budget", "daf", "finance"] },
    { re: /interop|uxp|x-road|api|intégration/i, keys: ["interop", "uxp", "api", "intégration"] },
    { re: /sécurité|sso|rgpd|rssi|dpo|tls/i, keys: ["sécur", "sso", "rgpd", "rssi"] },
    { re: /rh|drh|flotte|patrimoine|ged|marché/i, keys: ["rh", "drh", "flotte", "patrimoine", "ged", "marché"] },
    { re: /organigramme|processus|cartographie|flux/i, keys: ["organigramme", "processus", "flux", "carto"] },
    { re: /nnI|identité|bénéficiaire|référentiel/i, keys: ["nni", "ident", "bénéf", "référent"] },
    { re: /rapport|excel|consolidation/i, keys: ["rapport", "excel", "indicateur", "tableau"] },
  ];

  function gapBlob(g) {
    return [g.ref, g.exig, g.realite, g.theme, g.cdc].filter(Boolean).join(" ").toLowerCase();
  }

  function matchStructs(blob) {
    const out = new Set();
    STRUCT_KEYWORDS.forEach((row) => {
      if (row.re.test(blob)) row.structs.forEach((s) => out.add(s));
    });
    return [...out];
  }

  function traceProofs(gap) {
    if (!gap || !window.Store) return { entretiens: [], docs: [], constats: [] };
    const blob = gapBlob(gap);
    const structs = matchStructs(blob);

    const entretiens = Store.get("entretiens").filter((e) => {
      if (structs.length && structs.some((s) => e.struct === s || (e.struct || "").includes(s))) return true;
      const en = (e.n + " " + e.struct + " " + (e.axe || "")).toLowerCase();
      const words = blob.split(/\s+/).filter((w) => w.length > 5);
      return words.some((w) => en.includes(w.slice(0, Math.min(w.length, 8))));
    });

    const docKeys = new Set();
    DOC_KEYWORDS.forEach((row) => {
      if (row.re.test(blob)) row.keys.forEach((k) => docKeys.add(k));
    });

    const docs = Store.get("docs").filter((d) => {
      if (typeof isTestDoc === "function" && isTestDoc(d)) return false;
      const db = [d.desc, d.source, d.rep, d.type, d.format].join(" ").toLowerCase();
      if ([...docKeys].some((k) => db.includes(k))) return true;
      const words = blob.split(/\s+/).filter((w) => w.length > 6);
      return words.some((w) => db.includes(w.slice(0, 7)));
    });

    const constats = Store.get("constats").filter((c) => {
      if (c.ecart && String(c.ecart).includes(gap.ref)) return true;
      if (gap.ref && String(c.ref || "").replace("C-", "G-") === gap.ref.replace("G-", "C-")) return false;
      const cb = (c.titre + " " + c.desc + " " + (c.ecart || "")).toLowerCase();
      const exWords = (gap.exig || "").toLowerCase().split(/\s+/).filter((w) => w.length > 5);
      return exWords.filter((w) => cb.includes(w.slice(0, 6))).length >= 2;
    });

    const uniq = (arr, key) => {
      const seen = new Set();
      return arr.filter((x) => {
        const k = x[key];
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    };

    return {
      entretiens: uniq(entretiens, "id").slice(0, 6),
      docs: uniq(docs, "id").slice(0, 5),
      constats: uniq(constats, "id").slice(0, 4),
    };
  }

  function proofCount(gap) {
    const p = traceProofs(gap);
    return p.entretiens.length + p.docs.length + p.constats.length;
  }

  function proofSection(gap) {
    const p = traceProofs(gap);
    const n = p.entretiens.length + p.docs.length + p.constats.length;
    if (!n) {
      return `<div class="note slate" style="margin-top:12px;font-size:12px"><b>Preuves liées :</b> aucune correspondance automatique — renseignez un entretien ou versez un document dans la Data Room, puis rouvrez cette fiche.</div>`;
    }
    let html = `<div class="eyebrow" style="margin:14px 0 8px;color:var(--terra-deep)">PREUVES & SOURCES (${n})</div><div class="stack" style="gap:8px">`;
    p.entretiens.forEach((e) => {
      html += `<div class="alert-i clk" style="border:1px solid var(--line);border-radius:var(--r-sm);padding:8px 10px" data-pe="${e.id}">
        <div class="ic" style="background:var(--terra-soft);color:var(--terra-deep)">${typeof svgI === "function" ? svgI(typeof ICON !== "undefined" ? ICON.entretiens : "") : ""}</div>
        <div class="bd"><b style="font-size:12px">${esc(e.n)}</b><span>${esc(e.struct)} · S${e.sem} · ${typeof statutBadge === "function" ? statutBadge(e.statut) : e.statut}</span></div>
        <button type="button" class="btn ghost sm">Ouvrir</button></div>`;
    });
    p.docs.forEach((d) => {
      html += `<div class="alert-i clk" style="border:1px solid var(--line);border-radius:var(--r-sm);padding:8px 10px" data-pd="${d.id}">
        <div class="ic" style="background:var(--sage-soft);color:var(--sage-deep)">${typeof svgI === "function" ? svgI('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>') : ""}</div>
        <div class="bd"><b class="mono" style="font-size:11px">${esc(typeof docName === "function" ? docName(d) : d.desc)}</b><span>${esc(d.rep)} · ${esc(d.source)} · ${esc(d.statut)}</span></div>
        <button type="button" class="btn ghost sm">Voir</button></div>`;
    });
    p.constats.forEach((c) => {
      html += `<div class="alert-i clk" style="border:1px solid var(--line);border-radius:var(--r-sm);padding:8px 10px" data-pc="${c.id}">
        <div class="ic" style="background:var(--bord-soft);color:var(--axe-pol)">${typeof svgI === "function" ? svgI(typeof ICON !== "undefined" ? ICON.constats : "") : ""}</div>
        <div class="bd"><b style="font-size:12px">${esc(c.ref)} — ${esc(c.titre)}</b><span>${esc(c.struct)} · ${esc(c.axe)}</span></div>
        <button type="button" class="btn ghost sm">Constat</button></div>`;
    });
    html += `</div>
      <div class="chiprow" style="margin-top:12px">
        <button type="button" class="tag sm" id="gpEnt">Tous les entretiens liés</button>
        <button type="button" class="tag sm" id="gpDr">Data Room filtrée</button>
        <button type="button" class="tag sm" id="gpDepot">Déposer une preuve</button>
      </div>`;
    return html;
  }

  function wireProofClicks(gap) {
    document.querySelectorAll("[data-pe]").forEach((el) => {
      el.onclick = () => {
        const id = el.dataset.pe;
        Modal.close();
        if (typeof openEntretien === "function") openEntretien(id, true);
      };
    });
    document.querySelectorAll("[data-pd]").forEach((el) => {
      el.onclick = () => {
        const id = el.dataset.pd;
        const d = Store.find("docs", id);
        Modal.close();
        if (d) App.go("dataroom", { rep: d.rep, highlight: id });
        else App.go("dataroom");
      };
    });
    document.querySelectorAll("[data-pc]").forEach((el) => {
      el.onclick = () => {
        const id = el.dataset.pc;
        Modal.close();
        if (typeof openConstat === "function") openConstat(id);
      };
    });
    const ge = document.getElementById("gpEnt");
    if (ge)
      ge.onclick = () => {
        const p = traceProofs(gap);
        const st = p.entretiens[0] && p.entretiens[0].struct;
        Modal.close();
        App.go("entretiens", st ? { struct: st } : {});
      };
    const gd = document.getElementById("gpDr");
    if (gd)
      gd.onclick = () => {
        Modal.close();
        App.go("dataroom");
      };
    const gp = document.getElementById("gpDepot");
    if (gp)
      gp.onclick = () => {
        Modal.close();
        App.go("depot");
      };
  }

  function openGapWithTrace(gapOrId) {
    const g = typeof gapOrId === "string" ? Store.find("gaps", gapOrId) : gapOrId;
    if (!g) return;
    const v = VERDICTS[g.verdict] || { lbl: g.verdict, cls: "neutral" };
    Modal.open(
      `<div class="modal-h"><div class="ic" style="background:var(--slate-soft);color:var(--info)">${typeof svgI === "function" ? svgI(ICON.ecart) : ""}</div>
        <div style="min-width:0"><div class="eyebrow">${esc(g.theme || "")} · ${esc(g.cdc)}</div><h2 style="font-size:17px">${esc(g.ref)} — ${esc(g.exig)}</h2></div>
        <button class="x" onclick="Modal.close()" aria-label="Fermer">${typeof svgI === "function" ? svgI('<path d="M18 6 6 18M6 6l12 12"/>') : "×"}</button></div>
      <div class="modal-b">
        <div class="chiprow" style="margin-bottom:14px"><span class="bdg ${v.cls}">${esc(v.lbl)}</span><span class="tag">${esc(g.theme || "")}</span></div>
        <div class="eyebrow" style="font-family:var(--font-mono);font-size:10.5px;letter-spacing:.14em;color:var(--terra-deep);margin-bottom:7px">RÉALITÉ OBSERVÉE</div>
        <p style="font-size:14px;line-height:1.6" class="tip-full">${esc(g.realite)}</p>
        ${proofSection(g)}
      </div>
      <div class="modal-f">
        ${typeof PortiaExport !== "undefined" ? `<button class="btn ghost" onclick="PortiaExport.pick('gap','${g.id}')">${typeof svgI === "function" ? svgI('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>') : ""} Exporter</button>` : ""}
        <button class="btn ghost" onclick="Modal.close();App.go('cdc_tech')">Checklist tech.</button>
        <button class="btn ghost" onclick="Modal.close()">Fermer</button>
      </div>`,
      true
    );
    wireProofClicks(g);
    if (window.PortiaA11y && PortiaA11y.applyTips) PortiaA11y.applyTips(document.getElementById("ovBox"));
  }

  function patchEcartTable() {
    const orig = VIEWS.ecart;
    if (!orig || VIEWS._gapTrace) return;
    VIEWS.ecart = function () {
      const v = orig();
      setTimeout(() => {
        const table = v.querySelector(".tbl thead tr");
        const body = v.querySelector("#ecBody");
        if (!table || !body) return;
        if (!table.querySelector("th.gp-th")) {
          const th = document.createElement("th");
          th.className = "gp-th";
          th.textContent = "Preuves";
          th.style.width = "72px";
          table.appendChild(th);
        }
        const renderOrig = body.innerHTML;
        const observer = new MutationObserver(() => {
          body.querySelectorAll("tr").forEach((tr) => {
            if (tr.querySelector(".gp-cell")) return;
            const ref = tr.querySelector(".mono")?.textContent?.trim();
            const g = Store.get("gaps").find((x) => x.ref === ref);
            const td = document.createElement("td");
            td.className = "gp-cell mono";
            td.style.fontSize = "11px";
            td.style.textAlign = "center";
            const n = g ? proofCount(g) : 0;
            td.innerHTML = n
              ? `<span class="bdg ok" title="${n} preuve(s) liée(s)">${n}</span>`
              : `<span class="muted" title="Aucune preuve auto">—</span>`;
            tr.appendChild(td);
          });
          if (window.PortiaA11y && PortiaA11y.applyTips) PortiaA11y.applyTips(v);
        });
        observer.observe(body, { childList: true, subtree: true });
      }, 60);
      return v;
    };
    VIEWS._gapTrace = true;
  }

  function init() {
    window.openGap = openGapWithTrace;
    window.PortiaGapTrace = { traceProofs, proofCount, openGapWithTrace, proofSection, wireProofClicks };
    patchEcartTable();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(init, 200));
  } else {
    setTimeout(init, 200);
  }
})();
