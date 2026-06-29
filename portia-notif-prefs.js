/**
 * Préférences notifications — activation, types, badge (par utilisateur)
 */
(function () {
  "use strict";

  const NOTIF_TYPES = {
    relance_doc: {
      lbl: "Relances Data Room",
      desc: "Relance documentaire assignée — lien vers Mes tâches.",
      default: true,
      active: true,
    },
    collecte_relance_j7: {
      lbl: "Collecte interviewés (J-7)",
      desc: "Rappel pilotage : relance manuelle si aucun dépôt à J-7.",
      default: true,
      active: true,
    },
    tache_assignee: {
      lbl: "Tâches assignées",
      desc: "Nouvelle tâche de suivi (hors relance doc).",
      default: true,
      active: false,
    },
    depot_document: {
      lbl: "Dépôts Data Room",
      desc: "Nouveau document versé par le ministère ou le cabinet.",
      default: true,
      active: false,
    },
    entretien_reporte: {
      lbl: "Entretiens reportés",
      desc: "Changement de statut reporté sur votre programme.",
      default: true,
      active: false,
    },
    risque_critique: {
      lbl: "Risques ouverts (niveau élevé)",
      desc: "Alerte quand un risque passe en ouvert avec score P×I ≥ 9.",
      default: false,
      active: false,
    },
    gap_consolide: {
      lbl: "Matrice CDC consolidée",
      desc: "Modification réalité / verdict par le pilotage.",
      default: true,
      active: false,
    },
    livrable_echeance: {
      lbl: "Échéances livrables",
      desc: "Rappel J-3 avant jalon contractuel (L1–L8).",
      default: true,
      active: false,
    },
    copil_rappel: {
      lbl: "Rappels COPIL / gouvernance",
      desc: "Instance COPIL à J-2 et actions en retard.",
      default: true,
      active: false,
    },
  };

  function userKey() {
    const u = (window.App && App.user) || {};
    return (u.email || u.id || u.name || "local").toLowerCase();
  }

  function defaultPrefs() {
    const types = {};
    Object.keys(NOTIF_TYPES).forEach((k) => {
      types[k] = NOTIF_TYPES[k].default;
    });
    return { enabled: true, showBadge: true, showToast: false, types };
  }

  function ensureMeta() {
    if (!window.Store || !Store.state) return;
    if (!Store.state.meta) Store.state.meta = {};
    if (!Store.state.meta.notificationPrefs) Store.state.meta.notificationPrefs = {};
  }

  function getPrefs() {
    ensureMeta();
    const key = userKey();
    const stored = Store.state.meta.notificationPrefs[key];
    if (!stored) return defaultPrefs();
    const base = defaultPrefs();
    return {
      enabled: stored.enabled !== false,
      showBadge: stored.showBadge !== false,
      showToast: !!stored.showToast,
      types: Object.assign({}, base.types, stored.types || {}),
    };
  }

  function savePrefs(prefs) {
    ensureMeta();
    Store.state.meta.notificationPrefs[userKey()] = {
      enabled: !!prefs.enabled,
      showBadge: prefs.showBadge !== false,
      showToast: !!prefs.showToast,
      types: prefs.types || {},
      updatedAt: new Date().toISOString(),
    };
    if (window.portiaApi && portiaApi.saveState) return portiaApi.saveState();
    Store.save();
    return Promise.resolve();
  }

  function isTypeEnabled(type) {
    const prefs = getPrefs();
    if (!prefs.enabled) return false;
    const t = type || "relance_doc";
    return prefs.types[t] !== false;
  }

  function filterList(notifs) {
    const prefs = getPrefs();
    if (!prefs.enabled) return [];
    return (notifs || []).filter((n) => {
      const t = n.type || "relance_doc";
      return prefs.types[t] !== false;
    });
  }

  function typeIcon(type) {
    const map = {
      relance_doc: ICON.dataroom,
      tache_assignee: ICON.conduct,
      depot_document: ICON.dataroom,
      entretien_reporte: ICON.entretiens,
      risque_critique: ICON.risques,
      gap_consolide: ICON.ecart,
      livrable_echeance: ICON.livrables,
      copil_rappel: ICON.gouv,
    };
    return (map[type] || '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>');
  }

  function prefsCardInner() {
    const p = getPrefs();
    const rows = Object.keys(NOTIF_TYPES)
      .map((k) => {
        const def = NOTIF_TYPES[k];
        const on = p.types[k] !== false;
        const soon = def.active ? "" : ' <span class="muted" style="font-size:10px">(bientôt)</span>';
        return `<label style="display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line);cursor:pointer">
          <input type="checkbox" class="np-type" data-k="${k}" ${on ? "checked" : ""} ${def.active ? "" : "disabled"} style="margin-top:3px">
          <span><b style="font-size:13px">${esc(def.lbl)}</b>${soon}<br><span class="muted" style="font-size:11.5px">${esc(def.desc)}</span></span>
        </label>`;
      })
      .join("");
    return `<label style="display:flex;gap:10px;align-items:center;margin-bottom:14px;font-size:14px;font-weight:600">
          <input type="checkbox" id="npEnabled" ${p.enabled ? "checked" : ""}> Activer les notifications
        </label>
        <div class="f2" style="margin-bottom:14px">
          <label style="display:flex;gap:8px;font-size:13px"><input type="checkbox" id="npBadge" ${p.showBadge ? "checked" : ""}> Badge cloche (non lues)</label>
          <label style="display:flex;gap:8px;font-size:13px"><input type="checkbox" id="npToast" ${p.showToast ? "checked" : ""}> Toast à la réception</label>
        </div>
        <div class="eyebrow" style="margin-bottom:8px;color:var(--terra-deep)">TYPES DE NOTIFICATIONS</div>
        <div>${rows}</div>
        <div class="note slate" style="margin-top:12px;font-size:12px">Préférences pour <b>${esc(userKey())}</b>. Seules les <b>relances Data Room</b> sont émises aujourd'hui.</div>
        <button class="btn terra" id="npSave" style="margin-top:14px">${typeof svgI === "function" ? svgI('<path d="M20 6 9 17l-5-5"/>') : ""} Enregistrer</button>`;
  }

  function prefsFormHtml() {
    return `<div class="card" style="margin-bottom:16px"><div class="card-h"><div class="ic" style="background:var(--gold-soft);color:#7a5a14">${typeof svgI === "function" ? svgI('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>') : ""}</div><h3>Notifications</h3></div>
      <div class="card-b">${prefsCardInner()}</div></div>`;
  }

  function wirePrefsForm(root) {
    if (!root) return;
    const save = root.querySelector("#npSave");
    if (!save) return;
    save.onclick = () => {
      const types = {};
      root.querySelectorAll(".np-type").forEach((chk) => {
        types[chk.dataset.k] = chk.checked;
      });
      const prefs = {
        enabled: root.querySelector("#npEnabled").checked,
        showBadge: root.querySelector("#npBadge").checked,
        showToast: root.querySelector("#npToast").checked,
        types,
      };
      save.disabled = true;
      savePrefs(prefs).then(() => {
        toast("Notifications", "Préférences enregistrées", "ok");
        if (window.PortiaRelances && PortiaRelances.updateNotifBadge) PortiaRelances.updateNotifBadge();
        save.disabled = false;
      });
    };
  }

  function openPrefsModal() {
    Modal.open(
      `<div class="modal-h"><div class="ic" style="background:var(--gold-soft);color:#7a5a14">${typeof svgI === "function" ? svgI('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>') : ""}</div><div><h2>Préférences notifications</h2></div>
      <button class="x" onclick="Modal.close()">${typeof svgI === "function" ? svgI('<path d="M18 6 6 18M6 6l12 12"/>') : "×"}</button></div>
      <div class="modal-b">${prefsCardInner()}</div>
      <div class="modal-f"><button class="btn ghost" onclick="Modal.close()">Fermer</button></div>`,
      true
    );
    wirePrefsForm(document.getElementById("ovBox"));
  }

  function patchRelances() {
    if (!window.PortiaRelances || PortiaRelances._notifPrefs) return;
    const origGet = PortiaRelances.getNotifications;
    const origUnread = PortiaRelances.unreadCount;
    if (origGet) {
      PortiaRelances.getNotifications = function (filterMine) {
        return filterList(origGet(filterMine));
      };
    }
    PortiaRelances.unreadCount = function () {
      const prefs = getPrefs();
      if (!prefs.enabled || !prefs.showBadge) return 0;
      if (origGet) return filterList(origGet(true)).filter((n) => !n.read).length;
      return origUnread ? origUnread() : 0;
    };
    PortiaRelances._notifPrefs = true;
  }

  function patchCreateRelance() {
    /* relance creation respects PortiaNotifPrefs.shouldCreateNotif in portia-relances.js */
  }

  function patchTopBar() {
    if (window._notifTopPatch) return;
    window._notifTopPatch = true;
    setTimeout(() => {
      const nb = $("#topNotif");
      if (nb && !document.getElementById("topNotifCfg")) {
        const cfg = el("button", {
          class: "icon-btn",
          id: "topNotifCfg",
          type: "button",
          title: "Préférences notifications",
        });
        cfg.innerHTML = svgI(ICON.reglages);
        cfg.style.display = "none";
        cfg.onclick = () => openPrefsModal();
        nb.parentNode.insertBefore(cfg, nb.nextSibling);
        const origBadge = PortiaRelances && PortiaRelances.updateNotifBadge;
        if (origBadge) {
          const wrapped = PortiaRelances.updateNotifBadge;
          PortiaRelances.updateNotifBadge = function () {
            wrapped();
            const u = App.user;
            cfg.style.display = u && u.role !== "cabinet" ? "" : "none";
          };
          PortiaRelances.updateNotifBadge();
        }
      }
    }, 800);
  }

  function patchNotifPanel() {
    if (!window.PortiaRelances || PortiaRelances._panelPatch) return;
    const orig = PortiaRelances.showNotifPanel;
    if (!orig) return;
    PortiaRelances.showNotifPanel = function () {
      const prefs = getPrefs();
      if (!prefs.enabled) {
        openPrefsModal();
        toast("Notifications désactivées", "Activez-les ou choisissez les types", "info");
        return;
      }
      orig();
      setTimeout(() => {
        const foot = document.querySelector("#ovBox .modal-f");
        if (foot && !foot.querySelector("#npCfg")) {
          const btn = el("button", { class: "btn ghost", id: "npCfg", type: "button" });
          btn.textContent = "Configurer";
          btn.onclick = () => {
            Modal.close();
            openPrefsModal();
          };
          foot.insertBefore(btn, foot.firstChild);
        }
        // Type icons in panel
        document.querySelectorAll(".notif-row").forEach((row) => {
          const nid = row.dataset.nid;
          const n = (Store.state.notifications || []).find((x) => x.id === nid);
          if (n && n.type) {
            const ic = row.querySelector(".ic");
            if (ic) ic.innerHTML = svgI(typeIcon(n.type));
          }
        });
      }, 0);
    };
    PortiaRelances._panelPatch = true;
  }

  function patchReglages() {
    if (!window.VIEWS || VIEWS._notifReglages) return;
    const orig = VIEWS.reglages;
    VIEWS.reglages = function () {
      const v = orig();
      setTimeout(() => {
        const leftCol = v.querySelector(".col");
        if (leftCol && !v.querySelector("#notifPrefsCard")) {
          const wrap = el("div", { id: "notifPrefsCard" });
          wrap.innerHTML = prefsFormHtml();
          const simCard = leftCol.querySelector(".card:last-of-type");
          if (simCard) leftCol.insertBefore(wrap, simCard);
          else leftCol.appendChild(wrap);
          wirePrefsForm(wrap);
        }
      }, 0);
      return v;
    };
    VIEWS._notifReglages = true;
  }

  function patchBadge() {
    if (!window.PortiaRelances || PortiaRelances._badgePatch) return;
    const orig = PortiaRelances.updateNotifBadge;
    PortiaRelances.updateNotifBadge = function () {
      const prefs = getPrefs();
      const btn = $("#topNotif");
      if (btn && !prefs.enabled) {
        btn.style.display = "none";
        return;
      }
      orig();
    };
    PortiaRelances._badgePatch = true;
  }

  function shouldCreateNotif(type) {
    return isTypeEnabled(type);
  }

  function init() {
    if (window._notifPrefsInit) return;
    window._notifPrefsInit = true;
    window.PortiaNotifPrefs = {
      NOTIF_TYPES,
      getPrefs,
      savePrefs,
      isTypeEnabled,
      filterList,
      openPrefsModal,
      shouldCreateNotif,
      typeIcon,
    };
    patchReglages();
    setTimeout(() => {
      patchRelances();
      patchNotifPanel();
      patchBadge();
      patchTopBar();
      if (window.PortiaRelances && PortiaRelances.updateNotifBadge) PortiaRelances.updateNotifBadge();
    }, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(init, 200));
  } else {
    setTimeout(init, 200);
  }
})();
