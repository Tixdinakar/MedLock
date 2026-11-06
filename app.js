/* MedLock — kişisel ders arşivi. İçerik şifreli (AES-GCM); anahtar giriş şifresinden türetilir. */
(() => {
"use strict";

const NAME = "MedLock";
const INT = [1, 3, 7, 14, 30];             // Leitner aralıkları (gün)
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const strip = s => String(s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} },
};

/* ---------- icons ---------- */
const P = {
  home: '<path d="M3.5 11 12 4l8.5 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
  lib: '<path d="M5 4h4v16H5z"/><path d="M11 4h4v16h-4z"/><path d="m17 5.2 2.6-.7 2.4 15-2.6.7z"/>',
  rep: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 3.5V8h4.5"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 20.5V16h-4.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  set: '<path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17" r="2"/>',
  back: '<path d="m15 5-7 7 7 7"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  slide: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8.5 20.5h7M12 16.5v4"/>',
  test: '<rect x="4.5" y="3.5" width="15" height="17" rx="2"/><path d="m8 9 1.6 1.6L12.5 7.7M8 15.5h8M14.5 10H16"/>',
  note: '<path d="M6 3.5h8.5L19 8v12.5H6z"/><path d="M14 3.5V8h5M9 12h7M9 15.5h7"/>',
  ozet: '<path d="M5 5h14M5 9.5h14M5 14h9M5 18.5h6"/>',
  star: '<path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"/>',
  cards: '<rect x="3.5" y="7" width="13" height="13" rx="2"/><path d="M8 4h10.5a2 2 0 0 1 2 2v10.5"/>',
  audio: '<path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"/>',
  q: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1.1.9-1.1 1.6v.5M12 16.8v.2"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
  dl: '<path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 20h14"/>',
  expand: '<path d="M14 4h6v6M10 20H4v-6M20 4l-6.5 6.5M4 20l6.5-6.5"/>',
  shuffle: '<path d="M4 7h3.5c4 0 5 10 9 10H20M4 17h3.5c1.4 0 2.4-1.2 3.3-2.8M13.2 9.8C14.1 8.2 15.1 7 16.5 7H20"/><path d="m17.5 4.5 2.5 2.5-2.5 2.5M17.5 14.5l2.5 2.5-2.5 2.5"/>',
  out: '<path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10"/>',
};
const icon = (n, cls) => '<svg class="ic' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || "") + "</svg>";

const KIND = {
  slayt: { l: "Slayt", ic: "slide", c: "#2b5bd7" },
  not: { l: "Not", ic: "note", c: "#1f8a7a" },
  ozet: { l: "Özet", ic: "ozet", c: "#7a4fd0" },
  test: { l: "Test", ic: "test", c: "#e2691f" },
  kart: { l: "Kart", ic: "cards", c: "#c0398a" },
  cikmis: { l: "Çıkmış", ic: "star", c: "#b8861b" },
  soru: { l: "Soru", ic: "q", c: "#c23b2e" },
  ses: { l: "Ses", ic: "audio", c: "#5c6b8a" },
};
const KORDER = ["slayt", "not", "ozet", "test", "kart", "cikmis", "soru", "ses"];
const CCOL = {
  "Biyokimya": "#e0672a", "Tıbbi Biyoloji ve Genetik": "#2c9a5a", "Biyofizik": "#3567e0", "Tıp Tarihi": "#b88a22",
  "Biyoistatistik": "#8656d8", "Psikoloji": "#d2478c", "ATA 151 · Türk Dili I": "#1d98ae",
};
function ccol(c) {
  if (CCOL[c]) return CCOL[c];
  let h = 0; for (const ch of c) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return "hsl(" + (h % 360) + " 58% 48%)";
}

/* ---------- text helpers ---------- */
const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const MSHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const pad = n => String(n).padStart(2, "0");
const isoDay = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const today = () => isoDay(new Date());
const addDays = (iso, n) => { const d = new Date(iso + "T12:00"); d.setDate(d.getDate() + n); return isoDay(d); };
const dayDiff = (a, b) => Math.round((new Date(b + "T12:00") - new Date(a + "T12:00")) / 864e5);
function fdate(iso, withYear) {
  if (!iso) return "";
  const d = new Date(iso.length <= 10 ? iso + "T12:00" : iso);
  return d.getDate() + " " + MSHORT[d.getMonth()] + (withYear ? " " + d.getFullYear() : "");
}
const fmtMB = b => (b / 1048576).toFixed(b > 104857600 ? 0 : 1) + " MB";
const FOLD = new Map();
function foldChar(ch) {
  let f = FOLD.get(ch);
  if (f === undefined) {
    f = ch.toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");
    f = f.length === 1 ? f : f.length === 0 ? " " : f[0];
    FOLD.set(ch, f);
  }
  return f;
}
function fold(s) { let o = ""; for (let i = 0; i < s.length; i++) o += foldChar(s[i]); return o; }
const slug = s => fold(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ---------- crypto & data ---------- */
let KEY = null;
const b64d = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const b64e = u => { let s = ""; u.forEach(b => s += String.fromCharCode(b)); return btoa(s); };
const importDek = raw => crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);

async function unlockSaved() {
  const s = LS.get("ml.k");
  if (!s) return false;
  try { KEY = await importDek(b64d(s)); return true; } catch (e) { return false; }
}
async function login(pw) {
  const K = await (await fetch("k.json", { cache: "no-store" })).json();
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
  for (const e of K.keys) {
    const kek = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: b64d(e.salt), iterations: e.it, hash: "SHA-256" },
      base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    const w = b64d(e.w);
    try {
      const raw = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: w.slice(0, 12) }, kek, w.slice(12)));
      KEY = await importDek(raw);
      LS.set("ml.k", b64e(raw));
      return true;
    } catch (err) { /* sonraki anahtar */ }
  }
  return false;
}
async function decrypt(buf) {
  const u = new Uint8Array(buf);
  return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: u.slice(0, 12) }, KEY, u.slice(12)));
}
async function fetchBlob(path, v) {
  const r = await fetch(path + (v ? "?v=" + v : ""));
  if (!r.ok) throw new Error("HTTP " + r.status + " " + path);
  return decrypt(await r.arrayBuffer());
}
let fflateP = null;
function loadFflate() {
  if (!fflateP) fflateP = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.js";
    s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });
  return fflateP;
}
async function gunzip(u8) {
  if ("DecompressionStream" in window) {
    const st = new Blob([u8]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Uint8Array(await new Response(st).arrayBuffer());
  }
  await loadFflate();
  return window.fflate.gunzipSync(u8);
}
async function fetchJSON(path, v) { return JSON.parse(new TextDecoder().decode(await gunzip(await fetchBlob(path, v)))); }

/* ---------- state ---------- */
const S = { cat: null, byId: {}, ver: null, appVer: null, tests: {}, texts: {}, index: null, cur: null, cleanup: [], filters: {}, nav: 0 };
function setCatalog(cat) {
  S.cat = cat; S.byId = {};
  cat.items.forEach(it => { S.byId[it.id] = it; });
  cat.items.sort((a, b) => (b.d || "").localeCompare(a.d || ""));
}
async function loadCatalog() {
  let v = null;
  try { v = await (await fetch("v.json", { cache: "no-store" })).json(); LS.set("ml.v", v); }
  catch (e) { v = LS.get("ml.v", null); }
  if (!v) throw new Error("offline");
  S.ver = v; if (!S.appVer) S.appVer = v.app;
  setCatalog(await fetchJSON("d/c", v.c));
}
const loadTest = async it => S.tests[it.id] || (S.tests[it.id] = await fetchJSON("d/" + it.x, it.v));
const loadTexts = async it => S.texts[it.id] || (S.texts[it.id] = await fetchJSON("d/" + it.x + "/t", it.v));
let engineP = null;
const engineTpl = () => engineP || (engineP = fetch("engine.html").then(r => { if (!r.ok) throw new Error("engine"); return r.text(); }));

const kurulById = id => id === "ortak" ? Object.assign({ no: "", start: "", end: "" }, S.cat.ortak) : S.cat.kurullar.find(k => k.id === id);
function currentKurul() {
  const t = today(), K = S.cat.kurullar;
  return K.find(k => t >= k.start && t <= k.end) || K.find(k => t < k.start) || K[K.length - 1];
}
function courseItems(g, cslug) { return S.cat.items.filter(it => it.g === g && slug(it.c) === cslug); }
function coursesOf(g) {
  const m = new Map();
  S.cat.items.filter(it => it.g === g).forEach(it => {
    if (!m.has(it.c)) m.set(it.c, { c: it.c, items: [], hocas: new Set(), latest: "" });
    const o = m.get(it.c); o.items.push(it); if (it.h) o.hocas.add(it.h); if ((it.d || "") > o.latest) o.latest = it.d || "";
  });
  return Array.from(m.values()).sort((a, b) => b.latest.localeCompare(a.latest));
}
const unitWord = it => it.k === "test" ? "soru" : it.k === "kart" ? "kart" : it.k === "slayt" ? "slayt" : "sayfa";

/* ---------- progress records ---------- */
const srsLoad = () => LS.get("ml.srs", {});
const srsSave = s => LS.set("ml.srs", s);
function srsDue(all) {
  const s = srsLoad(), t = today();
  return Object.keys(s).filter(k => !s[k].m && (all || s[k].due <= t));
}
function srsKeyItem(k) { return S.byId[k.split("|")[0]]; }
const testRes = () => LS.get("ml.tres", {});

/* ---------- toast ---------- */
let toastT = 0;
function toast(msg, act, fn, ms) {
  const el = $("#toast");
  el.innerHTML = "<span>" + esc(msg) + "</span>" + (act ? "<button type=button>" + esc(act) + "</button>" : "");
  if (act) el.querySelector("button").onclick = () => { el.classList.remove("show"); fn(); };
  el.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove("show"), ms || (act ? 9000 : 3200));
}

