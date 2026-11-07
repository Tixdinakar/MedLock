/* MedLock service worker.
   Kabuk (index, app.js, css, test motoru) önbellekten anında açılır; ağ beklenmez.
   Yeni sürüm çıkınca uygulama (app.js › updateShell) kabuğu topluca yeniler ve sayfayı yeniden yükler.
   Sürümlü şifreli bloblar (?v=) önbellekten; v.json ve k.json hep ağdan. */
const SHELL = "ml-shell-1", DATA = "ml-data-1", FONTS = "ml-fonts-1";
const CORE = ["./", "index.html", "app.js", "app.css", "engine.html", "manifest.webmanifest", "icons/64.png", "icons/192.png"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(CORE.map(u => new Request(u, { cache: "reload" })))).catch(() => {}));
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
async function shellFirst(req) {
  const c = await caches.open(SHELL);
  const nav = req.mode === "navigate";
  const hit = (await c.match(req, { ignoreSearch: nav })) || (nav ? (await c.match("./")) || (await c.match("index.html")) : null);
  if (hit) return hit;
  const r = await fetch(req);
  if (r.ok) c.put(req, r.clone());
  return r;
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const u = new URL(req.url);
  if (u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com") { e.respondWith(cacheFirst(req, FONTS)); return; }
  if (u.origin !== location.origin) return;
  if (/\/(v|k)\.json$/.test(u.pathname)) return;                       // sürüm ve anahtar: hep ağdan
  if (u.searchParams.has("v")) { e.respondWith(cacheFirst(req, DATA)); return; }
  if (req.cache === "reload" || req.cache === "no-store") return;     // updateShell'in taze indirmesi
  e.respondWith(shellFirst(req));
});
