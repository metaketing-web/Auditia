/**
 * Pièces jointes sur les Constats & triangulation (photo, PDF, Word, etc.)
 */
(function () {
  "use strict";
  if (!window.Store || !window.Modal) return;

  const ACCEPT =
    ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp,.heic,.heif";
  const CLIP =
    '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>';

  let formDraft = null;

  function isReadOnly() {
    return !!(window.App && App.user && App.user.readOnly);
  }

  function attIdFor(constatId) {
    const base = String(constatId || "c")
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 12);
    const tail =
      typeof uid === "function"
        ? uid("ca").slice(-8)
        : Date.now().toString(36).slice(-6);
    return "ca_" + base + "_" + tail;
  }

  function openAttachment(att) {
    const fid = att.fileId || att.id;
    if (!fid) return;
    if (window.Files && Files.openDocument) {
      Files.openDocument({ id: fid, fileId: fid, name: att.name });
    } else if (window.Files && Files.openInTab) {
      Files.openInTab(fid);
    }
  }

  async function downloadAttachment(att) {
    if (window.Files && Files.downloadDocument) {
      await Files.downloadDocument({
        id: att.fileId || att.id,
        fileId: att.fileId || att.id,
        name: att.name,
      });
    }
  }

  async function uploadToDraft(file) {
    if (!formDraft || !file || !window.Files || !Files.put) {
      toast("Pièce jointe", "Upload indisponible sur ce poste", "err");
      return false;
    }
    const id = attIdFor(formDraft.id);
    toast("Envoi…", file.name, "info");
    try {
      const res = await Files.put(id, file, {
        name: file.name,
        mime: file.type || "application/octet-stream",
        entity: "constat",
        constatId: formDraft.id,
      });
      if (!res || res.ok === false) throw new Error("Échec de l'enregistrement");
      const fileId = (res && (res.fileId || res.id)) || id;
      const by =
        window.App && App.user
          ? App.user.name || App.user.email || ""
          : "";
      formDraft.attachments.push({
        id: id,
        fileId: fileId,
        name: file.name,
        mime: file.type || "application/octet-stream",
        at: new Date().toISOString(),
        by: by || undefined,
      });
      toast("Pièce jointe", file.name + " ajoutée", "ok");
      return true;
    } catch (e) {
      toast("Échec envoi", e.message || String(e), "err");
      return false;
    }
  }

  function renderFormAttList() {
    const box = document.getElementById("cfAttList");
    if (!box || !formDraft) return;
    const atts = formDraft.attachments || [];
    if (!atts.length) {
      box.innerHTML =
        '<div class="muted" style="font-size:12px">Aucune pièce jointe — photo, capture d\'écran, PDF, Word, etc.</div>';
      return;
    }
    box.innerHTML = atts
      .map(
        (a, i) =>
          `<div class="ck-att-item">
            <span style="color:var(--terra-deep);flex:none;width:16px;height:16px">${svgI(CLIP)}</span>
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
          formDraft.attachments.splice(i, 1);
          renderFormAttList();
        }
      };
    });
  }

  function wireFormAttInputs() {
    const inp = document.getElementById("cfAttInput");
    const cam = document.getElementById("cfAttCam");
    const btnFile = document.getElementById("cfAttFile");
    const btnPhoto = document.getElementById("cfAttPhoto");
    if (btnFile && inp) btnFile.onclick = () => inp.click();
    if (btnPhoto && cam) btnPhoto.onclick = () => cam.click();
    async function onPick(e) {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!f) return;
      const ok = await uploadToDraft(f);
      if (ok) renderFormAttList();
    }
    if (inp) inp.onchange = onPick;
    if (cam) cam.onchange = onPick;
  }

  function attFormBlock() {
    if (isReadOnly()) return "";
    return `
      <div class="frow" style="margin-top:4px">
        <label>Pièces jointes</label>
        <div class="ck-att-list" id="cfAttList"></div>
        <div class="chiprow" style="margin-top:8px">
          <button type="button" class="btn ghost sm" id="cfAttFile">${svgI(CLIP)} Fichier</button>
          <button type="button" class="btn ghost sm" id="cfAttPhoto">${svgI('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>')} Photo</button>
        </div>
        <input type="file" id="cfAttInput" accept="${ACCEPT}" style="display:none">
        <input type="file" id="cfAttCam" accept="image/*" capture="environment" style="display:none">
        <div class="muted" style="font-size:11px;margin-top:6px">PDF, Word, Excel, images — preuves, captures, documents sources.</div>
      </div>`;
  }

  function attViewBlock(atts) {
    if (!atts.length) {
      return `<div class="eyebrow" style="color:var(--terra-deep);font-family:var(--font-mono);font-size:10.5px;letter-spacing:.14em;margin:16px 0 7px">PIÈCES JOINTES</div>
        <p class="muted" style="font-size:12px">Aucune pièce jointe sur ce constat.</p>`;
    }
    const items = atts
      .map(
        (a, i) =>
          `<div class="ck-att-item">
            <span style="color:var(--terra-deep);flex:none;width:16px;height:16px">${svgI(CLIP)}</span>
            <span class="nm" title="${esc(a.name)}">${esc(a.name)}</span>
            <button type="button" class="btn ghost sm" data-cf-view="${i}">Voir</button>
            <button type="button" class="btn ghost sm" data-cf-dl="${i}">Télécharger</button>
          </div>`
      )
      .join("");
    return `<div class="eyebrow" style="color:var(--terra-deep);font-family:var(--font-mono);font-size:10.5px;letter-spacing:.14em;margin:16px 0 7px">PIÈCES JOINTES (${atts.length})</div>
      <div class="ck-att-list">${items}</div>`;
  }

  function wireViewAttButtons(atts) {
    document.querySelectorAll("[data-cf-view]").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const a = atts[parseInt(btn.dataset.cfView, 10)];
        if (a) openAttachment(a);
      };
    });
    document.querySelectorAll("[data-cf-dl]").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const a = atts[parseInt(btn.dataset.cfDl, 10)];
        if (a) downloadAttachment(a);
      };
    });
  }

  function openConstat(id) {
    const c = Store.find("constats", id);
    if (!c) return;
    const atts = c.attachments || [];
    const ro = isReadOnly();
    Modal.open(
      `<div class="modal-h"><div class="ic" style="background:${AXES[c.axe].soft};color:${AXES[c.axe].c}">${svgI(ICON.constats)}</div>
    <div style="min-width:0"><div class="eyebrow">${esc(c.ref)} · ${esc(c.struct)}</div><h2 style="font-size:17px">${esc(c.titre)}</h2></div>
    <button class="x" onclick="Modal.close()">${svgI('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div>
    <div class="modal-b">
      <div class="chiprow" style="margin-bottom:16px">${axeBadge(c.axe)} ${critBadge(c.crit)} ${qualPill(c.qual)} <span class="tag">Triangulation ${triangDots(c.triang)}</span>${atts.length ? ` <span class="tag">${atts.length} PJ</span>` : ""}</div>
      <div class="eyebrow" style="color:var(--terra-deep);font-family:var(--font-mono);font-size:10.5px;letter-spacing:.14em;margin-bottom:7px">CONSTAT</div>
      <p style="font-size:14px;line-height:1.6;color:var(--txt)">${esc(c.desc)}</p>
      ${c.ecart ? `<div class="eyebrow" style="color:var(--terra-deep);font-family:var(--font-mono);font-size:10.5px;letter-spacing:.14em;margin:16px 0 7px">ÉCART / IMPLICATION</div><div class="note terra">${esc(c.ecart)}</div>` : ""}
      ${attViewBlock(atts)}
      <div class="kv" style="margin-top:16px"><span class="k">Sources triangulées</span><span class="v">${(c.sources || []).map((s) => `<span class="tag">${esc(s)}</span>`).join(" ") || "—"}</span></div>
      <div class="kv"><span class="k">Dernière mise à jour</span><span class="v">${c.updated ? new Date(c.updated).toLocaleString("fr-FR") : "—"}</span></div>
    </div>
    <div class="modal-f">${typeof PortiaExport !== "undefined" ? `<button class="btn ghost" onclick="PortiaExport.pick('constat','${c.id}')">${svgI('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>')} Exporter</button>` : ""}<button class="btn ghost" onclick="Modal.close()">Fermer</button>${ro ? "" : `<button class="btn dark" onclick="constatForm('${c.id}')">${svgI('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>')} Modifier</button>`}</div>`
    );
    wireViewAttButtons(atts);
  }

  function constatForm(id) {
    if (isReadOnly()) {
      toast("Lecture seule", "Modification non autorisée", "warn");
      return;
    }
    const c = id ? Store.find("constats", id) : null;
    const next =
      "C-" + String(Store.get("constats").length + 1).padStart(2, "0");
    const sources = Store.get("entretiens")
      .map((e) => e.struct)
      .filter((x, i, a) => a.indexOf(x) === i);
    const draftId = c ? c.id : uid("c");
    formDraft = {
      id: draftId,
      attachments: c
        ? JSON.parse(JSON.stringify(c.attachments || []))
        : [],
    };
    Modal.open(
      `<div class="modal-h"><div class="ic" style="background:var(--terra-soft);color:var(--terra-deep)">${svgI(ICON.constats)}</div><div><div class="eyebrow">${c ? "Modifier le constat" : "Nouveau constat"}</div><h2>${c ? esc(c.ref) : next}</h2></div><button class="x" onclick="Modal.close()">${svgI('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div>
    <div class="modal-b">
      <div class="frow"><label>Intitulé du constat <span class="req">*</span></label><input id="cfTitre" value="${c ? esc(c.titre) : ""}" placeholder="Ex. Absence d'identifiant unique du bénéficiaire"></div>
      <div class="f3">
        <div class="frow"><label>Axe</label><select id="cfAxe">${Object.keys(AXES)
          .map(
            (a) =>
              `<option ${c && c.axe === a ? "selected" : ""}>${a}</option>`
          )
          .join("")}</select></div>
        <div class="frow"><label>Criticité</label><select id="cfCrit">${CRIT_OPTS.map(
          ([k, l]) =>
            `<option value="${k}" ${c && c.crit === k ? "selected" : !c && k === "moyen" ? "selected" : ""}>${l}</option>`
        ).join("")}</select></div>
        <div class="frow"><label>Triangulation</label><select id="cfTriang">${[0, 1, 2, 3]
          .map(
            (n) =>
              `<option value="${n}" ${c && c.triang === n ? "selected" : !c && n === 1 ? "selected" : ""}>${n} source(s)</option>`
          )
          .join("")}</select></div>
      </div>
      <div class="f2">
        <div class="frow"><label>Structure concernée</label><input id="cfStruct" list="cfStructList" value="${c ? esc(c.struct) : ""}" placeholder="Ex. DSI"><datalist id="cfStructList">${sources.map((s) => `<option value="${esc(s)}">`).join("")}</datalist></div>
        <div class="frow"><label>Qualification</label><select id="cfQual"><option value="">Non qualifié</option>${Object.keys(QUAL)
          .map(
            (q) =>
              `<option value="${q}" ${c && c.qual === q ? "selected" : ""}>${QUAL[q].lbl}</option>`
          )
          .join("")}</select></div>
      </div>
      <div class="frow"><label>Description factuelle <span class="req">*</span></label><textarea id="cfDesc" placeholder="Décrire le fait observé / déclaré…">${c ? esc(c.desc) : ""}</textarea></div>
      <div class="frow"><label>Écart / implication</label><textarea id="cfEcart" style="min-height:60px">${c ? esc(c.ecart || "") : ""}</textarea></div>
      <div class="frow"><label>Sources (séparées par des virgules)</label><input id="cfSrc" value="${c ? esc((c.sources || []).join(", ")) : ""}" placeholder="Ex. DSI, DPSD"></div>
      ${attFormBlock()}
    </div>
    <div class="modal-f">${c ? `<button class="btn ghost" style="margin-right:auto;color:var(--crit)" onclick="if(confirm('Supprimer ce constat ?')){Store.remove('constats','${c.id}');Modal.close();toast('Constat supprimé','','ok');App.refresh();}">Supprimer</button>` : ""}<button class="btn ghost" onclick="Modal.close()">Annuler</button><button class="btn terra" id="cfSave">${svgI('<path d="M20 6 9 17l-5-5"/>')} Enregistrer</button></div>`
    );
    renderFormAttList();
    wireFormAttInputs();
    $("#cfSave").onclick = () => {
      const titre = $("#cfTitre").value.trim(),
        desc = $("#cfDesc").value.trim();
      if (!titre || !desc) {
        toast("Champs requis", "Renseignez l'intitulé et la description", "err");
        return;
      }
      const obj = Object.assign(
        c || { id: draftId, ref: next, attachments: [] },
        {
          titre,
          axe: $("#cfAxe").value,
          crit: $("#cfCrit").value,
          triang: parseInt($("#cfTriang").value, 10),
          struct: $("#cfStruct").value.trim() || "—",
          qual: $("#cfQual").value,
          desc,
          ecart: $("#cfEcart").value.trim(),
          sources: $("#cfSrc").value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          attachments: (formDraft && formDraft.attachments) || [],
          updated: new Date().toISOString(),
        }
      );
      Store.upsert("constats", obj);
      Modal.close();
      toast(c ? "Constat modifié" : "Constat ajouté", "", "ok");
      App.refresh();
      formDraft = null;
    };
  }

  function pjBadge(c) {
    const n = (c.attachments || []).length;
    if (!n) return "";
    const names = (c.attachments || []).map((a) => a.name).join(", ");
    return `<span class="tag" style="font-size:9px" title="${esc(names)}">${n} PJ</span>`;
  }

  window.PortiaConstatAtt = {
    pjBadge,
    openConstat,
    constatForm,
  };
  window.openConstat = openConstat;
  window.constatForm = constatForm;
})();