/* ---------- shell ---------- */
const app = () => $("#app");
const main = () => $("#main");
function shell() {
  const kl = S.cat.kurullar.filter(k => k.start <= today() || S.cat.items.some(i => i.g === k.id)).slice().reverse();
  app().innerHTML = '<div class="shell" id="shell">'
    + '<aside class="side"><a class="brand" href="#/"><img src="icons/64.png" alt=""><span>' + NAME + '</span></a><nav>'
    + '<a data-nav="home" href="#/">' + icon("home") + 'Ana sayfa</a>'
    + '<a data-nav="lib" href="#/lib">' + icon("lib") + 'Kütüphane</a>'
    + kl.map(k => '<a class="sub" data-nav="k:' + k.id + '" href="#/lib/' + k.id + '">Kurul ' + k.no + '</a>').join("")
    + (S.cat.items.some(i => i.g === "ortak") ? '<a class="sub" data-nav="k:ortak" href="#/lib/ortak">Ortak dersler</a>' : "")
    + '<a data-nav="tekrar" href="#/tekrar">' + icon("rep") + 'Tekrar<span class="badge" data-badge hidden></span></a>'
    + '<a data-nav="ara" href="#/ara">' + icon("search") + 'Ara</a>'
    + '<div class="sep"></div><a data-nav="ayarlar" href="#/ayarlar">' + icon("set") + 'Ayarlar</a></nav>'
    + '<div class="foot" id="side-foot"></div></aside>'
    + '<main class="main" id="main"></main>'
    + '<nav class="tabs">'
    + '<a data-nav="home" href="#/">' + icon("home") + 'Ana sayfa</a>'
    + '<a data-nav="lib" href="#/lib">' + icon("lib") + 'Kütüphane</a>'
    + '<a data-nav="tekrar" href="#/tekrar">' + icon("rep") + 'Tekrar<span class="badge" data-badge hidden></span></a>'
    + '<a data-nav="ara" href="#/ara">' + icon("search") + 'Ara</a>'
    + '<a data-nav="ayarlar" href="#/ayarlar">' + icon("set") + 'Ayarlar</a>'
    + '</nav></div>';
  updateBadge();
  footNote();
}
function footNote() {
  const f = $("#side-foot");
  if (f && S.cat) f.textContent = S.cat.items.length + " öğe · güncelleme " + fdate(stampIso(S.cat.v));
}
const stampIso = v => v ? v.slice(0, 4) + "-" + v.slice(4, 6) + "-" + v.slice(6, 8) : "";
function updateBadge() {
  const n = srsDue().length;
  $$("[data-badge]").forEach(b => { b.hidden = !n; b.textContent = n > 99 ? "99+" : n; });
}
function setNav(key, immersive) {
  $$("[data-nav]").forEach(a => {
    const k = a.dataset.nav;
    a.classList.toggle("on", k === key || (key.startsWith("k:") && k === "lib" && !a.classList.contains("sub")) || k === key);
  });
  $("#shell").classList.toggle("immersive", !!immersive);
}
function bar(o) {
  const back = o.back ? '<a class="ibtn" href="' + o.back + '" data-back aria-label="Geri">' + icon("back") + "</a>" : "";
  return '<header class="bar' + (o.solid ? " solid" : "") + '">' + back + '<div class="ttl">' + (o.crumb ? "<small>" + o.crumb + "</small>" : "")
    + "<h1>" + esc(o.title) + "</h1></div>" + (o.actions || "") + "</header>";
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-back]");
  if (b && S.nav > 1) { e.preventDefault(); history.back(); }
});

/* ---------- router ---------- */
function parseHash() {
  const h = location.hash.slice(1) || "/";
  const [path, qs] = h.split("?");
  return { parts: path.split("/").filter(Boolean).map(decodeURIComponent), q: new URLSearchParams(qs || "") };
}
function cleanup() { S.cleanup.splice(0).forEach(f => { try { f(); } catch (e) {} }); }
async function route() {
  if (!S.cat) return;
  S.nav++;
  cleanup();
  const { parts, q } = parseHash();
  const [a, b, c] = parts;
  const m = main();
  m.scrollTop = 0;
  try {
    if (!a) return viewHome();
    if (a === "lib") return !b ? viewLib() : !c ? viewKurul(b) : viewCourse(b, c);
    if (a === "d") return viewDoc(b, parseInt(c, 10) || 1, q);
    if (a === "t") return viewTest(b);
    if (a === "c") return viewCards(b);
    if (a === "tekrar") return q.get("s") ? viewSession(q) : viewReview();
    if (a === "ara") return viewSearch(q.get("q") || "");
    if (a === "ayarlar") return viewSettings();
    if (a === "kurulum") return viewInstall(true);
    viewHome();
  } catch (err) { showError(err); }
}
function showError(err) {
  console.error(err);
  setNav("", false);
  main().innerHTML = bar({ title: "Bir sorun çıktı", back: "#/" }) + '<div class="page narrow"><div class="card empty">'
    + esc(err && err.message || err) + '<br><br><button class="btn" onclick="location.reload()">Yeniden yükle</button></div></div>';
}
const notFound = () => { main().innerHTML = bar({ title: "Bulunamadı", back: "#/" }) + '<div class="page"><div class="card empty">Bu öğe artık yok.</div></div>'; };

/* ---------- item rows ---------- */
function kindBox(k) { const K = KIND[k] || KIND.not; return '<span class="kind" style="--kc:' + K.c + '" title="' + K.l + '">' + icon(K.ic) + "</span>"; }
function itemHref(it) { return it.k === "test" ? "#/t/" + it.id : it.k === "kart" ? "#/c/" + it.id : "#/d/" + it.id + "/1"; }
function itemMeta(it, opts) {
  const m = [];
  if (opts && opts.course) m.push('<span><i class="cdot" style="background:' + ccol(it.c) + '"></i>' + esc(it.c) + "</span>");
  m.push("<span>" + (KIND[it.k] || {}).l + "</span>");
  if (it.d && !it.dq) m.push("<span>" + fdate(it.d) + "</span>");
  if (it.h && !(opts && opts.noHoca)) m.push("<span>" + esc(it.h) + "</span>");
  if (it.n) m.push("<span>" + it.n + " " + unitWord(it) + "</span>");
  if (it.k === "test") {
    const r = testRes()[it.id];
    if (r && r.fin) m.push('<span class="sc">Son: ' + r.ok + "/" + r.n + "</span>");
    else if (r && r.done) m.push('<span class="ip">Devam ediyor · ' + r.done + "/" + r.n + "</span>");
  }
  return m.join("");
}
function itemRow(it, opts) {
  return '<a class="it" href="' + itemHref(it) + '">' + kindBox(it.k) + '<div class="txt"><div class="t">' + esc(it.t) + (it.m ? ' <span class="muted small">· ' + esc(it.m) + "</span>" : "")
    + '</div><div class="m">' + itemMeta(it, opts) + "</div></div>" + icon("chev", "chev") + "</a>";
}

