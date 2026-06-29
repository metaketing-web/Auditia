/**
 * Flux entre pôles — création / édition ecoLinks + synchro vue Flux données
 */
(function () {
  "use strict";

  const FLOW_MODES = {
    critique: { lbl: "Flux critique / absent", color: "#e05252" },
    auto: { lbl: "Automatisé / API", color: "#e8c547" },
    manuel: { lbl: "Manuel / batch", color: "#c8cdd8" },
  };

  const FLOW_STATUTS = {
    actif: { lbl: "Actif", cls: "ok" },
    planifie: { lbl: "Planifié", cls: "info" },
    absent: { lbl: "Absent", cls: "crit" },
  };

  function linkTypes() {
    return window.ECO_LINK_TYPES || {};
  }

  function canEditFlux() {
    const u = window.App && App.user;
    return u && !u.readOnly;
  }

  function userLabel() {
    return ((window.App && App.user) || {}).name || "Équipe";
  }

  function allPoles() {
    const cols = window.ECO_COLUMNS || (typeof ECO_COLUMNS !== "undefined" ? ECO_COLUMNS : []);
    return cols.flatMap((c) =>
      (c.nodes || []).map((n) => ({
        id: n.id,
        n: n.n,
        col: c.title || c.key,
      }))
    );
  }

  function nodeName(id) {
    const p = allPoles().find((x) => x.id === id);
    return p ? p.n : id;
  }

  function ensureEcoLinks() {
    if (!window.Store || !Store.state) return [];
    if (!Array.isArray(Store.state.ecoLinks)) Store.state.ecoLinks = [];
    if (!Store.state.ecoLinks.length && window.ECO_LINKS && ECO_LINKS.length) {
      Store.state.ecoLinks = JSON.parse(JSON.stringify(ECO_LINKS));
      syncDataFlowsFromEco();
      Store.save();
      if (window.portiaApi && portiaApi.saveState) portiaApi.saveState().catch(() => {});
    }
    return Store.state.ecoLinks;
  }

  function getLinks() {
    const links = ensureEcoLinks();
    if (links.length) return links;
    return window.ECO_LINKS || [];
  }

  function inferFlowMode(lk) {
    if (window.PortiaCartoGraph && PortiaCartoGraph.edgeMode) {
      return PortiaCartoGraph.edgeMode(Object.assign({}, lk, { flowMode: null }));
    }
    const lbl = (lk.label || "").toLowerCase();
    if (lbl.includes("absent") || lbl.includes("non branch") || lbl.includes("non partag")) return "critique";
    if (lk.type === "integration" && lbl.includes("api")) return "auto";
    if (lbl.includes("api") || lbl.includes("batch sécurisé") || lbl.includes("sigfip")) return "auto";
    return "manuel";
  }

  function flowModeLbl(lk) {
    const m = lk.flowMode || inferFlowMode(lk);
    return (FLOW_MODES[m] && FLOW_MODES[m].lbl) || m;
  }

  function protocolFor(lk) {
    if (lk.protocol) return lk.protocol;
    const m = lk.flowMode || inferFlowMode(lk);
    if (m === "auto") return "API / intégration";
    if (m === "critique") return "Non établi";
    return "Excel / e-mail / batch";
  }

  function statutFor(lk) {
    if (lk.statut && FLOW_STATUTS[lk.statut]) return lk.statut;
    const m = lk.flowMode || inferFlowMode(lk);
    if (m === "critique") return "absent";
    if (m === "auto") return "actif";
    return "planifie";
  }

  function syncDataFlowsFromEco() {
    if (!window.Store || !Store.state) return;
    const links = getLinks();
    Store.state.dataFlows = links.map((lk) => ({
      id: "df_" + lk.id,
      ecoLinkId: lk.id,
      from: nodeName(lk.from),
      to: nodeName(lk.to),
      fromId: lk.from,
      toId: lk.to,
      type: lk.type || "data",
      protocol: protocolFor(lk),
      pii: !!lk.pii,
      statut: statutFor(lk),
      critique: (lk.flowMode || inferFlowMode(lk)) === "critique",
      label: lk.label || "",
    }));
  }

  async function saveState() {
    syncDataFlowsFromEco();
    if (window.portiaApi && portiaApi.saveState) await portiaApi.saveState();
    else Store.save();
  }

  function poleOptions(selected) {
    const poles = allPoles();
    const groups = {};
    poles.forEach((p) => {
      if (!groups[p.col]) groups[p.col] = [];
      groups[p.col].push(p);
    });
    return Object.keys(groups)
      .map((col) => {
        const opts = groups[col]
          .map((p) => `<option value="${p.id}" ${selected === p.id ? "selected" : ""}>${esc(p.n)}</option>`)
          .join("");
        return `<optgroup label="${esc(col)}">${opts}</optgroup>`;
      })
      .join("");
  }

  function linkForm(id) {
    if (!canEditFlux()) {
      toast("Accès refusé", "Profil lecture seule", "err");
      return;
    }
    ensureEcoLinks();
    const lk = getLinks().find((x) => x.id === id);
    if (!lk) return;

    const types = linkTypes();
    const typeOpts = Object.keys(types).map(
      (k) => `<option value="${k}" ${lk.type === k ? "selected" : ""}>${esc(types[k].lbl || k)}</option>`
    );
    const modeOpts =
      `<option value="">Auto (déduit du libellé)</option>` +
      Object.keys(FLOW_MODES).map(
        (k) => `<option value="${k}" ${lk.flowMode === k ? "selected" : ""}>${FLOW_MODES[k].lbl}</option>`
      );
    const stOpts = Object.keys(FLOW_STATUTS).map(
      (k) => `<option value="${k}" ${statutFor(lk) === k ? "selected" : ""}>${FLOW_STATUTS[k].lbl}</option>`
    );

    Modal.open(
      `<div class="modal-h"><div class="ic" style="background:var(--slate-soft);color:var(--info)">${typeof svgI === "function" ? svgI(ICON.eco) : ""}</div>
        <div><div class="eyebrow">Flux · ${esc(lk.id)}</div><h2 style="font-size:16px">Modifier le lien</h2></div>
        <button class="x" onclick="Modal.close()">${typeof svgI === "function" ? svgI('<path d="M18 6 6 18M6 6l12 12"/>') : "×"}</button></div>
      <div class="modal-b">
        <div class="note slate" style="font-size:12px;margin-bottom:14px">Les types <b>critique / API / manuel</b> alimentent les filtres de la cartographie interactive. La vue <b>Flux données</b> est synchronisée automatiquement.</div>
        <div class="f2">
          <div class="frow"><label>Pôle source <span class="req">*</span></label><select id="lfFrom">${poleOptions(lk.from)}</select></div>
          <div class="frow"><label>Pôle cible <span class="req">*</span></label><select id="lfTo">${poleOptions(lk.to)}</select></div>
        </div>
        <div class="f2">
          <div class="frow"><label>Type d'interaction</label><select id="lfType">${typeOpts}</select></div>
          <div class="frow"><label>Mode flux (carto)</label><select id="lfMode">${modeOpts}</select></div>
        </div>
        <div class="frow"><label>Description du flux <span class="req">*</span></label><textarea id="lfLabel" style="min-height:64px" placeholder="Ex. Consolidation indicateurs (Excel), API SIGFIP, raccordement absent…">${esc(lk.label || "")}</textarea></div>
        <div class="f2">
          <div class="frow"><label>Protocole / canal</label><input id="lfProto" value="${esc(lk.protocol || "")}" placeholder="Auto si vide"></div>
          <div class="frow"><label>Statut (vue Flux)</label><select id="lfStatut">${stOpts}</select></div>
        </div>
        <label style="display:flex;gap:8px;font-size:13px;margin-top:8px"><input type="checkbox" id="lfPii" ${lk.pii ? "checked" : ""}> Données personnelles (PII)</label>
      </div>
      <div class="modal-f">
        <button class="btn ghost" style="margin-right:auto;color:var(--crit)" id="lfDel">Supprimer</button>
        <button class="btn ghost" onclick="Modal.close()">Annuler</button>
        <button class="btn terra" id="lfSave">Enregistrer</button>
      </div>`,
      true
    );

    document.getElementById("lfDel").onclick = () => {
      if (!confirm("Supprimer ce flux entre " + nodeName(lk.from) + " et " + nodeName(lk.to) + " ?")) return;
      Store.state.ecoLinks = (Store.state.ecoLinks || []).filter((x) => x.id !== id);
      saveState().then(() => {
        Modal.close();
        toast("Flux supprimé", lk.id, "ok");
        if (App.refresh) App.refresh();
      });
    };

    document.getElementById("lfSave").onclick = async () => {
      const from = document.getElementById("lfFrom").value;
      const to = document.getElementById("lfTo").value;
      const label = document.getElementById("lfLabel").value.trim();
      if (!from || !to || from === to) {
        toast("Erreur", "Choisissez deux pôles distincts", "err");
        return;
      }
      if (!label) {
        toast("Description requise", "", "err");
        return;
      }
      lk.from = from;
      lk.to = to;
      lk.type = document.getElementById("lfType").value;
      lk.label = label;
      const mode = document.getElementById("lfMode").value;
      if (mode) lk.flowMode = mode;
      else delete lk.flowMode;
      lk.protocol = document.getElementById("lfProto").value.trim();
      lk.statut = document.getElementById("lfStatut").value;
      lk.pii = document.getElementById("lfPii").checked;
      lk.updated = new Date().toISOString();
      lk.updatedBy = userLabel();

      const btn = document.getElementById("lfSave");
      btn.disabled = true;
      try {
        await saveState();
        Modal.close();
        toast("Flux enregistré", nodeName(from) + " → " + nodeName(to), "ok");
        if (App.refresh) App.refresh();
      } catch (e) {
        toast("Erreur", (e && e.message) || "", "err");
        btn.disabled = false;
      }
    };
  }

  function createLinkForm() {
    if (!canEditFlux()) {
      toast("Accès refusé", "Profil lecture seule", "err");
      return;
    }
    ensureEcoLinks();
    const draft = { type: "data", flowMode: "", statut: "planifie" };
    const types = linkTypes();
    const typeOpts = Object.keys(types).map((k) => `<option value="${k}">${esc(types[k].lbl || k)}</option>`);
    const modeOpts =
      `<option value="">Auto (déduit du libellé)</option>` +
      Object.keys(FLOW_MODES).map((k) => `<option value="${k}">${FLOW_MODES[k].lbl}</option>`);
    const stOpts = Object.keys(FLOW_STATUTS).map((k) => `<option value="${k}">${FLOW_STATUTS[k].lbl}</option>`);

    Modal.open(
      `<div class="modal-h"><h2>Nouveau flux entre pôles</h2><button class="x" onclick="Modal.close()">${typeof svgI === "function" ? svgI('<path d="M18 6 6 18M6 6l12 12"/>') : "×"}</button></div>
      <div class="modal-b">
        <div class="note sage" style="font-size:12px;margin-bottom:14px"><b>Astuce :</b> pour un flux <em>critique / absent</em>, utilisez des mots-clés (« absent », « non branché », « non partagé ») ou sélectionnez le mode explicitement.</div>
        <div class="f2">
          <div class="frow"><label>Pôle source <span class="req">*</span></label><select id="cfFrom">${poleOptions("")}</select></div>
          <div class="frow"><label>Pôle cible <span class="req">*</span></label><select id="cfTo">${poleOptions("")}</select></div>
        </div>
        <div class="f2">
          <div class="frow"><label>Type</label><select id="cfType">${typeOpts}</select></div>
          <div class="frow"><label>Mode flux</label><select id="cfMode">${modeOpts}</select></div>
        </div>
        <div class="frow"><label>Description <span class="req">*</span></label><textarea id="cfLabel" style="min-height:64px" placeholder="Décrivez le flux observé ou cible…"></textarea></div>
        <div class="f2">
          <div class="frow"><label>Protocole</label><input id="cfProto" placeholder="Ex. API REST, SFTP, Excel"></div>
          <div class="frow"><label>Statut</label><select id="cfStatut">${stOpts}</select></div>
        </div>
        <label style="display:flex;gap:8px;font-size:13px"><input type="checkbox" id="cfPii"> Données personnelles (PII)</label>
      </div>
      <div class="modal-f"><button class="btn ghost" onclick="Modal.close()">Annuler</button><button class="btn terra" id="cfSave">Créer le flux</button></div>`,
      true
    );

    document.getElementById("cfSave").onclick = async () => {
      const from = document.getElementById("cfFrom").value;
      const to = document.getElementById("cfTo").value;
      const label = document.getElementById("cfLabel").value.trim();
      if (!from || !to || from === to) {
        toast("Erreur", "Choisissez deux pôles distincts", "err");
        return;
      }
      if (!label) {
        toast("Description requise", "", "err");
        return;
      }
      const n = (Store.state.ecoLinks || []).length + 1;
      const lk = {
        id: "lk" + n + "_" + Date.now().toString(36).slice(-4),
        from,
        to,
        type: document.getElementById("cfType").value,
        label,
        protocol: document.getElementById("cfProto").value.trim(),
        statut: document.getElementById("cfStatut").value,
        pii: document.getElementById("cfPii").checked,
        updated: new Date().toISOString(),
        updatedBy: userLabel(),
      };
      const mode = document.getElementById("cfMode").value;
      if (mode) lk.flowMode = mode;

      if (!Store.state.ecoLinks) Store.state.ecoLinks = [];
      Store.state.ecoLinks.push(lk);

      const btn = document.getElementById("cfSave");
      btn.disabled = true;
      try {
        await saveState();
        Modal.close();
        toast("Flux créé", nodeName(from) + " → " + nodeName(to), "ok");
        if (App.refresh) App.refresh();
      } catch (e) {
        toast("Erreur", (e && e.message) || "", "err");
        btn.disabled = false;
      }
    };
  }

  function managerModal() {
    ensureEcoLinks();
    const links = getLinks();
    const rows = links
      .map((lk) => {
        const mode = lk.flowMode || inferFlowMode(lk);
        const fm = FLOW_MODES[mode] || { lbl: mode, color: "#999" };
        const st = FLOW_STATUTS[statutFor(lk)] || { lbl: statutFor(lk), cls: "neutral" };
        return `<tr class="clk" data-lid="${esc(lk.id)}">
          <td class="mono" style="font-size:11px">${esc(lk.id)}</td>
          <td><b>${esc(nodeName(lk.from))}</b> → <b>${esc(nodeName(lk.to))}</b><div class="muted" style="font-size:11px">${esc(lk.label || "")}</div></td>
          <td><span style="color:${fm.color}">●</span> <span style="font-size:11px">${esc(fm.lbl)}</span></td>
          <td><span class="bdg ${st.cls}" style="font-size:10px">${st.lbl}</span></td>
          <td>${canEditFlux() ? `<button type="button" class="btn ghost sm" data-edit="${esc(lk.id)}">Modifier</button>` : ""}</td>
        </tr>`;
      })
      .join("");

    Modal.open(
      `<div class="modal-h"><h2>Registre des flux (${links.length})</h2><button class="x" onclick="Modal.close()">${typeof svgI === "function" ? svgI('<path d="M18 6 6 18M6 6l12 12"/>') : "×"}</button></div>
      <div class="modal-b">
        <div class="chiprow" style="margin-bottom:12px">
          ${Object.keys(FLOW_MODES)
            .map(
              (k) =>
                `<span class="tag"><span style="display:inline-block;width:12px;height:3px;background:${FLOW_MODES[k].color};vertical-align:middle;margin-right:4px"></span>${FLOW_MODES[k].lbl}</span>`
            )
            .join("")}
        </div>
        <table class="tbl"><thead><tr><th>Id</th><th>Pôles & description</th><th>Mode carto</th><th>Statut</th><th></th></tr></thead>
        <tbody>${rows || "<tr><td colspan=5>Aucun flux</td></tr>"}</tbody></table>
      </div>
      <div class="modal-f">
        ${canEditFlux() ? `<button class="btn terra" id="mgrNew" style="margin-right:auto">Nouveau flux</button>` : ""}
        <button class="btn ghost" onclick="Modal.close()">Fermer</button>
      </div>`,
      true
    );

    document.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        Modal.close();
        linkForm(btn.getAttribute("data-edit"));
      };
    });
    document.querySelectorAll("tr[data-lid]").forEach((tr) => {
      tr.onclick = () => {
        if (!canEditFlux()) return;
        Modal.close();
        linkForm(tr.getAttribute("data-lid"));
      };
    });
    const nw = document.getElementById("mgrNew");
    if (nw) nw.onclick = () => {
      Modal.close();
      createLinkForm();
    };
  }

  function patchFluxView() {
    if (!window.VIEWS || VIEWS._fluxEdit) return;
    const orig = VIEWS.flux;
    if (!orig) return;
    VIEWS.flux = function () {
      ensureEcoLinks();
      syncDataFlowsFromEco();
      const v = orig();
      setTimeout(() => {
        const head = v.querySelector(".page-head .actions");
        if (head && !head.querySelector("#btnFluxMgr")) {
          const btn = el("button", { class: "btn ghost", id: "btnFluxMgr", type: "button" });
          btn.textContent = "Registre des flux";
          btn.onclick = () => managerModal();
          head.appendChild(btn);
          if (canEditFlux()) {
            const add = el("button", { class: "btn terra", id: "btnFluxNew", type: "button" });
            add.innerHTML = `${typeof svgI === "function" ? svgI(ICON.eco) : "+"} Nouveau flux`;
            add.onclick = () => createLinkForm();
            head.insertBefore(add, head.firstChild);
          }
        }
        const grid = v.querySelector("#fluxGrid");
        if (grid && !grid.children.length) {
          grid.innerHTML = `<div class="note slate" style="grid-column:1/-1">Aucun flux affiché — ouvrez <b>Registre des flux</b> ou créez un lien depuis la <button type="button" class="btn ghost sm" onclick="App.go('carto_graph')">Cartographie interactive</button>.</div>`;
        }
      }, 0);
      return v;
    };
    VIEWS._fluxEdit = true;
  }

  function init() {
    if (window._fluxEditInit) return;
    window._fluxEditInit = true;
    ensureEcoLinks();
    window.PortiaFluxEdit = {
      canEditFlux,
      linkForm,
      createLinkForm,
      managerModal,
      ensureEcoLinks,
      syncDataFlowsFromEco,
      flowModeLbl,
    };
    patchFluxView();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(init, 400));
  } else {
    setTimeout(init, 400);
  }
})();
