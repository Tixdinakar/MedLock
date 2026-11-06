/* MedLock service worker: kabuk ağdan (yoksa önbellekten), sürümlü şifreli bloblar önbellekten. */
const SHELL = "ml-shell-1", DATA = "ml-data-1", FONTS = "ml-fonts-1";
const CORE = ["./", "index.html", "app.js", "app.css", "engine.html", "manifest.webmanifest", "icons/64.png", "icons/192.png"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(CORE)).catch(() => {}));
});
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keep = [SHELL, DATA, FONTS];
    for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function cacheFirst(req, name) {
  const c = await caches.open(name);
  const hit = await c.match(req);
  if (hit) return hit;
  const r = await fetch(req);
  if (r.ok || r.type === "opaque") c.put(req, r.clone());
  return r;
}
async function networkFirst(req) {
  const c = await caches.open(SHELL);
  try {
    const r = await fetch(req, { cache: req.cache === "no-store" ? "no-store" : "no-cache" });
    if (r.ok) c.put(req, r.clone());
    return r;
  } catch (e) {
    const hit = await c.match(req, { ignoreSearch: req.mode === "navigate" });
    if (hit) return hit;
    if (req.mode === "navigate") { const idx = await c.match("index.html"); if (idx) return idx; }
    throw e;
  }
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const u = new URL(req.url);
  if (u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com") { e.respondWith(cacheFirst(req, FONTS)); return; }
  if (u.origin !== location.origin) return;
  if (u.searchParams.has("v")) { e.respondWith(cacheFirst(req, DATA)); return; }
  e.respondWith(networkFirst(req));
});