/* ---------- views: home ---------- */
function viewHome() {
  setNav("home");
  const k = currentKurul(), t = today();
  const total = dayDiff(k.start, k.end) + 1, gone = Math.min(Math.max(dayDiff(k.start, t) + 1, 0), total);
  const week = Math.max(1, Math.ceil(gone / 7)), weeks = Math.ceil(total / 7), left = dayDiff(t, k.end);
  const kItems = S.cat.items.filter(i => i.g === k.id);
  const due = srsDue().length, tracked = srsDue(true).length;
  const lastDoc = LS.get("ml.lastDoc"), lastTest = LS.get("ml.lastTest");
  const cont = [];
  if (lastDoc && S.byId[lastDoc.id]) { const it = S.byId[lastDoc.id]; cont.push({ at: lastDoc.at, html: '<a class="it" href="#/d/' + it.id + "/" + lastDoc.p + '">' + kindBox(it.k) + '<div class="txt"><div class="t">' + esc(it.t) + '</div><div class="m"><span><i class="cdot" style="background:' + ccol(it.c) + '"></i>' + esc(it.c) + "</span><span>Sayfa " + lastDoc.p + " / " + it.n + "</span></div></div>" + icon("chev", "chev") + "</a>" }); }
  if (lastTest && S.byId[lastTest.id]) { const it = S.byId[lastTest.id]; cont.push({ at: lastTest.at, html: itemRow(it, { course: 1, noHoca: 1 }) }); }
  cont.sort((a, b) => b.at - a.at);
  const started = t >= k.start;
  main().innerHTML = bar({ title: NAME, crumb: fdate(t, true) })
    + '<div class="page">'
    + '<a class="card hero" href="#/lib/' + k.id + '"><div class="k">Kurul ' + k.no + (started ? " · " + week + ". hafta / " + weeks : " · yakında") + '</div><h3>' + esc(k.name) + "</h3>"
    + '<div class="prog"><i style="width:' + Math.round(100 * gone / total) + '%"></i></div>'
    + '<div class="meta"><span>' + fdate(k.start) + " – " + fdate(k.end) + "</span>" + (left >= 0 ? "<span>Kurul sonuna <b>" + left + " gün</b></span>" : "") + "<span><b>" + kItems.length + "</b> öğe</span></div>"
    + '<span class="btn">Kurula git ' + icon("chev") + "</span></a>"
    + '<div class="grid" style="margin-top:12px">'
    + '<a class="card tile' + (due ? " due" : "") + '" href="#/tekrar"><span class="big">' + due + '</span><span class="txt"><b>' + (due ? "soru tekrar bekliyor" : "Bugün tekrar yok") + '</b><span class="muted small">'
    + (tracked ? "Listede " + tracked + " soru var" : "Yanlış yaptığın sorular buraya düşer") + "</span></span>" + icon("chev", "chev") + "</a>"
    + '<a class="card tile" href="#/ara"><span class="big">' + icon("search") + '</span><span class="txt"><b>Her yerde ara</b><span class="muted small">Slaytlar, notlar ve sorular</span></span>' + icon("chev", "chev") + "</a>"
    + "</div>"
    + (cont.length ? '<h2 class="sec">Kaldığın yer</h2><div class="card list">' + cont.map(c => c.html).join("") + "</div>" : "")
    + '<h2 class="sec">Son eklenenler</h2><div class="card list">' + S.cat.items.slice(0, 8).map(it => itemRow(it, { course: 1, noHoca: 1 })).join("") + "</div>"
    + "</div>";
}

/* ---------- views: library ---------- */
function viewLib() {
  setNav("lib");
  const t = today();
  const started = S.cat.kurullar.filter(k => k.start <= t).slice().reverse();
  const future = S.cat.kurullar.filter(k => k.start > t);
  const card = (k, cls) => {
    const its = S.cat.items.filter(i => i.g === k.id);
    const cnt = KORDER.map(kk => [kk, its.filter(i => i.k === kk).length]).filter(x => x[1]).map(x => x[1] + " " + KIND[x[0]].l.toLowerCase()).join(" · ");
    const now = k.start && t >= k.start && t <= k.end;
    return '<a class="card kurul ' + (cls || "") + '" href="#/lib/' + k.id + '">' + (k.no ? '<span class="no">KURUL ' + k.no + "</span>" : '<span class="no">DÖNEM I</span>')
      + "<h3>" + esc(k.name) + "</h3>" + (k.start ? '<span class="d">' + fdate(k.start) + " – " + fdate(k.end, true) + "</span>" : '<span class="d">Kurul dışı dersler</span>')
      + '<span class="cnt">' + (cnt || "Henüz içerik yok") + "</span>"
      + (now ? '<span class="st now">Şu an</span>' : k.end && t > k.end ? '<span class="st">Bitti</span>' : k.start && t < k.start ? '<span class="st">Yaklaşıyor</span>' : "") + "</a>";
  };
  const hasOrtak = S.cat.items.some(i => i.g === "ortak");
  main().innerHTML = bar({ title: "Kütüphane", crumb: "Tıp · Dönem I" }) + '<div class="page"><div class="grid">'
    + started.map(k => card(k)).join("") + (hasOrtak ? card(kurulById("ortak")) : "") + future.map(k => card(k, "future")).join("")
    + "</div></div>";
}
function viewKurul(g) {
  const k = kurulById(g);
  if (!k) return notFound();
  setNav("k:" + g);
  const cs = coursesOf(g);
  main().innerHTML = bar({ title: k.no ? "Kurul " + k.no + " · " + k.name : k.name, crumb: '<a href="#/lib">Tıp</a>', back: "#/lib" })
    + '<div class="page">' + (k.start ? '<p class="muted small" style="margin:0 0 14px">' + fdate(k.start, true) + " – " + fdate(k.end, true) + "</p>" : "")
    + (cs.length ? '<div class="grid">' + cs.map(o => {
      const cnt = KORDER.map(kk => [kk, o.items.filter(i => i.k === kk).length]).filter(x => x[1]).map(x => "<span><b>" + x[1] + "</b> " + KIND[x[0]].l.toLowerCase() + "</span>").join("");
      return '<a class="card course" href="#/lib/' + g + "/" + slug(o.c) + '"><span class="bar-c" style="background:' + ccol(o.c) + '"></span><span class="txt"><h3>' + esc(o.c) + "</h3>"
        + '<span class="h">' + (Array.from(o.hocas).map(esc).join(", ") || "Hoca belirtilmedi") + '</span><span class="cnt">' + cnt + "</span></span>" + icon("chev", "chev") + "</a>";
    }).join("") + "</div>" : '<div class="card empty">Bu kurula henüz içerik eklenmedi. Ders dosyaları Drive’a yüklendikçe burada görünecek.</div>')
    + "</div>";
}
function viewCourse(g, cs) {
  const k = kurulById(g);
  const items = courseItems(g, cs);
  if (!k || !items.length) return notFound();
  setNav("k:" + g);
  const c = items[0].c, fk = g + "/" + cs;
  const F = S.filters[fk] || (S.filters[fk] = { h: "", k: "" });
  const hocas = Array.from(new Set(items.map(i => i.h).filter(Boolean)));
  const kinds = KORDER.filter(kk => items.some(i => i.k === kk));
  const render = () => {
    const vis = items.filter(i => (!F.h || i.h === F.h) && (!F.k || i.k === F.k));
    let lastM = "", rows = "";
    vis.forEach(it => {
      const m = it.dq ? "Tarihsiz" : it.d ? MONTHS[+it.d.slice(5, 7) - 1] + " " + it.d.slice(0, 4) : "";
      if (m !== lastM) { if (rows) rows += "</div>"; rows += '<div class="month">' + m + '</div><div class="card list">'; lastM = m; }
      rows += itemRow(it, { noHoca: !!F.h });
    });
    if (rows) rows += "</div>";
    $("#flt").innerHTML = (hocas.length > 1 ? '<div class="flabel">Hoca</div><div class="chips">' + chip("h", "", "Tümü", items.length) + hocas.map(h => chip("h", h, h, items.filter(i => i.h === h).length)).join("") + "</div>" : "")
      + (kinds.length > 1 ? '<div class="flabel">Tür</div><div class="chips">' + chip("k", "", "Tümü", null) + kinds.map(kk => chip("k", kk, KIND[kk].l, items.filter(i => i.k === kk && (!F.h || i.h === F.h)).length)).join("") + "</div>" : "");
    $("#rows").innerHTML = rows || '<div class="card empty">Bu filtreye uyan öğe yok.</div>';
  };
  const chip = (f, v, l, n) => '<button class="chip' + (F[f] === v ? " on" : "") + '" data-f="' + f + '" data-v="' + esc(v) + '">' + esc(l) + (n != null ? '<span class="n">' + n + "</span>" : "") + "</button>";
  main().innerHTML = bar({ title: c, crumb: '<a href="#/lib">Tıp</a> › <a href="#/lib/' + g + '">' + esc(k.no ? "Kurul " + k.no : k.name) + "</a>", back: "#/lib/" + g })
    + '<div class="page"><div class="filters" id="flt"></div><div id="rows"></div></div>';
  $("#flt").addEventListener("click", e => { const b = e.target.closest("[data-f]"); if (!b) return; F[b.dataset.f] = b.dataset.v; render(); });
  render();
}

