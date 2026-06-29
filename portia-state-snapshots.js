/**
 * Auto-save horodaté + historique de restauration (admin — Réglages).
 */
(function () {
  "use strict";

  const LS_SNAPS = "portia_audit_snapshots_v1";
  const AUTO_MS = 15 * 60 * 1000;
  const MAX_LOCAL = 40;
  let lastSnapHash = "";
  let lastSnapAt = 0;
  let autoTimer = null;
  let dirty = false;

  function isAdmin() {
    return window.App && App.user && App.user.role === "admin" && !App.user.readOnly;
  }

  function stateHash() {
    try {
      return String(JSON.stringify(Store.state || {})).length + ":" + (Store.state.meta && Store.state.meta.clockJ);
    } catch (_) {
      return "";
    }
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(LS_SNAPS);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function saveLocal(list) {
    try {
      localStorage.setItem(LS_SNAPS, JSON.stringify(list.slice(0, MAX_LOCAL)));
    } catch (e) {
      console.warn("snapshots local", e);
    }
  }

  function fmtAt(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (_) {
      return iso;
    }
  }

  async function apiFetch(path, opts) {
    const fn = window.portiaApi && portiaApi.fetch ? portiaApi.fetch : fetch;
    return fn(path, opts);
  }

  async function listSnapshots() {
    if (window.PORTIA_SERVER_MODE) {
      try {
        const r = await apiFetch("/api/state/snapshots");
        if (r.ok) {
          const data = await r.json();
          return data.snapshots || [];
        }
      } catch (_) {}
    }
    return loadLocal();
  }

  async function createSnapshot(label, auto) {
    if (!Store.state) return null;
    const payload = JSON.parse(JSON.stringify(Store.state));
    if (payload.settings) payload.settings.apiKey = "";
    const entry = {
      id: (typeof uid === "function" ? uid("snap") : "snap_" + Date.now()),
      label: label || "Sauvegarde",
      createdAt: new Date().toISOString(),
      createdBy: (App.user && App.user.name) || "",
      auto: !!auto,
      sizeBytes: JSON.stringify(payload).length,
    };
    if (window.PORTIA_SERVER_MODE) {
      try {
        const r = await apiFetch("/api/state/snapshots", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ label: entry.label, auto: entry.auto, payload }),
        });
        if (r.ok) {
          const data = await r.json();
          return data.snapshot || entry;
        }
      } catch (e) {
        console.warn("snapshot serveur", e);
      }
    }
    const list = loadLocal();
    list.unshift(Object.assign(entry, { payload }));
    saveLocal(list);
    return entry;
  }

  async function restoreSnapshot(id) {
    let payload = null;
    if (window.PORTIA_SERVER_MODE) {
      const r = await apiFetch("/api/state/snapshots/" + encodeURIComponent(id) + "/restore", {
        method: "POST",
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const data = await r.json();
      payload = data.state;
    } else {
      const row = loadLocal().find((s) => s.id === id);
      if (!row || !row.payload) throw new Error("Point introuvable");
      payload = row.payload;
    }
    if (!payload) throw new Error("État vide");
    Store.state = payload;
    const d = Store.defaults();
    for (const k in d) {
      if (Store.state[k] == null) Store.state[k] = d[k];
    }
    Store.save();
    if (window.portiaApi && portiaApi.saveState) await portiaApi.saveState();
    if (window.portiaReloadServer) await portiaReloadServer();
    else App.refresh();
  }

  async function periodicAutoSave() {
    if (!Store.state || !window.App || !App.user) return;
    try {
      if (window.portiaApi && portiaApi.saveState) {
        await portiaApi.saveState();
      } else if (window.Store && Store.save) {
        Store.save();
      }
      await maybeAutoSnapshot();
      showAutosaveBadge();
    } catch (e) {
      console.warn("auto-save périodique", e);
    }
  }

  async function maybeAutoSnapshot() {
    if (!dirty || !Store.state) return;
    const h = stateHash();
    if (h === lastSnapHash && Date.now() - lastSnapAt < AUTO_MS) return;
    const label =
      "Auto · " +
      fmtAt(new Date().toISOString()) +
      (App.user && App.user.name ? " · " + App.user.name : "");
    await createSnapshot(label, true);
    lastSnapHash = h;
    lastSnapAt = Date.now();
    dirty = false;
    showAutosaveBadge();
  }

  function showAutosaveBadge() {
    const el = document.getElementById("autosaveBadge");
    if (!el) return;
    el.textContent = "Auto-save · " + fmtAt(new Date().toISOString());
    el.style.opacity = "1";
    setTimeout(() => {
      el.style.opacity = "0.6";
    }, 2500);
  }

  function patchStore() {
    if (!window.Store || Store._snapPatched) return;
    const origSave = Store.save.bind(Store);
    Store.save = function () {
      dirty = true;
      origSave();
    };
    Store._snapPatched = true;
    clearInterval(autoTimer);
    autoTimer = setInterval(() => {
      periodicAutoSave().catch(() => {});
    }, AUTO_MS);
  }

  function renderSnapshotsCard(v) {
    if (!isAdmin()) return;
    const col = v.querySelector(".col");
    if (!col || v.querySelector("#stSnapshotsCard")) return;
    const card = document.createElement("div");
    card.className = "card";
    card.id = "stSnapshotsCard";
    card.style.marginTop = "16px";
    card.innerHTML =
      '<div class="card-h"><div class="ic" style="background:var(--gold-soft);color:#7a5a14">' +
      (typeof svgI === "function"
        ? svgI('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>')
        : "") +
      '</div><h3>Historique & restauration</h3><div class="actions"><span id="autosaveBadge" class="tag mono" style="font-size:9px;opacity:.6">Auto-save · toutes les 15 min</span></div></div>' +
      '<div class="card-b"><div class="note slate" style="margin-bottom:12px;font-size:12px">Sauvegarde automatique toutes les <b>15 minutes</b> (local + serveur). Un point de restauration est créé lorsque des modifications ont été détectées. Les administrateurs peuvent restaurer un point antérieur.</div>' +
      '<button class="btn dark sm" id="stSnapNow" style="width:100%;margin-bottom:12px">Créer un point de restauration maintenant</button>' +
      '<div id="stSnapList" class="stack" style="max-height:280px;overflow-y:auto"></div></div>';
    col.appendChild(card);

    async function refreshList() {
      const list = await listSnapshots();
      const box = card.querySelector("#stSnapList");
      if (!list.length) {
        box.innerHTML = '<div class="muted" style="font-size:12px">Aucun point enregistré.</div>';
        return;
      }
      box.innerHTML = list
        .map(
          (s) =>
            `<div class="ck-att-item" style="flex-wrap:wrap">
              <div style="flex:1;min-width:180px">
                <b style="font-size:12px">${esc(s.label || "Sauvegarde")}</b>
                <div class="muted mono" style="font-size:10px">${esc(fmtAt(s.createdAt))}${s.createdBy ? " · " + esc(s.createdBy) : ""}${s.auto ? ' <span class="tag" style="font-size:8px">auto</span>' : ""}</div>
              </div>
              <button type="button" class="btn ghost sm" data-restore="${esc(s.id)}">Restaurer</button>
            </div>`
        )
        .join("");
      box.querySelectorAll("[data-restore]").forEach((btn) => {
        btn.onclick = async () => {
          if (
            !confirm(
              "Restaurer cette version ? L'état actuel sera remplacé (un point auto sera créé avant restauration)."
            )
          )
            return;
          try {
            await createSnapshot("Avant restauration · " + fmtAt(new Date().toISOString()), false);
            await restoreSnapshot(btn.dataset.restore);
            toast("Restauration", "Version restaurée — rechargez si besoin", "ok");
            refreshList();
            App.refresh();
          } catch (e) {
            toast("Échec", e.message || String(e), "err");
          }
        };
      });
    }

    card.querySelector("#stSnapNow").onclick = async () => {
      const label = prompt("Libellé du point de restauration :", "Manuel · " + fmtAt(new Date().toISOString()));
      if (label === null) return;
      await createSnapshot(label.trim() || "Manuel", false);
      toast("Point créé", label, "ok");
      refreshList();
    };
    refreshList();
  }

  function patchReglages() {
    if (!window.VIEWS || VIEWS._snapReglages) return;
    const orig = VIEWS.reglages;
    VIEWS.reglages = function () {
      const v = orig();
      setTimeout(() => renderSnapshotsCard(v), 60);
      return v;
    };
    VIEWS._snapReglages = true;
  }

  function init() {
    patchStore();
    patchReglages();
  }

  window.PortiaSnapshots = {
    createSnapshot,
    listSnapshots,
    restoreSnapshot,
    fmtAt,
    autoSaveIntervalMs: AUTO_MS,
    init,
  };

  if (typeof Store !== "undefined") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
