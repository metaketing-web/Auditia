/* Skydeen Audit — cache application pour usage hors ligne (shell + assets). */
const CACHE = "skydeen-offline-v6";
const SHELL = [
  "/portia-bridge.js",
  "/portia-enterprise.js",
  "/portia-offline-sync.js",
  "/portia-file-preview.js",
  "/portia-plaud.js",
  "/portia-source-import.js",
  "/portia-state-snapshots.js",
  "/portia-item-export.js",
  "/portia-finish.js",
  "/portia-relances.js",
  "/portia-doc-ai.js",
  "/cdc-checklist-technique.js",
  "/questionnaires-complets.js",
  "/questionnaires-terrain.js",
];

function isHtmlDocument(pathname) {
  return pathname === "/" || pathname.endsWith(".html");
}

function isAppShell(pathname) {
  return pathname.endsWith(".js") || pathname.endsWith(".css");
}

function isGoodAssetResponse(response) {
  if (!response || !response.ok) return false;
  const ct = (response.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("text/html")) return false;
  return true;
}

async function fetchHtmlDocument(request) {
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response && response.ok) {
      const clone = response.clone();
      caches.open(CACHE).then((c) => c.put(request, clone));
      return response;
    }
  } catch (_) {}
  const cached = await caches.match(request);
  if (cached) return cached;
  return fetch(request);
}

async function fetchShellAsset(request) {
  const cached = await caches.match(request);
  try {
    const response = await fetch(request);
    if (isGoodAssetResponse(response)) {
      const clone = response.clone();
      caches.open(CACHE).then((c) => c.put(request, clone));
      return response;
    }
    if (cached) return cached;
    return response;
  } catch (_) {
    if (cached) return cached;
    throw _;
  }
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL.filter(Boolean))).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  if (e.request.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;

  if (isHtmlDocument(url.pathname)) {
    e.respondWith(fetchHtmlDocument(e.request));
    return;
  }

  if (isAppShell(url.pathname)) {
    e.respondWith(fetchShellAsset(e.request));
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const net = fetch(e.request)
        .then((r) => {
          if (isGoodAssetResponse(r)) {
            const clone = r.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return r;
        })
        .catch(() => cached);
      return cached || net;
    })
  );
});