/* ---------- document viewer ---------- */
const URLS = new Map();          // "x/p" -> objectURL (küçük LRU)
function urlCache(key, url) {
  URLS.set(key, url);
  if (URLS.size > 80) { const [k0, u0] = URLS.entries().next().value; URLS.delete(k0); URL.revokeObjectURL(u0); }
}
async function pageURL(it, p) {
  const key = it.x + "/" + p;
  if (URLS.has(key)) return URLS.get(key);
  const b = await fetchBlob("d/" + it.x + "/" + p, it.v);
  const u = URL.createObjectURL(new Blob([b], { type: "image/webp" }));
  urlCache(key, u);
  return u;
}
function mountDoc(el, it, page, opts) {
  opts = opts || {};
  const hl = new Set(opts.highlight || []);
  let html = "";
  for (let p = 1; p <= it.n; p++) {
    html += '<figure class="pg' + (hl.has(p) ? " hl" : "") + '" data-p="' + p + '"' + (hl.has(p) ? ' data-hl="' + (opts.est ? "Tahmini sayfa" : "Soruyla ilgili") + '"' : "")
      + '><div class="ph" style="--ar:' + (it.r || 1.333) + '">' + p + '</div><span class="pn">' + p + " / " + it.n + "</span></figure>";
  }
  el.innerHTML = html + (opts.foot || "");
  const loadP = async fig => {
    if (fig.dataset.l) return; fig.dataset.l = "1";
    try {
      const u = await pageURL(it, +fig.dataset.p);
      const img = new Image(); img.alt = "Sayfa " + fig.dataset.p; img.decoding = "async"; img.src = u;
      await img.decode().catch(() => {});
      const ph = fig.querySelector(".ph"); if (ph) ph.replaceWith(img); else fig.prepend(img);
    } catch (e) { fig.dataset.l = ""; const ph = fig.querySelector(".ph"); if (ph) ph.textContent = "Yüklenemedi · tekrar kaydır"; }
  };
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) loadP(e.target); }), { root: el, rootMargin: "120% 0px" });
  let curP = page;
  const seen = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { curP = +e.target.dataset.p; opts.onPage && opts.onPage(curP); } });
  }, { root: el, rootMargin: "-45% 0px -50% 0px" });
  $$(".pg", el).forEach(f => { io.observe(f); seen.observe(f); });
  const goto = (p, smooth) => { const f = el.querySelector('[data-p="' + Math.min(Math.max(p, 1), it.n) + '"]'); if (f) { loadP(f); el.scrollTo({ top: f.offsetTop - 8, behavior: smooth ? "smooth" : "auto" }); } };
  requestAnimationFrame(() => goto(page));
  return { goto, destroy() { io.disconnect(); seen.disconnect(); }, get page() { return curP; } };
}
function viewDoc(id, page, q) {
  const it = S.byId[id];
  if (!it || it.k === "test" || it.k === "kart") return notFound();
  setNav("lib", true);
  const k = kurulById(it.g);
  const back = "#/lib/" + it.g + "/" + slug(it.c);
  main().innerHTML = '<div class="fill">' + bar({
    title: it.t, solid: 1, back, crumb: esc(it.c) + (it.h ? " · " + esc(it.h) : ""),
    actions: '<button class="pgc" id="pgc">' + page + " / " + it.n + "</button>",
  }) + '<div class="doc" id="doc"></div></div>';
  const rel = S.cat.items.filter(t => t.k === "test" && (t.dk || []).some(d => d[0] === it.id));
  const foot = rel.length ? '<div class="doc-foot"><b>Bu ' + (it.k === "slayt" ? "slayttan" : "dosyadan") + " soru olan testler</b><div class=\"row-btns\">"
    + rel.map(t => '<a class="btn" href="#/t/' + t.id + '">' + icon("test") + esc(t.c === it.c ? t.t : t.c + " · " + t.t) + ' <span class="muted">' + (t.dk.find(d => d[0] === it.id)[1]) + " soru</span></a>").join("") + "</div></div>" : "";
  const hl = (q && q.get("h") || "").split(",").map(Number).filter(Boolean);
  let saveT = 0;
  const V = mountDoc($("#doc"), it, page, {
    highlight: hl, est: q && q.get("e") === "1", foot,
    onPage: p => {
      $("#pgc").textContent = p + " / " + it.n;
      clearTimeout(saveT);
      saveT = setTimeout(() => { history.replaceState(null, "", "#/d/" + it.id + "/" + p + (hl.length ? "?" + q.toString() : "")); LS.set("ml.lastDoc", { id: it.id, p, at: Date.now() }); }, 400);
    },
  });
  LS.set("ml.lastDoc", { id: it.id, p: page, at: Date.now() });
  S.cleanup.push(() => V.destroy());
  $("#pgc").onclick = () => {
    const b = $("#pgc");
    const inp = document.createElement("input");
    inp.type = "number"; inp.min = 1; inp.max = it.n; inp.value = V.page; inp.className = "pgjump"; inp.inputMode = "numeric";
    b.replaceWith(inp); inp.select();
    const done = () => { const p = parseInt(inp.value, 10); inp.replaceWith(b); if (p) V.goto(p); };
    inp.onkeydown = e => { if (e.key === "Enter") done(); if (e.key === "Escape") inp.replaceWith(b); };
    inp.onblur = done;
  };
}

/* ---------- slide panel (from tests & review) ---------- */
function openSlide(docId, pages, est) {
  const it = S.byId[docId];
  if (!it) return toast("Bu kaynak henüz kütüphanede yok.");
  closeSlide();
  let pane = $("#spane");
  if (!pane) { pane = document.createElement("aside"); pane.className = "spane"; pane.id = "spane"; pane.dataset.float = "1"; document.body.appendChild(pane); }
  pane.hidden = false;
  pane.innerHTML = '<div class="shead"><button class="ibtn" data-sclose aria-label="Kapat">' + icon(innerWidth < 900 ? "back" : "close") + '</button><div class="t">' + esc(it.t)
    + "<small>" + (est ? "Tahmini " : "") + (it.k === "slayt" ? "slayt " : "sayfa ") + esc(pages.join(", ")) + " · " + esc(it.c) + '</small></div><a class="ibtn" href="#/d/' + it.id + "/" + pages[0] + "?h=" + pages.join(",") + (est ? "&e=1" : "") + '" title="Tam ekran aç">' + icon("expand") + '</a></div><div class="doc"></div>';
  pane._v = mountDoc($(".doc", pane), it, pages[0], { highlight: pages, est });
  $("[data-sclose]", pane).onclick = closeSlide;
  S.cleanup.push(closeSlide);
}
function closeSlide() {
  const p = $("#spane");
  if (!p || p.hidden) return;
  if (p._v) { p._v.destroy(); p._v = null; }
  if (p.dataset.float) p.remove(); else { p.hidden = true; p.innerHTML = ""; }
}
const pagesLabel = (it, pages) => (it && it.k === "slayt" ? "slayt " : "sayfa ") + pages.join(", ");

