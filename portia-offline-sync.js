/**
 * Mode hors ligne — brouillons locaux + file de sync au retour réseau.
 */
(function () {
  "use strict";

  const QUEUE_DB = "portia_sync_v1";
  const QUEUE_STORE = "queue";
  const BLOB_STORE = "blobs";
  const LS_QUEUE_META = "portia_sync_meta_v1";

  let syncing = false;
  let online = typeof navigator !== "undefined" ? navigator.onLine : true;

  function uid(prefix) {
    return (
      (typeof window.uid === "function" ? window.uid(prefix) : prefix + "_" + Date.now().toString(36))
    );
  }

  function getToken() {
    return (
      (window.PortiaEnterprise && PortiaEnterprise.getToken && PortiaEnterprise.getToken()) ||
      (function () {
        try {
          return sessionStorage.getItem("portia_auth_token") || "";
        } catch (_) {
          return "";
        }
      })()
    );
  }

  function apiFetch(url, opts) {
    const fn = window.portiaApi && portiaApi.fetch ? portiaApi.fetch : fetch;
    return fn(url, opts);
  }

  function isServerMode() {
    return !!window.PORTIA_SERVER_MODE;
  }

  function canSync() {
    if (!isServerMode() || !online) return false;
    if (window.App && App.user) return true;
    return !!getToken();
  }

  function isAppActive() {
    const app = document.getElementById("app");
    if (!app || !app.classList.contains("on")) return false;
    const login = document.getElementById("login");
    if (login && login.style.display !== "none") {
      const disp = window.getComputedStyle ? getComputedStyle(login).display : login.style.display;
      if (disp && disp !== "none") return false;
    }
    if (window.PORTIA_REQUIRE_AUTH && !getToken()) return false;
    return true;
  }

  function queueMeta() {
    try {
      return JSON.parse(localStorage.getItem(LS_QUEUE_META) || "{}");
    } catch (_) {
      return {};
    }
  }

  function saveQueueMeta(patch) {
    const m = Object.assign(queueMeta(), patch, { updatedAt: new Date().toISOString() });
    localStorage.setItem(LS_QUEUE_META, JSON.stringify(m));
    renderBanner();
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(QUEUE_DB, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          db.createObjectStore(QUEUE_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(BLOB_STORE)) {
          db.createObjectStore(BLOB_STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function listQueue() {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(QUEUE_STORE, "readonly");
      const rq = tx.objectStore(QUEUE_STORE).getAll();
      rq.onsuccess = () => resolve(rq.result || []);
      rq.onerror = () => resolve([]);
    });
  }

  async function putQueue(item) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, "readwrite");
      tx.objectStore(QUEUE_STORE).put(item);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function delQueue(id) {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(QUEUE_STORE, "readwrite");
      tx.objectStore(QUEUE_STORE).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  }

  async function putBlob(id, blob) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BLOB_STORE, "readwrite");
      tx.objectStore(BLOB_STORE).put({ id, blob });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getBlob(id) {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(BLOB_STORE, "readonly");
      const rq = tx.objectStore(BLOB_STORE).get(id);
      rq.onsuccess = () => resolve((rq.result && rq.result.blob) || null);
      rq.onerror = () => resolve(null);
    });
  }

  async function delBlob(id) {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(BLOB_STORE, "readwrite");
      tx.objectStore(BLOB_STORE).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  }

  async function queueStatePush() {
    if (!Store.state) return;
    const items = await listQueue();
    const existing = items.find((x) => x.type === "state");
    const payload = JSON.parse(JSON.stringify(Store.state));
    if (payload.settings) payload.settings.apiKey = "";
    if (!Store.state.meta) Store.state.meta = {};
    Store.state.meta.offlineDraft = true;
    Store.state.meta.offlineDraftAt = new Date().toISOString();
    try {
      localStorage.setItem("portia_audit_cockpit_v1", JSON.stringify(Store.state));
    } catch (_) {}
    const entry = {
      id: existing ? existing.id : uid("sync"),
      type: "state",
      createdAt: new Date().toISOString(),
      payload,
    };
    await putQueue(entry);
    saveQueueMeta({ pending: (await listQueue()).length, lastDraftAt: entry.createdAt });
  }

  async function queueFileUpload(id, blob, meta, kind) {
    const entry = {
      id: uid("sync"),
      type: kind || "file_upload",
      fileRef: id,
      createdAt: new Date().toISOString(),
      meta: meta || {},
      blobKey: uid("blob"),
    };
    await putBlob(entry.blobKey, blob);
    await putQueue(entry);
    saveQueueMeta({ pending: (await listQueue()).length });
    return entry;
  }

  async function queueQuestionnaire(entretienId, answers) {
    const items = await listQueue();
    const existing = items.find(
      (x) => x.type === "questionnaire" && x.entretienId === entretienId
    );
    const entry = {
      id: existing ? existing.id : uid("sync"),
      type: "questionnaire",
      entretienId,
      createdAt: new Date().toISOString(),
      payload: answers,
    };
    await putQueue(entry);
    saveQueueMeta({ pending: (await listQueue()).length });
  }

  async function pushState(payload) {
    const r = await apiFetch("/api/state", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.status === 401) {
      if (window.PortiaEnterprise && PortiaEnterprise.handleUnauthorized) {
        PortiaEnterprise.handleUnauthorized();
      }
      throw new Error("state 401");
    }
    if (!r.ok) throw new Error("state " + r.status);
  }

  async function pushQuestionnaire(entretienId, answers) {
    const r = await apiFetch(
      "/api/entretiens/" + encodeURIComponent(entretienId) + "/questionnaire",
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(answers),
      }
    );
    if (!r.ok) throw new Error("questionnaire " + r.status);
  }

  async function pushFileItem(item) {
    const blob = await getBlob(item.blobKey);
    if (!blob) throw new Error("blob manquant");
    const meta = item.meta || {};
    if (item.type === "dataroom_deposit" && meta.rep) {
      const fd = new FormData();
      fd.append("file", blob, meta.name || "document");
      fd.append("doc_id", item.fileRef);
      fd.append("rep", meta.rep);
      fd.append("source", meta.source);
      fd.append("doc_type", meta.type || "DOC");
      fd.append("description", meta.desc);
      fd.append("version", meta.version || "v1");
      if (meta.format) fd.append("format", meta.format);
      if (meta.mission_j != null) fd.append("mission_j", String(meta.mission_j));
      if (meta.existing_doc_id) fd.append("existing_doc_id", meta.existing_doc_id);
      fd.append("uploaded_by", meta.par || meta.uploaded_by || "");
      const r = await apiFetch("/api/dataroom/deposit", { method: "POST", body: fd });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    }
    const fd = new FormData();
    fd.append("file", blob, meta.name || "document");
    fd.append("doc_id", item.fileRef);
    if (meta.uploaded_by) fd.append("uploaded_by", meta.uploaded_by);
    const r = await apiFetch("/api/files/upload", { method: "POST", body: fd });
    if (!r.ok) throw new Error("upload " + r.status);
    return r.json();
  }

  async function flushQueue() {
    if (!canSync() || syncing) return { ok: false, reason: "busy" };
    const items = (await listQueue()).sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
    if (!items.length) {
      saveQueueMeta({ pending: 0, lastSyncAt: new Date().toISOString() });
      return { ok: true, done: 0 };
    }
    syncing = true;
    renderBanner();
    let done = 0;
    const errors = [];
    for (const item of items) {
      try {
        if (item.type === "state") await pushState(item.payload);
        else if (item.type === "questionnaire")
          await pushQuestionnaire(item.entretienId, item.payload);
        else if (item.type === "file_upload" || item.type === "dataroom_deposit")
          await pushFileItem(item);
        await delQueue(item.id);
        if (item.blobKey) await delBlob(item.blobKey);
        done++;
      } catch (e) {
        errors.push({ id: item.id, type: item.type, error: String(e.message || e) });
        item.retries = (item.retries || 0) + 1;
        if (item.retries >= 5) {
          await delQueue(item.id);
          errors.push({ id: item.id, fatal: true });
        } else {
          await putQueue(item);
        }
        break;
      }
    }
    syncing = false;
    if (Store.state && Store.state.meta) {
      if (done && !(await listQueue()).length) {
        Store.state.meta.offlineDraft = false;
        Store.state.meta.lastOnlineSyncAt = new Date().toISOString();
        Store.save();
      }
    }
    saveQueueMeta({
      pending: (await listQueue()).length,
      lastSyncAt: done ? new Date().toISOString() : queueMeta().lastSyncAt,
      lastErrors: errors.slice(0, 3),
    });
    if (done && window.portiaBridgeReloadDocs) {
      try {
        await portiaBridgeReloadDocs();
      } catch (_) {}
    }
    renderBanner();
    if (done) {
      toast(
        "Synchronisation",
        done + " élément(s) envoyé(s) sur le serveur",
        errors.length ? "warn" : "ok"
      );
    }
    return { ok: true, done, errors };
  }

  function renderBanner() {
    let el = document.getElementById("portiaOfflineBanner");
    if (!el) {
      el = document.createElement("div");
      el.id = "portiaOfflineBanner";
      el.style.cssText =
        "display:none;position:fixed;top:0;left:0;right:0;z-index:9999;padding:8px 14px;font-size:12px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.12);cursor:pointer";
      el.onclick = () => {
        if (canSync()) flushQueue();
      };
      document.body.appendChild(el);
    }
    if (!isAppActive()) {
      el.style.display = "none";
      return;
    }
    const pending = queueMeta().pending || 0;
    const q = pending;
    if (syncing) {
      el.style.display = "block";
      el.style.background = "#ecdcb8";
      el.style.color = "#5c4033";
      el.textContent = "↻ Synchronisation en cours…";
      return;
    }
    if (!online || (isServerMode() && pending > 0)) {
      el.style.display = "block";
      if (!online) {
        el.style.background = "#3d3d3d";
        el.style.color = "#fff";
        el.innerHTML =
          "<b>Mode hors ligne</b> — vos saisies sont enregistrées en brouillon sur cet appareil" +
            (q ? " · <b>" + q + "</b> en attente de sync" : "") +
            (online ? "" : " · reconnectez-vous pour mettre en ligne");
      } else if (q > 0) {
        el.style.background = "#b3863a";
        el.style.color = "#fff";
        el.innerHTML = "<b>" + q + " brouillon(s) en attente</b> — cliquez pour synchroniser maintenant";
      }
      return;
    }
    el.style.display = "none";
  }

  function markEntretienDrafts() {
    (Store.state.entretiens || []).forEach((e) => {
      if (e.updated && online === false) {
        e._offlineDraft = true;
      }
    });
  }

  function patchStore() {
    if (!window.Store || Store._offlinePatched) return;
    const origSave = Store.save.bind(Store);
    const origPatch = Store.patch.bind(Store);
    Store.save = function () {
      origSave();
      if (!Store.state) return;
      if (!Store.state.meta) Store.state.meta = {};
      if (!canSync()) {
        Store.state.meta.offlineDraft = true;
        Store.state.meta.offlineDraftAt = new Date().toISOString();
        queueStatePush().catch(() => {});
      }
    };
    Store.patch = function (coll, id, fields) {
      const r = origPatch(coll, id, fields);
      if (coll === "entretiens" && fields && fields.questionnaire && !canSync()) {
        queueQuestionnaire(id, fields.questionnaire).catch(() => {});
      }
      return r;
    };
    Store._offlinePatched = true;
  }

  function patchSaveState() {
    if (!window.portiaApi || portiaApi._offlineSavePatched) return;
    const orig = portiaApi.saveState.bind(portiaApi);
    portiaApi.saveState = async function () {
      Store.save();
      if (!canSync()) {
        await queueStatePush();
        return;
      }
      try {
        await orig();
        if (Store.state && Store.state.meta) {
          Store.state.meta.offlineDraft = false;
          Store.state.meta.lastOnlineSyncAt = new Date().toISOString();
        }
      } catch (e) {
        online = false;
        await queueStatePush();
        throw e;
      }
    };
    portiaApi._offlineSavePatched = true;
  }

  function patchFiles() {
    if (!window.Files || Files._offlinePatched) return;
    const origPut = Files.put.bind(Files);
    Files.put = async function (id, blob, meta) {
      meta = meta || {};
      if (isServerMode() && !canSync()) {
        if (window.Files && Files.open) {
          try {
            const dbPut = async function (fid, blob2, meta2) {
              const db = await Files.open();
              return new Promise((res, rej) => {
                const tx = db.transaction("files", "readwrite");
                tx.objectStore("files").put({ id: fid, blob: blob2, meta: meta2 });
                tx.oncomplete = () => res(true);
                tx.onerror = (e) => rej(e.target.error);
              });
            };
            await dbPut(id, blob, meta);
          } catch (_) {}
        }
        const kind = meta.rep && meta.source ? "dataroom_deposit" : "file_upload";
        await queueFileUpload(id, blob, meta, kind);
        toast(
          "Brouillon local",
          (meta.name || "Fichier") + " enregistré — sync à la reconnexion",
          "info"
        );
        return {
          ok: true,
          id,
          fileId: id,
          offline: true,
          name: meta.name || "document",
        };
      }
      return origPut(id, blob, meta);
    };
    Files._offlinePatched = true;
  }

  function patchConductSave() {
    if (window._offlineConductPatched) return;
    const hook = () => {
      const save = document.getElementById("cdSave");
      if (!save || save._offlineHook) return;
      const origClick = save.onclick;
      save.onclick = async function (ev) {
        if (origClick) await origClick.call(this, ev);
        if (!canSync() && App.conductId) {
          const e = Store.find("entretiens", App.conductId);
          if (e && e.questionnaire) {
            await queueQuestionnaire(e.id, e.questionnaire);
          }
        }
      };
      save._offlineHook = true;
    };
    const origGo = App.go.bind(App);
    App.go = function (k) {
      const r = origGo(k);
      if (k === "conduct") setTimeout(hook, 200);
      return r;
    };
    window._offlineConductPatched = true;
  }

  function patchAppEnter() {
    if (!window.App || App._offlineEnterPatched) return;
    const orig = App.enter.bind(App);
    App.enter = async function () {
      const tok = getToken();
      if (isServerMode() && tok && !canSync()) {
        if (Store._loadLocalFallback) Store._loadLocalFallback();
        else Store.load();
        markEntretienDrafts();
        renderBanner();
        orig();
        toast(
          "Mode hors ligne",
          "Données locales chargées — les modifications seront synchronisées plus tard",
          "info"
        );
        return;
      }
      if (isServerMode() && tok && canSync()) {
        const recent =
          window._portiaServerLoadOk && Date.now() - window._portiaServerLoadOk < 3000;
        if (!recent) {
          try {
            if (window.portiaReloadServer) await portiaReloadServer();
          } catch (e) {
            if (Store._loadLocalFallback) Store._loadLocalFallback();
            online = false;
            renderBanner();
          }
        }
      }
      orig();
      setTimeout(flushQueue, 1500);
    };
    App._offlineEnterPatched = true;
  }

  function patchLoginScreen() {
    if (!window.App || App._offlineLoginPatched) return;
    const origLogout = App.logout.bind(App);
    App.logout = function () {
      origLogout();
      renderBanner();
    };
    if (window.PortiaEnterprise && PortiaEnterprise.showLoginScreen && !PortiaEnterprise._offlineBannerPatch) {
      const origShow = PortiaEnterprise.showLoginScreen;
      PortiaEnterprise.showLoginScreen = function () {
        origShow.apply(this, arguments);
        renderBanner();
      };
      PortiaEnterprise._offlineBannerPatch = true;
    }
    App._offlineLoginPatched = true;
  }

  function patchPortiaStart() {
    const orig = window.portiaStart;
    if (!orig || orig._offlineWrapped) return;
    window.portiaStart = async function () {
      await orig();
      patchStore();
      patchSaveState();
      if (isServerMode()) patchFiles();
      patchConductSave();
      patchAppEnter();
      patchLoginScreen();
      const pending = (await listQueue()).length;
      saveQueueMeta({ pending });
      renderBanner();
      if (canSync() && pending) setTimeout(flushQueue, 2000);
    };
    window.portiaStart._offlineWrapped = true;
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/portia-sw.js?v=20260622", { scope: "/" })
      .then((reg) => {
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            if (nw.state === "installed" && navigator.serviceWorker.controller) {
              nw.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
        if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
      })
      .catch((e) => console.warn("SW", e));
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (window._portiaSwReloaded) return;
      window._portiaSwReloaded = true;
      location.reload();
    });
  }

  function bindNetwork() {
    window.addEventListener("online", () => {
      online = true;
      renderBanner();
      toast("Connexion rétablie", "Synchronisation des brouillons…", "ok");
      setTimeout(flushQueue, 800);
    });
    window.addEventListener("offline", () => {
      online = false;
      renderBanner();
      toast("Hors ligne", "Saisie en brouillon local — rien n'est perdu", "warn");
    });
    setInterval(() => {
      if (navigator.onLine && !online) {
        online = true;
        flushQueue();
      }
      if (!navigator.onLine) online = false;
      renderBanner();
    }, 15000);
  }

  async function init() {
    bindNetwork();
    registerServiceWorker();
    patchPortiaStart();
    const pending = (await listQueue()).length;
    saveQueueMeta({ pending });
  }

  window.PortiaOffline = {
    isOnline: () => online,
    isOffline: () => !online,
    queueLength: async () => (await listQueue()).length,
    flushQueue,
    queueStatePush,
    queueQuestionnaire,
    renderBanner,
    init,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
