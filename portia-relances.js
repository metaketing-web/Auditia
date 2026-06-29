/**
 * Relances Data Room — modèle mail, tâches auditeurs, notifications
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

  function myTarget() {
    const PA = window.PortiaAuditors;
    if (PA) return PA.auditorCodeFromUser(App.user);
    const sr = App.user && App.user.serverRole;
    if (sr === "auditeur_b") return "A";
    if (sr === "auditeur_t") return "L";
    return null;
  }

  function isPilotage() {
    return App.user && (App.user.role === "admin" || App.user.role === "cabinet");
  }

  function ensureStateArrays() {
    if (!Store.state) return;
    if (!Array.isArray(Store.state.tasks)) Store.state.tasks = [];
    if (!Array.isArray(Store.state.notifications)) Store.state.notifications = [];
  }

  function getTasks(filterMine) {
    ensureStateArrays();
    const tasks = Store.state.tasks || [];
    if (!filterMine || isPilotage()) return tasks;
    const t = myTarget();
    if (!t) return tasks;
    return tasks.filter((x) => x.assignedTo === t || x.assignedTo === "A+L");
  }

  function getNotifications(filterMine) {
    ensureStateArrays();
    const notifs = Store.state.notifications || [];
    if (!filterMine || isPilotage()) return notifs;
    const t = myTarget();
    if (!t) return notifs;
    return notifs.filter((n) => n.target === t || n.target === "all" || n.target === "pilotage");
  }

  function unreadCount() {
    return getNotifications(true).filter((n) => !n.read).length;
  }

  function fmtRelanceDate(iso) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (_) {
      return iso.slice(0, 16).replace("T", " ");
    }
  }

  function repChecklistId(repId) {
    const r = (window.DATAROOM_REPS || []).find((x) => x.id === repId);
    return r ? r.chk || r.checklistId || "" : "";
  }

  function checklistOptions(repId, selected) {
    const cid = repChecklistId(repId);
    const cl = (Store.state && Store.state.checklists) || window.CHECKLISTS || [];
    const block = cl.find((c) => c.id === cid);
    if (!block) return `<option value="">— Checklist ${esc(cid || "?")} —</option>`;
    const sel = selected || "";
    return (
      `<option value="">— Ligne checklist (auto si vide) —</option>` +
      block.items
        .map((it) => `<option value="${esc(it.t)}" ${sel === it.t ? "selected" : ""}>${esc(it.t)}</option>`)
        .join("")
    );
  }

  function buildLocalEmail(doc, checklistItem, relanceNumber, customNote) {
    const rep = (window.DATAROOM_REPS || []).find((r) => r.id === doc.rep) || {};
    const chkId = rep.chk || repChecklistId(doc.rep) || "—";
    const dt = new Date().toLocaleString("fr-FR", { timeZone: "UTC" }) + " UTC";
    const desc = doc.desc || "document";
    const subject = `[PNIPM] Relance n°${relanceNumber} — Pièce Data Room ${desc} (${doc.rep})`;
    const lines = [
      "Madame, Monsieur,",
      "",
      "Dans le cadre de la mission d'audit de cadrage PNIPM (MPJIPSC), merci de nous transmettre la pièce suivante :",
      "",
      `• Répertoire : ${doc.rep} — ${rep.n || rep.name || doc.rep}`,
      `• Checklist : ${chkId}` + (checklistItem ? ` — ${checklistItem}` : ""),
      `• Document : ${desc}`,
      `• Source : ${doc.source || "—"}`,
      "",
      `Relance n° ${relanceNumber} — ${dt}`,
      "",
      "Merci de verser la pièce sous 72 h ouvrées ou de nous indiquer les contraintes.",
    ];
    if (customNote && customNote.trim()) lines.push("", "Précision :", customNote.trim());
    lines.push("", "Cordialement,", (App.user && App.user.name) || "Equipe audit Skydeen");
    const body = lines.join("\n");
    const mailto = "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    return { subject, body, mailto };
  }

  function uid(prefix) {
    return prefix + "_" + Math.random().toString(36).slice(2, 14);
  }

  function createLocalRelance(docId, opts) {
    ensureStateArrays();
    const doc = Store.find("docs", docId);
    if (!doc) throw new Error("Document introuvable");
    if (doc.statut === "verse") throw new Error("Document déjà versé");
    if (doc.statut === "a_verifier") throw new Error("Document déjà déposé — en attente de validation");
    const count = (doc.relanceCount || 0) + 1;
    const ts = new Date().toISOString();
    const author = (App.user && App.user.name) || "Pilotage";
    const assigned = opts.assignedTo && opts.assignedTo.length ? opts.assignedTo : ["A", "L"];
    const clItem = (opts.checklistItem || doc.checklistItem || "").trim();
    const email = buildLocalEmail(doc, clItem, count, opts.customNote || "");

    const entry = {
      id: uid("rl"),
      at: ts,
      by: author,
      number: count,
      assignedTo: assigned,
      checklistItem: clItem,
      note: (opts.customNote || "").trim(),
      emailSubject: email.subject,
    };
    const history = (doc.relanceHistory || []).slice();
    history.push(entry);

    Store.patch("docs", docId, {
      statut: "relance",
      relanceCount: count,
      lastRelanceAt: ts,
      relanceHistory: history,
      checklistItem: clItem,
    });

    const tasks = [];
    const notifs = [];
    assigned.forEach((target) => {
      const task = {
        id: uid("task"),
        type: "relance_doc",
        title: `Relance ${count} — ${doc.desc}`,
        docId: docId,
        rep: doc.rep,
        source: doc.source,
        checklistId: repChecklistId(doc.rep),
        checklistItem: clItem,
        assignedTo: target,
        status: "open",
        priority: count >= 2 ? "high" : "normal",
        relanceCount: count,
        lastRelanceAt: ts,
        createdAt: ts,
        createdBy: author,
        emailSubject: email.subject,
        emailBody: email.body,
        notes: (opts.customNote || "").trim(),
        relanceId: entry.id,
      };
      Store.state.tasks.unshift(task);
      tasks.push(task);
      if (opts.notifyAuditors !== false && (!window.PortiaNotifPrefs || PortiaNotifPrefs.shouldCreateNotif("relance_doc"))) {
        const notif = {
          id: uid("notif"),
          target,
          type: "relance_doc",
          title: `Relance Data Room — ${doc.source} / ${doc.desc}`,
          body: `Relance n°${count} enregistrée (${doc.rep}). Suivi dans Mes tâches.`,
          docId: docId,
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
    return { ok: true, doc: Store.find("docs", docId), email, relance: entry, tasks, notifications: notifs };
  }

  function openRelanceModal(docId) {
    const doc = Store.find("docs", docId);
    if (!doc) {
      toast("Relance", "Document introuvable", "err");
      return;
    }
    if (doc.statut === "verse") {
      toast("Relance", "Document déjà versé — relance non applicable", "warn");
      return;
    }
    if (doc.statut === "a_verifier") {
      toast("Relance", "Document déjà déposé — en attente de validation auditeur", "warn");
      return;
    }
    const nextNum = (doc.relanceCount || 0) + 1;
    const ro = App.user && App.user.readOnly;
    const preview = buildLocalEmail(doc, doc.checklistItem || "", nextNum, "");

    Modal.open(
      `<div class="modal-h"><div class="ic" style="background:var(--gold-soft);color:#7a5a14">${svgI('<path d="M4 4h16v16H4z"/><path d="M22 6l-10 7L2 6"/>')}</div>
      <div style="min-width:0"><div class="eyebrow">Data Room · Relance n°${nextNum}</div><h2 style="font-size:16px">${esc(docName(doc))}</h2></div>
      <button class="x" onclick="Modal.close()">${svgI('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div>
      <div class="modal-b stack" style="gap:14px">
        <div class="note slate" style="font-size:12.5px;line-height:1.5">
          <b>${esc(doc.rep)}</b> · ${esc(doc.source)} · Checklist <b class="mono">${esc(repChecklistId(doc.rep))}</b>
          ${doc.relanceCount ? `<br>Dernière relance : ${fmtRelanceDate(doc.lastRelanceAt)} (${doc.relanceCount} au total)` : ""}
        </div>
        <div class="frow"><label>Ligne checklist liée</label>
          <select id="rlChkItem" class="fselect">${checklistOptions(doc.rep, doc.checklistItem)}</select></div>
        <div class="frow"><label>Précision (optionnelle)</label>
          <textarea id="rlNote" rows="2" placeholder="Délai, format attendu, contact…"></textarea></div>
        <div class="frow"><label>Notifier les auditeurs</label>
          <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:6px">
            <label style="display:flex;gap:6px;align-items:center;font-size:13px"><input type="checkbox" id="rlAudA" checked> Asse (A)</label>
            <label style="display:flex;gap:6px;align-items:center;font-size:13px"><input type="checkbox" id="rlAudL" checked> Laetitia (L)</label>
          </div>
          <p class="muted" style="font-size:11.5px;margin-top:6px">Crée une tâche dans « Mes tâches » et une notification pour chaque auditeur coché.</p>
        </div>
        <div class="frow"><label>Aperçu du mail</label>
          <pre id="rlPreview" style="white-space:pre-wrap;font-size:11.5px;line-height:1.45;background:var(--bg-2);border:1px solid var(--line);border-radius:var(--r-sm);padding:12px;max-height:220px;overflow:auto;margin:0">${esc(preview.body)}</pre></div>
      </div>
      <div class="modal-f">
        <button class="btn ghost" onclick="Modal.close()">Annuler</button>
        ${ro ? "" : `<button class="btn ghost" id="rlMailto">${svgI('<path d="M4 4h16v16H4z"/>')} Ouvrir dans le mail</button>`}
        ${ro ? "" : `<button class="btn terra" id="rlSubmit">${svgI('<path d="M4 4h16v16H4z"/>')} Enregistrer la relance</button>`}
      </div>`,
      true
    );

    function refreshPreview() {
      const cl = $("#rlChkItem") ? $("#rlChkItem").value : "";
      const note = $("#rlNote") ? $("#rlNote").value : "";
      const em = buildLocalEmail(doc, cl, nextNum, note);
      const pre = $("#rlPreview");
      if (pre) pre.textContent = em.body;
      return em;
    }

    const chkSel = $("#rlChkItem");
    const noteEl = $("#rlNote");
    if (chkSel) chkSel.onchange = refreshPreview;
    if (noteEl) noteEl.oninput = refreshPreview;

    const mailBtn = $("#rlMailto");
    if (mailBtn) {
      mailBtn.onclick = () => {
        const em = refreshPreview();
        window.open(em.mailto, "_blank");
      };
    }

    const submitBtn = $("#rlSubmit");
    if (submitBtn) {
      submitBtn.onclick = async () => {
        const assigned = [];
        if ($("#rlAudA") && $("#rlAudA").checked) assigned.push("A");
        if ($("#rlAudL") && $("#rlAudL").checked) assigned.push("L");
        if (!assigned.length) {
          toast("Relance", "Sélectionnez au moins un auditeur", "warn");
          return;
        }
        submitBtn.disabled = true;
        const payload = {
          assignedTo: assigned,
          customNote: noteEl ? noteEl.value : "",
          checklistItem: chkSel ? chkSel.value : "",
          notifyAuditors: true,
        };
        try {
          let result;
          if (window.PORTIA_SERVER_MODE) {
            const r = await apiFetch("/api/dataroom/docs/" + encodeURIComponent(docId) + "/relance", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (!r.ok) {
              const err = await r.json().catch(() => ({}));
              throw new Error(err.detail || "Erreur serveur " + r.status);
            }
            result = await r.json();
            if (result.doc) Store.patch("docs", docId, result.doc);
            ensureStateArrays();
            (result.tasks || []).forEach((t) => Store.state.tasks.unshift(t));
            (result.notifications || []).forEach((n) => Store.state.notifications.unshift(n));
            if (window.portiaApi && portiaApi.loadDataroomDocs) await portiaApi.loadDataroomDocs();
          } else {
            result = createLocalRelance(docId, payload);
          }
          Modal.close();
          toast("Relance enregistrée", `Relance n°${result.relance.number} — tâches créées pour ${assigned.join(", ")}`, "ok");
          updateNotifBadge();
          if (App.route === "dataroom" || App.route === "taches") App.refresh();
        } catch (e) {
          toast("Relance", String(e.message || e), "err");
          submitBtn.disabled = false;
        }
      };
    }
  }

  async function patchTaskStatus(taskId, status) {
    if (window.PORTIA_SERVER_MODE) {
      const r = await apiFetch("/api/tasks/" + encodeURIComponent(taskId), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error("Mise à jour tâche impossible");
      const data = await r.json();
      const t = Store.state.tasks.find((x) => x.id === taskId);
      if (t && data.task) Object.assign(t, data.task);
    } else {
      const t = Store.state.tasks.find((x) => x.id === taskId);
      if (t) {
        t.status = status;
        t.updatedAt = new Date().toISOString();
      }
      Store.save();
    }
  }

  async function markNotifRead(notifId) {
    if (window.PORTIA_SERVER_MODE) {
      await apiFetch("/api/notifications/" + encodeURIComponent(notifId) + "/read", { method: "PATCH" });
    }
    const n = (Store.state.notifications || []).find((x) => x.id === notifId);
    if (n) {
      n.read = true;
      n.readAt = new Date().toISOString();
    }
    if (!window.PORTIA_SERVER_MODE) Store.save();
    updateNotifBadge();
  }

  function taskDueDate(t) {
    return ((t && (t.dueAt || t.due_at)) || "").slice(0, 10);
  }

  function isTaskOverdue(t) {
    if (window.PortiaMissionTasks && PortiaMissionTasks.isOverdue) return PortiaMissionTasks.isOverdue(t);
    if (!t || t.status !== "open") return false;
    const due = taskDueDate(t);
    if (!due) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(due + "T12:00:00") < today;
  }

  function fmtDue(due) {
    if (window.PortiaMissionTasks && PortiaMissionTasks.fmtDue) return PortiaMissionTasks.fmtDue(due);
    if (!due) return "—";
    try {
      return new Date(due + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
    } catch (_) {
      return due;
    }
  }

  function openTaskDetail(task) {
    const isChecklist = task.type === "checklist_jour";
    const isMission = task.type === "mission" || isChecklist;
    const overdue = isTaskOverdue(task);
    const kind = isChecklist ? "Checklist du jour" : isMission ? "Mission" : "Relance Data Room";
    Modal.open(
      `<div class="modal-h"><div class="ic" style="background:${isMission ? "var(--terra-soft)" : "var(--gold-soft)"};color:${isMission ? "var(--terra-deep)" : "#7a5a14"}">${svgI(isMission ? ICON.agenda : ICON.dataroom)}</div>
      <div><div class="eyebrow">Tâche · ${kind}</div><h2 style="font-size:16px">${esc(task.title)}</h2></div>
      <button class="x" onclick="Modal.close()">${svgI('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div>
      <div class="modal-b stack">
        ${!isMission ? `<div class="kv"><span>Répertoire</span><b class="mono">${esc(task.rep)}</b></div>
        <div class="kv"><span>Source</span><b>${esc(task.source)}</b></div>
        <div class="kv"><span>Checklist</span><b>${esc(task.checklistId)}${task.checklistItem ? " — " + esc(task.checklistItem) : ""}</b></div>
        <div class="kv"><span>Relance n°</span><b>${task.relanceCount || "—"}</b></div>` : ""}
        <div class="kv"><span>Date</span><b>${fmtRelanceDate(task.lastRelanceAt || task.createdAt)}</b></div>
        ${task.type === "mission" ? `<div class="kv"><span>Échéance</span><b class="${overdue ? "crit" : ""}">${fmtDue(taskDueDate(task))}${overdue ? " · en retard" : ""}</b></div>` : ""}
        <div class="kv"><span>Assigné à</span><b>${window.PortiaAuditors ? PortiaAuditors.audLabel(task.assignedTo) : task.assignedTo}</b></div>
        <div class="kv"><span>Statut</span><b>${task.status === "done" ? "Terminée" : task.status === "cancelled" ? "Annulée" : "Ouverte"}</b></div>
        ${task.notes ? `<div class="note slate">${esc(task.notes)}</div>` : ""}
        ${!isMission ? `<div class="frow"><label>Corps du mail</label>
          <pre style="white-space:pre-wrap;font-size:11.5px;background:var(--bg-2);padding:12px;border-radius:var(--r-sm);max-height:200px;overflow:auto">${esc(task.emailBody || "")}</pre></div>` : ""}
      </div>
      <div class="modal-f">
        ${!isMission ? `<button class="btn ghost" id="taskMail">Mail</button><button class="btn ghost" onclick="Modal.close();App.go('dataroom')">Data Room</button>` : ""}
        ${isChecklist && isPilotage() ? `<button class="btn ghost" id="taskEditCl">Modifier la ligne</button>` : ""}
        ${task.status === "open" && !(App.user && App.user.readOnly) ? `<button class="btn terra" id="taskDone">${svgI('<path d="M20 6 9 17l-5-5"/>')} Marquer terminée</button>` : ""}
        ${(isPilotage() || isChecklist) && task.status === "done" ? `<button class="btn ghost" id="taskReopen">Rouvrir</button>` : ""}
        <button class="btn ghost" onclick="Modal.close()">Fermer</button>
      </div>`
    );
    const mailBtn = $("#taskMail");
    if (mailBtn) {
      mailBtn.onclick = () => {
        const subj = encodeURIComponent(task.emailSubject || "");
        const bod = encodeURIComponent(task.emailBody || "");
        window.open("mailto:?subject=" + subj + "&body=" + bod, "_blank");
      };
    }
    const doneBtn = $("#taskDone");
    if (doneBtn) {
      doneBtn.onclick = async () => {
        try {
          await patchTaskStatus(task.id, "done");
          Modal.close();
          toast("Tâche", "Marquée comme terminée", "ok");
          App.refresh();
        } catch (e) {
          toast("Tâche", String(e.message || e), "err");
        }
      };
    }
    const reopenBtn = $("#taskReopen");
    if (reopenBtn) {
      reopenBtn.onclick = async () => {
        try {
          await patchTaskStatus(task.id, "open");
          Modal.close();
          toast("Tâche", "Rouverte", "ok");
          App.refresh();
        } catch (e) {
          toast("Tâche", String(e.message || e), "err");
        }
      };
    }
    const editCl = $("#taskEditCl");
    if (editCl) {
      editCl.onclick = () => {
        Modal.close();
        if (window.PortiaMissionTasks && PortiaMissionTasks.openEditChecklistModal) {
          PortiaMissionTasks.openEditChecklistModal(task);
        }
      };
    }
  }

  function renderTachesView() {
    const v = el("div", { class: "view" });
    const f = { status: "open", mine: !isPilotage(), type: "all" };
    const ro = App.user && App.user.readOnly;

    v.innerHTML =
      pageHead(
        "Suivi · Actions assignées",
        "Mes tâches",
        "Relances Data Room et tâches mission créées par le pilotage — marquer terminée, consulter l'échéance. La checklist du jour se coche ici ou sur Mon espace.",
        isPilotage()
          ? `<button class="btn ghost" onclick="App.go('taches_equipe')">Tâches équipe</button>`
          : `<span class="bdg info">${window.PortiaAuditors ? PortiaAuditors.audLabel(myTarget()) : "Auditeur"}</span>`
      ) +
      `<div class="fbar" style="margin-bottom:14px;flex-wrap:wrap">
        <div class="seg" id="taskStatut">${[["open", "Ouvertes"], ["done", "Terminées"], ["all", "Toutes"]]
          .map(([k, l], i) => `<button data-v="${k}" class="${i === 0 ? "on" : ""}">${l}</button>`)
          .join("")}</div>
        <div class="seg" id="taskType">${[["all", "Tous"], ["mission", "Mission"], ["checklist_jour", "Checklist jour"], ["relance_doc", "Relances"]]
          .map(([k, l], i) => `<button data-v="${k}" class="${i === 0 ? "on" : ""}">${l}</button>`)
          .join("")}</div>
        ${isPilotage() ? `<div class="seg" id="taskScope"><button data-v="all" class="on">Tous</button><button data-v="mine">Mes tâches</button></div>` : ""}
      </div>
      <div class="card"><table class="tbl"><thead><tr><th>Tâche</th><th>Type</th><th>Échéance</th><th>Assigné</th><th>Statut</th><th></th></tr></thead><tbody id="taskBody"></tbody></table></div>`;

    const body = v.querySelector("#taskBody");

    function taskTypeLabel(t) {
      if (t.type === "mission") return "Mission";
      if (t.type === "checklist_jour") return "Checklist jour";
      return "Relance";
    }

    function render() {
      let list = getTasks(f.mine);
      if (f.status !== "all") list = list.filter((t) => t.status === f.status);
      if (f.type !== "all") list = list.filter((t) => (t.type || "relance_doc") === f.type);
      body.innerHTML =
        list
          .map((t) => {
            const overdue = isTaskOverdue(t);
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
            <td><b style="font-size:12.5px">${esc(t.title)}</b>${pri}<br><span class="muted" style="font-size:11px">${fmtRelanceDate(t.createdAt)}</span></td>
            <td><span class="tag">${taskTypeLabel(t)}</span>${t.type === "relance_doc" && t.rep ? `<br><span class="mono muted" style="font-size:10px">${esc(t.rep)}</span>` : ""}</td>
            <td class="mono" style="font-size:11.5px">${t.type === "mission" ? fmtDue(due) : "—"}</td>
            <td>${window.PortiaAuditors ? PortiaAuditors.audLabel(t.assignedTo) : esc(t.assignedTo)}</td>
            <td>${st}</td>
            <td>${!ro && t.status === "open" ? `<button class="btn ghost sm task-done" data-id="${t.id}" onclick="event.stopPropagation()">✓</button>` : ""}</td>
          </tr>`;
          })
          .join("") ||
        `<tr><td colspan="6" class="muted" style="padding:24px;text-align:center">Aucune tâche ${f.status === "open" ? "ouverte" : ""}</td></tr>`;

      body.querySelectorAll("tr[data-task]").forEach((tr) => {
        tr.onclick = () => {
          const t = (Store.state.tasks || []).find((x) => x.id === tr.dataset.task);
          if (t) openTaskDetail(t);
        };
      });
      body.querySelectorAll(".task-done").forEach((btn) => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          try {
            await patchTaskStatus(btn.dataset.id, "done");
            toast("Tâche terminée", "", "ok");
            render();
            updateNotifBadge();
          } catch (err) {
            toast("Erreur", String(err.message || err), "err");
          }
        };
      });
    }

    v.querySelector("#taskStatut").onclick = (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      f.status = b.dataset.v;
      v.querySelectorAll("#taskStatut button").forEach((x) => x.classList.toggle("on", x === b));
      render();
    };
    v.querySelector("#taskType").onclick = (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      f.type = b.dataset.v;
      v.querySelectorAll("#taskType button").forEach((x) => x.classList.toggle("on", x === b));
      render();
    };
    const scope = v.querySelector("#taskScope");
    if (scope) {
      scope.onclick = (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        f.mine = b.dataset.v === "mine";
        scope.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
        render();
      };
    }
    render();
    return v;
  }

  function notifIcon(n) {
    if (n.type === "mission_task") return ICON.agenda;
    if (n.type === "collecte_relance_j7") return ICON.entretiens;
    return ICON.dataroom;
  }

  function notifColors(n) {
    if (n.read) return { bg: "var(--bg-2)", c: "var(--txt-3)" };
    if (n.type === "mission_task") return { bg: "var(--terra-soft)", c: "var(--terra-deep)" };
    if (n.type === "collecte_relance_j7") return { bg: "var(--gold-soft)", c: "#7a5a14" };
    return { bg: "var(--gold-soft)", c: "#7a5a14" };
  }

  function showNotifPanel() {
    const notifs = getNotifications(true).slice(0, 20);
    Modal.open(
      `<div class="modal-h"><div class="ic" style="background:var(--slate-soft);color:var(--info)">${svgI('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>')}</div>
      <div><div class="eyebrow">Alertes mission</div><h2>Notifications</h2></div>
      <button class="x" onclick="Modal.close()">${svgI('<path d="M18 6 6 18M6 6l12 12"/>')}</button></div>
      <div class="modal-b stack" style="gap:8px">
        ${
          notifs.length
            ? notifs
                .map((n) => {
                  const col = notifColors(n);
                  return `<div class="alert-i clk notif-row" data-nid="${n.id}" data-tid="${n.taskId || ""}" data-entid="${n.entretienId || ""}" data-ntype="${n.type || ""}" style="opacity:${n.read ? "0.65" : "1"};border:1px solid var(--line);border-radius:var(--r-sm)">
            <div class="ic" style="background:${col.bg};color:${col.c}">${svgI(notifIcon(n))}</div>
            <div class="bd"><b>${esc(n.title)}</b><span>${esc(n.body || "")} · ${fmtRelanceDate(n.createdAt)}</span></div>
            ${n.read ? "" : `<span class="bdg warn">Nouveau</span>`}
          </div>`;
                })
                .join("")
            : `<div class="note slate">Aucune notification.</div>`
        }
      </div>
      <div class="modal-f"><button class="btn ghost" onclick="Modal.close();App.go('taches')">Mes tâches</button><button class="btn ghost" onclick="Modal.close();App.go('collecte_externe')">Collecte interviewés</button><button class="btn ghost" onclick="Modal.close()">Fermer</button></div>`
    );
    document.querySelectorAll(".notif-row").forEach((row) => {
      row.onclick = async () => {
        await markNotifRead(row.dataset.nid);
        Modal.close();
        if (row.dataset.ntype === "collecte_relance_j7" && row.dataset.entid) {
          if (window.PortiaCollecte && PortiaCollecte.copyCollecteMail) {
            await PortiaCollecte.copyCollecteMail(row.dataset.entid, "relance");
          }
          App.go("collecte_externe");
          return;
        }
        if (row.dataset.tid) {
          const t = (Store.state.tasks || []).find((x) => x.id === row.dataset.tid);
          if (t) openTaskDetail(t);
          else App.go("taches");
        } else App.go("taches");
      };
    });
  }

  function updateNotifBadge() {
    const btn = $("#topNotif");
    const badge = $("#topNotifBadge");
    if (!btn || !badge) return;
    const n = unreadCount();
    const show = App.user && App.user.role !== "cabinet";
    btn.style.display = show ? "" : "none";
    if (n > 0) {
      badge.style.display = "";
      badge.textContent = n > 99 ? "99+" : String(n);
    } else {
      badge.style.display = "none";
    }
  }

  function patchDataroomRelanceButton() {
    const orig = VIEWS.dataroom;
    if (!orig || VIEWS._relanceDr) return;
    VIEWS.dataroom = function () {
      const v = orig();
      const body = v.querySelector("#drBody");
      if (!body) return v;
      const thead = v.querySelector(".tbl thead tr");
      if (thead && !thead.querySelector("th[data-rel]")) {
        const thRel = document.createElement("th");
        thRel.dataset.rel = "1";
        thRel.textContent = "Relances";
        thead.insertBefore(thRel, thead.lastElementChild);
        const thAct = document.createElement("th");
        thAct.textContent = "";
        thead.appendChild(thAct);
      }
      const ro = App.user && App.user.readOnly;
      const obs = new MutationObserver(() => patchRows());
      obs.observe(body, { childList: true });
      patchRows();

      function patchRows() {
        body.querySelectorAll("tr").forEach((tr) => {
          if (tr.querySelector("td[data-rel-cell]")) return;
          const stSel = tr.querySelector(".dr-st");
          const docId = stSel ? stSel.dataset.id : null;
          if (!docId) {
            const cols = tr.querySelectorAll("td").length;
            if (cols === 5) {
              tr.innerHTML += `<td data-rel-cell>—</td><td></td>`;
            }
            return;
          }
          const doc = Store.find("docs", docId);
          const cnt = doc ? doc.relanceCount || 0 : 0;
          const relCell = `<td data-rel-cell style="font-size:11.5px">${cnt ? `<b class="mono">×${cnt}</b><br><span class="muted">${fmtRelanceDate(doc.lastRelanceAt)}</span>` : '<span class="muted">—</span>'}</td>`;
          const canRelance = doc && doc.statut !== "verse" && doc.statut !== "a_verifier" && !ro;
          const actCell = `<td>${canRelance ? `<button class="btn ghost sm dr-relance" data-id="${docId}" onclick="event.stopPropagation()">Relancer</button>` : ""}</td>`;
          tr.insertAdjacentHTML("beforeend", relCell + actCell);
        });
        body.querySelectorAll(".dr-relance").forEach((btn) => {
          btn.onclick = (e) => {
            e.stopPropagation();
            openRelanceModal(btn.dataset.id);
          };
        });
      }
      return v;
    };
    VIEWS._relanceDr = true;
  }

  function registerNav() {
    if (!window.NAV) return;
    const item = {
      k: "taches",
      lbl: "Mes tâches",
      ic: "inbox",
      ct: () => {
        const open = getTasks(!isPilotage()).filter((t) => t.status === "open");
        return open.length || null;
      },
    };
    if (NAV.admin && NAV.admin[0] && !NAV.admin[0].items.some((i) => i.k === "taches")) {
      NAV.admin[0].items.splice(3, 0, item);
    }
    if (NAV.auditeur && NAV.auditeur[0] && !NAV.auditeur[0].items.some((i) => i.k === "taches")) {
      NAV.auditeur[0].items.unshift(item);
    }
    if (window.CRUMB) CRUMB.taches = "Mes tâches";
    if (window.App) {
      const origAllowed = App.allowed.bind(App);
      App.allowed = function (k) {
        if (k === "taches" || k === "taches_equipe") return true;
        return origAllowed(k);
      };
    }
  }

  function patchEnter() {
    if (!window.App || App._relanceEnter) return;
    const origEnter = App.enter.bind(App);
    App.enter = function () {
      origEnter();
      updateNotifBadge();
      const nb = $("#topNotif");
      if (nb) nb.onclick = () => showNotifPanel();
    };
    App._relanceEnter = true;
  }

  function init() {
    registerNav();
    patchEnter();
    patchDataroomRelanceButton();
    VIEWS.taches = renderTachesView;
    window.PortiaRelances = {
      init,
      openRelanceModal,
      openTaskDetail,
      patchTaskStatus,
      updateNotifBadge,
      getTasks,
      getNotifications,
      showNotifPanel,
      unreadCount,
    };
  }

  window.PortiaRelances = { init };
})();