/* ---------- tests (engine in iframe) ---------- */
window.MLBridge = function (win) {
  const C = S.cur;
  if (!C) return null;
  win.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-ml],[data-mld]");
    if (!b) return;
    e.preventDefault();
    if (b.dataset.ml) { const r = C.blob.refs[b.dataset.ml]; if (r) openSlide(r[0], r[1], r[2]); }
    else openSlide(b.dataset.mld, b.dataset.mlp.split(",").map(Number), b.dataset.est === "1");
  });
  return {
    btn(qid) {
      const r = C.blob.refs[qid], d = r && S.byId[r[0]];
      if (!d) return "";
      return '<button type="button" class="ml-go" data-ml="' + esc(qid) + '">' + icon("slide", "ml-ic") + '<span class="ml-t">Slayta git<small>' + esc(d.t) + " · " + (r[2] ? "tahmini " : "") + pagesLabel(d, r[1]) + '</small></span><span class="ml-arrow">→</span></button>';
    },
    panel(ids) {
      const g = new Map();
      ids.forEach(id => {
        const r = C.blob.refs[id]; if (!r || !S.byId[r[0]]) return;
        if (!g.has(r[0])) g.set(r[0], { n: 0, pages: new Map() });
        const o = g.get(r[0]); o.n++;
        r[1].forEach(p => { if (!o.pages.has(p) || !r[2]) o.pages.set(p, !!r[2]); });
      });
      if (!g.size) return "";
      const rows = Array.from(g.entries()).sort((a, b) => b[1].n - a[1].n).map(([id, o]) => {
        const d = S.byId[id];
        const chips = Array.from(o.pages.entries()).sort((a, b) => a[0] - b[0]).map(([p, est]) =>
          '<button type="button" class="ml-chip' + (est ? " est" : "") + '" data-mld="' + id + '" data-mlp="' + p + '" data-est="' + (est ? 1 : 0) + '">' + (est ? "~" : "") + p + "</button>").join("");
        return '<div class="ml-deck"><b>' + esc(d.t) + '<span class="ml-n">' + o.n + " soru</span></b><div class=\"ml-chips\">" + chips + "</div></div>";
      }).join("");
      return '<div class="panel"><h2>Bakman gereken slaytlar</h2><div class="ml-decks">' + rows + '</div><p class="ml-note">Numaraya dokununca o sayfa açılır. Kesikli çerçeveli (~) numaralar tahminidir.</p></div>';
    },
    save(state) { onEngineSave(C, state); },
  };
};
function onEngineSave(C, st) {
  const r = st && st.run;
  if (!r) return;
  if (!r.mlid) r.mlid = Date.now();
  const res = testRes();
  let ok = 0, done = 0;
  r.ids.forEach(id => { const a = r.ans[id]; if (a !== undefined) { done++; if (C.byQ[id] && a === C.byQ[id].a) ok++; } });
  res[C.it.id] = { ok, done, n: r.ids.length, fin: !!r.finished, at: Date.now() };
  LS.set("ml.tres", res);
  LS.set("ml.lastTest", { id: C.it.id, at: Date.now() });
  const srs = srsLoad();
  let ch = false;
  r.ids.forEach(id => {
    const q = C.byQ[id], a = r.ans[id];
    if (!q) return;
    const revealed = r.finished || (r.mode === "study" && a !== undefined);
    if (!revealed || a === undefined || a === q.a) return;   // boşlar listeye girmez, sadece yanlışlar
    const key = C.it.id + "|" + id, e = srs[key];
    if (e && e.r === r.mlid) return;
    srs[key] = { b: 0, due: addDays(today(), 1), w: (e ? e.w : 0) + 1, r: r.mlid, t: Date.now() };
    ch = true;
  });
  if (ch) { srsSave(srs); updateBadge(); }
}
const jsLit = o => JSON.stringify(o).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
async function viewTest(id) {
  const it = S.byId[id];
  if (!it || it.k !== "test") return notFound();
  setNav("lib", true);
  const back = "#/lib/" + it.g + "/" + slug(it.c);
  main().innerHTML = '<div class="fill">' + bar({
    title: it.t, solid: 1, back, crumb: esc(it.c) + (it.h ? " · " + esc(it.h) : ""),
    actions: '<button class="ibtn" id="tinfo" title="Testin kaynakları">' + icon("info") + "</button>",
  }) + '<div class="tsplit"><div class="tpane"><div class="loading"><div><div class="spin"></div>Test açılıyor…</div></div></div><aside class="spane" id="spane" hidden></aside></div></div>';
  const [tpl, blob] = await Promise.all([engineTpl(), loadTest(it)]);
  if (parseHash().parts[1] !== id) return;
  const byQ = {}; blob.data.forEach(q => { byQ[q.id] = q; });
  S.cur = { it, blob, byQ };
  S.cleanup.push(() => { S.cur = null; });
  const fr = document.createElement("iframe");
  fr.title = it.t;
  fr.srcdoc = tpl.replace("/*ML_DATA*/", () => "const CFG = " + jsLit(blob.cfg) + ";\nconst DATA = " + jsLit(blob.data));
  $(".tpane").replaceChildren(fr);
  $("#tinfo").onclick = () => testInfo(it);
  LS.set("ml.lastTest", { id: it.id, at: Date.now() });
}
function sheet(html) {
  const bg = document.createElement("div");
  bg.className = "sheet-bg";
  bg.innerHTML = '<div class="sheet" role="dialog">' + html + "</div>";
  bg.addEventListener("click", e => { if (e.target === bg || e.target.closest("[data-close]")) bg.remove(); });
  document.body.appendChild(bg);
  S.cleanup.push(() => bg.remove());
  return bg;
}
function testInfo(it) {
  const dk = it.dk || [], max = Math.max(1, ...dk.map(d => d[1]));
  const r = testRes()[it.id];
  const tp = it.tp || [];
  sheet('<h3>' + esc(it.t) + '</h3><p class="muted small">' + esc(it.c) + " · " + it.n + " soru" + (it.d ? " · " + fdate(it.d, true) : "") + (r && r.fin ? " · son sonuç " + r.ok + "/" + r.n : "") + "</p>"
    + '<h2 class="sec">Kullanılan dersler</h2><div class="dist">'
    + (dk.length ? dk.map(([id, n]) => { const d = S.byId[id]; return '<a href="#/d/' + id + '/1" data-close><span>' + esc(d ? d.t : id) + '</span><span class="muted">' + n + ' soru</span><span class="b"><i style="width:' + Math.round(100 * n / max) + '%"></i></span></a>'; }).join("")
      : tp.map(([t, n]) => '<div class="r"><span>' + esc(t) + '</span><span class="muted">' + n + ' soru</span><span class="b"><i style="width:' + Math.round(100 * n / Math.max(...tp.map(x => x[1]))) + '%"></i></span></div>').join(""))
    + '</div><p class="note">Bir derse dokunursan slaytları açılır. Test içinde her açıklamanın altında “Slayta git” düğmesi var; test bitince sonuç sayfasında yanlışlarının slaytları listelenir.</p>'
    + '<div class="row-btns" style="margin-top:12px"><button class="btn" data-close>Kapat</button></div>');
}

/* ---------- cards ---------- */
async function viewCards(id) {
  const it = S.byId[id];
  if (!it || it.k !== "kart") return notFound();
  setNav("lib", true);
  main().innerHTML = '<div class="fill">' + bar({ title: it.t, solid: 1, back: "#/lib/" + it.g + "/" + slug(it.c), crumb: esc(it.c) })
    + '<div class="doc" style="padding:16px"><div class="page narrow" id="cv"><div class="loading"><div class="spin"></div></div></div></div></div>';
  const { cards } = await loadTest(it);
  const topics = Array.from(new Set(cards.map(c => c[0])));
  const st = { t: "", order: cards.map((_, i) => i), i: 0, back: false, shuffle: false };
  const listOf = () => st.order.filter(i => !st.t || cards[i][0] === st.t);
  const draw = () => {
    const L = listOf(); if (st.i >= L.length) st.i = 0;
    const ci = L[st.i], c = cards[ci];
    $("#cv").innerHTML = '<div class="chips" style="margin-bottom:10px"><button class="chip' + (!st.t ? " on" : "") + '" data-t="">Tümü<span class="n">' + cards.length + "</span></button>"
      + topics.map(t => '<button class="chip' + (st.t === t ? " on" : "") + '" data-t="' + esc(t) + '">' + esc(t) + '<span class="n">' + cards.filter(x => x[0] === t).length + "</span></button>").join("") + "</div>"
      + '<div class="qprog"><span>' + (st.i + 1) + " / " + L.length + '</span><div class="prog"><i style="width:' + Math.round(100 * (st.i + 1) / L.length) + '%;background:var(--accent)"></i></div><button class="ibtn" id="shf" title="Karıştır" style="' + (st.shuffle ? "color:var(--accent)" : "") + '">' + icon("shuffle") + "</button></div>"
      + '<div class="card flash' + (st.back ? " back" : "") + '" id="fl"><div><div class="side-l">' + esc(c[0]) + (st.back ? " · cevap" : "") + (c[3] ? " · ★" : "") + '</div><div class="fx" style="margin-top:10px">' + (st.back ? c[2] : c[1]) + "</div>"
      + (st.back ? "" : '<div class="muted small" style="margin-top:14px">Cevabı görmek için dokun</div>') + "</div></div>"
      + '<div class="qnav">' + (st.back ? '<button class="btn" id="no">Bilemedim</button><button class="btn primary" id="yes">Bildim</button>' : '<button class="btn" id="prev">← Önceki</button><button class="btn primary" id="flip">Çevir</button>') + "</div>";
    $("#fl").onclick = () => { st.back = !st.back; draw(); };
    const fl = $("#flip"); if (fl) fl.onclick = () => { st.back = true; draw(); };
    const pv = $("#prev"); if (pv) pv.onclick = () => { st.i = (st.i - 1 + L.length) % L.length; st.back = false; draw(); };
    const nx = () => { st.i = (st.i + 1) % L.length; st.back = false; draw(); };
    const y = $("#yes"); if (y) y.onclick = nx;
    const n = $("#no"); if (n) n.onclick = () => {
      const s = srsLoad(), key = it.id + "|" + ci, e = s[key];
      s[key] = { b: 0, due: addDays(today(), 1), w: (e ? e.w : 0) + 1, t: Date.now() }; srsSave(s); updateBadge();
      toast("Tekrar listesine eklendi"); nx();
    };
    $("#shf").onclick = () => { st.shuffle = !st.shuffle; st.order = st.shuffle ? st.order.slice().sort(() => Math.random() - .5) : cards.map((_, i) => i); st.i = 0; st.back = false; draw(); };
    $$("[data-t]", $("#cv")).forEach(b => b.onclick = () => { st.t = b.dataset.t; st.i = 0; st.back = false; draw(); });
  };
  draw();
}

