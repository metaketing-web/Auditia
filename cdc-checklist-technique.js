/**
 * Checklist des besoins techniques du cahier des charges PNIPM.
 * Synchronisée avec la matrice d'écart (gaps) — suivi de vérification audit.
 */
(function () {
  "use strict";

  /** Thèmes CDC considérés comme besoins techniques / SI */
  const TECH_THEMES = new Set([
    "Architecture",
    "Données",
    "Interop",
    "Réseau",
    "Sécurité",
    "Fonctionnel",
    "Performance",
    "IA",
    "Conformité",
    "UX",
    "Reporting",
    "Legacy",
  ]);

  const COUVERTURE = {
    oui: { lbl: "Couvert / conforme", cls: "ok" },
    partiel: { lbl: "Partiel", cls: "warn" },
    non: { lbl: "Non couvert", cls: "crit" },
    na: { lbl: "N/A / caduc", cls: "neutral" },
    a_verifier: { lbl: "À vérifier", cls: "info" },
  };

  const THEME_ORDER = [
    "Architecture",
    "Données",
    "Interop",
    "Réseau",
    "Sécurité",
    "Fonctionnel",
    "Performance",
    "IA",
    "Conformité",
    "UX",
    "Reporting",
    "Legacy",
  ];

  const EXTRA_TECH = [
    {
      ref: "G-46",
      theme: "Sécurité",
      exig: "Gouvernance RSSI / DPO distincte du DSI",
      cdc: "§ Tech. sécurité · RGPD",
      realite: "Trame rssi_dpo — entretiens S3",
      verdict: "completer",
    },
    {
      ref: "G-47",
      theme: "Données",
      exig: "Grille qualité données (complétude, fraîcheur, lineage)",
      cdc: "§ Données · L3",
      realite: "Grille 10 sources — enrichissement en cours",
      verdict: "completer",
    },
    {
      ref: "G-48",
      theme: "Fonctionnel",
      exig: "Structuration programmatique vs non-programmatique",
      cdc: "§ Fonc. 3.2",
      realite: "Module 7 domaines initialisé",
      verdict: "completer",
    },
  ];

  function verdictToCouverture(v) {
    if (v === "confirme") return "partiel";
    if (v === "ajuster") return "partiel";
    if (v === "caduc") return "na";
    if (v === "completer") return "non";
    return "a_verifier";
  }

  function gapToRow(g, saved) {
    const s = saved && saved[g.ref];
    return {
      ref: g.ref,
      theme: g.theme || "—",
      exig: g.exig || "",
      cdc: g.cdc || "",
      realite: g.realite || "",
      verdict: g.verdict || "completer",
      gapId: g.id,
      verifie: !!(s && s.verifie),
      couverture: (s && s.couverture) || verdictToCouverture(g.verdict),
      preuve: (s && s.preuve) || "",
      notes: (s && s.notes) || "",
      attachments: Array.isArray(s && s.attachments) ? s.attachments.slice() : [],
    };
  }

  function buildRows() {
    const gaps = Store.get("gaps") || [];
    const saved = Store.state.cdcChecklistTech || {};
    const byRef = {};
    gaps.forEach((g) => {
      if (TECH_THEMES.has(g.theme)) byRef[g.ref] = g;
    });
    EXTRA_TECH.forEach((g) => {
      if (!byRef[g.ref]) byRef[g.ref] = Object.assign({ id: "g_" + g.ref }, g);
    });
    const refs = Object.keys(byRef).sort((a, b) => {
      const na = parseInt(a.replace("G-", ""), 10) || 0;
      const nb = parseInt(b.replace("G-", ""), 10) || 0;
      return na - nb;
    });
    return refs.map((ref) => gapToRow(byRef[ref], saved));
  }

  function persistRow(row) {
    if (!Store.state.cdcChecklistTech) Store.state.cdcChecklistTech = {};
    Store.state.cdcChecklistTech[row.ref] = {
      verifie: row.verifie,
      couverture: row.couverture,
      preuve: row.preuve,
      notes: row.notes,
      attachments: (row.attachments || []).map((a) => ({
        id: a.id,
        fileId: a.fileId || a.id,
        name: a.name,
        mime: a.mime || "",
        at: a.at || "",
      })),
      updated: new Date().toISOString(),
    };
    if (window.portiaApi && portiaApi.saveState) portiaApi.saveState();
    else Store.save();
  }

  function attIdFor(row) {
    const base = String(row.ref || "G").replace(/-/g, "_");
    const tail =
      typeof uid === "function"
        ? uid("ck").slice(-10)
        : Date.now().toString(36);
    return "ck_" + base + "_" + tail;
  }

  async function uploadAttachment(row, file) {
    if (!file || !window.Files || !Files.put) {
      toast("Pièce jointe", "Upload indisponible sur ce poste", "err");
      return;
    }
    const id = attIdFor(row);
    toast("Envoi…", file.name, "info");
    try {
      const res = await Files.put(id, file, {
        name: file.name,
        mime: file.type || "application/octet-stream",
      });
      if (!res || res.ok === false) throw new Error("Échec de l'enregistrement");
      const fileId = (res && (res.fileId || res.id)) || id;
      if (!row.attachments) row.attachments = [];
      row.attachments.push({
        id: id,
        fileId: fileId,
        name: file.name,
        mime: file.type || "application/octet-stream",
        at: new Date().toISOString(),
      });
      persistRow(row);
      toast("Pièce jointe", file.name + " ajoutée à " + row.ref, "ok");
      return true;
    } catch (e) {
      toast("Échec envoi", e.message || String(e), "err");
      return false;
    }
  }

  function openAttachment(att) {
    const fid = att.fileId || att.id;
    if (!fid) return;
    if (Files.openDocument) Files.openDocument({ id: fid, fileId: fid });
    else if (Files.openInTab) Files.openInTab(fid);
  }

  function renderAttList(row) {
    const box = document.getElementById("ckAttList");
    if (!box) return;
    const atts = row.attachments || [];
    if (!atts.length) {
      box.innerHTML =
        '<div class="muted" style="font-size:12px">Aucune pièce jointe — ajoutez une photo de démo, une capture ou un document.</div>';
      return;
    }
    const clip = svgI(
      '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>'
    );
    box.innerHTML = atts
      .map(
        (a, i) =>
          `<div class="ck-att-item">
            <span style="color:var(--terra-deep);flex:none;width:16px;height:16px">${clip}</span>
            <span class="nm" title="${esc(a.name)}">${esc(a.name)}</span>
            <button type="button" class="btn ghost sm" data-act="open" data-i="${i}">Voir</button>
            <button type="button" class="btn ghost sm" data-act="rm" data-i="${i}">Retirer</button>
          </div>`
      )
      .join("");
    box.querySelectorAll("button").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const i = parseInt(btn.dataset.i, 10);
        const a = atts[i];
        if (!a) return;
        if (btn.dataset.act === "open") openAttachment(a);
        else {
          row.attachments.splice(i, 1);
          persistRow(row);
          renderAttList(row);
        }
      };
    });
  }

  function wireAttachmentInputs(row) {
    const inp = document.getElementById("ckAttInput");
    const cam = document.getElementById("ckAttCam");
    const btnFile = document.getElementById("ckAttFile");
    const btnPhoto = document.getElementById("ckAttPhoto");
    if (btnFile && inp) btnFile.onclick = () => inp.click();
    if (btnPhoto && cam) btnPhoto.onclick = () => cam.click();
    async function onPick(e) {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!f) return;
      const ok = await uploadAttachment(row, f);
      if (ok) renderAttList(row);
    }
    if (inp) inp.onchange = onPick;
    if (cam) cam.onchange = onPick;
    renderAttList(row);
  }

  function exportCsv(rows) {
    const head = [
      "ref",
      "theme",
      "exigence",
      "cdc",
      "verdict",
      "couverture",
      "verifie",
      "preuve",
      "pieces_jointes",
      "notes",
      "realite",
    ];
    const lines = [head.join(";")];
    rows.forEach((r) => {
      const pj = (r.attachments || []).map((a) => a.name).join(" | ");
      lines.push(
        [
          r.ref,
          r.theme,
          r.exig,
          r.cdc,
          r.verdict,
          r.couverture,
          r.verifie ? "oui" : "non",
          r.preuve,
          pj,
          r.notes,
          r.realite,
        ]
          .map((c) => '"' + String(c).replace(/"/g, '""') + '"')
          .join(";")
      );
    });
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "checklist-cdc-technique_" + (typeof todayISO === "function" ? todayISO() : "export") + ".csv";
    a.click();
  }

  function openRowModal(row) {
    const g = Store.get("gaps").find((x) => x.ref === row.ref);
    Modal.open(
      `<div class="modal-h"><div class="ic" style="background:var(--slate-soft);color:var(--info)">${svgI(ICON.ecart)}</div>
        <div><div class="eyebrow">${esc(row.theme)} · ${esc(row.cdc)}</div><h2>${esc(row.ref)}</h2></div>
        <button class="x" onclick="Modal.close()">${svgI('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div>
      <div class="modal-b stack">
        <p><b>${esc(row.exig)}</b></p>
        <div class="note slate" style="font-size:12px">${esc(row.realite)}</div>
        <div class="frow"><label>Couverture technique</label>
          <select id="ckCouv">${Object.keys(COUVERTURE).map((k) => `<option value="${k}" ${row.couverture === k ? "selected" : ""}>${COUVERTURE[k].lbl}</option>`).join("")}</select></div>
        <div class="frow"><label>Photos & pièces jointes</label>
          <div id="ckAttList" class="ck-att-list"></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
            <button type="button" class="btn terra sm" id="ckAttPhoto">${svgI('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>')} Ajouter une photo</button>
            <button type="button" class="btn ghost sm" id="ckAttFile">${svgI('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/>')} Joindre un fichier</button>
            <input type="file" id="ckAttInput" style="display:none" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip">
            <input type="file" id="ckAttCam" style="display:none" accept="image/*" capture="environment">
          </div>
          <div class="hint">Sur iPad / téléphone : « Ajouter une photo » ouvre l'appareil photo. Les fichiers sont stockés sur le serveur mission.</div>
        </div>
        <div class="frow"><label>Preuve / source (Data Room, entretien, démo)</label><input id="ckPreuve" value="${esc(row.preuve)}"></div>
        <div class="frow"><label>Notes audit</label><textarea id="ckNotes" rows="4">${esc(row.notes)}</textarea></div>
        <label style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" id="ckVerif" ${row.verifie ? "checked" : ""}> Point vérifié par l'équipe audit</label>
      </div>
      <div class="modal-f">
        ${g ? `<button class="btn ghost" onclick="Modal.close();openGap('${g.id}')">Matrice & preuves liées</button>` : ""}
        <button class="btn ghost" onclick="Modal.close()">Fermer</button>
        <button class="btn terra" id="ckSave">Enregistrer</button>
      </div>`,
      true
    );
    wireAttachmentInputs(row);
    document.getElementById("ckSave").onclick = () => {
      row.couverture = document.getElementById("ckCouv").value;
      row.preuve = document.getElementById("ckPreuve").value.trim();
      row.notes = document.getElementById("ckNotes").value.trim();
      row.verifie = document.getElementById("ckVerif").checked;
      persistRow(row);
      Modal.close();
      toast("Checklist", row.ref + " enregistré", "ok");
      App.go("cdc_tech");
    };
  }

  function registerView() {
    VIEWS.cdc_tech = function () {
      const v = el("div", { class: "view" });
      const f = { theme: "all", couv: "all", q: "", onlyTodo: false };
      let rows = buildRows();

      function stats(list) {
        const tot = list.length;
        const ver = list.filter((r) => r.verifie).length;
        const oui = list.filter((r) => r.couverture === "oui").length;
        const non = list.filter((r) => r.couverture === "non").length;
        return { tot, ver, oui, non, pct: tot ? Math.round((ver / tot) * 100) : 0 };
      }

      function render() {
        rows = buildRows();
        let list = rows.filter((r) => {
          if (f.theme !== "all" && r.theme !== f.theme) return false;
          if (f.couv !== "all" && r.couverture !== f.couv) return false;
          if (f.onlyTodo && r.verifie) return false;
          if (f.q) {
            const s = (r.ref + " " + r.exig + " " + r.cdc + " " + r.preuve).toLowerCase();
            if (!s.includes(f.q.toLowerCase())) return false;
          }
          return true;
        });
        const st = stats(rows);

        v.querySelector("#ckKpis").innerHTML = `
          <div class="kpi"><div class="top"><span class="lbl">Exigences techniques CDC</span></div><div class="val">${st.tot}</div></div>
          <div class="kpi"><div class="top"><span class="lbl">Points vérifiés</span></div><div class="val">${st.ver}<small>/${st.tot}</small></div><div class="bar"><i style="width:${st.pct}%;background:var(--sage)"></i></div></div>
          <div class="kpi"><div class="top"><span class="lbl">Couverture « oui »</span></div><div class="val">${st.oui}</div></div>
          <div class="kpi"><div class="top"><span class="lbl">Non couverts</span></div><div class="val" style="color:var(--crit)">${st.non}</div></div>`;

        const body = v.querySelector("#ckBody");
        body.innerHTML =
          list
            .map((r) => {
              const cv = COUVERTURE[r.couverture] || COUVERTURE.a_verifier;
              const vd = VERDICTS[r.verdict] || { lbl: r.verdict, cls: "neutral" };
              return `<tr class="clk" data-ref="${esc(r.ref)}">
                <td><input type="checkbox" class="ckVer" data-ref="${esc(r.ref)}" ${r.verifie ? "checked" : ""} onclick="event.stopPropagation()"></td>
                <td><span class="mono" style="font-weight:700;color:var(--terra-deep)">${esc(r.ref)}</span></td>
                <td><span class="tag">${esc(r.theme)}</span></td>
                <td><b style="font-size:12.5px">${esc(r.exig)}</b><div class="muted mono" style="font-size:10px">${esc(r.cdc)}</div></td>
                <td><span class="bdg ${vd.cls}">${vd.lbl}</span></td>
                <td><span class="bdg ${cv.cls}">${cv.lbl}</span></td>
                <td class="muted" style="font-size:11px;max-width:160px">${esc(r.preuve || "—")}${(r.attachments || []).length ? `<span class="tag" style="margin-left:4px;font-size:9px" title="${(r.attachments || []).map((a) => a.name).join(", ")}">${(r.attachments || []).length} PJ</span>` : ""}</td>
              </tr>`;
            })
            .join("") ||
          "<tr><td colspan=7 class='muted'>Aucune ligne</td></tr>";

        body.querySelectorAll(".ckVer").forEach((cb) => {
          cb.onchange = () => {
            const ref = cb.dataset.ref;
            const row = rows.find((x) => x.ref === ref);
            if (row) {
              row.verifie = cb.checked;
              persistRow(row);
              render();
            }
          };
        });
        body.querySelectorAll("tr[data-ref]").forEach((tr) => {
          tr.onclick = () => {
            const row = rows.find((x) => x.ref === tr.dataset.ref);
            if (row) openRowModal(row);
          };
        });

        v.querySelector("#ckThemeChips").innerHTML = THEME_ORDER.filter((t) => rows.some((r) => r.theme === t))
          .map((t) => {
            const n = rows.filter((r) => r.theme === t).length;
            const nv = rows.filter((r) => r.theme === t && !r.verifie).length;
            return `<button type="button" class="tag ${f.theme === t ? "on" : ""}" data-th="${esc(t)}">${esc(t)} (${n}${nv ? " · " + nv + " à faire" : ""})</button>`;
          })
          .join("");
      }

      v.innerHTML =
        pageHead(
          "Analyse · Conformité CDC",
          "Checklist besoins techniques",
          "Vérification des exigences à thème technique/SI du CDC (" +
            (Store.get("gaps") || []).filter((g) => TECH_THEMES.has(g.theme)).length +
            " sur " +
            (Store.get("gaps") || []).length +
            " exigences de la matrice) — architecture, données, interop, sécurité, performance, IA, conformité, UX, legacy.",
          `<button class="btn ghost" id="ckExport">${svgI('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>')} Export CSV</button>
           <button class="btn ghost" onclick="App.go('ecart')">${svgI(ICON.ecart)} Matrice complète</button>`
        ) +
        `<div class="kpis" id="ckKpis" style="margin-bottom:16px;grid-template-columns:repeat(auto-fit,minmax(160px,1fr))"></div>
        <div class="fbar">
          <input class="search" id="ckQ" placeholder="Rechercher réf., exigence, § CDC…">
          <select class="fselect" id="ckCouvF"><option value="all">Toutes couvertures</option>${Object.keys(COUVERTURE).map((k) => `<option value="${k}">${COUVERTURE[k].lbl}</option>`).join("")}</select>
          <label class="tag" style="cursor:pointer"><input type="checkbox" id="ckTodo" style="margin-right:6px"> À vérifier seulement</label>
        </div>
        <div class="chiprow" id="ckThemeChips" style="margin-bottom:12px;flex-wrap:wrap"></div>
        <div class="card"><div class="gantt"><table class="tbl"><thead><tr>
          <th style="width:36px">✓</th><th>Réf.</th><th>Thème</th><th>Exigence CDC</th><th>Verdict audit</th><th>Couverture</th><th>Preuve</th>
        </tr></thead><tbody id="ckBody"></tbody></table></div></div>
        <div class="note slate" style="margin-top:14px;font-size:12px">
          <b>Légende :</b> la checklist reprend les lignes techniques de la matrice d'écart (G-01 à G-45 + G-46–48).
          Verdict audit = constat mission ; couverture = appréciation technique (conforme / partiel / non / N/A).
          Cochez chaque point après vérification (entretien, Data Room, démo, document).
        </div>`;

      v.querySelector("#ckQ").oninput = (e) => {
        f.q = e.target.value;
        render();
      };
      v.querySelector("#ckCouvF").onchange = (e) => {
        f.couv = e.target.value;
        render();
      };
      v.querySelector("#ckTodo").onchange = (e) => {
        f.onlyTodo = e.target.checked;
        render();
      };
      v.querySelector("#ckExport").onclick = () => {
        exportCsv(buildRows());
        toast("Export", "CSV téléchargé", "ok");
      };
      v.querySelector("#ckThemeChips").addEventListener("click", (e) => {
        const b = e.target.closest("[data-th]");
        if (!b) return;
        f.theme = f.theme === b.dataset.th ? "all" : b.dataset.th;
        render();
      });

      render();
      return v;
    };
    CRUMB.cdc_tech = "Checklist CDC technique";
  }

  function patchNav() {
    if (!window.NAV) return;
    const inserts = [
      { k: "cdc_tech", lbl: "Checklist CDC tech.", ic: "clipboard" },
      { k: "ecart", lbl: "Matrice d'écart", ic: "ecart" },
      { k: "prognonprog", lbl: "Prog./Non-prog.", ic: "split" },
    ];
    function adminHasKey(key) {
      return (NAV.admin || []).some((s) => (s.items || []).some((i) => i.k === key));
    }
    const sec = NAV.admin && NAV.admin.find((s) => s.sec === "Analyse & restitution");
    if (sec && !adminHasKey("cdc_tech")) {
      sec.items.splice(1, 0, inserts[0]);
    }
    const audSec =
      NAV.auditeur &&
      (NAV.auditeur.find((s) => /analyse/i.test(s.sec || "")) || NAV.auditeur[1]);
    if (audSec && audSec.items) {
      inserts
        .slice()
        .reverse()
        .forEach((insert) => {
          if (!audSec.items.some((i) => i.k === insert.k)) {
            audSec.items.unshift(insert);
          }
        });
    }
  }

  function patchEnterprise() {
    if (!window.PortiaEnterprise || !App.allowed) return;
    const orig = App.allowed.bind(App);
    App.allowed = function (k) {
      if (k === "cdc_tech") {
        if (App.user && (App.user.role === "cabinet" || App.user.serverRole === "cabinet")) {
          return false;
        }
        if (
          App.user &&
          (App.user.serverRole === "auditeur_b" || App.user.serverRole === "auditeur_t")
        ) {
          return true;
        }
        return orig(k);
      }
      return orig(k);
    };
  }

  function patchNavConnect() {
    if (window.PortiaNav && PortiaNav.GRAPH) {
      PortiaNav.GRAPH.cdc_tech = [
        { k: "ecart", l: "Matrice d'écart" },
        { k: "qualdata", l: "Qualité données" },
        { k: "flux", l: "Flux données" },
        { k: "voletb", l: "Volet B" },
        { k: "dataroom", l: "Data Room" },
      ];
    }
  }

  function init() {
    registerView();
    patchNav();
    patchEnterprise();
    patchNavConnect();
  }

  window.PortiaCdcChecklist = {
    TECH_THEMES,
    buildRows,
    exportCsv,
    init,
  };

  if (typeof VIEWS !== "undefined") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
