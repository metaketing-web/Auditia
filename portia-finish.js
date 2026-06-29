/**
 * Finalisation produit — checklists, Data Room statuts, workflows UI, feature flags
 */
(function () {
  "use strict";

  function getChecklists() {
    if (Store.state && Store.state.checklists && Store.state.checklists.length) {
      return Store.state.checklists;
    }
    return window.CHECKLISTS || [];
  }

  function chkPct(id) {
    const c = getChecklists().find((x) => x.id === id);
    if (!c) return 0;
    return Math.round((c.items.filter((i) => i.ok).length / c.items.length) * 100);
  }

  function saveChecklists() {
    if (window.portiaApi && portiaApi.saveState) return portiaApi.saveState();
    Store.save();
    return Promise.resolve();
  }

  function patchStoreChecklists() {
    if (!window.Store || Store._checklistsWrapped) return;
    const orig = Store.defaults.bind(Store);
    Store.defaults = function () {
      const d = orig();
      if (!d.checklists || !d.checklists.length) {
        d.checklists = JSON.parse(JSON.stringify(window.CHECKLISTS || []));
      }
      return d;
    };
    Store._checklistsWrapped = true;
    if (Store.state && (!Store.state.checklists || !Store.state.checklists.length)) {
      Store.state.checklists = JSON.parse(JSON.stringify(window.CHECKLISTS || []));
    }
  }

  function getMissionDocs() {
    if (window.PortiaDataroom && PortiaDataroom.missionDocs) return PortiaDataroom.missionDocs();
    return Store.get("docs").filter((d) => !(window.isTestDoc && isTestDoc(d)));
  }

  function docHasFile(d) {
    return !!(d && (d.fileId || d.id) && (d.statut === "verse" || d.statut === "a_verifier"));
  }

  function canValidateDoc() {
    const u = App.user;
    if (!u || u.readOnly) return false;
    if (window.PortiaEnterprise && PortiaEnterprise.userCanDeposit) {
      return PortiaEnterprise.userCanDeposit(u);
    }
    return !u.readOnly;
  }

  async function validateDoc(docId) {
    const fetchFn = window.portiaApi ? portiaApi.fetch : fetch;
    const r = await fetchFn("/api/dataroom/docs/" + encodeURIComponent(docId) + "/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
    });
    if (!r.ok) {
      let msg = "Validation impossible";
      try {
        const err = await r.json();
        if (err.detail) msg = typeof err.detail === "string" ? err.detail : msg;
      } catch (_) {}
      toast("Data Room", msg, "err");
      return false;
    }
    const data = await r.json();
    const doc = data.doc;
    if (doc) {
      Store.patch("docs", docId, {
        statut: doc.statut || "verse",
        taille: doc.taille || undefined,
        par: doc.par || undefined,
        fileId: doc.fileId || doc.file_id || undefined,
      });
    } else {
      Store.patch("docs", docId, { statut: "verse" });
    }
    if (window.portiaApi && portiaApi.saveState) {
      try {
        await portiaApi.saveState();
      } catch (_) {}
    }
    toast("Document validé", "Classé comme versé dans la Data Room", "ok");
    return true;
  }

  function patchDataroomView() {
    const orig = VIEWS.dataroom;
    if (!orig || VIEWS._dataroomFinish) return;

    function buildDataroomView() {
      const v = el("div", { class: "view" });
      const f = { rep: (App.routeParams && App.routeParams.rep) || "all", ministry: "all", statut: "all", q: "" };
      let ministryFolders = [];
      const cl = getChecklists();
      const ro = App.user && App.user.readOnly;
      const canDeposit =
        App.user &&
        (App.user.canDeposit ||
          (window.PortiaEnterprise && PortiaEnterprise.userCanDeposit
            ? PortiaEnterprise.userCanDeposit(App.user)
            : !App.user.readOnly));
      const dropBlock =
        ro || typeof depositDropzoneHtml !== "function"
          ? ""
          : depositDropzoneHtml("drDrop", true);
      const headActions = canDeposit
        ? `<button class="btn ghost" onclick="App.go('depot')">${svgI(ICON.dataroom)} Déposer un document</button>`
        : "";

      v.innerHTML =
        pageHead(
          "Collecte · Salle de données",
          "Data Room",
          "Centralisation et traçabilité des pièces probantes — 11 répertoires, checklists A→F et consultation des documents versés.",
          headActions
        ) +
        `<div class="kpis" style="margin-bottom:18px" id="drKpis"></div>
    ${dropBlock}
    <div class="row" style="margin-bottom:18px">
      <div class="col card" style="min-width:300px;flex:1.2"><div class="card-h"><h3>Répertoires audit (R1→R11)</h3></div><div class="card-b"><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))" id="drReps"></div></div></div>
      <div class="col card" style="min-width:280px"><div class="card-h"><h3>Checklists A → F</h3></div><div class="card-b stack" id="chkPanel">
      ${cl
        .map((c) => {
          const p = chkPct(c.id);
          return `<div class="chk-block" data-chk="${c.id}"><div class="between" style="margin-bottom:6px"><span style="font-size:12.5px"><b class="mono" style="color:var(--terra-deep)">${c.id}</b> · ${esc(c.n)}</span><span class="mono chk-pct" data-chk-pct="${c.id}" style="font-size:11px;color:var(--txt-3)">${c.items.filter((i) => i.ok).length}/${c.items.length}</span></div>
          ${c.items
            .map(
              (it, idx) =>
                `<label style="display:flex;gap:8px;align-items:flex-start;font-size:12px;margin:4px 0;cursor:${ro ? "default" : "pointer"}"><input type="checkbox" data-chk="${c.id}" data-idx="${idx}" ${it.ok ? "checked" : ""} ${ro ? "disabled" : ""} style="margin-top:3px"><span>${esc(it.t)}</span></label>`
            )
            .join("")}</div>`;
        })
        .join("")}
      </div></div>
    </div>
    <div class="card" style="margin-bottom:18px"><div class="card-h"><h3>Arborescence ministère (00→10)</h3><div class="actions"><span class="muted" style="font-size:11px">cliquer pour filtrer</span></div></div><div class="card-b"><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))" id="drMinistry"></div></div></div>
    <div class="fbar"><input class="search" id="drQ" placeholder="Rechercher…"><select class="fselect" id="drRep"><option value="all">Tous R1→R11</option>${DATAROOM_REPS.map((r) => `<option value="${r.id}">${r.id}</option>`).join("")}</select>
    <select class="fselect" id="drMinistrySel" style="min-width:160px"><option value="all">Tous dossiers 00→10</option></select>
    <div class="seg" id="drStatut">${[["all", "Tous"], ["a_verifier", "À valider"], ["verse", "Versés"], ["attendu", "Attendus"], ["relance", "Relance"]].map(([k, l], i) => `<button data-v="${k}" class="${i === 0 ? "on" : ""}">${l}</button>`).join("")}</div></div>
    <div class="card"><table class="tbl"><thead><tr><th>Document</th><th>Rép.</th><th title="Arborescence ministère 00→10 (classement des dépôts externes)">Ministère</th><th>Source</th><th>Dépôt</th><th>Statut</th><th style="text-align:right">Action</th></tr></thead><tbody id="drBody"></tbody></table></div>`;

      const body = v.querySelector("#drBody");
      const kpiEl = v.querySelector("#drKpis");
      const repsEl = v.querySelector("#drReps");
      const ministryEl = v.querySelector("#drMinistry");
      const ministrySel = v.querySelector("#drMinistrySel");

      function ministryName(id) {
        const m = ministryFolders.find((x) => x.id === id);
        return m ? m.name : id || "—";
      }

      function fmtDepositDate(d) {
        const iso = d.updatedAt || d.createdAt;
        if (!iso || !docHasFile(d)) return "—";
        try {
          return new Date(iso).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        } catch (_) {
          return String(iso).slice(0, 10);
        }
      }

      function loadMinistryFolders() {
        const fetchFn = window.portiaApi ? portiaApi.fetch : fetch;
        return fetchFn("/api/collecte/folders")
          .then((r) => (r.ok ? r.json() : { folders: [] }))
          .then((data) => {
            ministryFolders = data.folders || [];
            if (ministrySel) {
              ministrySel.innerHTML =
                '<option value="all">Tous dossiers 00→10</option>' +
                ministryFolders
                  .map((mf) => `<option value="${mf.id}">${mf.id} — ${mf.name}</option>`)
                  .join("");
              if (f.ministry !== "all") ministrySel.value = f.ministry;
            }
          })
          .catch(() => {
            ministryFolders = [];
          });
      }

      function setDocStatut(id, statut) {
        Store.patch("docs", id, { statut });
        saveChecklists();
        toast("Data Room", "Statut mis à jour", "ok");
        render();
      }

      function renderKpis(D) {
        const m = metrics();
        const chkGlobal = cl.length
          ? Math.round(
              (cl.reduce((s, c) => s + c.items.filter((i) => i.ok).length, 0) /
                cl.reduce((s, c) => s + c.items.length, 0)) *
                100
            )
          : 0;
        kpiEl.innerHTML = `<div class="kpi"><div class="top"><div class="ic" style="background:var(--slate-soft);color:var(--info)">${svgI(ICON.dataroom)}</div><span class="lbl">Documents total</span></div><div class="val">${m.docTot}</div><div class="sub" style="margin-top:6px">Fichiers validés</div></div>
      <div class="kpi"><div class="top"><div class="ic" style="background:var(--gold-soft);color:#7a5a14">${svgI('<path d="M12 9v4M12 17h.01"/>')}</div><span class="lbl">À valider</span></div><div class="val">${m.aVerifier || 0}</div><div class="sub" style="margin-top:6px">Déposés · en attente de relecture</div></div>
      <div class="kpi"><div class="top"><div class="ic" style="background:var(--sage-soft);color:var(--sage-deep)">${svgI('<path d="M20 6 9 17l-5-5"/>')}</div><span class="lbl">Attendus ministère</span></div><div class="val">${m.docCollecteRecu}<small>/${m.docCollecteTot}</small></div><div class="bar"><i style="width:${m.docCollecteTot ? Math.round((m.docCollecteRecu / m.docCollecteTot) * 100) : 0}%;background:var(--sage)"></i></div></div>
      <div class="kpi"><div class="top"><div class="ic" style="background:var(--gold-soft);color:#7a5a14">${svgI('<path d="M12 9v4"/>')}</div><span class="lbl">En relance</span></div><div class="val">${m.relance}</div></div>
      <div class="kpi"><div class="top"><div class="ic" style="background:var(--terra-soft);color:var(--terra-deep)">${svgI(ICON.constats)}</div><span class="lbl">Checklists A-F</span></div><div class="val">${chkGlobal}<small>%</small></div></div>`;
      }

      function renderReps(D) {
        repsEl.innerHTML = DATAROOM_REPS.map((r) => {
          const sub = D.filter((d) => d.rep === r.id);
          const vs = sub.filter((d) => d.statut === "verse").length;
          const pct = sub.length ? Math.round((vs / sub.length) * 100) : 0;
          return `<div class="card pad clk" data-rep="${r.id}" style="cursor:pointer;padding:13px"><b class="mono">${r.id}</b> ${vs}/${sub.length}<div class="pline" style="margin-top:8px"><i style="width:${pct}%"></i></div></div>`;
        }).join("");
        v.querySelectorAll("[data-rep]").forEach((c) => {
          c.onclick = () => {
            f.rep = c.dataset.rep;
            f.ministry = "all";
            v.querySelector("#drRep").value = f.rep;
            if (ministrySel) ministrySel.value = "all";
            render();
          };
        });
      }

      function renderMinistry(D) {
        if (!ministryEl) return;
        const ids = ministryFolders.length
          ? ministryFolders.map((x) => x.id)
          : [...new Set(D.map((d) => d.ministryFolder).filter(Boolean))].sort();
        if (!ids.length) {
          ministryEl.innerHTML =
            '<div class="muted" style="font-size:12px;padding:8px">Aucun dossier ministère — les dépôts externes seront classés ici.</div>';
          return;
        }
        ministryEl.innerHTML = ids
          .map((id) => {
            const mf = ministryFolders.find((x) => x.id === id);
            const sub = D.filter((d) => (d.ministryFolder || "") === id);
            const vs = sub.filter((d) => d.statut === "verse" || d.statut === "a_verifier").length;
            const pct = sub.length ? Math.round((vs / sub.length) * 100) : 0;
            const lbl = mf ? mf.name : id;
            return `<div class="card pad clk" data-ministry="${id}" style="cursor:pointer;padding:13px;border-left:3px solid var(--slate)"><b class="mono">${id}</b> ${vs}/${sub.length}<div style="font-size:11px;color:var(--txt-3);margin:4px 0 6px;line-height:1.3">${esc(lbl)}</div><div class="pline"><i style="width:${pct}%"></i></div></div>`;
          })
          .join("");
        ministryEl.querySelectorAll("[data-ministry]").forEach((c) => {
          c.onclick = () => {
            f.ministry = c.dataset.ministry;
            f.rep = "all";
            v.querySelector("#drRep").value = "all";
            if (ministrySel) ministrySel.value = f.ministry;
            render();
          };
        });
      }

      function render() {
        const D = getMissionDocs();
        renderKpis(D);
        renderReps(D);
        renderMinistry(D);
        const list = D.filter((d) => {
          if (f.rep !== "all" && d.rep !== f.rep) return false;
          if (f.ministry !== "all" && (d.ministryFolder || "") !== f.ministry) return false;
          if (f.statut !== "all" && d.statut !== f.statut) return false;
          if (f.q && !docName(d).toLowerCase().includes(f.q.toLowerCase())) return false;
          return true;
        });
        body.innerHTML =
          list
            .map((d) => {
              const st = DOC_STATUT[d.statut] || DOC_STATUT.attendu;
              const sel = ro
                ? `<span class="bdg ${st.cls}">${st.lbl}</span>`
                : `<select class="fselect dr-st" data-id="${d.id}" style="min-width:120px;font-size:12px">
                <option value="attendu" ${d.statut === "attendu" ? "selected" : ""}>Attendu</option>
                <option value="a_verifier" ${d.statut === "a_verifier" ? "selected" : ""}>À valider</option>
                <option value="verse" ${d.statut === "verse" ? "selected" : ""}>Versé</option>
                <option value="relance" ${d.statut === "relance" ? "selected" : ""}>Relance</option>
              </select>`;
              const open = docHasFile(d);
              const validateBtn =
                d.statut === "a_verifier" && canValidateDoc()
                  ? `<button type="button" class="btn ok sm dr-validate" data-id="${esc(d.id)}">Valider</button>`
                  : "";
              const action = open
                ? `<div style="display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap">${validateBtn}<button type="button" class="btn terra sm dr-open" data-id="${esc(d.id)}" data-fid="${esc(d.fileId || "")}">Consulter</button></div>`
                : `<span class="muted" style="font-size:11px">${d.statut === "attendu" ? "En attente" : "Sans fichier"}</span>`;
              return `<tr data-doc-id="${d.id}" class="${open ? "clk" : ""}">
              <td><b class="mono" style="font-size:11px">${esc(docName(d))}</b>${d.taille ? `<div class="muted" style="font-size:10px;margin-top:2px">${esc(d.taille)}${d.par ? " · " + esc(d.par) : ""}${d.depositOrigin === "externe" ? " · collecte" : ""}</div>` : ""}</td>
              <td><span class="tag mono">${d.rep}</span></td>
              <td>${d.ministryFolder ? `<span class="tag mono" title="${esc(ministryName(d.ministryFolder))}">${esc(d.ministryFolder)}</span>` : '<span class="muted">—</span>'}</td>
              <td>${esc(d.source)}</td>
              <td class="mono" style="font-size:11px;white-space:nowrap">${esc(fmtDepositDate(d))}</td>
              <td>${sel}</td>
              <td style="text-align:right">${action}</td></tr>`;
            })
            .join("") ||
          `<tr><td colspan="7"><div class="empty" style="padding:30px"><b>Aucun document</b><p>Aucun document ne correspond aux filtres — vérifiez la connexion serveur ou réessayez dans un instant.</p></div></td></tr>`;
        v.querySelectorAll(".dr-st").forEach((sel) => {
          sel.onclick = (e) => e.stopPropagation();
          sel.onchange = (e) => {
            e.stopPropagation();
            setDocStatut(sel.dataset.id, sel.value);
          };
        });
        v.querySelectorAll(".dr-open").forEach((btn) => {
          btn.onclick = (e) => {
            e.stopPropagation();
            if (window.Files && Files.openDocument) {
              Files.openDocument({ id: btn.dataset.id, fileId: btn.dataset.fid || btn.dataset.id });
            }
          };
        });
        v.querySelectorAll(".dr-validate").forEach((btn) => {
          btn.onclick = async (e) => {
            e.stopPropagation();
            btn.disabled = true;
            const ok = await validateDoc(btn.dataset.id);
            btn.disabled = false;
            if (ok) render();
          };
        });
        v.querySelectorAll("tr.clk").forEach((row) => {
          row.onclick = () => {
            const id = row.dataset.docId;
            const d = D.find((x) => x.id === id);
            if (d && docHasFile(d) && window.Files && Files.openDocument) {
              Files.openDocument({ id: d.id, fileId: d.fileId || d.id });
            }
          };
        });
      }

      v.querySelector("#drQ").oninput = (e) => {
        f.q = e.target.value;
        render();
      };
      v.querySelector("#drRep").onchange = (e) => {
        f.rep = e.target.value;
        if (f.rep !== "all") f.ministry = "all";
        if (ministrySel && f.rep !== "all") ministrySel.value = "all";
        render();
      };
      if (ministrySel) {
        ministrySel.onchange = (e) => {
          f.ministry = e.target.value;
          if (f.ministry !== "all") f.rep = "all";
          if (f.ministry !== "all") v.querySelector("#drRep").value = "all";
          render();
        };
      }
      v.querySelector("#drStatut").onclick = (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        f.statut = b.dataset.v;
        v.querySelectorAll("#drStatut button").forEach((x) => x.classList.toggle("on", x === b));
        render();
      };

      const drDrop = v.querySelector("#drDrop");
      if (drDrop && typeof bindDepositDropzone === "function") {
        bindDepositDropzone(drDrop, { getDefaultRep: () => f.rep });
      }
      if (f.rep !== "all") {
        const sel = v.querySelector("#drRep");
        if (sel) sel.value = f.rep;
      }

      if (!ro) {
        v.querySelectorAll("#chkPanel input[type=checkbox]").forEach((cb) => {
          cb.onchange = () => {
            const block = getChecklists().find((x) => x.id === cb.dataset.chk);
            if (!block) return;
            const idx = parseInt(cb.dataset.idx, 10);
            block.items[idx].ok = cb.checked;
            Store.state.checklists = getChecklists();
            saveChecklists();
            render();
          };
        });
      }

      loadMinistryFolders().then(() => render());
      return v;
    }

    VIEWS.dataroom = function () {
      if (window.PORTIA_SERVER_MODE) {
        const shell = el("div", { class: "view" });
        shell.innerHTML =
          '<div class="note slate" style="padding:28px 20px;text-align:center">Chargement de la Data Room…</div>';
        const reload =
          window.portiaApi && portiaApi.loadDataroomDocs
            ? portiaApi.loadDataroomDocs()
            : window.PortiaDataroom && PortiaDataroom.reload
              ? PortiaDataroom.reload()
              : Promise.resolve();
        reload
          .then(() => {
            const view = buildDataroomView();
            if (shell.parentNode) shell.replaceWith(view);
          })
          .catch(() => {
            const view = buildDataroomView();
            if (shell.parentNode) shell.replaceWith(view);
          });
        return shell;
      }
      return buildDataroomView();
    };
    VIEWS._dataroomFinish = true;
  }

  function patchConductAutosave() {
    const orig = VIEWS.conduct;
    if (!orig || VIEWS._conductAuto) return;
    VIEWS.conduct = function () {
      const v = orig();
      let timer;
      v.addEventListener(
        "focusout",
        (e) => {
          const ta = e.target.closest("textarea[data-qid][data-phase]");
          if (!ta || !App.conductId || !window.PORTIA_SERVER_MODE) return;
          clearTimeout(timer);
          timer = setTimeout(async () => {
            const ent = Store.find("entretiens", App.conductId);
            if (!ent) return;
            const phase = ta.dataset.phase;
            const qid = ta.dataset.qid;
            if (!ent.questionnaire) ent.questionnaire = { invest: {}, confront: {}, coconstruct: {} };
            if (!ent.questionnaire[phase]) ent.questionnaire[phase] = {};
            ent.questionnaire[phase][qid] = ta.value;
            Store.patch("entretiens", ent.id, { questionnaire: ent.questionnaire });
            try {
              const f =
                window.portiaApi && portiaApi.fetch
                  ? portiaApi.fetch.bind(portiaApi)
                  : window.PortiaEnterprise && PortiaEnterprise.authHeaders
                    ? (url, opts) =>
                        fetch(url, {
                          ...opts,
                          headers: { ...PortiaEnterprise.authHeaders(), ...(opts && opts.headers) },
                        })
                    : fetch;
              await f(`/api/entretiens/${encodeURIComponent(ent.id)}/questionnaire`, {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(ent.questionnaire),
              });
            } catch (_) {}
          }, 800);
        },
        true
      );
      return v;
    };
    VIEWS._conductAuto = true;
  }

  function init() {
    patchStoreChecklists();
    patchDataroomView();
    patchConductAutosave();
    if (window.PortiaFinalize && PortiaFinalize.applyFeatureNav) {
      PortiaFinalize.applyFeatureNav();
    }
  }

  window.PortiaFinish = { getChecklists, init, validateDoc };
})();