/* ---------- review (Leitner) ---------- */
function viewReview() {
  setNav("tekrar");
  const s = srsLoad(), t = today(), keys = Object.keys(s);
  const active = keys.filter(k => !s[k].m && srsKeyItem(k));
  const due = active.filter(k => s[k].due <= t);
  const tomorrow = active.filter(k => s[k].due === addDays(t, 1)).length;
  const week = active.filter(k => s[k].due > t && s[k].due <= addDays(t, 7)).length;
  const learned = keys.filter(k => s[k].m).length;
  const byC = new Map();
  active.forEach(k => { const it = srsKeyItem(k); const key = it.c; if (!byC.has(key)) byC.set(key, { due: 0, all: 0 }); const o = byC.get(key); o.all++; if (s[k].due <= t) o.due++; });
  main().innerHTML = bar({ title: "Tekrar", crumb: "Yanlış yaptığın sorular" }) + '<div class="page narrow">'
    + '<div class="stat3"><div class="card"><b style="color:var(--flame)">' + due.length + '</b><span>bugün</span></div><div class="card"><b>' + tomorrow + '</b><span>yarın</span></div><div class="card"><b>' + week + "</b><span>bu hafta</span></div></div>"
    + '<div class="row-btns" style="margin:14px 0 4px">' + (due.length ? '<a class="btn flame" href="#/tekrar?s=1">' + icon("rep") + "Tekrara başla (" + due.length + ")</a>" : "")
    + (active.length ? '<a class="btn' + (due.length ? "" : " primary") + '" href="#/tekrar?s=1&all=1">Hepsini çalış (' + active.length + ")</a>" : "") + "</div>"
    + (byC.size ? '<h2 class="sec">Derslere göre</h2><div class="card">' + Array.from(byC.entries()).sort((a, b) => b[1].due - a[1].due || b[1].all - a[1].all).map(([c, o]) =>
      '<div class="crow"><i class="cdot" style="background:' + ccol(c) + '"></i><div class="txt"><b>' + esc(c) + '</b></div><span class="n">' + o.due + " / " + o.all + '</span><a class="btn" href="#/tekrar?s=1&c=' + encodeURIComponent(c) + (o.due ? "" : "&all=1") + '">Çalış</a></div>').join("") + "</div>" : "")
    + '<h2 class="sec">Nasıl çalışır</h2><p class="note">Testte yanlış yaptığın her soru buraya düşer ve ertesi gün sorulur. Doğru bildikçe aralık uzar: 1, 3, 7, 14, 30 gün. 30 günlük aralıktan sonra da doğru bilirsen soru öğrenildi sayılır'
    + (learned ? " (şimdiye kadar " + learned + ")" : "") + ". Yanlış yaparsan baştan başlar. Kartlarda “Bilemedim” dediklerin de buraya gelir.</p>"
    + (active.length ? "" : '<div class="card empty" style="margin-top:14px">Listen boş. Bir test çöz; yanlışların burada birikir.</div>')
    + "</div>";
}
function qHTML(q) {
  return (q.p ? '<div class="passage">' + q.p + "</div>" : "") + '<p class="stem">' + q.q + "</p>"
    + (q.l ? '<ol class="roman">' + q.l.map((x, i) => "<li><b>" + ["I", "II", "III", "IV", "V"][i] + ".</b><span>" + x + "</span></li>").join("") + "</ol>" : "")
    + (q.q2 ? '<p class="stem">' + q.q2 + "</p>" : "");
}
function slideBtn(blob, qid) {
  const r = blob.refs && blob.refs[qid], d = r && S.byId[r[0]];
  if (!d) return "";
  return '<button class="goslide" data-gs="' + esc(r[0]) + '" data-p="' + r[1].join(",") + '" data-e="' + (r[2] ? 1 : 0) + '">' + icon("slide") + "<span>Slayta git<small>" + esc(d.t) + " · " + (r[2] ? "tahmini " : "") + pagesLabel(d, r[1]) + "</small></span>→</button>";
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-gs]");
  if (b) openSlide(b.dataset.gs, b.dataset.p.split(",").map(Number), b.dataset.e === "1");
});
async function viewSession(q) {
  setNav("tekrar", true);
  const s = srsLoad(), t = today(), all = q.get("all") === "1", cf = q.get("c");
  let keys = Object.keys(s).filter(k => !s[k].m && srsKeyItem(k) && (all || s[k].due <= t) && (!cf || srsKeyItem(k).c === cf));
  keys.sort(() => Math.random() - .5);
  main().innerHTML = '<div class="fill">' + bar({ title: "Tekrar", solid: 1, back: "#/tekrar", crumb: cf ? esc(cf) : all ? "Bütün liste" : "Bugünün soruları" })
    + '<div class="doc" style="padding:16px 12px 60px"><div class="page narrow" id="rv" style="padding:0"><div class="loading"><div class="spin"></div></div></div></div></div>';
  const items = Array.from(new Set(keys.map(k => k.split("|")[0]))).map(id => S.byId[id]);
  await Promise.all(items.map(loadTest));
  const queue = keys.map(k => ({ k, again: false }));
  let pos = 0, nOk = 0, nBad = 0;
  const draw = () => {
    const box = $("#rv");
    if (!box) return;
    if (pos >= queue.length) {
      box.innerHTML = '<div class="card empty"><div style="font:700 26px var(--f-cond);color:var(--ink)">Bitti</div><p>' + nOk + " doğru · " + nBad + ' yanlış</p><div class="row-btns" style="justify-content:center"><a class="btn primary" href="#/tekrar">Tekrar sayfası</a><a class="btn" href="#/">Ana sayfa</a></div></div>';
      updateBadge(); return;
    }
    const cur = queue[pos], [tid, qid] = cur.k.split("|"), it = S.byId[tid], blob = S.tests[tid];
    const head = '<div class="qprog"><span>' + (pos + 1) + " / " + queue.length + '</span><div class="prog"><i style="width:' + Math.round(100 * pos / queue.length) + '%;background:var(--flame)"></i></div></div>';
    if (it.k === "kart") {
      const c = blob.cards[+qid];
      let back = false;
      const dc = () => {
        box.innerHTML = head + '<div class="card flash' + (back ? " back" : "") + '" id="fl"><div><div class="side-l">' + esc(it.c) + " · " + esc(c[0]) + '</div><div class="fx" style="margin-top:10px">' + (back ? c[2] : c[1]) + "</div></div></div>"
          + '<div class="qnav">' + (back ? '<button class="btn" id="no">Bilemedim</button><button class="btn primary" id="yes">Bildim</button>' : '<button class="btn primary" id="flip">Cevabı göster</button>') + "</div>";
        $("#fl").onclick = () => { back = true; dc(); };
        if (!back) $("#flip").onclick = () => { back = true; dc(); };
        else { $("#yes").onclick = () => grade(true); $("#no").onclick = () => grade(false); }
      };
      dc(); return;
    }
    const qq = blob.data.find(x => x.id === qid);
    if (!qq) { pos++; return draw(); }
    const L = ["A", "B", "C", "D", "E"];
    box.innerHTML = head + '<div class="card qcard"><div class="crumb"><i class="cdot" style="background:' + ccol(it.c) + '"></i>' + esc(it.c) + " · " + esc(it.t) + " · " + esc(qq.t) + (s[cur.k] && s[cur.k].w > 1 ? " · " + s[cur.k].w + ". kez" : "") + "</div>"
      + qHTML(qq) + '<ul class="opts">' + qq.o.map((o, i) => '<li><button class="opt" data-i="' + i + '"><span class="bub">' + L[i] + "</span><span>" + o + "</span></button></li>").join("") + '</ul><div id="fbx"></div></div>';
    $$(".opt", box).forEach(b => b.onclick = () => {
      const i = +b.dataset.i, ok = i === qq.a;
      $$(".opt", box).forEach((x, j) => { x.disabled = true; if (j === qq.a) x.classList.add("ok"); else if (j === i) x.classList.add("bad"); else x.classList.add("dim"); });
      $("#fbx").innerHTML = '<div class="fb ' + (ok ? "ok" : "bad") + '"><h4>' + (ok ? "Doğru." : "Yanlış. Doğru cevap: " + L[qq.a]) + "</h4><p>" + qq.e + '</p><div class="src">Kaynak: ' + esc(qq.s) + "</div></div>"
        + slideBtn(blob, qid) + '<div class="qnav"><button class="btn primary" id="nx">Devam →</button></div>';
      gradeOnly(ok);
      $("#nx").onclick = () => { pos++; draw(); $("#rv").parentNode.scrollTop = 0; };
    });
  };
  const gradeOnly = ok => {
    const cur = queue[pos], st = srsLoad(), e = st[cur.k] || { b: 0, w: 0 };
    if (ok) { nOk++; if (!cur.again) { e.b = (e.b || 0) + 1; if (e.b >= INT.length) e.m = 1; e.due = addDays(today(), INT[Math.min(e.b, INT.length - 1)]); } }
    else { nBad++; e.b = 0; e.w = (e.w || 0) + 1; e.due = addDays(today(), 1); if (!cur.again) queue.push({ k: cur.k, again: true }); }
    st[cur.k] = e; srsSave(st);
  };
  const grade = ok => { gradeOnly(ok); pos++; draw(); };
  if (!queue.length) { $("#rv").innerHTML = '<div class="card empty">Şu an tekrar edilecek soru yok.</div>'; return; }
  draw();
}

