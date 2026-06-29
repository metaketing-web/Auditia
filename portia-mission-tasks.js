/**
 * Tâches mission (hors relances Data Room) — création pilotage, vue équipe
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

  function isPilotage() {
    const u = App.user;
    if (!u) return false;
    return u.role === "admin" || u.serverRole === "juliana" || u.serverRole === "admin";
  }

  function uid(prefix) {
    return prefix + "_" + Math.random().toString(36).slice(2, 14);
  }

  function ensureStateArrays() {
    if (!Store.state) return;
    if (!Array.isArray(Store.state.tasks)) Store.state.tasks = [];
    if (!Array.isArray(Store.state.notifications)) Store.state.notifications = [];
  }

  function taskDueDate(t) {
    return ((t && (t.dueAt || t.due_at)) || "").slice(0, 10);
  }

  function isOverdue(t) {
    if (!t || t.status !== "open") return false;
    const due = taskDueDate(t);
    if (!due) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(due + "T12:00:00");
    return d < today;
  }

  function fmtDue(due) {
    if (!due) return "—";
    try {
      return new Date(due + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
    } catch (_) {
      return due;
    }
  }

  const DEFAULT_CHECKLIST_JOUR = [
    "Relire la trame d'entretien avant la réunion",
    "Enregistrer le CR et qualifier la source (déclaratif / documenté / observé)",
    "Verser les pièces dans la Data Room avec le bon répertoire",
    "Mettre à jour les observations et constats liés",
  ];

  function auditorCode() {
    if (window.PortiaAuditors) return PortiaAuditors.auditorCodeFromUser(App.user);
    const sr = App.user && App.user.serverRole;
    if (sr === "auditeur_b") return "A";
    if (sr === "auditeur_t") return "L";
    return null;
  }

  function getChecklistTasks(code) {
    const c = code || auditorCode();
    if (!c) return [];
    return (Store.state.tasks || [])
      .filter((t) => t.type === "checklist_jour" && t.assignedTo === c && t.status !== "cancelled")
      .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
  }

  function hasChecklistTasks() {
    return (Store.state.tasks || []).some((t) => t.type === "checklist_jour" && t.status !== "cancelled");
  }

  async function ensureChecklistSeed() {
    if (!isPilotage() || hasChecklistTasks()) return;
    for (const target of ["A", "L"]) {
      for (const title of DEFAULT_CHECKLIST_JOUR) {
        await createMissionTask({
          title,
          assignedTo: [target],
          taskType: "checklist_jour",
          sourceView: "checklist_jour",
          notifyAuditors: false,
        });
      }
    }
  }

  async function renderHubChecklist(chkEl, linkBtn) {
    if (!chkEl) return;
    const code = auditorCode();
    const list = getChecklistTasks(code);
    if (linkBtn) {
      linkBtn.style.display = "";
      linkBtn.onclick = () => App.go("taches");
    }
    if (!list.length) {
      chkEl.innerHTML = `<p class="muted" style="font-size:13px">Aucune ligne — le pilotage configure la checklist dans <b>Tâches équipe</b>.</p>`;
      return;
    }
    chkEl.innerHTML = list
      .map(
        (t) =>
          `<label style="display:flex;gap:10px;align-items:flex-start;font-size:13px;opacity:${t.status === "done" ? "0.7" : "1"}">
            <input type="checkbox" data-task="${t.id}" ${t.status === "done" ? "checked" : ""}>
            <span>${esc(t.title)}</span>
          </label>`
      )
      .join("");
    chkEl.querySelectorAll('input[type="checkbox"][data-task]').forEach((inp) => {
      inp.onchange = async () => {
        try {
          await patchTaskStatus(inp.dataset.task, inp.checked ? "done" : "open");
          if (App.route === "hub_auditeur") App.refresh();
          else if (App.route === "taches") App.refresh();
        } catch (e) {
          toast("Checklist", String(e.message || e), "err");
          inp.checked = !inp.checked;
        }
      };
    });
  }

  function openEditChecklistModal(task) {
    if (!task || !isPilotage()) return;
    Modal.open(
      `<div class="modal-h"><div class="ic" style="background:var(--terra-soft);color:var(--terra-deep)">${svgI(ICON.agenda)}</div>
      <div><div class="eyebrow">Checklist du jour</div><h2 style="font-size:16px">Modifier la ligne</h2></div>
      <button class="x" onclick="Modal.close()">${svgI('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div>
      <div class="modal-b stack">
        <div class="frow"><label>Intitulé</label><input id="clEditTitle" type="text" value="${esc(task.title)}"></div>
        <div class="frow"><label>Notes</label><textarea id="clEditNotes" rows="2">${esc(task.notes || "")}</textarea></div>
      </div>
      <div class="modal-f">
        <button class="btn ghost" onclick="Modal.close()">Annuler</button>
        <button class="btn terra" id="clEditSave">Enregistrer</button>
      </div>`,
      true
    );
    $("#clEditSave").onclick = async () => {
      try {
        await patchTaskMeta(task.id, {
          title: $("#clEditTitle").value,
          notes: $("#clEditNotes").value,
        });
        Modal.close();
        toast("Checklist", "Ligne mise à jour", "ok");
        App.refresh();
      } catch (e) {
        toast("Checklist", String(e.message || e), "err");
      }
    };
  }

  async function patchTaskMeta(taskId, fields) {
    if (window.PORTIA_SERVER_MODE) {
      const r = await apiFetch("/api/tasks/" + encodeURIComponent(taskId), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!r.ok) throw new Error("Mise à jour impossible");
      const data = await r.json();
      const t = (Store.state.tasks || []).find((x) => x.id === taskId);
      if (t && data.task) Object.assign(t, data.task);
      return data;
    }
    const t = (Store.state.tasks || []).find((x) => x.id === taskId);
    if (t) {
      if (fields.title != null) t.title = fields.title.trim();
      if (fields.notes != null) t.notes = fields.notes.trim();
      t.updatedAt = new Date().toISOString();
    }
    Store.save();
  }

  function audLabel(code) {
    return window.PortiaAuditors ? PortiaAuditors.audLabel(code) : code;
  }

  function openTaskDetail(task) {
    if (window.PortiaRelances && PortiaRelances.openTaskDetail) {
      PortiaRelances.openTaskDetail(task);
    }
  }

  function createLocalMissionTask(payload) {
    ensureStateArrays();
    const title = (payload.title || "").trim();
    if (!title) throw new Error("Intitulé obligatoire");
    const taskType = payload.taskType === "checklist_jour" ? "checklist_jour" : "mission";
    const assigned = payload.assignedTo && payload.assignedTo.length ? payload.assignedTo : ["A", "L"];
    const ts = new Date().toISOString();
    const author = (App.user && App.user.name) || "Pilotage";
    const due = (payload.dueAt || "").slice(0, 10);
    const tasks = [];
    const notifs = [];
    assigned.forEach((target) => {
      const task = {
        id: uid("task"),
        type: taskType,
        title,
        assignedTo: target,
        status: "open",
        priority: payload.priority === "high" ? "high" : "normal",
        dueAt: due,
        notes: (payload.notes || "").trim(),
        sourceView: payload.sourceView || "",
        createdAt: ts,
        createdBy: author,
      };
      Store.state.tasks.unshift(task);
      tasks.push(task);
      if (payload.notifyAuditors !== false && taskType !== "checklist_jour") {
        const notif = {
          id: uid("notif"),
          target,
          type: "mission_task",
          title: `Tâche mission — ${title}`,
          body: "Nouvelle tâche assignée — suivi dans Mes tâches." + (due ? ` Échéance : ${fmtDue(due)}.` : ""),
          taskId: task.id,
          read: false,
          createdAt: ts,
        };
        Store.state.notifications.unshift(notif);
        notifs.push(notif);
      }
    });
    if (window.portiaApi && portiaApi.saveState) portiaApi.saveState();
    else Store.save();
    return { ok: true, tasks, notifications: notifs };
  }

  async function createMissionTask(payload) {
    if (window.PORTIA_SERVER_MODE) {
      const r = await apiFetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.detail || "Création impossible");
      }
      const result = await r.json();
      ensureStateArrays();
      (result.tasks || []).forEach((t) => Store.state.tasks.unshift(t));
      (result.notifications || []).forEach((n) => Store.state.notifications.unshift(n));
      if (window.portiaApi && portiaApi.saveState) await portiaApi.saveState();
      return result;
    }
    return createLocalMissionTask(payload);
  }

  function openCreateModal(opts) {
    opts = opts || {};
    if (!isPilotage() || (App.user && App.user.readOnly)) {
      toast("Tâche", "Réservé au pilotage", "warn");
      return;
    }
    const defaultTitle = opts.defaultTitle || "";
    const sourceView = opts.sourceView || opts.source || "manual";
    const preChecklist = !!opts.isChecklistJour;

    Modal.open(
      `<div class="modal-h"><div class="ic" style="background:var(--terra-soft);color:var(--terra-deep)">${svgI(ICON.agenda || ICON.conduct)}</div>
      <div><div class="eyebrow">Pilotage · Tâche équipe</div><h2 style="font-size:16px">Nouvelle tâche</h2></div>
      <button class="x" onclick="Modal.close()">${svgI('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div>
      <div class="modal-b stack" style="gap:14px">
        <div class="frow"><label>Intitulé <span class="muted">(obligatoire)</span></label>
          <input id="mtTitle" type="text" placeholder="Ex. Préparer entretien DSI" value="${esc(defaultTitle)}"></div>
        <div class="frow"><label>Échéance <span class="muted">(optionnelle)</span></label>
          <input id="mtDue" type="date"></div>
        <div class="frow"><label>Priorité</label>
          <select id="mtPri" class="fselect"><option value="normal">Normale</option><option value="high">Urgente</option></select></div>
        <div class="frow"><label>Notes</label>
          <textarea id="mtNotes" rows="2" placeholder="Contexte, livrable attendu…"></textarea></div>
        <div class="frow"><label>Type</label>
          <label style="display:flex;gap:8px;align-items:center;font-size:13px;margin-top:6px">
            <input type="checkbox" id="mtChecklistJour"> Ligne <b>Checklist du jour</b> (affichée sur Mon espace auditeur)
          </label></div>
        <div class="frow"><label>Assigner à</label>
          <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:6px">
            <label style="display:flex;gap:6px;align-items:center;font-size:13px"><input type="checkbox" id="mtAudA" checked> Asse (A)</label>
            <label style="display:flex;gap:6px;align-items:center;font-size:13px"><input type="checkbox" id="mtAudL" checked> Laetitia (L)</label>
          </div></div>
      </div>
      <div class="modal-f">
        <button class="btn ghost" onclick="Modal.close()">Annuler</button>
        <button class="btn terra" id="mtSubmit">${svgI('<path d="M20 6 9 17l-5-5"/>')} Créer la tâche</button>
      </div>`,
      true
    );

    if (preChecklist && $("#mtChecklistJour")) $("#mtChecklistJour").checked = true;

    const submit = $("#mtSubmit");
    if (!submit) return;
    submit.onclick = async () => {
      const title = ($("#mtTitle") && $("#mtTitle").value || "").trim();
      if (!title) {
        toast("Tâche", "Intitulé obligatoire", "warn");
        return;
      }
      const assigned = [];
      if ($("#mtAudA") && $("#mtAudA").checked) assigned.push("A");
      if ($("#mtAudL") && $("#mtAudL").checked) assigned.push("L");
      if (!assigned.length) {
        toast("Tâche", "Sélectionnez au moins un auditeur", "warn");
        return;
      }
      submit.disabled = true;
      const isChecklist = $("#mtChecklistJour") && $("#mtChecklistJour").checked;
      try {
        const result = await createMissionTask({
          title,
          assignedTo: assigned,
          dueAt: $("#mtDue") ? $("#mtDue").value : "",
          priority: $("#mtPri") ? $("#mtPri").value : "normal",
          notes: $("#mtNotes") ? $("#mtNotes").value : "",
          sourceView: isChecklist ? "checklist_jour" : sourceView,
          taskType: isChecklist ? "checklist_jour" : "mission",
          notifyAuditors: !isChecklist,
        });
        Modal.close();
        toast("Tâche créée", `${(result.tasks || []).length} assignation(s)`, "ok");
        if (window.PortiaRelances && PortiaRelances.updateNotifBadge) PortiaRelances.updateNotifBadge();
        if (["taches", "taches_equipe", "entretiens", "planning"].includes(App.route)) App.refresh();
      } catch (e) {
        toast("Tâche", String(e.message || e), "err");
        submit.disabled = false;
      }
    };
  }

  async function patchTaskStatus(taskId, status) {
    if (window.PortiaRelances && PortiaRelances.patchTaskStatus) {
      return PortiaRelances.patchTaskStatus(taskId, status);
    }
    if (window.PORTIA_SERVER_MODE) {
      const r = await apiFetch("/api/tasks/" + encodeURIComponent(taskId), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error("Mise à jour impossible");
      const data = await r.json();
      const t = (Store.state.tasks || []).find((x) => x.id === taskId);
      if (t && data.task) Object.assign(t, data.task);
      return data;
    }
    const t = (Store.state.tasks || []).find((x) => x.id === taskId);
    if (t) {
      t.status = status;
      t.updatedAt = new Date().toISOString();
    }
    Store.save();
  }

  function renderChecklistBlock(ro) {
    const itemsA = getChecklistTasks("A");
    const itemsL = getChecklistTasks("L");
    const row = (t) =>
      `<div style="display:flex;gap:8px;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:13px;${t.status === "done" ? "opacity:0.65;text-decoration:line-through" : ""}">${esc(t.title)}</span>
        ${!ro ? `<button class="btn ghost sm cl-edit" data-id="${t.id}" title="Modifier">✎</button>` : ""}
      </div>`;
    return `<div class="card" style="margin-bottom:14px">
      <div class="card-h"><h3>Checklist du jour</h3>
        <div class="actions">${!ro ? `<button class="btn ghost sm" id="clAdd">+ Ligne</button>${!hasChecklistTasks() ? `<button class="btn ghost sm" id="clSeed">Modèle par défaut</button>` : ""}` : ""}</div>
      </div>
      <div class="card-b" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px">
        <div><div class="eyebrow" style="margin-bottom:8px">Asse (A)</div>${itemsA.length ? itemsA.map(row).join("") : '<p class="muted" style="font-size:12px">Aucune ligne</p>'}</div>
        <div><div class="eyebrow" style="margin-bottom:8px">Laetitia (L)</div>${itemsL.length ? itemsL.map(row).join("") : '<p class="muted" style="font-size:12px">Aucune ligne</p>'}</div>
      </div>
      <div class="card-f muted" style="font-size:12px;padding:10px 14px">Les lignes cochées par l'auditeur sur <b>Mon espace</b> ou dans <b>Mes tâches</b> sont synchronisées ici.</div>
    </div>`;
  }

  function wireChecklistBlock(v, ro) {
    const add = v.querySelector("#clAdd");
    if (add) add.onclick = () => openCreateModal({ sourceView: "checklist_jour", isChecklistJour: true });
    const seed = v.querySelector("#clSeed");
    if (seed) {
      seed.onclick = async () => {
        seed.disabled = true;
        try {
          await ensureChecklistSeed();
          toast("Checklist", "Modèle par défaut créé pour A et L", "ok");
          App.refresh();
        } catch (e) {
          toast("Checklist", String(e.message || e), "err");
          seed.disabled = false;
        }
      };
    }
    v.querySelectorAll(".cl-edit").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const t = (Store.state.tasks || []).find((x) => x.id === btn.dataset.id);
        if (t) openEditChecklistModal(t);
      };
    });
  }

  function renderTachesEquipeView() {
    const v = el("div", { class: "view" });
    const f = { status: "open", type: "all", assignee: "all", overdue: false };
    const ro = App.user && App.user.readOnly;
    const openCount = (Store.state.tasks || []).filter((t) => t.status === "open").length;
    const overdueCount = (Store.state.tasks || []).filter((t) => isOverdue(t)).length;

    v.innerHTML =
      pageHead(
        "Pilotage · Suivi équipe",
        "Tâches équipe",
        "Relances documentaires et tâches mission — création, réouverture et suivi des échéances.",
        ro
          ? ""
          : `<button class="btn terra" id="teCreate">${svgI('<path d="M12 5v14M5 12h14"/>')} Nouvelle tâche</button>`
      ) +
      `<div class="kpis" style="margin-bottom:14px;grid-template-columns:repeat(auto-fit,minmax(140px,1fr))">
        <div class="kpi"><div class="lbl">Ouvertes</div><div class="val">${openCount}</div></div>
        <div class="kpi"><div class="lbl">En retard</div><div class="val" style="color:var(--crit)">${overdueCount}</div></div>
      </div>
      ${renderChecklistBlock(ro)}
      <div class="fbar" style="margin-bottom:14px;flex-wrap:wrap">
        <div class="seg" id="teStatut">${[["open", "Ouvertes"], ["done", "Terminées"], ["all", "Toutes"]]
          .map(([k, l], i) => `<button data-v="${k}" class="${i === 0 ? "on" : ""}">${l}</button>`)
          .join("")}</div>
        <div class="seg" id="teType">${[["all", "Tous types"], ["mission", "Mission"], ["checklist_jour", "Checklist jour"], ["relance_doc", "Relances"]]
          .map(([k, l], i) => `<button data-v="${k}" class="${i === 0 ? "on" : ""}">${l}</button>`)
          .join("")}</div>
        <select class="fselect" id="teAssign"><option value="all">Tous</option><option value="A">Asse</option><option value="L">Laetitia</option></select>
        <label class="tag" style="cursor:pointer;display:flex;gap:6px;align-items:center"><input type="checkbox" id="teOverdue"> En retard seulement</label>
      </div>
      <div class="card"><table class="tbl"><thead><tr><th>Tâche</th><th>Type</th><th>Échéance</th><th>Assigné</th><th>Statut</th><th></th></tr></thead><tbody id="teBody"></tbody></table></div>`;

    const body = v.querySelector("#teBody");

    function taskTypeLabel(t) {
      if (t.type === "relance_doc") return "Relance";
      if (t.type === "checklist_jour") return "Checklist jour";
      return "Mission";
    }

    function render() {
      let list = (Store.state.tasks || []).slice();
      if (f.status !== "all") list = list.filter((t) => t.status === f.status);
      if (f.type !== "all") list = list.filter((t) => (t.type || "relance_doc") === f.type);
      if (f.assignee !== "all") list = list.filter((t) => t.assignedTo === f.assignee || t.assignedTo === "A+L");
      if (f.overdue) list = list.filter((t) => isOverdue(t));

      body.innerHTML =
        list
          .map((t) => {
            const overdue = isOverdue(t);
            const st =
              t.status === "done"
                ? '<span class="bdg ok">Terminée</span>'
                : t.status === "cancelled"
                  ? '<span class="bdg muted">Annulée</span>'
                  : overdue
                    ? '<span class="bdg crit">En retard</span>'
                    : '<span class="bdg warn">Ouverte</span>';
            const pri = t.priority === "high" ? ' <span class="bdg crit" style="font-size:10px">Urgent</span>' : "";
            const due = taskDueDate(t);
            return `<tr class="clk" data-task="${t.id}" style="${overdue ? "background:var(--crit-soft)" : ""}">
            <td><b style="font-size:12.5px">${esc(t.title)}</b>${pri}${t.notes ? `<br><span class="muted" style="font-size:11px">${esc(t.notes.slice(0, 80))}</span>` : ""}</td>
            <td><span class="tag">${taskTypeLabel(t)}</span></td>
            <td class="mono" style="font-size:11.5px">${fmtDue(due)}</td>
            <td>${audLabel(t.assignedTo)}</td>
            <td>${st}</td>
            <td style="white-space:nowrap">
              ${!ro && t.status === "open" ? `<button class="btn ghost sm te-done" data-id="${t.id}">✓</button>` : ""}
              ${!ro && t.status === "done" ? `<button class="btn ghost sm te-reopen" data-id="${t.id}" title="Rouvrir">↺</button>` : ""}
              ${!ro && t.status === "open" && (t.type === "mission" || t.type === "checklist_jour") ? `<button class="btn ghost sm te-cancel" data-id="${t.id}" title="Annuler">×</button>` : ""}
            </td></tr>`;
          })
          .join("") ||
        `<tr><td colspan="6" class="muted" style="padding:24px;text-align:center">Aucune tâche</td></tr>`;

      body.querySelectorAll("tr[data-task]").forEach((tr) => {
        tr.onclick = (e) => {
          if (e.target.closest("button")) return;
          const t = (Store.state.tasks || []).find((x) => x.id === tr.dataset.task);
          if (t) openTaskDetail(t);
        };
      });
      body.querySelectorAll(".te-done").forEach((btn) => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          try {
            await patchTaskStatus(btn.dataset.id, "done");
            toast("Tâche terminée", "", "ok");
            render();
          } catch (err) {
            toast("Erreur", String(err.message || err), "err");
          }
        };
      });
      body.querySelectorAll(".te-reopen").forEach((btn) => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          try {
            await patchTaskStatus(btn.dataset.id, "open");
            toast("Tâche rouverte", "", "ok");
            render();
          } catch (err) {
            toast("Erreur", String(err.message || err), "err");
          }
        };
      });
      body.querySelectorAll(".te-cancel").forEach((btn) => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          try {
            await patchTaskStatus(btn.dataset.id, "cancelled");
            toast("Tâche annulée", "", "ok");
            render();
          } catch (err) {
            toast("Erreur", String(err.message || err), "err");
          }
        };
      });
    }

    const createBtn = v.querySelector("#teCreate");
    if (createBtn) createBtn.onclick = () => openCreateModal({ sourceView: "taches_equipe" });

    v.querySelector("#teStatut").onclick = (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      f.status = b.dataset.v;
      v.querySelectorAll("#teStatut button").forEach((x) => x.classList.toggle("on", x === b));
      render();
    };
    v.querySelector("#teType").onclick = (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      f.type = b.dataset.v;
      v.querySelectorAll("#teType button").forEach((x) => x.classList.toggle("on", x === b));
      render();
    };
    v.querySelector("#teAssign").onchange = (e) => {
      f.assignee = e.target.value;
      render();
    };
    v.querySelector("#teOverdue").onchange = (e) => {
      f.overdue = e.target.checked;
      render();
    };
    wireChecklistBlock(v, ro);
    render();
    return v;
  }

  function patchEntretiensView() {
    const orig = VIEWS.entretiens;
    if (!orig || VIEWS._missionTasksEnt) return;
    VIEWS.entretiens = function () {
      const v = orig();
      if (!isPilotage() || (App.user && App.user.readOnly)) return v;
      const fbar = v.querySelector(".fbar");
      if (fbar && !fbar.querySelector("#enNewTask")) {
        const btn = document.createElement("button");
        btn.id = "enNewTask";
        btn.className = "btn ghost";
        btn.innerHTML = `${svgI('<path d="M12 5v14M5 12h14"/>', "")} Tâche équipe`;
        btn.onclick = () => openCreateModal({ sourceView: "entretiens" });
        fbar.appendChild(btn);
      }
      return v;
    };
    VIEWS._missionTasksEnt = true;
  }

  function patchPlanningView() {
    const orig = VIEWS.planning;
    if (!orig || VIEWS._missionTasksPl) return;
    VIEWS.planning = function () {
      const v = orig();
      if (!isPilotage() || (App.user && App.user.readOnly)) return v;
      const head = v.querySelector(".ph .actions");
      if (head && !head.querySelector("#plNewTask")) {
        const btn = document.createElement("button");
        btn.id = "plNewTask";
        btn.className = "btn ghost";
        btn.innerHTML = `${svgI('<path d="M12 5v14M5 12h14"/>', "")} Tâche équipe`;
        btn.onclick = () => openCreateModal({ sourceView: "planning" });
        head.insertBefore(btn, head.firstChild);
      }
      return v;
    };
    VIEWS._missionTasksPl = true;
  }

  function registerNav() {
    if (!window.NAV || !NAV.admin) return;
    const sec = NAV.admin.find((s) => s.sec === "Pilotage");
    if (!sec) return;
    if (!sec.items.some((i) => i.k === "taches_equipe")) {
      const idx = sec.items.findIndex((i) => i.k === "planning");
      const item = {
        k: "taches_equipe",
        lbl: "Tâches équipe",
        ic: "tasks",
        ct: () => {
          const open = (Store.state.tasks || []).filter((t) => t.status === "open").length;
          const late = (Store.state.tasks || []).filter((t) => t.status === "open" && isOverdue(t)).length;
          return late || open || null;
        },
      };
      sec.items.splice(idx >= 0 ? idx + 1 : 3, 0, item);
    }
    if (window.CRUMB) CRUMB.taches_equipe = "Tâches équipe";
  }

  function init() {
    registerNav();
    patchEntretiensView();
    patchPlanningView();
    VIEWS.taches_equipe = renderTachesEquipeView;
    window.PortiaMissionTasks = {
      init,
      openCreateModal,
      createMissionTask,
      renderHubChecklist,
      openEditChecklistModal,
      patchTaskMeta,
      getChecklistTasks,
      isOverdue,
      taskDueDate,
      fmtDue,
    };
  }

  window.PortiaMissionTasks = { init };
})();
