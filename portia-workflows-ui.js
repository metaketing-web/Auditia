/**
 * UI workflows validation, pièces jointes COPIL / PV, alertes cockpit collecte
 */
(function () {
  "use strict";

  const WF = {
    brouillon: { lbl: "Brouillon", cls: "neutral", next: "en_revue" },
    en_revue: { lbl: "En revue", cls: "warn", next: "valide" },
    valide: { lbl: "Validé", cls: "ok", next: null },
  };

  function readOnly() {
    return !!(App.user && App.user.readOnly);
  }

  function workflowHtml(cur, entityLabel) {
    const w = WF[cur] || WF.brouillon;
    const nxt = w.next;
    return `<div class="wf-bar" style="margin:16px 0;padding:14px;background:var(--surface-2);border-radius:var(--r-sm);border:1px solid var(--line)">
      <div class="between" style="flex-wrap:wrap;gap:10px;margin-bottom:10px">
        <span class="eyebrow" style="margin:0">Workflow ${esc(entityLabel)}</span>
        <span class="bdg ${w.cls}">${w.lbl}</span>
      </div>
      <div class="chiprow">
        ${Object.keys(WF)
          .map(
            (k) =>
              `<button type="button" class="tag wf-btn ${cur === k ? "on" : ""}" data-wf="${k}" ${readOnly() ? "disabled" : ""}>${WF[k].lbl}</button>`
          )
          .join("")}
        ${
          nxt && !readOnly()
            ? `<button type="button" class="btn dark sm wf-advance" data-wf="${nxt}">Valider → ${WF[nxt].lbl}</button>`
            : ""
        }
      </div>
    </div>`;
  }

  function bindWorkflow(container, coll, id, item, onSave) {
    container.querySelectorAll(".wf-btn, .wf-advance").forEach((btn) => {
      btn.onclick = () => {
        const wf = btn.dataset.wf;
        if (!wf || readOnly()) return;
        const patch = { workflow: wf, workflowBy: App.user.name, workflowAt: new Date().toISOString() };
        Store.patch(coll, id, patch);
        toast("Workflow", WF[wf].lbl + " — " + item.ref, "ok");
        Modal.close();
        onSave && onSave();
        App.refresh();
      };
    });
  }

  function patchOpenConstat() {
    const orig = window.openConstat;
    if (!orig || window._wfConstat) return;
    window.openConstat = function (id) {
      const c = Store.find("constats", id);
      if (!c) return;
      const wf = c.workflow || "brouillon";
      Modal.open(
        `<div class="modal-h"><div class="ic" style="background:${AXES[c.axe].soft};color:${AXES[c.axe].c}">${svgI(ICON.constats)}</div>
        <div style="min-width:0"><div class="eyebrow">${esc(c.ref)} · ${esc(c.struct)}</div><h2 style="font-size:17px">${esc(c.titre)}</h2></div>
        <button class="x" onclick="Modal.close()">${svgI('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div>
        <div class="modal-b">
          ${workflowHtml(wf, "constat")}
          <div class="chiprow" style="margin-bottom:16px">${axeBadge(c.axe)} ${critBadge(c.crit)} ${qualPill(c.qual)} <span class="tag">Triangulation ${triangDots(c.triang)}</span></div>
          ${c.workflowBy ? `<div class="muted" style="font-size:11px;margin-bottom:12px">Dernière action workflow : ${esc(c.workflowBy)} · ${c.workflowAt ? new Date(c.workflowAt).toLocaleString("fr-FR") : ""}</div>` : ""}
          <div class="eyebrow" style="color:var(--terra-deep);font-family:var(--font-mono);font-size:10.5px;letter-spacing:.14em;margin-bottom:7px">CONSTAT</div>
          <p style="font-size:14px;line-height:1.6;color:var(--txt)">${esc(c.desc)}</p>
          ${c.ecart ? `<div class="eyebrow" style="color:var(--terra-deep);font-family:var(--font-mono);font-size:10.5px;letter-spacing:.14em;margin:16px 0 7px">ÉCART / IMPLICATION</div><div class="note terra">${esc(c.ecart)}</div>` : ""}
          <div class="kv" style="margin-top:16px"><span class="k">Sources triangulées</span><span class="v">${(c.sources || []).map((s) => `<span class="tag">${esc(s)}</span>`).join(" ") || "—"}</span></div>
        </div>
        <div class="modal-f"><button class="btn ghost" onclick="Modal.close()">Fermer</button><button class="btn dark" onclick="Modal.close();constatForm('${c.id}')">${svgI('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>')} Modifier</button></div>`
      );
      bindWorkflow(document.querySelector(".modal-b"), "constats", id, c);
    };
    window._wfConstat = true;
  }

  function patchOpenLivrable() {
    const orig = window.openLivrable;
    if (!orig || window._wfLivrable) return;
    window.openLivrable = function (id) {
      orig(id);
      setTimeout(() => {
        const l = Store.find("livrables", id);
        if (!l) return;
        const modalB = document.querySelector(".modal-b");
        if (!modalB || modalB.querySelector(".wf-bar")) return;
        const wf = l.workflow || (l.statut === "valide" ? "valide" : l.statut === "en_cours" ? "en_revue" : "brouillon");
        const div = document.createElement("div");
        div.innerHTML = workflowHtml(wf, "livrable") + (l.workflowBy ? `<div class="muted" style="font-size:11px;margin-bottom:12px">Workflow : ${esc(l.workflowBy)} · ${l.workflowAt ? new Date(l.workflowAt).toLocaleString("fr-FR") : ""}</div>` : "");
        modalB.insertBefore(div.firstChild, modalB.firstChild);
        bindWorkflow(modalB, "livrables", id, l);
      }, 0);
    };
    window._wfLivrable = true;
  }

  function patchOpenGouv() {
    const orig = window.openGouv;
    if (!orig || window._wfGouv) return;
    window.openGouv = function (id) {
      const g = Store.find("gouv", id);
      if (!g) return;
      const t = GOUV_TYPES[g.type];
      const tenu = g.statut === "tenu";
      const att = g.attachments || [];
      const sig = g.signatureCopil || {};
      Modal.open(
        `<div class="modal-h"><div class="ic" style="background:var(--sage-soft);color:var(--sage-deep)">${svgI(ICON.gouv)}</div><div style="min-width:0"><div class="eyebrow">${t.lbl} · ${Store.fmtDate(g.j)}</div><h2 style="font-size:16px">${esc(g.titre)}</h2></div><button class="x" onclick="Modal.close()">${svgI('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div>
        <div class="modal-b">
          <div class="frow"><label>Statut</label><select id="gvStatut" ${readOnly() ? "disabled" : ""}><option value="planifie" ${!tenu ? "selected" : ""}>Planifié</option><option value="tenu" ${tenu ? "selected" : ""}>Tenu</option></select></div>
          ${
            g.type === "lancement" || g.type === "copil"
              ? `<div class="card pad" style="margin:14px 0;background:var(--surface-2)">
            <div class="eyebrow" style="margin-bottom:8px">Charte COPIL & signatures</div>
            <label style="display:flex;gap:8px;align-items:center;font-size:13px;margin-bottom:10px">
              <input type="checkbox" id="gvCharte" ${sig.charteSignee ? "checked" : ""} ${readOnly() ? "disabled" : ""}>
              Charte du COPIL signée
            </label>
            <div class="frow"><label>Signataires (un par ligne)</label><textarea id="gvSign" style="min-height:60px" ${readOnly() ? "disabled" : ""}>${esc((sig.signataires || []).join("\n"))}</textarea></div>
            <div class="frow"><label>Date de signature</label><input type="date" id="gvSigDate" value="${sig.signedAt ? sig.signedAt.slice(0, 10) : ""}" ${readOnly() ? "disabled" : ""}></div>
          </div>`
              : ""
          }
          <div class="frow"><label>Procès-verbal / relevé de décisions</label><textarea id="gvPv" style="min-height:120px" ${readOnly() ? "disabled" : ""}>${esc(g.pv || "")}</textarea></div>
          <div class="frow"><label>Décisions (une par ligne)</label><textarea id="gvDec" style="min-height:70px" ${readOnly() ? "disabled" : ""}>${esc((g.decisions || []).join("\n"))}</textarea></div>
          <div class="frow"><label>Actions & responsables (une par ligne)</label><textarea id="gvAct" style="min-height:70px" ${readOnly() ? "disabled" : ""}>${esc((g.actions || []).join("\n"))}</textarea></div>
          <div class="eyebrow" style="margin:16px 0 8px">Pièces jointes (PV, charte, annexes)</div>
          <div id="gvAttList" class="stack" style="margin-bottom:12px">${att.length ? att.map((a) => `<div class="alert-i"><div class="bd"><b>${esc(a.name)}</b><span class="muted">${esc(a.type || "annexe")} · ${a.uploadedAt ? new Date(a.uploadedAt).toLocaleDateString("fr-FR") : ""}</span></div>${a.fileId ? `<button class="btn ghost sm" onclick="Files.openInTab('${a.fileId}')">Ouvrir</button>` : ""}</div>`).join("") : '<div class="muted" style="font-size:12px">Aucune pièce jointe</div>'}</div>
          ${!readOnly() ? `<div class="frow"><label>Ajouter un fichier</label><input type="file" id="gvFile"><select id="gvAttType" style="margin-top:8px"><option value="pv">PV / relevé</option><option value="charte">Charte COPIL</option><option value="annexe">Annexe</option></select></div>` : ""}
        </div>
        <div class="modal-f"><button class="btn ghost" onclick="Modal.close()">Fermer</button>${!readOnly() ? `<button class="btn terra" id="gvSave">${svgI('<path d="M20 6 9 17l-5-5"/>')} Enregistrer</button>` : ""}</div>`
      );
      const saveBtn = document.getElementById("gvSave");
      if (saveBtn) {
        saveBtn.onclick = async () => {
          const patch = {
            statut: document.getElementById("gvStatut").value,
            pv: document.getElementById("gvPv").value,
            decisions: document.getElementById("gvDec").value.split("\n").map((s) => s.trim()).filter(Boolean),
            actions: document.getElementById("gvAct").value.split("\n").map((s) => s.trim()).filter(Boolean),
            attachments: att.slice(),
          };
          const ch = document.getElementById("gvCharte");
          if (ch) {
            patch.signatureCopil = {
              charteSignee: ch.checked,
              signataires: document.getElementById("gvSign").value.split("\n").map((s) => s.trim()).filter(Boolean),
              signedAt: document.getElementById("gvSigDate").value
                ? document.getElementById("gvSigDate").value + "T12:00:00"
                : null,
            };
          }
          const fileIn = document.getElementById("gvFile");
          if (fileIn && fileIn.files && fileIn.files[0]) {
            const file = fileIn.files[0];
            const fid = "gv_" + id + "_" + Date.now();
            const putRes = await Files.put(fid, file, { name: file.name, gouvId: id });
            if (putRes !== false && putRes !== null) {
              patch.attachments.push({
                id: uid("att"),
                name: file.name,
                type: document.getElementById("gvAttType").value,
                fileId: fid,
                uploadedAt: new Date().toISOString(),
                uploadedBy: App.user ? App.user.name : "",
              });
            }
          }
          Store.patch("gouv", id, patch);
          Modal.close();
          toast("Instance mise à jour", "", "ok");
          App.refresh();
        };
      }
    };
    window._wfGouv = true;
  }

  function patchConstatsList() {
    if (window._wfConstatsList) return;
    const origRender = null;
    window._wfConstatsList = true;
    const origConstats = VIEWS.constats;
    const origConsaud = VIEWS.consaud;
    function wrapConstatsView(fn) {
      return function () {
        const v = fn();
        const list = v.querySelector("#csList");
        if (!list) return v;
        const obs = new MutationObserver(() => {
          list.querySelectorAll(".card.clk").forEach((card) => {
            const on = card.getAttribute("onclick") || "";
            const m = on.match(/openConstat\('([^']+)'\)/);
            if (!m || card.querySelector(".wf-mini")) return;
            const c = Store.find("constats", m[1]);
            if (!c) return;
            const w = WF[c.workflow || "brouillon"] || WF.brouillon;
            const sp = document.createElement("span");
            sp.className = "bdg " + w.cls + " wf-mini";
            sp.style.cssText = "font-size:9px;margin-left:6px";
            sp.textContent = w.lbl;
            const between = card.querySelector(".between");
            if (between) between.appendChild(sp);
          });
        });
        obs.observe(list, { childList: true, subtree: true });
        return v;
      };
    }
    if (origConstats) VIEWS.constats = wrapConstatsView(origConstats);
    if (origConsaud) VIEWS.consaud = wrapConstatsView(origConsaud);
  }

  function patchCockpit() {
    const orig = VIEWS.cockpit;
    if (!orig || VIEWS._cockpitWf) return;
    VIEWS.cockpit = function () {
      const v = orig();
      const lacunes =
        window.PortiaCollecte && PortiaCollecte.getLacunes
          ? PortiaCollecte.getLacunes().filter((l) => l.statut !== "couvert")
          : [];
      const wfBrouillon = Store.get("constats").filter((c) => (c.workflow || "brouillon") === "brouillon").length;
      const wfRevue = Store.get("constats").filter((c) => c.workflow === "en_revue").length;
      const alertsBox = v.querySelector(".col.card .card-h + div");
      if (lacunes.length && alertsBox) {
        const extra = document.createElement("div");
        extra.className = "alert-i clk";
        extra.style.cursor = "pointer";
        extra.innerHTML = `<div class="ic" style="background:var(--gold-soft);color:#7a5a14">${svgI(ICON.conduct)}</div><div class="bd"><b>Collecte — ${lacunes.length} lacune(s)</b><span>Questionnaires / grilles à compléter</span></div><div class="tm">Collecte</div>`;
        extra.onclick = () => App.go("lacunes");
        alertsBox.insertBefore(extra, alertsBox.firstChild);
      }
      if (wfRevue > 0 && alertsBox) {
        const extra = document.createElement("div");
        extra.className = "alert-i clk";
        extra.style.cursor = "pointer";
        extra.innerHTML = `<div class="ic" style="background:var(--slate-soft);color:var(--info)">${svgI(ICON.constats)}</div><div class="bd"><b>${wfRevue} constat(s) en revue</b><span>${wfBrouillon} brouillon(s) — validation workflow</span></div><div class="tm">Workflow</div>`;
        extra.onclick = () => App.go("constats");
        alertsBox.insertBefore(extra, alertsBox.firstChild);
      }
      return v;
    };
    VIEWS._cockpitWf = true;
  }

  function patchLivrablesCards() {
    const orig = VIEWS.livrables;
    if (!orig || VIEWS._livWf) return;
    VIEWS.livrables = function () {
      const v = orig();
      v.querySelectorAll(".card.clk").forEach((card) => {
        const onclick = card.getAttribute("onclick");
        const m = onclick && onclick.match(/openLivrable\('([^']+)'\)/);
        if (!m) return;
        const l = Store.find("livrables", m[1]);
        if (!l) return;
        const wf = l.workflow || "brouillon";
        const w = WF[wf] || WF.brouillon;
        const badge = document.createElement("span");
        badge.className = "bdg " + w.cls;
        badge.style.cssText = "position:absolute;top:12px;right:12px;font-size:9px";
        badge.textContent = w.lbl;
        const inner = card.querySelector(".card-b");
        if (inner) {
          inner.style.position = "relative";
          inner.appendChild(badge);
        }
      });
      return v;
    };
    VIEWS._livWf = true;
  }

  function init() {
    patchOpenConstat();
    patchOpenLivrable();
    patchOpenGouv();
    patchCockpit();
    patchLivrablesCards();
    patchConstatsList();
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      setTimeout(init, 0);
    }
  }

  window.PortiaWorkflows = { WF, init };
})();
