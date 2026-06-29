/**
 * Planning 4 semaines — édition, gantt dynamique, sync Google / Outlook / ICS
 */
(function () {
  "use strict";

  function saveState() {
    if (window.portiaApi && portiaApi.saveState) return portiaApi.saveState();
    Store.save();
    return Promise.resolve();
  }

  function apiFetch(url, opts) {
    if (window.portiaApi && portiaApi.fetch) return portiaApi.fetch(url, opts);
    return fetch(url, opts);
  }

  function assignErrorMessage(status, fallback) {
    if (status === 403) {
      return "Accès refusé — connectez-vous en Administrateur et terminez la configuration 2FA si demandée";
    }
    if (status === 401) {
      return "Session expirée — reconnectez-vous";
    }
    return fallback || "Erreur " + status;
  }

  function getPlanning() {
    if (!Store.state) return defaultLocalPlanning();
    if (!Store.state.planning4s || !Store.state.planning4s.weeks) {
      Store.state.planning4s = defaultLocalPlanning();
    }
    return Store.state.planning4s;
  }

  function defaultLocalPlanning() {
    return {
      j0: (Store.state && Store.state.meta && Store.state.meta.j0) || "2026-07-06",
      spanDays: 29,
      weeks: [
        { sem: 1, titre: "Cadrage stratégique", objectif: "Commande politique, COPIL, Data Room.", jalons: ["Lancement COPIL"], startJ: 0, endJ: 4, color: "var(--axe-pol)" },
        { sem: 2, titre: "Deep-dive programmatique", objectif: "SIGFIP, prog/non-prog.", jalons: ["Grille qualité"], startJ: 7, endJ: 11, color: "var(--axe-prog)" },
        { sem: 3, titre: "Volet B & intégrations", objectif: "RH, DSI, flux.", jalons: ["Matrice CDC"], startJ: 14, endJ: 18, color: "var(--axe-tech)" },
        { sem: 4, titre: "Terrain régional", objectif: "Régions, focus groups.", jalons: ["Synthèse terrain"], startJ: 21, endJ: 25, color: "var(--sage)" },
        { sem: 5, titre: "Rendus & clôture", objectif: "Finalisation livrables, remise 3 août.", jalons: ["Remise des livrables — 3 août"], startJ: 26, endJ: 28, color: "var(--gold)" },
      ],
      events: [],
      syncMeta: {},
    };
  }

  function persistPlanning(p) {
    Store.state.planning4s = p;
    if (!window.PORTIA_SERVER_MODE) {
      saveState();
      return Promise.resolve({ ok: true });
    }
    return apiFetch("/api/planning", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(p),
    }).then((r) => {
      if (!r.ok) throw new Error(assignErrorMessage(r.status, "save " + r.status));
      return r.json();
    });
  }

  function ganttFromPlanning() {
    const p = getPlanning();
    const SPAN = p.spanDays || 34;
    const now = Store.clockJ;
    const nowPct = Math.max(0, Math.min(1, now / SPAN)) * 100;
    let html = `<div class="gantt"><div style="min-width:560px">`;
    (p.weeks || []).forEach((w) => {
      const left = ((w.startJ || 0) / SPAN) * 100;
      const width = (((w.endJ || 0) - (w.startJ || 0) + 1) / SPAN) * 100;
      const past = now > (w.endJ || 0);
      const current = now >= (w.startJ || 0) && now <= (w.endJ || 0);
      const showNow = now >= 0 && now <= SPAN;
      const c = w.color || "var(--terra)";
      html += `<div class="gantt-row"><div class="gantt-lbl">${esc("S" + w.sem + " — " + w.titre)}<small>J+${w.startJ} → J+${w.endJ}</small></div>
        <div class="gantt-track">
          <div class="gantt-bar" style="left:${left.toFixed(1)}%;width:${width.toFixed(1)}%;background:${c};opacity:${past ? ".5" : "1"}">${past ? "✓ " : current ? "● " : ""}S${w.sem}</div>
          ${showNow ? `<div class="gantt-now" style="left:${nowPct.toFixed(1)}%"></div>` : ""}
        </div></div>`;
    });
    html += `</div></div>`;
    return html;
  }

  function openWeekEditor(w, idx) {
    const ro = App.user && App.user.readOnly;
    Modal.open(
      `<div class="modal-h"><h2>Semaine ${w.sem} — ${esc(w.titre)}</h2><button class="x" onclick="Modal.close()">${svgI('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div>
      <div class="modal-b stack">
        <div class="frow"><label>Titre</label><input id="pwTitre" value="${esc(w.titre)}" ${ro ? "readonly" : ""}></div>
        <div class="frow"><label>Objectif</label><textarea id="pwObj" rows="3" ${ro ? "readonly" : ""}>${esc(w.objectif || "")}</textarea></div>
        <div class="f2"><div class="frow"><label>Début (J+)</label><input type="number" id="pwStart" value="${w.startJ}" ${ro ? "readonly" : ""}></div>
        <div class="frow"><label>Fin (J+)</label><input type="number" id="pwEnd" value="${w.endJ}" ${ro ? "readonly" : ""}></div></div>
        <div class="frow"><label>Jalons (un par ligne)</label><textarea id="pwJal" rows="4" ${ro ? "readonly" : ""}>${esc((w.jalons || []).join("\n"))}</textarea></div>
      </div>
      <div class="modal-f"><button class="btn ghost" onclick="Modal.close()">Fermer</button>${ro ? "" : '<button class="btn terra" id="pwSave">Enregistrer</button>'}</div>`,
      true
    );
    if (!ro) {
      document.getElementById("pwSave").onclick = () => {
        const p = getPlanning();
        p.weeks[idx] = Object.assign({}, w, {
          titre: document.getElementById("pwTitre").value,
          objectif: document.getElementById("pwObj").value,
          startJ: parseInt(document.getElementById("pwStart").value, 10),
          endJ: parseInt(document.getElementById("pwEnd").value, 10),
          jalons: document.getElementById("pwJal").value.split("\n").map((s) => s.trim()).filter(Boolean),
        });
        persistPlanning(p).then(() => {
          Modal.close();
          toast("Planning", "Semaine enregistrée", "ok");
          App.go("planning");
        });
      };
    }
  }

  function audBadge(aud) {
    const PA = window.PortiaAuditors;
    const lbl = PA ? PA.audLabel(aud) : aud || "—";
    return `<span class="tag mono" style="font-size:11px">${esc(lbl)}</span>`;
  }

  function syncEntretienAud(entretienId, aud, lead) {
    if (!entretienId || !aud) return Promise.resolve();
    const PA = window.PortiaAuditors;
    const norm = PA ? PA.normAud(aud) : aud;
    const patch = { aud: norm };
    if (lead) patch.leadAuditor = lead;
    Store.patch("entretiens", entretienId, patch);
    if (window.PORTIA_SERVER_MODE) {
      return apiFetch("/api/entretiens/bulk-assign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assignments: [{ id: entretienId, aud: norm, lead: lead || "" }] }),
      }).then((r) => {
        if (!r.ok) throw new Error(assignErrorMessage(r.status, "assign " + r.status));
        return r.json();
      });
    }
    return saveState();
  }

  function syncEventToEntretiens(row) {
    if (!Store.state || (!row.entretienId && row.type !== "entretien")) return null;
    const PA = window.PortiaAuditors;
    const aud =
      row.aud || (PA && App.user ? PA.auditorCodeFromUser(App.user) : null) || "A";
    const normAud = PA ? PA.normAud(aud) : aud;
    if (row.entretienId) {
      const patch = {
        j: row.startJ,
        heure: row.startTime,
        sem: row.sem,
        aud: normAud,
        updated: new Date().toISOString(),
      };
      if (row.location) patch.struct = row.location;
      if (row.title) patch.n = row.title;
      Store.patch("entretiens", row.entretienId, patch);
      return row.entretienId;
    }
    if (row.type === "entretien" && (row.title || "").trim()) {
      const id = "ent_" + Math.random().toString(36).slice(2, 10);
      const ent = {
        id,
        n: row.title.trim(),
        struct: row.location || "",
        axe: "Programmatique",
        couche: "Direction",
        sem: row.sem || 1,
        j: row.startJ,
        heure: row.startTime || "09:00",
        aud: normAud,
        trame: "direction",
        statut: "planifie",
        region: "Abidjan",
        prenom: "",
        nom: "",
        mail: "",
        tel: "",
        cr: "",
        qual: "",
        obs: [],
        docs: [],
        media: [],
        triang: 0,
        updated: new Date().toISOString(),
        questionnaire: { invest: {}, confront: {}, coconstruct: {} },
      };
      Store.state.entretiens.push(ent);
      row.entretienId = id;
      row.readonly = true;
      row.type = "entretien";
      Store.save();
      return id;
    }
    return null;
  }

  function afterPlanningSaved(res) {
    const cal =
      res &&
      res.calendar &&
      res.calendar.results &&
      (res.calendar.results.google || res.calendar.results.outlook);
    const reload =
      window.portiaReloadServer && window.PORTIA_SERVER_MODE
        ? portiaReloadServer()
        : saveState();
    return Promise.resolve(reload).then(() => {
      Modal.close();
      toast(
        "Planning",
        "Entretien enregistré — visible dans Mon agenda" + (cal ? " et Google Agenda" : ""),
        "ok"
      );
      App.go("agenda");
    });
  }

  function openEventEditor(ev, idx) {
    const canPilot = App.user && (App.user.role === "admin" || App.user.serverRole === "juliana");
    const roUser = App.user && App.user.readOnly;
    const metaRo = roUser || (ev && ev.readonly);
    const isEntretienEv = ev && (ev.type === "entretien" || ev.entretienId);
    const canEditAud = canPilot && !roUser && isEntretienEv;
    const isNew = idx < 0;
    const e = ev || { type: "atelier", sem: 1, startJ: Store.clockJ, endJ: Store.clockJ, startTime: "09:00", endTime: "10:00" };
    const ents = Store.get("entretiens") || [];
    const linkedEnt = e.entretienId ? ents.find((x) => x.id === e.entretienId) : null;
    const PA = window.PortiaAuditors;
    const userAud = PA && App.user ? PA.auditorCodeFromUser(App.user) : null;
    const curAud =
      e.aud ||
      (linkedEnt && linkedEnt.aud && canPilot ? linkedEnt.aud : null) ||
      userAud ||
      (linkedEnt && linkedEnt.aud) ||
      "A";
    const entSource =
      userAud && !canPilot && PA
        ? ents.filter((x) => PA.audMatches(x.aud, userAud))
        : ents;
    const audSel = PA
      ? PA.audOptions(curAud, App.user)
      : '<option value="A">Asse (A)</option><option value="L">Laetitia (L)</option><option value="A+L">Asse + Laetitia</option>';
    const entOpts =
      '<option value="">— Choisir un entretien —</option>' +
      entSource
        .filter((x) => x.j != null)
        .slice()
        .sort((a, b) => (a.j || 0) - (b.j || 0) || (a.n || "").localeCompare(b.n || ""))
        .map((x) => `<option value="${esc(x.id)}" ${e.entretienId === x.id ? "selected" : ""}>${esc(x.n || x.id)} · J+${x.j} · S${x.sem || "?"}</option>`)
        .join("");
    const showEntBlock = isEntretienEv || e.type === "entretien" || isNew;
    const canSave = !metaRo || canEditAud;
    Modal.open(
      `<div class="modal-h"><h2>${isNew ? "Nouvel événement" : esc(e.title)}</h2><button class="x" onclick="Modal.close()">${svgI('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div>
      <div class="modal-b stack">
        <div class="frow"><label>Titre</label><input id="peTitre" value="${esc(e.title || "")}" ${metaRo ? "readonly" : ""}></div>
        <div class="f2">
          <div class="frow"><label>Type</label><select id="peType" ${metaRo ? "disabled" : ""}><option value="atelier">Atelier</option><option value="copil">COPIL</option><option value="jalon">Jalon</option><option value="entretien">Entretien</option><option value="autre">Autre</option></select></div>
          <div class="frow"><label>Semaine</label><select id="peSem" ${metaRo ? "disabled" : ""}>${[1, 2, 3, 4, 5].map((s) => `<option value="${s}">${s}</option>`).join("")}</select></div>
        </div>
        <div id="peEntBlock" style="display:${showEntBlock ? "block" : "none"}">
          <div class="f2">
            <div class="frow"><label>Entretien lié</label><select id="peEntretien" ${metaRo ? "disabled" : ""}>${entOpts}</select></div>
            <div class="frow"><label>Auditeur(s)</label><select id="peAud" ${canEditAud ? "" : "disabled"}>${audSel}</select></div>
          </div>
          ${linkedEnt ? `<div class="note slate" style="font-size:11px;margin-top:6px">Entretien synchronisé — seule l'affectation auditeur est modifiable ici.</div>` : ""}
        </div>
        <div class="f3">
          <div class="frow"><label>J mission</label><input type="number" id="peJ" value="${e.startJ}" ${metaRo ? "readonly" : ""}></div>
          <div class="frow"><label>Heure début</label><input id="peT1" value="${esc(e.startTime || "09:00")}" ${metaRo ? "readonly" : ""}></div>
          <div class="frow"><label>Heure fin</label><input id="peT2" value="${esc(e.endTime || "10:00")}" ${metaRo ? "readonly" : ""}></div>
        </div>
        <div class="frow"><label>Lieu</label><input id="peLoc" value="${esc(e.location || "")}" ${metaRo ? "readonly" : ""}></div>
        <div class="frow"><label>Description</label><textarea id="peDesc" rows="3" ${metaRo ? "readonly" : ""}>${esc(e.description || "")}</textarea></div>
      </div>
      <div class="modal-f"><button class="btn ghost" onclick="Modal.close()">Fermer</button>${canSave ? '<button class="btn terra" id="peSave">Enregistrer</button>' : ""}</div>`,
      true
    );
    document.getElementById("peType").value = e.type || "atelier";
    document.getElementById("peSem").value = String(e.sem || 1);
    const peType = document.getElementById("peType");
    const peEntBlock = document.getElementById("peEntBlock");
    const peEntretien = document.getElementById("peEntretien");
    const toggleEntBlock = () => {
      const isEnt = peType.value === "entretien";
      peEntBlock.style.display = isEnt || e.entretienId ? "block" : "none";
      const peAud = document.getElementById("peAud");
      if (peAud) peAud.disabled = !(canPilot && !roUser && (isEnt || e.entretienId));
    };
    peType.onchange = toggleEntBlock;
    if (peEntretien && !metaRo) {
      peEntretien.onchange = () => {
        const ent = ents.find((x) => x.id === peEntretien.value);
        if (!ent) return;
        document.getElementById("peTitre").value = ent.n || "";
        document.getElementById("peSem").value = String(ent.sem || 1);
        document.getElementById("peJ").value = ent.j;
        document.getElementById("peT1").value = ent.heure || "09:00";
        document.getElementById("peLoc").value = ent.struct || "";
        const peAud = document.getElementById("peAud");
        if (peAud) {
          if (userAud && !canPilot) {
            peAud.value = PA ? PA.normAud(userAud) : userAud;
          } else if (ent.aud) {
            peAud.value = PA ? PA.normAud(ent.aud) : ent.aud;
          }
        }
      };
    }
    if (canSave) {
      document.getElementById("peSave").onclick = () => {
        const p = getPlanning();
        const type = document.getElementById("peType").value;
        const entretienId = document.getElementById("peEntretien") ? document.getElementById("peEntretien").value || e.entretienId || null : e.entretienId || null;
        const audEl = document.getElementById("peAud");
        const aud = audEl ? audEl.value : e.aud;
        const row = metaRo
          ? Object.assign({}, e, { aud: aud })
          : Object.assign({}, e, {
              id: e.id || "ev_" + Math.random().toString(36).slice(2, 10),
              title: document.getElementById("peTitre").value,
              type: type,
              sem: parseInt(document.getElementById("peSem").value, 10),
              startJ: parseInt(document.getElementById("peJ").value, 10),
              endJ: parseInt(document.getElementById("peJ").value, 10),
              startTime: document.getElementById("peT1").value,
              endTime: document.getElementById("peT2").value,
              location: document.getElementById("peLoc").value,
              description: document.getElementById("peDesc").value,
              external: e.external || {},
            });
        if (type === "entretien" || entretienId) {
          row.entretienId = entretienId;
          row.aud = userAud && !canPilot ? (PA ? PA.normAud(userAud) : userAud) : aud;
          row.readonly = !!entretienId;
          const entRef = ents.find((x) => x.id === entretienId) || linkedEnt;
          if (PA && entRef) row.description = "Auditeur " + PA.audLabel(row.aud, App.user) + " · " + (entRef.trame || "");
        }
        if (isNew) p.events.push(row);
        else p.events[idx] = row;
        if (type === "entretien" || entretienId) syncEventToEntretiens(row);
        if (entretienId && aud && canPilot) {
          syncEntretienAud(entretienId, aud)
            .then(() => persistPlanning(p))
            .then(afterPlanningSaved)
            .catch((err) => toast("Affectation", err.message, "err"));
        } else {
          persistPlanning(p).then(afterPlanningSaved).catch((err) => toast("Planning", err.message, "err"));
        }
      };
    }
  }

  function registerPlanningView() {
    VIEWS.planning = function () {
      const v = el("div", { class: "view" });
      const p = getPlanning();
      const ro = App.user && App.user.readOnly;
      const canPilot = App.user && (App.user.role === "admin" || App.user.serverRole === "juliana");

      v.innerHTML =
        pageHead(
          "Pilotage",
          "Planning 4 semaines",
          "Agenda mission éditable — export ICS disponible ; synchronisation Google/Outlook si activée sur le serveur.",
          ro
            ? ""
            : `<button class="btn terra" id="plSave">${svgI('<path d="M20 6 9 17l-5-5"/>')} Enregistrer</button>
             <button class="btn ghost" id="plRebuild">Reconstruire depuis entretiens</button>
             <button class="btn ghost" id="plAddEv">+ Événement</button>`
        ) +
        `<div class="row" style="margin-bottom:18px;align-items:flex-start">
          <div class="col card" style="flex:1.4;min-width:320px"><div class="card-h"><h3>Frise mission</h3><span class="bdg neutral">J0 = ${esc(p.j0)} · J${Store.clockJ >= 0 ? "+" + Store.clockJ : Store.clockJ}</span></div>
          <div class="card-b" id="plGantt"></div></div>
          <div class="col card" style="min-width:280px;flex:1"><div class="card-h"><h3>Synchronisation calendrier</h3></div>
          <div class="card-b stack" id="plSync">
            <div class="note slate" style="font-size:12px" id="plSyncIntro">Abonnez-vous au flux ICS (lecture seule) ou connectez un calendrier si l'administrateur a activé la synchronisation.</div>
            <div id="plSyncBtns"></div>
            <div id="plIcs" class="muted" style="font-size:11px;word-break:break-all"></div>
          </div></div>
        </div>
        <div class="card"><div class="card-h"><h3>Semaines & jalons</h3></div><div class="card-b stack" id="plWeeks"></div></div>
        <div class="card" style="margin-top:16px"><div class="card-h"><h3>Événements (${(p.events || []).length})</h3></div>
        <div class="card-b"><table class="tbl"><thead><tr><th>Date</th><th>Titre</th><th>Type</th><th>Auditeur</th><th>Sem.</th><th></th></tr></thead><tbody id="plEvBody"></tbody></table></div></div>`;

      v.querySelector("#plGantt").innerHTML = ganttFromPlanning();

      const weeksEl = v.querySelector("#plWeeks");
      weeksEl.innerHTML = (p.weeks || [])
        .map(
          (w, i) =>
            `<div class="card pad clk" data-wi="${i}" style="border-left:3px solid ${w.color || "var(--terra)"}">
            <b>S${w.sem} — ${esc(w.titre)}</b>
            <p class="muted" style="font-size:12px;margin:6px 0">${esc(w.objectif || "")}</p>
            <div class="chiprow">${(w.jalons || []).map((j) => `<span class="tag">${esc(j)}</span>`).join("")}</div>
          </div>`
        )
        .join("");
      weeksEl.querySelectorAll("[data-wi]").forEach((card) => {
        card.onclick = () => openWeekEditor(p.weeks[+card.dataset.wi], +card.dataset.wi);
      });

      const evBody = v.querySelector("#plEvBody");
      const sorted = (p.events || []).slice().sort((a, b) => a.startJ - b.startJ || (a.startTime || "").localeCompare(b.startTime || ""));
      evBody.innerHTML =
        sorted
          .map((e, i) => {
            const realIdx = p.events.indexOf(e);
            return `<tr class="clk" data-ei="${realIdx}"><td class="mono">${Store.fmtDate(e.startJ)} ${esc(e.startTime || "")}</td><td><b>${esc(e.title)}</b></td><td><span class="tag">${esc(e.type)}</span></td><td>${e.type === "entretien" || e.entretienId ? audBadge(e.aud) : '<span class="muted">—</span>'}</td><td>S${e.sem}</td>
            <td>${e.external && (e.external.google || e.external.outlook) ? '<span class="bdg ok">sync</span>' : ""}</td></tr>`;
          })
          .join("") || "<tr><td colspan=6 class='muted'>Aucun événement — ajoutez-en ou reconstruisez depuis les entretiens.</td></tr>";
      evBody.querySelectorAll("[data-ei]").forEach((tr) => {
        tr.onclick = () => openEventEditor(p.events[+tr.dataset.ei], +tr.dataset.ei);
      });

      function loadSyncUi() {
        fetch("/api/calendar/status")
          .then((r) => r.json())
          .then((data) => {
            const box = v.querySelector("#plSyncBtns");
            const gOk = data.connections && data.connections.some((c) => c.provider === "google");
            const oOk = data.connections && data.connections.some((c) => c.provider === "outlook");
            const syncReady = data.googleConfigured || data.microsoftConfigured;
            const intro = v.querySelector("#plSyncIntro");
            if (intro) {
              intro.textContent = syncReady
                ? "Connectez Gmail ou Outlook pour pousser le planning. Le flux ICS reste disponible en lecture seule."
                : "Synchronisation Google/Outlook non configurée sur ce serveur. Utilisez le flux ICS ci-dessous ou contactez l'administrateur.";
            }
            const head = v.querySelector(".card-h h3");
            if (head) head.textContent = syncReady ? "Synchronisation calendrier" : "Calendrier (ICS uniquement)";
            let html = "";
            if (!syncReady) {
              html += `<div class="note warn" style="font-size:12px;margin-bottom:8px">Fonctionnalité OAuth désactivée — identifiants Google/Microsoft non renseignés côté serveur.</div>`;
              html += `<div class="note slate" style="font-size:11px;margin-bottom:8px">Les créneaux ajoutés dans Google Agenda <b>ne remontent pas</b> ici. Le planning se gère sur cette plateforme ; Google reçoit une copie via l'abonnement ICS (lecture seule) ou la synchro OAuth (pilotage).</div>`;
            } else {
              if (data.googleConfigured) {
                html += `<button class="btn ghost sm" style="width:100%;margin-bottom:8px" id="plGoogle">${gOk ? "✓ " : ""}Connecter Google Calendar</button>`;
              }
              if (data.microsoftConfigured) {
                html += `<button class="btn ghost sm" style="width:100%;margin-bottom:8px" id="plOutlook">${oOk ? "✓ " : ""}Connecter Outlook</button>`;
              }
              if (gOk || oOk) {
                html += `<button class="btn terra sm" style="width:100%;margin-top:8px" id="plPush">Synchroniser vers mon Google / Outlook</button>`;
              }
            }
            box.innerHTML = html;
            if (data.icsAvailable) {
              const canPilot = App.user && (App.user.role === "admin" || App.user.serverRole === "juliana");
              v.querySelector("#plIcs").innerHTML =
                `<b>Abonnement ICS</b> (Gmail / Outlook)<br>` +
                `<span class="muted" style="font-size:11px">Calendrier serveur : J0 ${esc(p.j0 || "")}. Si Google affiche d'anciennes dates, supprimez l'abonnement puis réimportez le lien.</span><br>` +
                `<span class="muted" style="font-size:11px">Le lien contient un jeton d'accès confidentiel — non affiché ici.</span><br>` +
                (canPilot
                  ? `<button class="btn ghost sm" style="margin-top:6px" id="plCopyIcs">Copier le lien sécurisé</button>`
                  : `<span class="muted" style="font-size:11px">Demandez le lien au pilotage (admin).</span>`);
              const cp = v.querySelector("#plCopyIcs");
              if (cp)
                cp.onclick = () =>
                  fetch("/api/planning/ics-link")
                    .then((r) => {
                      if (!r.ok) throw new Error(String(r.status));
                      return r.json();
                    })
                    .then((d) => {
                      if (d.url && navigator.clipboard) return navigator.clipboard.writeText(d.url).then(() => toast("ICS", "Lien copié (confidentiel)", "ok"));
                      throw new Error("no url");
                    })
                    .catch((e) => toast("ICS", e.message || "Accès refusé", "err"));
            }
            const g = v.querySelector("#plGoogle");
            if (g) g.onclick = () => fetch("/api/calendar/oauth/google/start").then((r) => r.json()).then((d) => (window.location.href = d.url));
            const o = v.querySelector("#plOutlook");
            if (o) o.onclick = () => fetch("/api/calendar/oauth/microsoft/start").then((r) => r.json()).then((d) => (window.location.href = d.url));
            const pu = v.querySelector("#plPush");
            if (pu)
              pu.onclick = () => {
                pu.disabled = true;
                fetch("/api/calendar/sync", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ direction: "push", providers: ["google", "outlook"] }),
                })
                  .then((r) => r.json())
                  .then((res) => {
                    if (res.planning) Store.state.planning4s = res.planning;
                    toast("Sync", JSON.stringify(res.results || res), "ok");
                    App.go("planning");
                  })
                  .catch((e) => toast("Sync", e.message, "err"))
                  .finally(() => (pu.disabled = false));
              };
          })
          .catch(() => {});
      }

      if (window.PORTIA_SERVER_MODE) loadSyncUi();
      else v.querySelector("#plSync").innerHTML += '<div class="note warn">Mode local — sync calendrier disponible en mode serveur.</div>';

      if (!ro) {
        v.querySelector("#plSave") &&
          (v.querySelector("#plSave").onclick = () =>
            persistPlanning(getPlanning()).then(() => toast("Planning", "Enregistré", "ok")));
        v.querySelector("#plRebuild") &&
          (v.querySelector("#plRebuild").onclick = () => {
            if (!confirm("Reconstruire les événements liés aux entretiens (conserve ateliers/COPIL) ?")) return;
            const fn = window.PORTIA_SERVER_MODE
              ? () => fetch("/api/planning/rebuild", { method: "POST" }).then((r) => r.json())
              : () => {
                  const ents = Store.get("entretiens");
                  const manual = getPlanning().events.filter((e) => !e.entretienId);
                  const from = ents.map((e) => ({
                    id: "ev_" + Math.random().toString(36).slice(2, 9),
                    title: e.n,
                    type: "entretien",
                    sem: e.sem,
                    startJ: e.j,
                    endJ: e.j,
                    startTime: e.heure || "09:00",
                    endTime: "10:00",
                    location: e.struct,
                    description: "",
                    entretienId: e.id,
                    aud: e.aud || "A",
                    readonly: true,
                    external: {},
                  }));
                  getPlanning().events = manual.concat(from);
                  return persistPlanning(getPlanning());
                };
            fn().then(() => {
              toast("Planning", "Entretiens importés", "ok");
              App.go("planning");
            });
          });
        v.querySelector("#plAddEv") && (v.querySelector("#plAddEv").onclick = () => openEventEditor(null, -1));
      }

      return v;
    };
    CRUMB.planning = "Planning 4 semaines";
  }

  function patchGantt() {
    window.ganttHTML = ganttFromPlanning;
  }

  function patchNav() {
    if (!window.NAV || !NAV.admin) return;
    const item = { k: "planning", lbl: "Planning 4 sem.", ic: "agenda" };
    if (NAV.admin[0] && !NAV.admin[0].items.some((x) => x.k === "planning")) {
      NAV.admin[0].items.splice(1, 0, item);
    }
    /* Planning éditable + sync calendrier : pilotage uniquement (pas menu auditeur). */
  }

  function patchAllowed() {
    if (!window.PortiaEnterprise) return;
    const orig = App.allowed.bind(App);
    App.allowed = function (k) {
      if (k === "planning") {
        const u = this.user;
        if (u && (u.role === "auditeur" || u.serverRole === "auditeur_b" || u.serverRole === "auditeur_t")) {
          return false;
        }
        return true;
      }
      return orig(k);
    };
  }

  function handleSyncReturn() {
    const q = new URLSearchParams(window.location.search);
    const sync = q.get("planning_sync");
    if (sync === "google_ok") toast("Google Calendar", "Compte connecté", "ok");
    if (sync === "outlook_ok") toast("Outlook", "Compte connecté", "ok");
    if (sync === "err") toast("Calendrier", q.get("msg") || "Erreur", "err");
    if (sync) {
      history.replaceState({}, "", window.location.pathname + window.location.hash || "#planning");
      App.go("planning");
    }
  }

  function loadPlanningFromServer() {
    const requireAuth = !!window.PORTIA_REQUIRE_AUTH;
    const tok =
      (window.PortiaEnterprise && PortiaEnterprise.getToken && PortiaEnterprise.getToken()) ||
      (function () {
        try {
          return sessionStorage.getItem("portia_auth_token") || "";
        } catch (_) {
          return "";
        }
      })();
    if (requireAuth && !tok) return;
    fetch("/api/planning")
      .then((r) => {
        if (r.status === 401) return null;
        return r.ok ? r.json() : null;
      })
      .then((data) => {
        if (data && data.planning && Store.state) Store.state.planning4s = data.planning;
      })
      .catch(() => {});
  }

  function init() {
    registerPlanningView();
    patchGantt();
    patchNav();
    patchAllowed();
    handleSyncReturn();
    if (window.PortiaNav && PortiaNav.GRAPH) {
      PortiaNav.GRAPH.planning = [
        { k: "agenda", l: "Agenda entretiens" },
        { k: "entretiens", l: "Liste entretiens" },
        { k: "cockpit", l: "Cockpit" },
        { k: "cadrage", l: "Cadrage" },
      ];
    }
  }

  window.PortiaPlanning = { init, ganttFromPlanning, getPlanning, loadPlanningFromServer };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