/* ---------- search ---------- */
async function loadIndex() {
  if (S.index) return S.index;
  const raw = await fetchJSON("d/s", S.cat.v);
  const pages = [];
  Object.entries(raw.d).forEach(([id, arr]) => { if (S.byId[id]) arr.forEach((t, i) => { if (t) pages.push({ id, p: i + 1, t, f: fold(t) }); }); });
  const qs = raw.q.filter(x => S.byId[x[0]]).map(([id, qid, t]) => ({ id, qid, t, f: fold(t) }));
  return (S.index = { pages, qs });
}
function snippet(o, terms) {
  const i = Math.max(0, o.f.indexOf(terms[0]));
  const a = Math.max(0, i - 70), b = Math.min(o.t.length, i + 170);
  let s = (a ? "…" : "") + o.t.slice(a, b) + (b < o.t.length ? "…" : "");
  const fs = fold(s);
  let out = "", k = 0;
  const marks = [];
  terms.forEach(t => { let j = fs.indexOf(t); while (j >= 0) { marks.push([j, j + t.length]); j = fs.indexOf(t, j + t.length); } });
  marks.sort((x, y) => x[0] - y[0]);
  marks.forEach(([x, y]) => { if (x < k) return; out += esc(s.slice(k, x)) + "<mark>" + esc(s.slice(x, y)) + "</mark>"; k = y; });
  return out + esc(s.slice(k));
}
function viewSearch(q0) {
  setNav("ara");
  main().innerHTML = bar({ title: "Ara", crumb: "Slaytlar, notlar, sorular ve kartlar" }) + '<div class="page narrow">'
    + '<div class="sbox">' + icon("search") + '<input id="sq" type="search" placeholder="Örn. Henderson, peptid bağı, Galen" autocomplete="off" value="' + esc(q0) + '"></div><div id="sr"></div></div>';
  const inp = $("#sq"), out = $("#sr");
  let tm = 0;
  const run = async () => {
    const qv = inp.value.trim();
    history.replaceState(null, "", "#/ara" + (qv ? "?q=" + encodeURIComponent(qv) : ""));
    const terms = fold(qv).split(/\s+/).filter(x => x.length >= 2);
    if (!terms.length) { out.innerHTML = '<p class="note">En az iki harf yaz. Türkçe karakterler fark etmez: “ozellik” de “özellik”i bulur.</p>'; return; }
    if (!S.index) out.innerHTML = '<div class="loading"><div><div class="spin"></div>Arama dizini hazırlanıyor…</div></div>';
    const I = await loadIndex();
    if (inp.value.trim() !== qv) return;
    const score = f => terms.reduce((n, t) => { if (n < 0) return n; const c = f.split(t).length - 1; return c ? n + c : -1; }, 0);
    const ph = [], qh = [];
    I.pages.forEach(o => { const sc = score(o.f); if (sc > 0) ph.push([sc, o]); });
    I.qs.forEach(o => { const sc = score(o.f); if (sc > 0) qh.push([sc, o]); });
    ph.sort((a, b) => b[0] - a[0]); qh.sort((a, b) => b[0] - a[0]);
    const pr = ph.slice(0, 60).map(([, o]) => { const it = S.byId[o.id]; return '<a class="hit" href="#/d/' + o.id + "/" + o.p + "?h=" + o.p + '"><div class="h"><i class="cdot" style="background:' + ccol(it.c) + '"></i>' + esc(it.t) + '<span class="pg-n">' + (it.k === "slayt" ? "slayt " : "s. ") + o.p + '</span></div><div class="s">' + snippet(o, terms) + "</div></a>"; }).join("");
    const qr = qh.slice(0, 40).map(([, o]) => { const it = S.byId[o.id]; return '<div class="hit" data-qi="' + esc(o.id) + '" data-qq="' + esc(o.qid) + '"><div class="h"><i class="cdot" style="background:' + ccol(it.c) + '"></i>' + esc(it.c) + " · " + esc(it.t) + '</div><div class="s">' + snippet(o, terms) + "</div></div>"; }).join("");
    out.innerHTML = (pr ? '<h2 class="sec">Slayt ve notlar · ' + ph.length + '</h2><div class="card list">' + pr + "</div>" : "")
      + (qr ? '<h2 class="sec">Sorular ve kartlar · ' + qh.length + '</h2><div class="card list">' + qr + "</div>" : "")
      + (!pr && !qr ? '<div class="card empty">“' + esc(qv) + "” için sonuç yok.</div>" : "");
  };
  inp.addEventListener("input", () => { clearTimeout(tm); tm = setTimeout(run, 220); });
  out.addEventListener("click", async e => {
    const h = e.target.closest("[data-qi]");
    if (!h) return;
    const it = S.byId[h.dataset.qi], blob = await loadTest(it);
    if (it.k === "kart") { const c = blob.cards[+h.dataset.qq]; sheet('<p class="muted small">' + esc(it.c) + " · " + esc(c[0]) + '</p><h3 style="font-family:var(--f-ui);font-size:18px">' + c[1] + '</h3><div class="fb ok"><p>' + c[2] + '</p></div><div class="row-btns" style="margin-top:14px"><a class="btn" href="#/c/' + it.id + '" data-close>Kartlara git</a><button class="btn" data-close>Kapat</button></div>'); return; }
    const qq = blob.data.find(x => x.id === h.dataset.qq), L = ["A", "B", "C", "D", "E"];
    sheet('<p class="muted small">' + esc(it.c) + " · " + esc(it.t) + " · " + esc(qq.t) + '</p><div class="qcard" style="padding:0">' + qHTML(qq) + '<ul class="opts">' + qq.o.map((o, i) => '<li><div class="opt' + (i === qq.a ? " ok" : " dim") + '"><span class="bub">' + L[i] + "</span><span>" + o + "</span></div></li>").join("")
      + '</ul><div class="fb"><p>' + qq.e + '</p><div class="src">Kaynak: ' + esc(qq.s) + "</div></div>" + slideBtn(blob, qq.id) + '</div><div class="row-btns" style="margin-top:14px"><a class="btn" href="#/t/' + it.id + '" data-close>Teste git</a><button class="btn" data-close>Kapat</button></div>');
  });
  if (q0) run(); else run();
  if (innerWidth >= 900 || !q0) inp.focus();
}

/* ---------- settings ---------- */
let installEvt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; });
async function viewSettings() {
  setNav("ayarlar");
  const est = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate().catch(() => null) : null;
  const ks = S.cat.kurullar.filter(k => S.cat.items.some(i => i.g === k.id)).concat(S.cat.items.some(i => i.g === "ortak") ? [kurulById("ortak")] : []);
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  main().innerHTML = bar({ title: "Ayarlar" }) + '<div class="page narrow">'
    + '<h2 class="sec">Uygulama</h2><div class="card set">'
    + '<div class="row"><img src="icons/64.png" width="40" height="40" style="border-radius:10px" alt=""><div class="txt"><b>' + NAME + '</b><span>İçerik ' + fdate(stampIso(S.cat.v), true) + " tarihinde güncellendi · " + S.cat.items.length + " öğe</span></div>"
    + '<button class="btn" id="chk">Denetle</button></div>'
    + (standalone ? "" : '<div class="row"><div class="txt"><b>Ana ekrana yükle</b><span>Uygulama gibi açılır, çevrimdışı da çalışır.</span></div>' + (installEvt ? '<button class="btn primary" id="inst">Yükle</button>' : '<a class="btn" href="#/kurulum">Nasıl?</a>') + "</div>")
    + "</div>"
    + '<h2 class="sec">Çevrimdışı</h2><div class="card set">'
    + ks.map(k => { const its = S.cat.items.filter(i => i.g === k.id); const sz = its.reduce((n, i) => n + (i.sz || 0), 0);
      return '<div class="row"><div class="txt"><b>' + esc(k.no ? "Kurul " + k.no : k.name) + "</b><span>" + its.length + " öğe · yaklaşık " + fmtMB(sz) + '</span></div><button class="btn" data-off="' + k.id + '">' + icon("dl") + "İndir</button></div>"; }).join("")
    + '<div class="row"><div class="txt"><span>' + (est ? "Bu cihazda kullanılan: " + fmtMB(est.usage || 0) : "") + " Açtığın slaytlar zaten kendiliğinden saklanır; “İndir” bütün kurulu önceden indirir.</span></div></div></div>"
    + '<h2 class="sec">İlerleme</h2><div class="card set">'
    + '<div class="row"><div class="txt"><b>Yedek al</b><span>Test sonuçları ve tekrar listesi bu cihazda tutulur. Cihaz değiştirirken yedeği taşı.</span></div><button class="btn" id="bk">İndir</button></div>'
    + '<div class="row"><div class="txt"><b>Yedekten yükle</b><span>Başka cihazdan aldığın yedek dosyasını seç.</span></div><label class="btn">Seç<input type="file" accept="application/json,.json" id="rs" hidden></label></div>'
    + "</div>"
    + '<h2 class="sec">Cihaz</h2><div class="card set"><div class="row"><div class="txt"><b>Bu cihazdan çıkış yap</b><span>Anahtar ve indirilen içerik silinir; ilerlemen kalır.</span></div><button class="btn danger" id="lo">' + icon("out") + "Çıkış</button></div></div>"
    + "</div>";
  $("#chk").onclick = async () => { await checkUpdate(true); };
  const ib = $("#inst"); if (ib) ib.onclick = async () => { installEvt.prompt(); await installEvt.userChoice.catch(() => {}); installEvt = null; viewSettings(); };
  $$("[data-off]").forEach(b => b.onclick = () => offline(b, b.dataset.off));
  $("#bk").onclick = () => {
    const o = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k !== "ml.k" && (k.startsWith("ml.") || k.startsWith("astro:"))) o[k] = localStorage.getItem(k); }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ medlock: 1, at: new Date().toISOString(), data: o })], { type: "application/json" }));
    a.download = "medlock-yedek-" + today() + ".json"; a.click();
  };
  $("#rs").onchange = async e => {
    try {
      const j = JSON.parse(await e.target.files[0].text());
      if (!j.medlock) throw 0;
      Object.entries(j.data).forEach(([k, v]) => { if (k !== "ml.k") localStorage.setItem(k, v); });
      toast("Yedek yüklendi"); updateBadge();
    } catch (err) { toast("Bu dosya bir MedLock yedeği değil."); }
  };
  let sure = false;
  $("#lo").onclick = async () => {
    if (!sure) { sure = true; $("#lo").textContent = "Emin misin? Tekrar dokun"; return; }
    LS.del("ml.k");
    try { const ns = await caches.keys(); await Promise.all(ns.map(n => caches.delete(n))); } catch (e) {}
    location.hash = ""; location.reload();
  };
}
async function offline(btn, g) {
  const its = S.cat.items.filter(i => i.g === g);
  const urls = [];
  its.forEach(it => {
    if (it.k === "test" || it.k === "kart") urls.push("d/" + it.x + "?v=" + it.v);
    else { urls.push("d/" + it.x + "/t?v=" + it.v); for (let p = 1; p <= it.n; p++) urls.push("d/" + it.x + "/" + p + "?v=" + it.v); }
  });
  btn.disabled = true;
  let done = 0, fail = 0, i = 0;
  const worker = async () => { while (i < urls.length) { const u = urls[i++]; try { const r = await fetch(u); if (!r.ok) fail++; await r.arrayBuffer(); } catch (e) { fail++; } done++; if (done % 10 === 0 || done === urls.length) btn.textContent = Math.round(100 * done / urls.length) + "%"; } };
  await Promise.all(Array.from({ length: 6 }, worker));
  btn.textContent = fail ? "Eksik: " + fail : "Hazır";
  toast(fail ? fail + " dosya indirilemedi; bağlantıyı kontrol edip tekrar dene." : "Kurul çevrimdışı kullanıma hazır.");
}

/* ---------- install guide (public) ---------- */
function installHTML() {
  return '<div class="card inst"><h3>' + icon("dl") + "Android tablet ve telefon (Chrome)</h3><ol class=\"steps\"><li>Bu sayfayı Chrome’da aç.</li><li>Sağ üstteki <span class=\"key\">⋮</span> menüsüne dokun.</li><li><b>Uygulamayı yükle</b> ya da <b>Ana ekrana ekle → Yükle</b>’yi seç.</li></ol></div>"
    + '<div class="card inst"><h3>' + icon("dl") + "iPad ve iPhone (Safari)</h3><ol class=\"steps\"><li>Bu sayfayı Safari’de aç.</li><li>Paylaş düğmesine dokun (kare ve yukarı ok).</li><li><b>Ana Ekrana Ekle</b> → <b>Ekle</b>.</li></ol></div>"
    + '<div class="card inst"><h3>' + icon("dl") + "Bilgisayar (Chrome ya da Edge)</h3><ol class=\"steps\"><li>Adres çubuğunun sağındaki yükle simgesine tıkla.</li><li><b>Yükle</b>’yi seç.</li></ol></div>"
    + '<div class="card inst"><h3>Sonra</h3><ol class="steps"><li>Ana ekrandaki MedLock simgesinden aç.</li><li>Şifreyi bir kez gir; o cihaz hatırlar.</li><li>Yeni içerik ve güncellemeler kendiliğinden gelir, bir şey yapman gerekmez.</li></ol></div>';
}
function viewInstall(inShell) {
  if (inShell && S.cat) {
    setNav("ayarlar");
    main().innerHTML = bar({ title: "Nasıl kurulur", back: "#/ayarlar" }) + '<div class="page narrow" style="display:grid;gap:12px">' + installHTML() + "</div>";
    return;
  }
  app().innerHTML = '<div class="gate" style="place-items:start center"><div style="width:100%;max-width:560px;display:grid;gap:12px;color:var(--ink)"><div style="color:#e9ecf7;display:flex;align-items:center;gap:12px;margin-bottom:6px"><img src="icons/64.png" width="44" height="44" style="border-radius:12px" alt=""><h1 style="margin:0;font:700 26px var(--f-cond)">MedLock nasıl kurulur</h1></div>'
    + installHTML() + '<a class="btn primary" href="#" style="justify-content:center">Girişe dön</a></div></div>';
}

/* ---------- login screen ---------- */
function viewLogin(msg) {
  if (location.hash === "#/kurulum") return viewInstall(false);
  app().innerHTML = '<div class="gate"><div class="gate-card"><img src="icons/192.png" alt=""><h1>' + NAME + '</h1><p>Kişisel ders arşivi</p>'
    + '<form id="lf" autocomplete="on"><input type="text" name="username" value="medlock" autocomplete="username" hidden><input id="pw" type="password" name="password" autocomplete="current-password" placeholder="Şifre" required>'
    + '<button class="btn primary" id="lb">Giriş</button><div class="err" id="le">' + esc(msg || "") + "</div></form>"
    + '<div class="links"><a href="#/kurulum">Ana ekrana nasıl kurulur?</a></div></div></div>';
  $("#pw").focus();
  $("#lf").onsubmit = async e => {
    e.preventDefault();
    const b = $("#lb"); b.disabled = true; b.textContent = "Anahtar hazırlanıyor…"; $("#le").textContent = "";
    let ok = false;
    try { ok = await login($("#pw").value); } catch (err) { $("#le").textContent = "Bağlantı yok. İlk giriş için internet gerekir."; b.disabled = false; b.textContent = "Giriş"; return; }
    if (!ok) { b.disabled = false; b.textContent = "Giriş"; $("#le").textContent = "Şifre yanlış."; $("#pw").select(); return; }
    start();
  };
}

/* ---------- updates ---------- */
const passive = () => { const a = parseHash().parts[0]; return !a || a === "lib" || a === "ayarlar" || a === "kurulum" || (a === "tekrar" && !parseHash().q.get("s")); };
async function checkUpdate(manual) {
  let j;
  try { j = await (await fetch("v.json", { cache: "no-store" })).json(); } catch (e) { if (manual) toast("Bağlantı yok."); return; }
  LS.set("ml.v", j);
  let changed = false;
  if (j.c !== S.ver.c) {
    const old = new Set(S.cat.items.map(i => i.id));
    try {
      const cat = await fetchJSON("d/c", j.c);
      S.ver = Object.assign({}, S.ver, { c: j.c }); setCatalog(cat); S.index = null; S.tests = {}; changed = true;
      const added = cat.items.filter(i => !old.has(i.id));
      toast(added.length ? "Yeni: " + added.slice(0, 2).map(i => i.t).join(", ") + (added.length > 2 ? " ve " + (added.length - 2) + " öğe daha" : "") : "İçerik güncellendi", null, null, 5000);
      footNote();
      if (passive()) { shell(); route(); }
    } catch (e) {}
  }
  if (j.app !== S.appVer) {
    if (passive()) { try { sessionStorage.setItem("ml.upd", "1"); } catch (e) {} location.reload(); return; }
    toast("Yeni sürüm hazır", "Yenile", () => location.reload());
    return;
  }
  if (manual && !changed) toast("Her şey güncel.");
}

/* ---------- start ---------- */
async function start() {
  try { await loadCatalog(); }
  catch (e) {
    if (e && e.name === "OperationError") { LS.del("ml.k"); KEY = null; return viewLogin("Şifre değişmiş; yeniden giriş yap."); }
    app().innerHTML = '<div class="gate"><div class="gate-card"><img src="icons/192.png" alt=""><h1>' + NAME + "</h1><p>Bağlantı yok ve bu cihazda kayıtlı içerik bulunamadı.</p><button class=\"btn primary\" onclick=\"location.reload()\">Tekrar dene</button></div></div>";
    return;
  }
  shell();
  if (location.hash === "#/kurulum" && S.cat) location.hash = "#/ayarlar";
  route();
  try { if (sessionStorage.getItem("ml.upd")) { sessionStorage.removeItem("ml.upd"); toast("Güncellendi"); } } catch (e) {}
  setInterval(() => checkUpdate(false), 15 * 60e3);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") checkUpdate(false); });
}
window.addEventListener("hashchange", () => { if (S.cat) route(); else if (!KEY) viewLogin(); });
if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
(async () => {
  if (!window.crypto || !crypto.subtle) { app().innerHTML = '<div class="gate"><div class="gate-card"><h1>' + NAME + "</h1><p>Bu tarayıcı desteklenmiyor. Güncel Chrome ya da Safari kullan.</p></div></div>"; return; }
  if (await unlockSaved()) start(); else viewLogin();
})();
})();
