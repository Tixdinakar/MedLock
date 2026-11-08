/* MedLock — kişisel ders arşivi. İçerik şifreli (AES-GCM); anahtar giriş şifresinden türetilir. */
(() => {
"use strict";

const NAME = "MedLock";
// Sürüm: büyük güncelleme +0.1 (1.1 → 1.2), küçük düzeltme +0.0.1 (1.1.1 → 1.1.2). Her arayüz değişikliğinde CHANGES'in başına kısa not ekle.
const VERSION = "1.1.8";
const CHANGES = [
  { v: "1.1.8", d: "2026-11-08", l: [
    "Slayt ve notlarda yakınlaştırma: büyüteç düğmesi ya da sayfaya çift dokunma (1× → 1,6× → 2,2×); özetler telefonda okunur",
    "Telefonda üstteki yol sığmayınca yarım kesilmiyor, baştaki parça gizleniyor",
    "Yeni profilde bütün sürüm geçmişi değil yalnız son sürüm notu çıkıyor",
    "Tekrar ve İlerleme'de ders adı iki kez yazılmıyor",
  ] },
  { v: "1.1.7", d: "2026-11-08", l: [
    "Net kaldırıldı (sınavlarda yanlış doğruyu götürmüyor): sonuçlarda doğru sayısı ve yüzde var",
    "İlerleme › Kurul sınavı ile karşılaştır: artık kuruldan aldığın puanı (100 üzerinden) yazıyorsun",
  ] },
  { v: "1.1.6", d: "2026-11-08", l: [
    "Ana sayfada yaklaşan sınav uyarısı: kaç gün kaldığı, özete, denemeye ve derse tek dokunuş (ilki Kanser ve Kök Hücre vizesi, 13 Kasım Cuma)",
    "Kanser ve Kök Hücre denemesinde açıklamalardaki kaynak satırı iki kez yazıyordu; düzeldi",
  ] },
  { v: "1.1.5", d: "2026-11-07", l: [
    "Ortak Dersler’e Kanser ve Kök Hücre eklendi: vize özeti ve 100 soruluk vize denemesi",
  ] },
  { v: "1.1.4", d: "2026-11-07", l: [
    "Telefonun geri tuşu önce açık pencereyi ya da testteki slayt panelini kapatıyor, testten çıkmıyor",
    "Alt sekmelere ya da yoldaki Kurul/Ders düğmesine basınca geçmiş uzamıyor; geri tuşu geldiğin yolu yukarı doğru izliyor",
    "Sol üstteki ok, yoldan yukarı çıktıktan sonra seni slayta geri indirmiyor; bir üst ekrana çıkıyor",
  ] },
  { v: "1.1.3", d: "2026-11-07", l: [
    "Telefonda sayfa sayacı, işaret ve döndürme artık ekranın üstündeki slayta uygulanıyor (önceden bir iki sonrakine gidiyordu)",
    "Sayfa numarasına dokunup sayfaya giderken çıkan hata düzeldi",
    "Geri düğmesi bazen uygulamadan çıkabiliyordu; düzeldi",
    "Tıbbi Biyoloji Kurul 1 çıkmışında bir sorunun eksik E şıkkı eklendi",
    "“Kurulu indir” artık aramayı ve Anatomi Latincesi’ni de internetsiz kullanıma alıyor",
    "Eski sürüm dosyaları cihazda birikmiyor; net ve MB değerleri virgülle yazılıyor",
  ] },
  { v: "1.1.2", d: "2026-11-07", l: ["Üstteki yol (Tıp › Kurul › Ders) düğmeleri büyüdü, dokunması kolay", "Slaytı kaydırdıktan hemen sonra yol düğmesine basınca slayta geri dönme hatası düzeldi", "Sürüm numarası ve bu yenilik notu"] },
  { v: "1.1.1", d: "2026-11-07", l: ["Alttaki çubuk slayt, test ve tekrarda da görünüyor"] },
  { v: "1.1", d: "2026-11-07", l: [
    "Çıkmışlar sayfası: her derste çözülebilir test ve orijinal PDF yan yana, ilerleme ve netinle",
    "Üstteki yol dokunulabilir; testten ya da slayttan tek dokunuşla kurula veya derse dönersin",
    "Testte tek başlık, altta sabit “Başla · N soru”; karma denemede de",
    "Optik formda başka sorunun satırına dokunmak önce o soruya götürür",
    "Sorularda “Hata bildir”; Ayarlar › Hata bildirimleri’nden kopyalanır",
    "İnternet yokken anında açılış",
    "Tırnaklı arama: \"sodyum pompası\" yalnız yan yana geçenleri bulur",
    "Ana sayfa sadeleşti; Psikoloji artık Davranış Bilimleri; Drive videoları; final döneminde öğrenilmiş sorular yeniden gelir",
  ] },
  { v: "1.0", l: ["İlk sürüm: kütüphane, slaytlar, testler ve “Slayta git”, tekrar listesi, arama, Anatomi Latincesi, cihazlar arası senkron"] },
];
const vcmp = (a, b) => { const x = String(a).split(".").map(Number), y = String(b).split(".").map(Number); for (let i = 0; i < 3; i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d; } return 0; };
const APPV = "7224e7eff9";                            // arayüz sürümü; tools/medlock.py stamp yazar
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
const ICONS = {
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
  chart: '<path d="M4 20h16"/><path d="M7 16v-5M12 16V7M17 16v-8"/>',
  mix: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><path d="M16.5 13.5v6M13.5 16.5h6"/>',
  rot: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3L19.5 9"/><path d="M19.5 4v5h-5"/>',
  zoom: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M10.5 7.5v6M7.5 10.5h6"/>',
  lex: '<path d="M5 4.5h10.5a3 3 0 0 1 3 3v12H8a3 3 0 0 1-3-3z"/><path d="M5 16.5a3 3 0 0 1 3-3h10.5M9 8h6M9 11h4"/>',
  bm: '<path d="M6.5 3.5h11v17l-5.5-4-5.5 4z"/>',
  bmf: '<path d="M6.5 3.5h11v17l-5.5-4-5.5 4z" fill="currentColor"/>',
  play: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m10 9 5 3-5 3z"/>',
  flag: '<path d="M5.5 21V4.5"/><path d="M5.5 5h11l-2 4 2 4h-11"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',
};
const icon = (n, cls) => '<svg class="ic' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || "") + "</svg>";

const KIND = {
  slayt: { l: "Slayt", ic: "slide", c: "#2b5bd7" },
  not: { l: "Not", ic: "note", c: "#1f8a7a" },
  ozet: { l: "Özet", ic: "ozet", c: "#7a4fd0" },
  test: { l: "Test", ic: "test", c: "#e2691f" },
  kart: { l: "Kart", ic: "cards", c: "#c0398a" },
  cikmis: { l: "Çıkmış", ic: "star", c: "#b8861b" },
  soru: { l: "Soru", ic: "q", c: "#c23b2e" },
  ses: { l: "Ses", ic: "audio", c: "#5c6b8a" },
  video: { l: "Video", ic: "play", c: "#d23b5a" },
};
const KORDER = ["slayt", "not", "ozet", "test", "kart", "video", "cikmis", "soru", "ses"];
const CCOL = {
  "Biyokimya": "#e0672a", "Tıbbi Biyoloji ve Genetik": "#2c9a5a", "Biyofizik": "#3567e0", "Tıp Tarihi": "#b88a22",
  "Biyoistatistik": "#8656d8", "Davranış Bilimleri": "#d2478c", "Psikoloji": "#d2478c", "ATA 151 · Türk Dili I": "#1d98ae",
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
const fmtMB = b => (b / 1048576).toFixed(b > 104857600 ? 0 : 1).replace(".", ",") + " MB";
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
const importDek = raw => crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);

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
const S = { cat: null, byId: {}, ver: null, tests: {}, texts: {}, index: null, cur: null, cleanup: [], filters: {}, nav: 0 };
function setCatalog(cat) {
  S.cat = cat; S.byId = {};
  cat.items.forEach(it => { S.byId[it.id] = it; });
  cat.items.sort((a, b) => (b.d || "").localeCompare(a.d || ""));
}
// v.json ağdan beklenmez: bu cihazdaki son sürümle hemen açılır, yenisi arka planda denetlenir (checkUpdate)
async function fetchV(ms) {
  const ac = "AbortController" in window ? new AbortController() : null;
  const t = setTimeout(() => ac && ac.abort(), ms || 5000);
  try { const r = await fetch("v.json", { cache: "no-store", signal: ac && ac.signal }); if (!r.ok) throw new Error("HTTP " + r.status); return await r.json(); }
  finally { clearTimeout(t); }
}
async function loadCatalog() {
  const cached = LS.get("ml.v", null);
  if (cached) {
    try { S.ver = cached; setCatalog(await fetchJSON("d/c", cached.c)); return; }
    catch (e) { if (e && e.name === "OperationError") throw e; }
  }
  const v = await fetchV(8000).catch(() => null);
  if (!v) throw new Error("offline");
  LS.set("ml.v", v); S.ver = v;
  setCatalog(await fetchJSON("d/c", v.c));
}
const LEXITEM = { id: "lex", k: "lex", c: "Tıbbi Terimler", t: "Kökler", g: "" };
const RTYPE = { on: "Ön ek", kok: "Kök", son: "Son ek" };
let lexP = null;
function loadLex() {
  if (!lexP) lexP = fetchJSON("d/" + S.cat.lex.x, S.cat.lex.v).then(L => {
    const ex = L.roots.map(() => []);
    L.terms.forEach((t, ti) => { new Set(t[1].map(p => p[1]).filter(x => x != null)).forEach(ri => { if (ex[ri].length < 6) ex[ri].push(ti); }); });
    L.ex = ex;
    L.cards = L.roots.map((r, i) => [RTYPE[r[0]] || "", "<b>" + esc(r[1]) + "</b>" + (ex[i].length ? '<div class="muted small" style="margin-top:8px">' + ex[i].slice(0, 3).map(ti => esc(L.terms[ti][0])).join(", ") + "</div>" : ""), esc(r[2]) + '<div class="muted small" style="margin-top:6px">' + esc(r[3]) + "</div>"]);
    return L;
  });
  return lexP;
}
const loadTest = async it => it.k === "lex" ? loadLex() : it.k === "lat" ? loadLat() : S.tests[it.id] || (S.tests[it.id] = await fetchJSON("d/" + it.x, it.v));
const loadTexts = async it => S.texts[it.id] || (S.texts[it.id] = await fetchJSON("d/" + it.x + "/t", it.v));
let engineP = null;
const engineTpl = () => engineP || (engineP = fetch("engine.html").then(r => { if (!r.ok) throw new Error("engine"); return r.text(); }));

// Kurul dışı grup: ortak dersler (seçmeliler dahil; tarihsiz, kurul numarası yok)
const SPECIAL = { ortak: "Ortak Dersler" };
const kurulById = id => SPECIAL[id] ? Object.assign({ no: "", start: "", end: "" }, { id, name: SPECIAL[id], dn: "d1" }, S.cat[id]) : S.cat.kurullar.find(k => k.id === id);
const specialGs = () => Object.keys(SPECIAL).filter(g => S.cat.items.some(i => i.g === g));
const DEFDN = { id: "d1", no: "I", name: "Dönem I" };
const donemler = () => S.cat.donemler && S.cat.donemler.length ? S.cat.donemler : [DEFDN];
const donemById = id => donemler().find(d => d.id === id) || donemler()[0];
const donemOf = g => { const k = g && kurulById(g); return donemById(k && k.dn || "d1"); };
const kurulLabel = k => k.no ? "Kurul " + k.no : k.name;
// Üstteki yol: Tıp › Dönem I › Kurul II › Biyokimya (her parça dokunulabilir)
// "Ders · Başlık"; başlık zaten ders adıyla başlıyorsa ders adı tekrar yazılmaz
const ct = (c, t) => (t || "").toLocaleLowerCase("tr").startsWith((c || "").toLocaleLowerCase("tr")) ? t : c + " · " + t;
// Dar ekranda yol sığmazsa baştaki parçalar gizlenir (yarım kesik "m I" görünmesin); en az son iki parça kalır
function fitCrumbs() {
  $$(".bar .crumb").forEach(n => {
    const as = $$("a", n).filter(a => getComputedStyle(a).display !== "none");
    for (let i = 0; i < as.length - 2 && n.scrollWidth > n.clientWidth + 1; i++) {
      as[i].style.display = "none"; const sp = as[i].nextElementSibling; if (sp && sp.classList.contains("sep")) sp.style.display = "none";
    }
    n.scrollLeft = n.scrollWidth;
  });
}
function crumbs(P) { return P.map(([l, h], i) => h ? '<a href="' + h + '"' + (i === 0 && l === "Tıp" ? ' class="root"' : "") + ">" + esc(l) + "</a>" : "<span>" + esc(l) + "</span>").join('<i class="sep">›</i>'); }
function crumbFor(g, c, upTo) {
  const P = [["Tıp", "#/lib"]];
  if (donemler().length > 1 || g !== undefined) { const d = donemOf(g); P.push([d.name, "#/lib?dn=" + d.id]); }
  const k = g && kurulById(g);
  if (k && upTo !== "dn") P.push([kurulLabel(k), "#/lib/" + g]);
  if (c && k && upTo !== "k") P.push([c, "#/lib/" + g + "/" + slug(c)]);
  return crumbs(P);
}
// Final sınavı dönemi: öğrenilmiş sorular bir kez daha tekrar listesine gelir
function finalInfo() {
  const d = donemOf(currentKurul().id), f = d && d.final, t = today();
  if (!f) return null;
  return { d, start: f.start, end: f.end, est: !!f.est, on: t >= f.start && t <= f.end, key: d.id + ":" + f.start };
}
const finalBack = e => { const F = finalInfo(); return !!(F && F.on && e && e.m && e.fr !== F.key); };
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
const srsLoad = () => Object.assign({}, PS.get("srs", {}));
const srsSave = s => PS.set("srs", s);
function srsDue(all) {
  const s = srsLoad(), t = today();
  return Object.keys(s).filter(k => finalBack(s[k]) || (!s[k].m && (all || s[k].due <= t)));
}
function srsKeyItem(k) { const id = k.split("|")[0]; return id === "lex" ? (S.cat.lex ? LEXITEM : null) : id === "lat" ? (S.cat.lat ? LATITEM : null) : S.byId[id]; }
const testRes = () => Object.assign({}, PS.get("tres", {}));
const bmLoad = () => Object.values(PS.get("bm", {})).filter(b => !b.x).sort((a, b) => b.at - a.at);
const bmHas = (id, p) => { const b = PS.get("bm", {})[id + "|" + p]; return !!b && !b.x; };
function bmToggle(id, p) {
  const M = Object.assign({}, PS.get("bm", {})), had = bmHas(id, p);
  M[id + "|" + p] = { id, p, at: Date.now(), x: had ? 1 : 0 };
  PS.set("bm", M);
  return !had;
}
const getLast = k => (PS.get("last", {})[k] || null);
function setLast(k, v) { const L = Object.assign({}, PS.get("last", {})); L[k] = Object.assign({ at: Date.now() }, v); PS.set("last", L); }
const dayN = (days, d) => Object.values(days[d] || {}).reduce((a, b) => a + b, 0);
function addDayAnswers(days, n) { const d = today(); days[d] = Object.assign({}, days[d]); days[d][DEV] = (days[d][DEV] || 0) + n; return days; }
function bmRow(b) {
  const it = S.byId[b.id];
  return '<a class="it" href="#/d/' + it.id + "/" + b.p + "?h=" + b.p + '">' + kindBox(it.k) + '<div class="txt"><div class="t">' + esc(it.t) + '</div><div class="m"><span><i class="cdot" style="background:' + ccol(it.c) + '"></i>' + esc(it.c) + "</span><span>" + (it.k === "slayt" ? "Slayt " : "Sayfa ") + b.p + "</span></div></div>" + icon("chev", "chev") + "</a>";
}

/* ---------- profiles ---------- */
// Her kişinin ilerlemesi (tekrar listesi, sonuçlar, işaretler, test durumları) kendi profilinde durur.
// Senkron açıksa profil şifrelenip GitHub Gist'e yazılır; aynı kişi başka cihazdan girince kaldığı yerden devam eder.
const DEV = LS.get("ml.dev") || (() => { const d = Math.random().toString(36).slice(2, 10); LS.set("ml.dev", d); return d; })();
let PID = LS.get("ml.prof", null), P = null, saveT2 = 0;
const PKEY = id => "ml.p." + id;
const engKey = k => "ml.e." + PID + "." + k;
const blankProfile = (id, name) => ({ v: 1, id, name, at: Date.now(), srs: {}, tres: {}, hist: [], qh: {}, days: {}, bm: {}, real: {}, eng: {}, rot: {}, last: {}, rep: {}, mix: null });
function saveProfile() { clearTimeout(saveT2); if (P) LS.set(PKEY(P.id), P); }
const PS = {
  get(k, d) { const v = P ? P[k] : undefined; return v === undefined || v === null ? d : v; },
  set(k, v) { if (!P) return; P[k] = v; P.at = Date.now(); clearTimeout(saveT2); saveT2 = setTimeout(saveProfile, 300); syncSoon(); },
};
function profilesLocal() { return LS.get("ml.profiles", []); }
function rememberProfile(id, name) { const L = profilesLocal().filter(x => x.id !== id); L.unshift({ id, name }); LS.set("ml.profiles", L); }
function useProfile(id, name) {
  PID = id; LS.set("ml.prof", id);
  P = LS.get(PKEY(id), null);
  if (!P) { P = blankProfile(id, name); migrateLegacy(); }
  if (name && !P.name) P.name = name;
  saveProfile(); rememberProfile(id, P.name);
}
function migrateLegacy() {             // profil öncesi sürümden kalan veriler ilk profile taşınır
  const g = k => LS.get("ml." + k, null);
  if (g("srs")) P.srs = g("srs");
  if (g("tres")) P.tres = g("tres");
  if (g("hist")) P.hist = g("hist");
  if (g("qh")) P.qh = g("qh");
  if (g("real")) P.real = g("real");
  const d = g("days"); if (d) Object.keys(d).forEach(k => { P.days[k] = { [DEV]: d[k] }; });
  const b = g("bm"); if (Array.isArray(b)) b.forEach(x => { P.bm[x.id + "|" + x.p] = x; });
  ["srs", "tres", "hist", "qh", "real", "days", "bm", "lastDoc", "lastTest", "mix"].forEach(k => LS.del("ml." + k));
}
function mergeMap(A, B, f) {
  const o = Object.assign({}, A || {});
  Object.entries(B || {}).forEach(([k, y]) => { const x = o[k]; if (!x || ((y && (y[f] || y.t || 0)) > (x[f] || x.t || 0))) o[k] = y; });
  return o;
}
function mergeP(a, b) {
  if (!a) return b; if (!b) return a;
  const o = Object.assign({}, a);
  o.name = (b.at > a.at ? b.name : a.name) || a.name || b.name;
  o.srs = mergeMap(a.srs, b.srs, "u");
  ["tres", "qh", "bm", "real", "eng", "rot", "last", "rep"].forEach(k => { o[k] = mergeMap(a[k], b[k], "at"); });
  o.mix = !a.mix ? b.mix : !b.mix ? a.mix : (b.mix.at || 0) > (a.mix.at || 0) ? b.mix : a.mix;
  const H = new Map(); (a.hist || []).concat(b.hist || []).forEach(h => H.set(h.r, h));
  o.hist = Array.from(H.values()).sort((x, y) => x.at - y.at).slice(-400);
  o.days = {};
  [a.days || {}, b.days || {}].forEach(D => Object.entries(D).forEach(([d, m]) => {
    o.days[d] = Object.assign({}, o.days[d]);
    Object.entries(m || {}).forEach(([dev, n]) => { o.days[d][dev] = Math.max(o.days[d][dev] || 0, n); });
  }));
  o.at = Math.max(a.at || 0, b.at || 0);
  return o;
}

/* ---------- sync (GitHub Gist, şifreli) ---------- */
const SY = { gist: null, t: 0, busy: false, again: false, last: 0, err: "" };
// Anahtar repoya konmaz: her cihazda Ayarlar › Senkron'dan bir kez girilir ve yalnız o cihazda durur.
const syncToken = () => LS.get("ml.st", "");
const syncOn = () => !!syncToken();
async function gh(method, path, body) {
  const r = await fetch("https://api.github.com" + path, {
    method, cache: "no-store", body: body ? JSON.stringify(body) : undefined,
    headers: { Authorization: "Bearer " + syncToken(), Accept: "application/vnd.github+json" },
  });
  if (!r.ok) throw new Error("GitHub " + r.status);
  return r.status === 204 ? null : r.json();
}
async function encJSON(o) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, KEY, new TextEncoder().encode(JSON.stringify(o))));
  const u = new Uint8Array(12 + ct.length); u.set(iv); u.set(ct, 12);
  let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(s);
}
async function decJSON(b64) { return JSON.parse(new TextDecoder().decode(await decrypt(b64d(b64.trim()).buffer))); }
async function findGist() {
  if (SY.gist) return SY.gist;
  const fixed = LS.get("ml.gist", null);
  if (fixed) return (SY.gist = fixed);
  for (let page = 1; page <= 5; page++) {
    const L = await gh("GET", "/gists?per_page=100&page=" + page);
    const g = L.find(x => x.description === "MedLock senkron");
    if (g) { LS.set("ml.gist", g.id); return (SY.gist = g.id); }
    if (L.length < 100) break;
  }
  const g = await gh("POST", "/gists", { description: "MedLock senkron", public: false, files: { "README.md": { content: "MedLock ilerleme verisi (şifreli)." } } });
  LS.set("ml.gist", g.id);
  return (SY.gist = g.id);
}
async function remoteAll() {
  const g = await gh("GET", "/gists/" + (await findGist()));
  const out = {};
  for (const [name, f] of Object.entries(g.files || {})) {
    const m = name.match(/^p-(.+)\.txt$/); if (!m) continue;
    let c = f.content;
    if (f.truncated) c = await (await fetch(f.raw_url, { cache: "no-store" })).text();
    try { out[m[1]] = await decJSON(c); } catch (e) {}
  }
  return out;
}
let syncT = 0;
function syncSoon() { if (!syncOn()) return; clearTimeout(syncT); syncT = setTimeout(() => syncNow(), 5000); }
async function syncNow(opts) {
  if (!syncOn() || !P) return false;
  if (SY.busy) { SY.again = true; return false; }
  SY.busy = true;
  let changedLocal = false;
  try {
    const all = await remoteAll(), remote = all[P.id];
    const before = JSON.stringify(P);
    const merged = mergeP(P, remote);
    changedLocal = JSON.stringify(merged) !== before;
    P = merged; saveProfile();
    if (!remote || JSON.stringify(remote) !== JSON.stringify(merged)) {
      await gh("PATCH", "/gists/" + (await findGist()), { files: { ["p-" + P.id + ".txt"]: { content: await encJSON(P) } } });
    }
    SY.last = Date.now(); SY.err = "";
  } catch (e) { SY.err = String(e.message || e); }
  SY.busy = false;
  if (SY.again) { SY.again = false; syncSoon(); }
  if (changedLocal && !(opts && opts.quiet) && passive()) { updateBadge(); route(); }
  return changedLocal;
}

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
    + '<aside class="side"><a class="brand" href="#/"><img src="icons/64.png" alt=""><span>' + NAME + '</span><small class="ver">' + VERSION + '</small></a><nav>'
    + '<a data-nav="home" href="#/">' + icon("home") + 'Ana sayfa</a>'
    + '<a data-nav="lib" href="#/lib">' + icon("lib") + 'Kütüphane</a>'
    + (cxAny() ? '<a class="sub" data-nav="cikmis" href="#/cikmis">Çıkmışlar</a>' : "")
    + kl.map(k => '<a class="sub" data-nav="k:' + k.id + '" href="#/lib/' + k.id + '">Kurul ' + k.no + '</a>').join("")
    + specialGs().map(g => '<a class="sub" data-nav="k:' + g + '" href="#/lib/' + g + '">' + "Ortak dersler" + "</a>").join("")
    + '<a data-nav="tekrar" href="#/tekrar">' + icon("rep") + 'Tekrar<span class="badge" data-badge hidden></span></a>'
    + '<a data-nav="ilerleme" href="#/ilerleme">' + icon("chart") + 'İlerleme</a>'
    + '<a data-nav="karma" href="#/karma">' + icon("mix") + 'Karma deneme</a>'
    + (S.cat.lex || S.cat.lat ? '<a data-nav="sozluk" href="#/sozluk">' + icon("lex") + 'Anatomi Latincesi</a>' : "")
    + '<a data-nav="ara" href="#/ara">' + icon("search") + 'Ara</a>'
    + '<div class="sep"></div><a data-nav="ayarlar" href="#/ayarlar">' + icon("set") + 'Ayarlar</a></nav>'
    + '<div class="foot" id="side-foot"></div></aside>'
    + '<main class="main" id="main"></main>'
    + '<nav class="tabs">'
    + '<a data-nav="home" href="#/">' + icon("home") + 'Ana sayfa</a>'
    + '<a data-nav="lib" href="#/lib">' + icon("lib") + 'Kütüphane</a>'
    + '<a data-nav="tekrar" href="#/tekrar">' + icon("rep") + 'Tekrar<span class="badge" data-badge hidden></span></a>'
    + '<a data-nav="ilerleme" href="#/ilerleme">' + icon("chart") + 'İlerleme</a>'
    + '<a data-nav="ara" href="#/ara">' + icon("search") + 'Ara</a>'
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
    a.classList.toggle("on", k === key || ((key.startsWith("k:") || key === "cikmis" || key === "yeni") && k === "lib" && !a.classList.contains("sub")) || (key === "karma" && k === "ilerleme" && a.closest(".tabs")));
  });
  $("#shell").classList.toggle("immersive", !!immersive);   // alttaki sekme çubuğu hiç gizlenmez; yatay tablette yalnız yan menü gizlenir
  tabH();
}
// testten açılan slayt paneli telefonda alttaki çubuğun üstünde biter
function tabH() { const t = $(".tabs"); document.documentElement.style.setProperty("--tabh", (t ? t.offsetHeight : 0) + "px"); }
addEventListener("resize", () => tabH());
function bar(o) {
  const back = o.back ? '<a class="ibtn bk" href="' + o.back + '" data-back aria-label="Geri">' + icon("back") + "</a>" : "";
  return '<header class="bar' + (o.solid ? " solid" : "") + (o.crumb ? " has-crumb" : "") + '">' + back + '<div class="ttl">' + (o.crumb ? '<nav class="crumb">' + o.crumb + "</nav>" : "")
    + "<h1>" + esc(o.title) + "</h1></div>" + (o.actions ? '<div class="acts">' + o.actions + "</div>" : "") + "</header>";
}
/* ---------- geçmiş ve geri tuşu ----------
   Geçmiş bir yığın gibi tutulur: her kayıtta derinlik (history.state.d), sessionStorage'da o derinlikteki adres.
   - Yığında zaten olan bir ekrana (alt sekmeler, yoldaki Kurul II, Çıkmışlar…) giderken yeni kayıt açılmaz, o kayda dönülür.
     Böylece geçmiş şişmez; telefonun geri tuşu geldiğin yolu yukarı doğru izler.
   - Sol üstteki ok: geldiğin ekran üst ya da aynı seviyedeyse oraya döner; değilse (ör. slayttan yolla kurula çıktıysan)
     üst ekrana çıkar, slayta geri inmez. İlk ekransa uygulamadan çıkmaz.
   - Alt pencere ya da testteki slayt paneli açıkken telefonun geri tuşu önce onu kapatır. */
const NAVK = "ml.navstack";
const navStack = () => { try { return JSON.parse(sessionStorage.getItem(NAVK)) || []; } catch (e) { return []; } };
const navSave = A => { try { sessionStorage.setItem(NAVK, JSON.stringify(A)); } catch (e) {} };
const curHash = () => location.hash || "#/";
function navDepth() {
  const st = history.state, A = navStack();
  if (st && st.d) S.nav = st.d;
  else {
    S.nav = (S.nav || 0) + 1;
    A.length = S.nav;                                            // ileri kayıtlar artık geçersiz
    try { history.replaceState(Object.assign({}, st, { d: S.nav }), ""); } catch (e) {}
  }
  A[S.nav] = curHash(); navSave(A);
}
const keepState = () => history.state;
function replaceHash(h) {                                        // adresi değiştir, geçmişe kayıt ekleme
  history.replaceState(keepState(), "", h);
  const A = navStack(); A[S.nav] = h; navSave(A);
}
function navLevel(h) {
  const [p, q] = String(h || "#/").replace(/^#/, "").split("?"), a = p.split("/").filter(Boolean);
  if (!a.length) return 0;
  if (a[0] === "lib") return a.length;
  if (["d", "t", "c", "v"].includes(a[0])) return 4;
  if (a[0] === "tekrar") return /(^|&)s=/.test(q || "") ? 2 : 1;
  if (["cikmis", "yenilikler", "kurulum"].includes(a[0])) return 2;
  return 1;
}
function navKey(h) {
  const [p, q] = String(h || "#/").replace(/^#/, "").split("?"), a = p.split("/").filter(Boolean);
  if (a[0] === "d") return "/d/" + a[1];
  if (a[0] === "tekrar" && /(^|&)s=/.test(q || "")) return h;
  return "/" + a.join("/");
}
function findUp(href) {                                          // geride, yığında aynı ekran var mı
  const A = navStack(), exact = /[?&](h|final|s|w|e)=/.test(href) || /^#\/karma/.test(href);
  for (let k = S.nav - 1; k >= 1; k--) {
    const h = A[k];
    if (h && (h === href || (!exact && navKey(h) === navKey(href)))) return k;
  }
  return -1;
}
const OV = [];                                                   // açık katmanlar (alt pencere, slayt paneli)
let ovSkip = 0, afterPop = null;
function ovOpen(close) { OV.push(close); try { history.pushState(Object.assign({}, history.state, { ov: OV.length }), ""); } catch (e) {} return close; }
function ovDone(tok) {                                           // katman düğmeyle kapandı: eklediği geçmiş kaydını geri al
  const i = OV.indexOf(tok); if (i < 0) return;
  OV.splice(i, 1);
  if (((history.state && history.state.ov) || 0) > OV.length) { ovSkip++; history.back(); }
}
addEventListener("popstate", () => {
  const st = history.state || {};
  if (ovSkip) { ovSkip--; }
  else {
    const want = st.ov || 0;
    while (OV.length > want) { const f = OV.pop(); try { f(true); } catch (e) {} }
    if (want > OV.length) { history.back(); return; }          // artık açık olmayan bir katmanın eski kaydı: atla
  }
  if (afterPop) { const f = afterPop; afterPop = null; setTimeout(f, 0); }
});
function navTo(href, isBack) {
  if (!S.cat) { location.hash = href; return; }
  if ((history.state && history.state.ov) || ovSkip) {           // önce açık katmanın geçmiş kaydını kapat
    while (OV.length) { const f = OV.pop(); try { f(true); } catch (e) {} }
    afterPop = () => navTo(href, isBack);
    if (!ovSkip) { ovSkip = 1; history.go(-history.state.ov); }  // zaten geri gidiliyorsa ikinci kez gitme
    return;
  }
  const cur = curHash();
  if (href === cur) return;
  const A = navStack();
  if (isBack) {
    const from = A[S.nav - 1];
    if (S.nav > 1 && from && navLevel(from) <= navLevel(cur)) { history.back(); return; }
  }
  const k = findUp(href);
  if (k > 0) { history.go(k - S.nav); return; }
  if (isBack) { replaceHash(href); route(); return; }           // üst ekrana çık, geçmiş uzamasın
  location.hash = href;
}
document.addEventListener("click", e => {
  if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest && e.target.closest('a[href^="#/"], a[href="#"]');
  if (!a || a.target || !S.cat) return;
  e.preventDefault();
  navTo(a.getAttribute("href") === "#" ? "#/" : a.getAttribute("href"), a.hasAttribute("data-back"));
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
  cleanup();
  const { parts, q } = parseHash();
  const [a, b, c] = parts;
  const m = main();
  m.scrollTop = 0;
  requestAnimationFrame(fitCrumbs);
  try {
    if (!a) return viewHome();
    if (a === "lib") return !b ? viewLib(q) : !c ? viewKurul(b) : viewCourse(b, c);
    if (a === "d") return viewDoc(b, parseInt(c, 10) || 1, q);
    if (a === "t") return viewTest(b);
    if (a === "c") return viewCards(b);
    if (a === "v") return viewVideo(b);
    if (a === "cikmis") return viewCikmis(q);
    if (a === "yeni") return viewRecent();
    if (a === "yenilikler") return viewChanges();
    if (a === "tekrar") return q.get("s") ? viewSession(q) : viewReview();
    if (a === "ara") return viewSearch(q.get("q") || "");
    if (a === "ayarlar") return viewSettings();
    if (a === "isaretler") return viewBookmarks();
    if (a === "ilerleme") return viewProgress();
    if (a === "karma") return viewMix(q);
    if (a === "sozluk") return viewLexicon(q);
    if (a === "kurulum") return viewInstall(true);
    viewHome();
  } catch (err) { showError(err); }
}
function showError(err) {
  console.error(err); logErr(err);
  setNav("", false);
  main().innerHTML = bar({ title: "Bir sorun çıktı", back: "#/" }) + '<div class="page narrow"><div class="card empty">'
    + esc(err && err.message || err) + '<br><br><button class="btn" onclick="location.reload()">Yeniden yükle</button></div></div>';
}
const notFound = () => { main().innerHTML = bar({ title: "Bulunamadı", back: "#/" }) + '<div class="page"><div class="card empty">Bu öğe artık yok.</div></div>'; };

/* ---------- item rows ---------- */
function kindBox(k) { const K = KIND[k] || KIND.not; return '<span class="kind" style="--kc:' + K.c + '" title="' + K.l + '">' + icon(K.ic) + "</span>"; }
function itemHref(it) { return it.k === "test" ? "#/t/" + it.id : it.k === "kart" ? "#/c/" + it.id : it.k === "video" ? "#/v/" + it.id : "#/d/" + it.id + "/1"; }
const fnum = x => String(x).replace(".", ",");
function itemMeta(it, opts) {
  const m = [];
  if (opts && opts.course) m.push('<span><i class="cdot" style="background:' + ccol(it.c) + '"></i>' + esc(it.c) + "</span>");
  m.push("<span>" + (KIND[it.k] || {}).l + "</span>");
  if (it.d && !it.dq) m.push("<span>" + fdate(it.d) + "</span>");
  if (it.h && !(opts && opts.noHoca)) m.push("<span>" + esc(it.h) + "</span>");
  if (it.n) m.push("<span>" + it.n + " " + unitWord(it) + "</span>");
  if (it.dur) m.push("<span>" + esc(it.dur) + "</span>");
  if (it.u) m.push('<span class="up">Yükleyen: ' + esc(it.u) + "</span>");
  if (it.k === "test") {
    const r = testRes()[it.id];
    if (r && r.fin) m.push('<span class="sc">Son: ' + r.ok + "/" + r.n + " doğru · %" + Math.round(100 * r.ok / r.n) + "</span>");
    else if (r && r.done) m.push('<span class="ip">Devam ediyor · ' + r.done + "/" + r.n + "</span>");
  }
  return m.join("");
}
// prefix: başlığın önüne ders adı (kurul sayfasındaki testler: "Biyofizik · Deneme Sınavı 1")
function itemRow(it, opts) {
  const pre = opts && opts.prefix && !fold(it.t).includes(fold(it.c));
  return '<a class="it" href="' + itemHref(it) + '">' + kindBox(it.k) + '<div class="txt"><div class="t">' + (pre ? '<i class="cdot" style="background:' + ccol(it.c) + '"></i>' + esc(it.c) + " · " : "") + esc(it.t) + (it.m ? ' <span class="muted small">· ' + esc(it.m) + "</span>" : "")
    + '</div><div class="m">' + itemMeta(it, pre ? Object.assign({}, opts, { course: 0 }) : opts) + "</div></div>" + icon("chev", "chev") + "</a>";
}

/* ---------- çıkmışlar ---------- */
const cxAny = () => S.cat.items.some(i => (i.k === "test" && i.cx) || i.k === "cikmis") || (S.cat.todo || []).some(t => t.kind === "cikmis");
function cxGroups() {
  const K = new Map();
  const slot = (g, c) => {
    if (!K.has(g)) K.set(g, new Map());
    const m = K.get(g);
    if (!m.has(c)) m.set(c, { c, tests: [], pdfs: [], pend: [] });
    return m.get(c);
  };
  S.cat.items.forEach(it => { if (it.k === "test" && it.cx) slot(it.g, it.c).tests.push(it); else if (it.k === "cikmis") slot(it.g, it.c).pdfs.push(it); });
  (S.cat.todo || []).filter(t => t.kind === "cikmis").forEach(t => slot(t.g, t.c).pend.push(t));
  const order = S.cat.kurullar.map(k => k.id).concat(Object.keys(SPECIAL));
  return Array.from(K.entries()).sort((a, b) => order.indexOf(b[0]) - order.indexOf(a[0]))
    .map(([g, m]) => ({ g, k: kurulById(g), rows: Array.from(m.values()).sort((a, b) => a.c.localeCompare(b.c, "tr")) }));
}
function cxCount() { let n = 0; cxGroups().forEach(G => { n += G.rows.length; }); return n; }
function viewCikmis(q) {
  setNav("cikmis");
  const G = cxGroups(), R = testRes();
  const card = r => {
    const tests = r.tests.map(it => {
      const x = R[it.id];
      const st = x && x.fin ? "Son: " + x.ok + "/" + x.n + " doğru · %" + Math.round(100 * x.ok / x.n)
        : x && x.done ? "Devam ediyor · " + x.done + "/" + x.n : "Henüz çözmedin";
      const pc = x ? Math.round(100 * (x.fin ? x.ok : x.done) / x.n) : 0;
      return '<a class="cxa" href="#/t/' + it.id + '">' + kindBox("test") + '<span class="tx"><b>Çöz · ' + it.n + ' soru</b><small class="' + (x && x.fin ? "sc" : x && x.done ? "ip" : "") + '">' + st + '</small><span class="pbar"><i class="' + (x && x.fin ? "ok" : "") + '" style="width:' + pc + '%"></i></span></span></a>';
    }).join("");
    const pdfs = r.pdfs.map(it => '<a class="cxa" href="#/d/' + it.id + '/1">' + kindBox("cikmis") + '<span class="tx"><b>Orijinal PDF</b><small>' + it.n + " sayfa · taranmış çıkmış</small></span></a>").join("")
      + r.pend.map(t => '<div class="cxa pend">' + kindBox("cikmis") + '<span class="tx"><b>Orijinal PDF</b><small>Drive’da, ' + Math.round((t.kb || 0) / 1024) + " MB; sohbete eklenince gelir</small></span></div>").join("");
    return '<div class="card cxc"><div class="cxh"><i class="cdot" style="background:' + ccol(r.c) + '"></i><b>' + esc(r.c) + "</b></div>"
      + '<div class="cxb">' + (tests || '<div class="cxa pend">' + kindBox("test") + '<span class="tx"><b>Çözülebilir test</b><small>Henüz hazırlanmadı</small></span></div>') + pdfs + "</div></div>";
  };
  main().innerHTML = bar({ title: "Çıkmışlar", crumb: crumbs([["Tıp", "#/lib"], [donemOf(currentKurul().id).name, "#/lib"]]), back: S.nav > 1 ? "#/lib" : "" })
    + '<div class="page">'
    + (G.length ? G.map(x => '<h2 class="sec" id="cx-' + x.g + '">' + esc(x.k ? (x.k.no ? "Kurul " + x.k.no + " · " + x.k.name : x.k.name) : x.g) + '</h2><div class="cxgrid">' + x.rows.map(card).join("") + "</div>").join("")
      : '<div class="card empty">Henüz çıkmış eklenmedi.</div>')
    + '<p class="note">Çözülebilir testte yalnız bu yılın slaytlarında karşılığı olan sorular var; her açıklama slayttan alıntı ve “Slayta git” içerir. Teste girmeyen sorular orijinal PDF’te duruyor.</p></div>';
  const g = q && q.get("g"), el = g && document.getElementById("cx-" + g);
  if (el) el.scrollIntoView();
}

/* ---------- views: home ---------- */
// Yaklaşan sınav uyarısı (katalogda "sinavlar": [{d, c, t}]; medlock.py sinav ile eklenir), 3 hafta önceden
function examCard() {
  const t = today(), L = (S.cat.sinavlar || []).filter(x => x.d >= t && dayDiff(t, x.d) <= 21);
  if (!L.length) return "";
  return L.map(x => {
    const n = dayDiff(t, x.d), its = S.cat.items.filter(i => i.c === x.c), g = its[0] && its[0].g;
    const wd = new Date(x.d + "T12:00").toLocaleDateString("tr", { weekday: "long" });
    const pick = k => its.filter(i => i.k === k && !i.cx).sort((a, b) => (b.d || "").localeCompare(a.d || ""))[0];
    const oz = pick("ozet"), ts = pick("test");
    return '<div class="card exam' + (n <= 2 ? " soon" : "") + '"><div class="ex-l"><span class="ex-n">' + (n === 0 ? "Bugün" : n === 1 ? "Yarın" : n + " gün") + '</span><span class="ex-k">Yaklaşan sınav</span></div>'
      + '<div class="ex-t"><b>' + esc(x.c) + " · " + esc(x.t || "Sınav") + '</b><span class="muted small">' + fdate(x.d) + " " + wd + "</span>"
      + '<div class="row-btns">' + (oz ? '<a class="btn" href="#/d/' + oz.id + '/1">Özet</a>' : "") + (ts ? '<a class="btn" href="#/t/' + ts.id + '">Deneme</a>' : "")
      + (g ? '<a class="btn" href="#/lib/' + g + "/" + slug(x.c) + '">Ders</a>' : "") + "</div></div></div>";
  }).join("");
}
function viewHome() {
  setNav("home");
  const k = currentKurul(), t = today(), F = finalInfo();
  const total = dayDiff(k.start, k.end) + 1, gone = Math.min(Math.max(dayDiff(k.start, t) + 1, 0), total);
  const week = Math.max(1, Math.ceil(gone / 7)), weeks = Math.ceil(total / 7), left = dayDiff(t, k.end);
  const kItems = S.cat.items.filter(i => i.g === k.id);
  const due = srsDue().length, tracked = srsDue(true).length;
  const lastDoc = getLast("doc"), lastTest = getLast("test");
  const cont = [];
  if (lastDoc && S.byId[lastDoc.id]) { const it = S.byId[lastDoc.id]; cont.push({ at: lastDoc.at, html: '<a class="it" href="#/d/' + it.id + "/" + lastDoc.p + '">' + kindBox(it.k) + '<div class="txt"><div class="t">' + esc(it.t) + '</div><div class="m"><span><i class="cdot" style="background:' + ccol(it.c) + '"></i>' + esc(it.c) + "</span><span>Sayfa " + lastDoc.p + " / " + it.n + "</span></div></div>" + icon("chev", "chev") + "</a>" }); }
  if (lastTest && S.byId[lastTest.id]) { const it = S.byId[lastTest.id]; cont.push({ at: lastTest.at, html: itemRow(it, { course: 1, noHoca: 1 }) }); }
  cont.sort((a, b) => b.at - a.at);
  const bms = bmLoad().filter(b => S.byId[b.id]);
  const started = t >= k.start;
  const lastWeek = started && left >= 0 && left <= 7;
  const days = PS.get("days", {});
  let streak = 0, dd = dayN(days, t) ? t : addDays(t, -1); while (dayN(days, dd)) { streak++; dd = addDays(dd, -1); }
  const hasCx = cxAny();
  const hero = F && F.on
    ? '<div class="card hero"><div class="k">Final dönemi · ' + esc(F.d.name) + (F.est ? " · tarihler tahmini" : "") + "</div><h3>Final sınavları</h3>"
      + '<div class="meta"><span>' + fdate(F.start) + " – " + fdate(F.end, true) + "</span><span>Bütün kurulların soruları tekrar ve denemelerde</span></div>"
      + '<div class="row-btns"><a class="btn" href="#/karma?final=1">' + icon("mix") + "Final denemesi</a>" + (hasCx ? '<a class="btn" href="#/cikmis">' + icon("star") + "Çıkmışlar</a>" : "") + "</div></div>"
    : '<div class="card hero"><div class="k">Kurul ' + k.no + (started ? " · " + week + ". hafta / " + weeks : " · yakında") + (lastWeek ? ' <span class="lw">Son hafta</span>' : "") + '</div><h3>' + esc(k.name) + "</h3>"
      + '<div class="prog"><i style="width:' + Math.round(100 * gone / total) + '%"></i></div>'
      + '<div class="meta"><span>' + fdate(k.start) + " – " + fdate(k.end) + "</span>" + (left >= 0 ? "<span>Kurul sonuna <b>" + left + " gün</b></span>" : "") + "<span><b>" + kItems.length + "</b> öğe</span></div>"
      + '<div class="row-btns"><a class="btn" href="#/lib/' + k.id + '">Kurula git ' + icon("chev") + "</a>"
      + (lastWeek ? '<a class="btn" href="#/karma?w=1&g=' + k.id + '">' + icon("mix") + 'Zayıf konulardan deneme</a>' : "")
      + "</div></div>";
  main().innerHTML = bar({ title: NAME, crumb: fdate(t, true) + (P && P.name ? " · " + esc(P.name) : ""), actions: '<a class="ibtn" href="#/ayarlar" aria-label="Ayarlar">' + icon("set") + "</a>" })
    + '<div class="page">' + updCard() + examCard() + hero
    + '<div class="duo">'
    + '<a class="card tile mini' + (due ? " due" : "") + '" href="#/tekrar"><span class="big">' + due + '</span><b>' + (due ? "soru tekrar bekliyor" : "Bugün tekrar yok") + '</b><span class="muted small">'
    + (tracked ? "Listede " + tracked + " soru" : "Yanlışların buraya düşer") + "</span></a>"
    + '<a class="card tile mini" href="#/ilerleme"><span class="big">' + streak + '</span><b>günlük seri</b><span class="muted small">Bugün ' + dayN(days, t) + " soru</span></a>"
    + "</div>"
    + '<div class="grid tiles4" style="margin-top:12px">'
    + '<a class="card tile" href="#/karma"><span class="big">' + icon("mix") + '</span><span class="txt"><b>Karma deneme</b><span class="muted small">Seçtiğin derslerden karışık sorular</span></span>' + icon("chev", "chev") + "</a>"
    + (hasCx ? '<a class="card tile" href="#/cikmis"><span class="big">' + icon("star") + '</span><span class="txt"><b>Çıkmışlar</b><span class="muted small">' + cxCount() + " ders · çöz ya da orijinalini aç</span></span>" + icon("chev", "chev") + "</a>" : "")
    + (S.cat.lex || S.cat.lat ? '<a class="card tile" href="#/sozluk"><span class="big">' + icon("lex") + '</span><span class="txt"><b>Anatomi Latincesi</b><span class="muted small">' + (S.cat.lat ? "Terim çözücü, " + S.cat.lat.n + " kelime, alıştırma" : "Latince ve Yunanca kökler") + "</span></span>" + icon("chev", "chev") + "</a>" : "")
    + "</div>"
    + installCard()
    + (cont.length ? '<h2 class="sec">Kaldığın yer</h2><div class="card list">' + cont.map(c => c.html).join("") + "</div>" : "")
    + (bms.length ? '<h2 class="sec">İşaretli sayfalar' + (bms.length > 4 ? ' · <a href="#/isaretler" style="color:var(--accent)">tümü (' + bms.length + ")</a>" : "") + '</h2><div class="card list">' + bms.slice(0, 4).map(bmRow).join("") + "</div>" : "")
    + '<h2 class="sec sec-a">Son eklenenler<a href="#/yeni">Tümü ' + icon("chev") + '</a></h2><div class="card list">' + S.cat.items.slice(0, 5).map(it => itemRow(it, { course: 1, noHoca: 1 })).join("") + "</div>"
    + "</div>";  bindUpd();
}
// Güncellemeden sonra ana sayfada bir kez görünen kısa not (cihaz başına)
function updCard() {
  const seen = LS.get("ml.seenv", null);
  const news = seen == null ? CHANGES.slice(0, 1) : CHANGES.filter(c => vcmp(c.v, seen) > 0);   // ilk kez açan cihaz yalnız son sürümü görür
  if (!news.length) return "";
  return '<div class="card upd" id="updc"><div class="uh"><span class="k">Yeni sürüm</span><b>MedLock ' + VERSION + '</b><button class="ibtn" id="updx" aria-label="Kapat">' + icon("close") + "</button></div>"
    + news.map(c => '<div class="uv">' + (news.length > 1 ? "<small>" + c.v + "</small>" : "") + "<ul>" + c.l.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></div>").join("")
    + '<div class="row-btns"><button class="btn primary" id="updok">Tamam</button><a class="btn ghost" href="#/yenilikler">Bütün sürümler</a></div></div>';
}
function bindUpd() {
  const done = () => { LS.set("ml.seenv", VERSION); const c = $("#updc"); if (c) c.remove(); };
  ["#updx", "#updok"].forEach(s => { const b = $(s); if (b) b.onclick = done; });
}
function viewChanges() {
  setNav("ayarlar");
  LS.set("ml.seenv", VERSION);
  main().innerHTML = bar({ title: "Yenilikler", back: "#/ayarlar", crumb: "Şu an " + VERSION + " · büyük güncelleme 0.1, küçük düzeltme 0.0.1 artar" })
    + '<div class="page narrow">' + CHANGES.map(c => '<div class="card chg"><div class="ch"><b>' + c.v + "</b>" + (c.v === VERSION ? '<span class="now">Şu an</span>' : "") + (c.d ? '<span class="muted small">' + fdate(c.d, true) + "</span>" : "") + "</div><ul>"
      + c.l.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></div>").join("") + "</div>";
}
function viewRecent() {
  setNav("yeni");
  let lastM = "", rows = "";
  S.cat.items.forEach(it => {
    const m = it.d ? MONTHS[+it.d.slice(5, 7) - 1] + " " + it.d.slice(0, 4) : "Tarihsiz";
    if (m !== lastM) { if (rows) rows += "</div>"; rows += '<div class="month">' + m + '</div><div class="card list">'; lastM = m; }
    rows += itemRow(it, { course: 1, noHoca: 1 });
  });
  main().innerHTML = bar({ title: "Son eklenenler", back: "#/", crumb: S.cat.items.length + " öğe, en yeni üstte" }) + '<div class="page narrow">' + rows + (rows ? "</div>" : "") + "</div>";
}

function installCard() {
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (standalone || LS.get("ml.noinst")) return "";
  return '<div class="card tile" style="margin-top:12px" id="instc"><img src="icons/64.png" width="40" height="40" style="border-radius:10px" alt=""><span class="txt"><b>Ana ekrana ekle</b><span class="muted small">Uygulama gibi açılır, çevrimdışı da çalışır.</span></span>'
    + '<a class="btn" href="#/kurulum">Nasıl?</a><button class="ibtn" onclick="localStorage.setItem(\'ml.noinst\',\'1\');this.parentNode.remove()" aria-label="Kapat">' + icon("close") + "</button></div>";
}
function viewBookmarks() {
  setNav("home");
  const bms = bmLoad().filter(b => S.byId[b.id]);
  main().innerHTML = bar({ title: "İşaretli sayfalar", back: "#/" }) + '<div class="page narrow">'
    + (bms.length ? '<div class="card list">' + bms.map(bmRow).join("") + "</div>" : '<div class="card empty">Henüz işaretli sayfa yok. Slayt açıkken üstteki işaret düğmesine dokun.</div>') + "</div>";
}

/* ---------- views: library ---------- */
function viewLib(q) {
  setNav("lib");
  const t = today();
  const card = (k, cls) => {
    const its = S.cat.items.filter(i => i.g === k.id);
    const cnt = KORDER.map(kk => [kk, its.filter(i => i.k === kk).length]).filter(x => x[1]).map(x => x[1] + " " + KIND[x[0]].l.toLowerCase()).join(" · ");
    const now = k.start && t >= k.start && t <= k.end;
    return '<a class="card kurul ' + (cls || "") + '" href="#/lib/' + k.id + '">' + (k.no ? '<span class="no">KURUL ' + k.no + "</span>" : '<span class="no">' + esc(donemById(k.dn).name.toLocaleUpperCase("tr")) + "</span>")
      + "<h3>" + esc(k.name) + "</h3>" + (k.start ? '<span class="d">' + fdate(k.start) + " – " + fdate(k.end, true) + "</span>" : '<span class="d">Kurul dışı dersler</span>')
      + '<span class="cnt">' + (cnt || "Henüz içerik yok") + "</span>"
      + (now ? '<span class="st now">Şu an</span>' : k.end && t > k.end ? '<span class="st">Bitti</span>' : k.start && t < k.start ? '<span class="st">Yaklaşıyor</span>' : "") + "</a>";
  };
  const DN = donemler().slice().reverse(), curDn = donemOf(currentKurul().id).id;
  const sec = d => {
    const ks = S.cat.kurullar.filter(k => (k.dn || "d1") === d.id);
    const started = ks.filter(k => k.start <= t).reverse(), future = ks.filter(k => k.start > t);
    const sp = specialGs().map(kurulById).filter(k => (k.dn || "d1") === d.id);
    return '<h2 class="sec" id="dn-' + d.id + '">' + esc(d.name) + (d.yil ? ' <span class="muted">· ' + esc(d.yil) + "</span>" : "") + "</h2>"
      + '<div class="grid">' + started.map(k => card(k)).join("") + sp.map(k => card(k)).join("") + future.map(k => card(k, "future")).join("") + "</div>";
  };
  main().innerHTML = bar({ title: "Kütüphane", crumb: crumbs([["Tıp", ""]]) }) + '<div class="page">'
    + (cxAny() ? '<a class="card tile" href="#/cikmis" style="margin-top:4px"><span class="big">' + icon("star") + '</span><span class="txt"><b>Çıkmışlar</b><span class="muted small">Kurul sınavlarının çıkmış soruları: çözülebilir test ve orijinal PDF</span></span>' + icon("chev", "chev") + "</a>" : "")
    + DN.filter(d => d.id === curDn).concat(DN.filter(d => d.id !== curDn)).map(sec).join("")
    + (S.cat.lex || S.cat.lat ? '<h2 class="sec">Ek kaynaklar</h2><a class="card tile" href="#/sozluk"><span class="big">' + icon("lex") + '</span><span class="txt"><b>Anatomi Latincesi</b><span class="muted small">Terim çözücü, kelimeler, dilbilgisi, alıştırma ve kökler</span></span>' + icon("chev", "chev") + "</a>" : "")
    + "</div>";
  const dn = q && q.get("dn"), el = dn && donemler().length > 1 && document.getElementById("dn-" + dn);
  if (el) el.scrollIntoView();
}
function viewKurul(g) {
  const k = kurulById(g);
  if (!k) return notFound();
  setNav("k:" + g);
  const cs = coursesOf(g);
  const cx = cxGroups().find(x => x.g === g);
  main().innerHTML = bar({ title: k.no ? "Kurul " + k.no + " · " + k.name : k.name, crumb: crumbFor(g, null, "dn"), back: "#/lib" })
    + '<div class="page">' + (k.start ? '<p class="muted small" style="margin:0 0 12px">' + fdate(k.start, true) + " – " + fdate(k.end, true) + "</p>" : "")
    + (cs.length ? '<div class="card list crs">' + cs.map(o => {
      const cnt = KORDER.map(kk => [kk, o.items.filter(i => i.k === kk && !(kk === "test" && i.cx)).length]).filter(x => x[1]).map(x => "<span><b>" + x[1] + "</b> " + KIND[x[0]].l.toLowerCase() + "</span>").join("");
      return '<a class="course" href="#/lib/' + g + "/" + slug(o.c) + '"><span class="bar-c" style="background:' + ccol(o.c) + '"></span><span class="txt"><b>' + esc(o.c) + '</b><span class="cnt">' + cnt + "</span></span>" + icon("chev", "chev") + "</a>";
    }).join("") + "</div>" : '<div class="card empty">Bu kurula henüz içerik eklenmedi. Ders dosyaları Drive’a yüklendikçe burada görünecek.</div>')
    + kurulSection(g, "test", k.no ? "Bu kuruldaki testler" : "Testler", "test")
    + (cx ? '<h2 class="sec" id="sec-cikmis">Çıkmışlar</h2><div class="card list"><a class="it" href="#/cikmis?g=' + g + '">' + kindBox("cikmis") + '<div class="txt"><div class="t">Kurul ' + esc(k.no) + ' çıkmışları</div><div class="m"><span>' + cx.rows.map(r => esc(r.c)).join(" · ") + "</span></div></div>" + icon("chev", "chev") + "</a></div>" : "")
    + "</div>";
  const sec = parseHash().q.get("s");
  if (sec) { const el = document.getElementById("sec-" + sec); if (el) el.scrollIntoView(); }
}
function kurulSection(g, kind, title, id) {
  const its = S.cat.items.filter(i => i.g === g && i.k === kind && !i.cx);
  return its.length ? '<h2 class="sec" id="sec-' + id + '">' + title + '</h2><div class="card list">' + its.map(it => itemRow(it, { prefix: 1, noHoca: 1 })).join("") + "</div>" : "";
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
    const pend = (S.cat.todo || []).filter(t => t.g === g && slug(t.c) === cs && (!F.k || t.kind === F.k) && (!F.h || t.h === F.h));
    if (pend.length) rows += '<div class="month">Eklenmeyi bekleyen</div><div class="card list">' + pend.map(t => '<div class="it pend">' + kindBox(t.kind)
      + '<div class="txt"><div class="t">' + esc(t.t) + '</div><div class="m"><span>Drive’da · ' + Math.round((t.kb || 0) / 1024) + " MB</span><span>Dosya büyük olduğu için otomatik çekilemedi; sohbete ek olarak gönderilince eklenir.</span></div></div></div>").join("") + "</div>";
    $("#rows").innerHTML = rows || '<div class="card empty">Bu filtreye uyan öğe yok.</div>';
  };
  const chip = (f, v, l, n) => '<button class="chip' + (F[f] === v ? " on" : "") + '" data-f="' + f + '" data-v="' + esc(v) + '">' + esc(l) + (n != null ? '<span class="n">' + n + "</span>" : "") + "</button>";
  main().innerHTML = bar({ title: c, crumb: crumbFor(g, null), back: "#/lib/" + g })
    + '<div class="page"><div class="filters" id="flt"></div><div id="rows"></div></div>';
  $("#flt").addEventListener("click", e => { const b = e.target.closest("[data-f]"); if (!b) return; F[b.dataset.f] = b.dataset.v; render(); });
  render();
}

/* ---------- video (Drive'da durur) ---------- */
function viewVideo(id) {
  const it = S.byId[id];
  if (!it || it.k !== "video") return notFound();
  setNav("lib", true);
  const fid = encodeURIComponent((it.src || "").replace(/^drive:/, ""));
  main().innerHTML = '<div class="fill">' + bar({
    title: it.t, solid: 1, back: "#/lib/" + it.g + "/" + slug(it.c), crumb: crumbFor(it.g, it.c),
    actions: '<a class="btn" href="https://drive.google.com/file/d/' + fid + '/view" target="_blank" rel="noopener">Drive’da aç</a>',
  }) + '<div class="doc vdoc"><div class="vbox"><iframe src="https://drive.google.com/file/d/' + fid + '/preview" allow="autoplay; fullscreen" allowfullscreen title="' + esc(it.t) + '"></iframe></div>'
    + '<div class="vmeta"><div class="m">' + itemMeta(it, { course: 1 }) + '</div><p class="note">Video Drive’dan oynatılır, MedLock’a yüklenmez. Açılmazsa “Drive’da aç”a dokun; Drive’a o hesapla giriş yapmış olman gerekir. Çevrimdışı çalışmaz.</p></div></div></div>';
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
async function rotURL(u, a, key) {
  if (URLS.has(key)) return URLS.get(key);
  const img = new Image(); img.src = u; await img.decode();
  const c = document.createElement("canvas"), side = a % 180 !== 0;
  c.width = side ? img.naturalHeight : img.naturalWidth; c.height = side ? img.naturalWidth : img.naturalHeight;
  const x = c.getContext("2d"); x.translate(c.width / 2, c.height / 2); x.rotate(a * Math.PI / 180); x.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  const blob = await new Promise(r => c.toBlob(r, "image/webp", 0.88));
  const url = URL.createObjectURL(blob); urlCache(key, url); return url;
}
function mountDoc(el, it, page, opts) {
  opts = opts || {};
  const hl = new Set(opts.highlight || []);
  let html = "";
  for (let p = 1; p <= it.n; p++) {
    // sayfa numarası ve "soruyla ilgili" etiketi görselin üstüne değil altına yazılır
    html += '<figure class="pg' + ((it.r || 1.333) < 1 ? " portrait" : "") + (hl.has(p) ? " hl" : "") + '" data-p="' + p + '"><div class="pgi"><div class="ph" style="--ar:' + (it.r || 1.333) + '">' + p + "</div></div>"
      + '<figcaption class="pn">' + p + " / " + it.n + (hl.has(p) ? ' <b class="hlt">' + (opts.est ? "tahmini sayfa" : "soruyla ilgili") + "</b>" : "") + "</figcaption></figure>";
  }
  el.innerHTML = html + (opts.foot || "");
  const loadP = async fig => {
    if (fig.dataset.l) return; fig.dataset.l = "1";
    try {
      const pn = +fig.dataset.p, ra = (PS.get("rot", {})[it.x + "/" + pn] || {}).a || 0;
      let u = await pageURL(it, pn);
      if (ra) u = await rotURL(u, ra, it.x + "/" + pn + "@" + ra);
      const img = new Image(); img.alt = "Sayfa " + fig.dataset.p; img.decoding = "async"; img.src = u;
      await img.decode().catch(() => {});
      const ph = fig.querySelector(".ph"); if (ph) ph.replaceWith(img); else fig.querySelector(".pgi").prepend(img);
    } catch (e) { fig.dataset.l = ""; const ph = fig.querySelector(".ph"); if (ph) ph.textContent = "Yüklenemedi · tekrar kaydır"; }
  };
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) loadP(e.target); }), { root: el, rootMargin: "120% 0px" });
  // Açık sayfa: ekranın üst kısmındaki sayfa (telefonda kısa slaytlarda ortadaki değil). En alta inilince son sayfa.
  let curP = page, raf = 0;
  const figs = $$(".pg", el);
  const calc = () => {
    raf = 0;
    let p = 1;
    if (el.scrollTop > 0 && el.scrollTop + el.clientHeight >= el.scrollHeight - 2) p = it.n;
    else { const y = el.scrollTop + Math.max(40, el.clientHeight * 0.12); for (const f of figs) { if (f.offsetTop <= y) p = +f.dataset.p; else break; } }
    if (p !== curP) { curP = p; opts.onPage && opts.onPage(p); }
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(calc); };
  el.addEventListener("scroll", onScroll, { passive: true });
  figs.forEach(f => io.observe(f));
  const goto = (p, smooth) => { const f = el.querySelector('[data-p="' + Math.min(Math.max(p, 1), it.n) + '"]'); if (f) { loadP(f); el.scrollTo({ top: f.offsetTop - 8, behavior: smooth ? "smooth" : "auto" }); } };
  requestAnimationFrame(() => goto(page));
  const reload = p => {
    const f = el.querySelector('[data-p="' + p + '"]'); if (!f) return;
    const img = f.querySelector("img"); if (img) { const ph = document.createElement("div"); ph.className = "ph"; ph.style.setProperty("--ar", img.naturalWidth / img.naturalHeight); img.replaceWith(ph); }
    f.dataset.l = ""; loadP(f);
  };
  return { goto, reload, destroy() { io.disconnect(); el.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); }, get page() { return curP; } };
}
function viewDoc(id, page, q) {
  const it = S.byId[id];
  if (!it || it.k === "test" || it.k === "kart") return notFound();
  setNav("lib", true);
  const k = kurulById(it.g);
  const back = "#/lib/" + it.g + "/" + slug(it.c);
  main().innerHTML = '<div class="fill">' + bar({
    title: it.t, solid: 1, back, crumb: crumbFor(it.g, it.c),
    actions: (S.cat.lat && (S.cat.lat.ids || []).includes(it.id) ? '<button class="ibtn" id="latb" title="Bu sayfadaki Latince terimler">' + icon("lex") + "</button>" : "") + '<button class="ibtn" id="zmb" title="Yakınlaştır">' + icon("zoom") + '</button><button class="ibtn" id="rotb" title="Sayfayı döndür">' + icon("rot") + '</button><button class="ibtn" id="bmb" title="Bu sayfayı işaretle">' + icon(bmHas(it.id, page) ? "bmf" : "bm") + '</button><button class="pgc" id="pgc">' + page + " / " + it.n + "</button>",
  }) + '<div class="doc" id="doc" tabindex="-1"></div></div>';
  const rel = S.cat.items.filter(t => t.k === "test" && (t.dk || []).some(d => d[0] === it.id));
  const foot = rel.length ? '<div class="doc-foot"><b>Bu ' + (it.k === "slayt" ? "slayttan" : "dosyadan") + " soru olan testler</b><div class=\"row-btns\">"
    + rel.map(t => '<a class="btn" href="#/t/' + t.id + '">' + icon("test") + esc(t.c === it.c ? t.t : t.c + " · " + t.t) + ' <span class="muted">' + (t.dk.find(d => d[0] === it.id)[1]) + " soru</span></a>").join("") + "</div></div>" : "";
  const hl = (q && q.get("h") || "").split(",").map(Number).filter(Boolean);
  let saveT = 0;
  const V = mountDoc($("#doc"), it, page, {
    highlight: hl, est: q && q.get("e") === "1", foot,
    onPage: p => {
      $("#pgc").textContent = p + " / " + it.n;
      $("#bmb").innerHTML = icon(bmHas(it.id, p) ? "bmf" : "bm");
      clearTimeout(saveT);
      // sayfa adresi yazılmadan başka yere geçildiyse yazma (yoksa yol düğmesine basınca slayta geri döner)
      saveT = setTimeout(() => { if (!location.hash.startsWith("#/d/" + it.id + "/")) return; replaceHash("#/d/" + it.id + "/" + p + (hl.length ? "?" + q.toString() : "")); setLast("doc", { id: it.id, p }); }, 400);
    },
  });
  setLast("doc", { id: it.id, p: page });
  S.cleanup.push(() => { clearTimeout(saveT); V.destroy(); });
  $("#doc").focus({ preventScroll: true });
  const lb = $("#latb");
  if (lb) lb.onclick = async () => {
    const pg = V.page, { D, terms } = await latPageTerms(it.id, pg);
    if (!terms.length) return toast((it.k === "slayt" ? "Bu slaytta" : "Bu sayfada") + " Latince terim bulunamadı");
    latSheet((it.k === "slayt" ? "Slayt " : "Sayfa ") + pg + " · Latince terimler", terms.map(t => latDecodeHTML(D, t)).join(""));
  };
  // Yakınlaştırma: 1× → 1,6× → 2,2× (A4 sayfalar telefonda okunsun diye); sayfaya çift dokunmak da aynı işi yapar
  const ZL = [1, 1.6, 2.2];
  const zoomTo = z => { const d = $("#doc"), p = V.page; S.zoom = z; d.style.setProperty("--z", z); d.classList.toggle("zoomed", z > 1); V.goto(p); toast(z > 1 ? "Yakınlaştırma " + String(z).replace(".", ",") + "×" : "Normal boyut"); };
  const zoomNext = () => zoomTo(ZL[(ZL.indexOf(S.zoom || 1) + 1) % ZL.length]);
  S.zoom = 1;
  $("#zmb").onclick = zoomNext;
  $("#doc").addEventListener("dblclick", e => { if (e.target.closest(".pg")) zoomNext(); });
  $("#rotb").onclick = () => {
    const rk = it.x + "/" + V.page, R = Object.assign({}, PS.get("rot", {}));
    R[rk] = { a: (((R[rk] || {}).a || 0) + 90) % 360, at: Date.now() };
    PS.set("rot", R); V.reload(V.page);
  };
  $("#bmb").onclick = () => {
    const on = bmToggle(it.id, V.page);
    $("#bmb").innerHTML = icon(on ? "bmf" : "bm");
    toast(on ? (it.k === "slayt" ? "Slayt " : "Sayfa ") + V.page + " işaretlendi" : "İşaret kaldırıldı");
  };
  $("#pgc").onclick = () => {
    const b = $("#pgc");
    const inp = document.createElement("input");
    inp.type = "number"; inp.min = 1; inp.max = it.n; inp.value = V.page; inp.className = "pgjump"; inp.inputMode = "numeric";
    b.replaceWith(inp); inp.select();
    // Enter, Escape ve odak kaybı aynı anda gelebilir: yalnız bir kez geri koy
    let closed = false;
    const close = go => { if (closed) return; closed = true; const p = parseInt(inp.value, 10); if (inp.isConnected) inp.replaceWith(b); if (go && p) V.goto(p); };
    inp.onkeydown = e => { if (e.key === "Enter") close(true); if (e.key === "Escape") close(false); };
    inp.onblur = () => close(true);
  };
}

/* ---------- slide panel (from tests & review) ---------- */
let slideTok = null;
function openSlide(docId, pages, est) {
  const it = S.byId[docId];
  if (!it) return toast("Bu kaynak henüz kütüphanede yok.");
  const wasOpen = $("#spane") && !$("#spane").hidden;
  closeSlide(true);
  let pane = $("#spane");
  if (!pane) { pane = document.createElement("aside"); pane.className = "spane"; pane.id = "spane"; pane.dataset.float = "1"; document.body.appendChild(pane); }
  pane.hidden = false;
  pane.innerHTML = '<div class="shead"><button class="ibtn" data-sclose aria-label="Kapat">' + icon(innerWidth < 900 ? "back" : "close") + '</button><div class="t">' + esc(it.t)
    + "<small>" + (est ? "Tahmini " : "") + (it.k === "slayt" ? "slayt " : "sayfa ") + esc(pages.join(", ")) + " · " + esc(it.c) + '</small></div><a class="ibtn" href="#/d/' + it.id + "/" + pages[0] + "?h=" + pages.join(",") + (est ? "&e=1" : "") + '" title="Tam ekran aç">' + icon("expand") + '</a></div><div class="doc"></div>';
  pane._v = mountDoc($(".doc", pane), it, pages[0], { highlight: pages, est });
  $("[data-sclose]", pane).onclick = () => closeSlide(false);
  if (!wasOpen || !slideTok) slideTok = ovOpen(() => closeSlide(true));   // telefonun geri tuşu paneli kapatsın
  S.cleanup.push(() => { slideTok = null; closeSlide(true); });
}
// fromPop: geri tuşuyla ya da başka bir slayt açılırken kapandı; false: kapat düğmesi (geçmiş kaydı da geri alınır)
function closeSlide(fromPop) {
  const p = $("#spane");
  if (!p || p.hidden) return;
  if (p._v) { p._v.destroy(); p._v = null; }
  if (p.dataset.float) p.remove(); else { p.hidden = true; p.innerHTML = ""; }
  if (fromPop !== true && slideTok) { const t = slideTok; slideTok = null; ovDone(t); }
}
const pagesLabel = (it, pages) => (it && it.k === "slayt" ? "slayt " : "sayfa ") + pages.join(", ");

/* ---------- tests (engine in iframe) ---------- */
window.MLBridge = function (win) {
  const C = S.cur;
  if (!C) return null;
  win.addEventListener("error", e => logErr(e.error || e.message, "test"));
  win.addEventListener("click", e => {
    const rb = e.target.closest && e.target.closest("[data-mlr]");
    if (rb) { e.preventDefault(); return reportQ(C, rb.dataset.mlr); }
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
    rep(qid) { return '<button type="button" class="ml-rep" data-mlr="' + esc(qid) + '">⚑ Hata bildir</button>'; },
    save(state) { onEngineSave(C, state); },
  };
};
function onEngineSave(C, st) {
  const r = st && st.run;
  if (!r) return;
  if (!r.mlid) r.mlid = Date.now();
  let ok = 0, done = 0, bad = 0;
  r.ids.forEach(id => { const a = r.ans[id]; if (a !== undefined) { done++; if (C.byQ[id] && a === C.byQ[id].a) ok++; else bad++; } });
  if (!C.mix) {
    const res = testRes();
    res[C.it.id] = { ok, done, n: r.ids.length, fin: !!r.finished, at: Date.now() };
    PS.set("tres", res);
    setLast("test", { id: C.it.id });
  }
  if (r.finished) {
    const H = PS.get("hist", []).slice();
    if (!H.some(h => h.r === r.mlid)) {
      H.push({ id: C.it.id, g: C.it.g, t: C.it.t, c: C.it.c, at: Date.now(), ok, bad, n: r.ids.length, r: r.mlid });
      PS.set("hist", H.slice(-400));
    }
  }
  const eng = Object.assign({}, PS.get("eng", {}));
  eng[C.ekey] = { at: Date.now(), s: JSON.parse(JSON.stringify(st)) };
  PS.set("eng", eng);
  const srs = srsLoad(), qh = Object.assign({}, PS.get("qh", {})), td = today();
  let ch = false, chq = false, nNew = 0;
  r.ids.forEach(id => {
    const q = C.byQ[id], a = r.ans[id];
    if (!q || a === undefined || !(r.finished || r.mode === "study")) return;
    const key = C.src ? C.src[id] : C.it.id + "|" + id;
    const h = qh[key] || (qh[key] = { n: 0, k: 0 });
    if (h.r !== r.mlid) {
      h.r = r.mlid; h.n++; if (a === q.a) h.k++; h.l = a === q.a ? 1 : 0; h.t = q.t; h.c = C.srcC ? C.srcC[id] : C.it.c; h.at = Date.now();
      nNew++; chq = true;
    }
    if (a === q.a) return;                       // boşlar ve doğrular tekrar listesine girmez
    const e = srs[key];
    if (e && e.r === r.mlid) return;
    srs[key] = { b: 0, due: addDays(td, 1), w: (e ? e.w : 0) + 1, r: r.mlid, t: Date.now(), u: Date.now() };
    ch = true;
  });
  if (chq) { PS.set("qh", qh); PS.set("days", addDayAnswers(Object.assign({}, PS.get("days", {})), nNew)); }
  if (ch) { srsSave(srs); updateBadge(); }
}
const jsLit = o => JSON.stringify(o).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
async function mixBlob(M) {
  const tests = {};
  for (const [tid] of M.ids) if (!tests[tid] && S.byId[tid]) tests[tid] = await loadTest(S.byId[tid]);
  const data = [], refs = {}, src = {}, srcC = {}, courses = new Map();
  M.ids.forEach(([tid, qid]) => {
    const b = tests[tid]; if (!b) return;
    const q = b.data.find(x => x.id === qid); if (!q) return;
    const nid = tid + "~" + qid;
    data.push(Object.assign({}, q, { id: nid }));
    if (b.refs && b.refs[qid]) refs[nid] = b.refs[qid];
    src[nid] = tid + "|" + qid; srcC[nid] = S.byId[tid].c;
    b.cfg.courses.forEach(c => { if (!courses.has(c.code)) courses.set(c.code, c); });
  });
  const cfg = { key: M.k, title: M.t, sub: data.length + " soru", eyebrow: NAME + " · karma deneme", lede: M.d || "", courses: Array.from(courses.values()), perQuestion: 1.2 };
  return { blob: { cfg, data, refs }, src, srcC };
}
async function viewTest(id) {
  let it, blob, extra = {}, back;
  if (id === "mix") {
    const M = PS.get("mix", null);
    if (!M) return notFound();
    it = { id: "mix", k: "test", t: M.t, c: M.c || "Karma", g: M.g || "", n: M.ids.length, h: "" };
    back = "#/karma";
  } else {
    it = S.byId[id];
    if (!it || it.k !== "test") return notFound();
    back = "#/lib/" + it.g + "/" + slug(it.c);
  }
  setNav("lib", true);
  main().innerHTML = '<div class="fill">' + bar({
    title: it.t, solid: 1, back, crumb: id === "mix" ? crumbs([["Karma deneme", "#/karma"], [it.c, ""]]) : it.cx ? crumbs([["Tıp", "#/lib"], ["Çıkmışlar", "#/cikmis?g=" + it.g], [it.c, "#/lib/" + it.g + "/" + slug(it.c)]]) : crumbFor(it.g, it.c),
    actions: id === "mix" ? "" : '<button class="ibtn" id="tinfo" title="Testin kaynakları">' + icon("info") + "</button>",
  }) + '<div class="tsplit"><div class="tpane"><div class="loading"><div><div class="spin"></div>Test açılıyor…</div></div></div><aside class="spane" id="spane" hidden></aside></div></div>';
  if (id === "mix") { const m = await mixBlob(PS.get("mix", null)); blob = m.blob; extra = { mix: 1, src: m.src, srcC: m.srcC }; }
  else blob = await loadTest(it);
  const tpl = await engineTpl();
  if (parseHash().parts[1] !== id) return;
  const byQ = {}; blob.data.forEach(q => { byQ[q.id] = q; });
  const ekey = engKey(blob.cfg.key);
  const saved = PS.get("eng", {})[ekey];
  try { if (saved) localStorage.setItem(ekey, JSON.stringify(saved.s)); else localStorage.removeItem(ekey); } catch (e) {}
  S.cur = Object.assign({ it, blob, byQ, ekey }, extra);
  S.cleanup.push(() => { S.cur = null; });
  const fr = document.createElement("iframe");
  fr.title = it.t;
  fr.srcdoc = tpl.replace("/*ML_DATA*/", () => "const CFG = " + jsLit(Object.assign({}, blob.cfg, { key: ekey })) + ";\nconst DATA = " + jsLit(blob.data));
  $(".tpane").replaceChildren(fr);
  const ti = $("#tinfo"); if (ti) ti.onclick = () => testInfo(it);
  if (id !== "mix") setLast("test", { id: it.id });
}
function sheet(html) {
  const bg = document.createElement("div");
  bg.className = "sheet-bg";
  bg.innerHTML = '<div class="sheet" role="dialog">' + html + "</div>";
  let tok = null;
  // fromPop: telefonun geri tuşu kapattı (geçmiş zaten geri gitti)
  const close = fromPop => { if (!bg.isConnected) return; bg.remove(); if (!fromPop) ovDone(tok); };
  bg.addEventListener("click", e => { if (e.target === bg || e.target.closest("[data-close]")) close(false); });
  document.body.appendChild(bg);
  tok = ovOpen(() => close(true));
  S.cleanup.push(() => bg.remove());
  bg.close = () => close(false);
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

/* ---------- hata bildirimleri ---------- */
const REASONS = [["key", "Cevap anahtarı yanlış"], ["q", "Soru ya da şıklar hatalı / eksik"], ["e", "Açıklama yanlış ya da eksik"], ["s", "Slayt bağlantısı yanlış"], ["x", "Başka bir şey"]];
const reasonLabel = k => (REASONS.find(r => r[0] === k) || REASONS[4])[1];
function reportQ(C, qid) {
  let tid = C.it.id, oq = qid;
  if (C.src && C.src[qid]) [tid, oq] = C.src[qid].split("|");
  const it = S.byId[tid] || C.it, blob = S.tests[tid] || C.blob, qq = C.byQ[qid] || {};
  reportSheet({ tid, qid: oq, t: it.t, c: it.c, no: (blob.data || []).findIndex(x => x.id === oq) + 1, q: strip(qq.q) });
}
function reportSheet(R) {
  const key = R.tid + "|" + R.qid, old = PS.get("rep", {})[key], cur = old && !old.x ? old : null;
  const bg = sheet('<h3>Hata bildir</h3><p class="muted small">' + esc(R.c + " · " + R.t + (R.no > 0 ? " · " + R.no + ". soru" : "")) + '</p><p class="rq">' + esc((R.q || "").slice(0, 220)) + "</p>"
    + '<div class="card rreasons">' + REASONS.map(([k, l], i) => '<label class="tl"><input type="radio" name="rr" value="' + k + '"' + ((cur ? cur.r === k : i === 0) ? " checked" : "") + '><span class="tn">' + l + "</span></label>").join("") + "</div>"
    + '<textarea id="rnote" class="rnote" rows="3" maxlength="600" placeholder="İstersen kısaca yaz: doğru cevap ne olmalı, neresi yanlış?">' + esc(cur ? cur.n || "" : "") + "</textarea>"
    + '<div class="row-btns" style="margin-top:12px"><button class="btn primary" id="rsend">Kaydet</button><button class="btn" data-close>Vazgeç</button></div>'
    + '<p class="note">Bildirimler Ayarlar › Hata bildirimleri’nde birikir. Oradan “Kopyala”ya dokunup Claude’a yapıştırırsın.</p>');
  $("#rsend", bg).onclick = () => {
    const M = Object.assign({}, PS.get("rep", {}));
    M[key] = { tid: R.tid, qid: R.qid, t: R.t, c: R.c, no: R.no, q: (R.q || "").slice(0, 220), r: ($("input[name=rr]:checked", bg) || {}).value || "x", n: $("#rnote", bg).value.trim(), at: Date.now(), x: 0 };
    PS.set("rep", M); bg.close(); toast("Kaydedildi · Ayarlar › Hata bildirimleri");
  };
}
const openReps = () => Object.values(PS.get("rep", {})).filter(r => r && !r.x).sort((a, b) => b.at - a.at);
function reportText() {
  const reps = openReps(), errs = LS.get("ml.errs", []);
  const L = ["MedLock hata bildirimleri · " + (P.name || "") + " · " + fdate(today(), true) + " · sürüm " + (APPV || "?"), ""];
  reps.forEach((r, i) => {
    L.push((i + 1) + ") " + r.c + " · " + r.t + " [" + r.tid + " / " + r.qid + (r.no > 0 ? ", " + r.no + ". soru" : "") + "]");
    L.push("   Neden: " + reasonLabel(r.r)); if (r.n) L.push("   Not: " + r.n); if (r.q) L.push("   Soru: " + r.q); L.push("");
  });
  if (errs.length) { L.push("Uygulama hataları:"); errs.forEach(e => L.push("- " + new Date(e.at).toLocaleString("tr") + " · " + e.h + " · " + e.m + (e.n > 1 ? " (" + e.n + " kez)" : "") + " · " + (e.v || "?"))); L.push(""); }
  L.push("Cihaz: " + navigator.userAgent.replace(/\s+/g, " ").slice(0, 160));
  return L.join("\n");
}
function logErr(err, where) {
  try {
    if (err && err.name === "AbortError") return;
    const msg = String(err && (err.stack || err.message) || err).split("\n").slice(0, 3).map(x => x.trim()).join(" | ").slice(0, 300);
    const L = LS.get("ml.errs", []), last = L[L.length - 1];
    if (last && last.m === msg) { last.n = (last.n || 1) + 1; last.at = Date.now(); }
    else L.push({ at: Date.now(), m: msg, h: location.hash.slice(0, 60), v: APPV, w: where || "" });
    LS.set("ml.errs", L.slice(-25));
  } catch (e) {}
}
window.addEventListener("error", e => logErr(e.error || e.message, "js"));
window.addEventListener("unhandledrejection", e => logErr(e.reason, "promise"));

/* ---------- cards ---------- */
async function viewCards(id) {
  const it = S.byId[id];
  if (!it || it.k !== "kart") return notFound();
  setNav("lib", true);
  main().innerHTML = '<div class="fill">' + bar({ title: it.t, solid: 1, back: "#/lib/" + it.g + "/" + slug(it.c), crumb: crumbFor(it.g, it.c) })
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
      s[key] = { b: 0, due: addDays(today(), 1), w: (e ? e.w : 0) + 1, t: Date.now(), u: Date.now() }; srsSave(s); updateBadge();
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
  const s = srsLoad(), t = today(), keys = Object.keys(s), F = finalInfo();
  const active = keys.filter(k => (!s[k].m || finalBack(s[k])) && srsKeyItem(k));
  const due = active.filter(k => s[k].due <= t || finalBack(s[k]));
  const back = active.filter(k => finalBack(s[k])).length;
  const tomorrow = active.filter(k => s[k].due === addDays(t, 1)).length;
  const week = active.filter(k => s[k].due > t && s[k].due <= addDays(t, 7)).length;
  const learned = keys.filter(k => s[k].m).length;
  const byC = new Map();
  active.forEach(k => { const it = srsKeyItem(k); const key = it.c; if (!byC.has(key)) byC.set(key, { due: 0, all: 0 }); const o = byC.get(key); o.all++; if (s[k].due <= t || finalBack(s[k])) o.due++; });
  main().innerHTML = bar({ title: "Tekrar", crumb: "Yanlış yaptığın sorular" }) + '<div class="page narrow">'
    + (back ? '<div class="card fnote"><b>Final dönemi</b> · Daha önce öğrendiğin ' + back + " soru bir kez daha soruluyor. Doğru bilirsen yine öğrenildi sayılır.</div>" : "")
    + '<div class="stat3"><div class="card"><b style="color:var(--flame)">' + due.length + '</b><span>bugün</span></div><div class="card"><b>' + tomorrow + '</b><span>yarın</span></div><div class="card"><b>' + week + "</b><span>bu hafta</span></div></div>"
    + '<div class="row-btns" style="margin:14px 0 4px">' + (due.length ? '<a class="btn flame" href="#/tekrar?s=1">' + icon("rep") + "Tekrara başla (" + due.length + ")</a>" : "")
    + (active.length ? '<a class="btn' + (due.length ? "" : " primary") + '" href="#/tekrar?s=1&all=1">Hepsini çalış (' + active.length + ")</a>" : "") + "</div>"
    + (byC.size ? '<h2 class="sec">Derslere göre</h2><div class="card">' + Array.from(byC.entries()).sort((a, b) => b[1].due - a[1].due || b[1].all - a[1].all).map(([c, o]) =>
      '<div class="crow"><i class="cdot" style="background:' + ccol(c) + '"></i><div class="txt"><b>' + esc(c) + '</b></div><span class="n">' + o.due + " / " + o.all + '</span><a class="btn" href="#/tekrar?s=1&c=' + encodeURIComponent(c) + (o.due ? "" : "&all=1") + '">Çalış</a></div>').join("") + "</div>" : "")
    + resultsHTML()
    + '<h2 class="sec">Nasıl çalışır</h2><p class="note">Testte yanlış yaptığın her soru buraya düşer ve ertesi gün sorulur. Doğru bildikçe aralık uzar: 1, 3, 7, 14, 30 gün. 30 günlük aralıktan sonra da doğru bilirsen soru öğrenildi sayılır'
    + (learned ? " (şimdiye kadar " + learned + ")" : "") + ". Yanlış yaparsan baştan başlar. Kartlarda “Bilemedim” dediklerin de buraya gelir."
    + (F ? " Final döneminde (" + fdate(F.start) + " – " + fdate(F.end, true) + (F.est ? ", tahmini" : "") + ") öğrenilmiş sorular bir kez daha gelir." : "") + "</p>"
    + (active.length ? "" : '<div class="card empty" style="margin-top:14px">Listen boş. Bir test çöz; yanlışların burada birikir.</div>')
    + "</div>";
}
function resultsHTML() {
  const R = testRes();
  const rows = Object.entries(R).filter(([id]) => S.byId[id]).sort((a, b) => b[1].at - a[1].at);
  if (!rows.length) return "";
  return '<h2 class="sec">Test sonuçların</h2><div class="card">' + rows.map(([id, r]) => {
    const it = S.byId[id], pc = r.n ? Math.round(100 * r.ok / r.n) : 0;
    return '<a class="crow" href="#/t/' + id + '"><i class="cdot" style="background:' + ccol(it.c) + '"></i><div class="txt"><b>' + esc(ct(it.c, it.t)) + '</b><div class="muted small">'
      + (r.fin ? "Bitti" : "Devam ediyor") + " · " + fdate(isoDay(new Date(r.at))) + '</div></div><span class="n">' + (r.fin ? r.ok + "/" + r.n + " · %" + pc : r.done + "/" + r.n) + "</span></a>";
  }).join("") + "</div>";
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
  let keys = Object.keys(s).filter(k => (finalBack(s[k]) || (!s[k].m && (all || s[k].due <= t))) && srsKeyItem(k) && (!cf || srsKeyItem(k).c === cf));
  keys.sort(() => Math.random() - .5);
  main().innerHTML = '<div class="fill">' + bar({ title: "Tekrar", solid: 1, back: "#/tekrar", crumb: cf ? esc(cf) : all ? "Bütün liste" : "Bugünün soruları" })
    + '<div class="doc" style="padding:16px 12px 60px"><div class="page narrow" id="rv" style="padding:0"><div class="loading"><div class="spin"></div></div></div></div></div>';
  const items = Array.from(new Set(keys.map(k => k.split("|")[0]))).map(id => id === "lex" ? LEXITEM : id === "lat" ? LATITEM : S.byId[id]);
  await Promise.all(items.map(loadTest));
  if (items.some(i => i.k === "lex")) S.lex = await loadLex();
  if (items.some(i => i.k === "lat")) S.lat = await loadLat();
  const queue = keys.map(k => ({ k, again: false }));
  let pos = 0, nOk = 0, nBad = 0;
  const draw = () => {
    const box = $("#rv");
    if (!box) return;
    if (pos >= queue.length) {
      box.innerHTML = '<div class="card empty"><div style="font:700 26px var(--f-cond);color:var(--ink)">Bitti</div><p>' + nOk + " doğru · " + nBad + ' yanlış</p><div class="row-btns" style="justify-content:center"><a class="btn primary" href="#/tekrar">Tekrar sayfası</a><a class="btn" href="#/">Ana sayfa</a></div></div>';
      updateBadge(); return;
    }
    const cur = queue[pos], [tid, qid] = cur.k.split("|"), it = srsKeyItem(cur.k), blob = tid === "lex" ? S.lex : tid === "lat" ? S.lat : S.tests[tid];
    const head = '<div class="qprog"><span>' + (pos + 1) + " / " + queue.length + '</span><div class="prog"><i style="width:' + Math.round(100 * pos / queue.length) + '%;background:var(--flame)"></i></div></div>';
    if (it.k === "kart" || it.k === "lex" || it.k === "lat") {
      const c = it.k === "lat" ? blob.card(qid) : blob.cards[+qid];
      if (!c) { pos++; return draw(); }
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
    box.innerHTML = head + '<div class="card qcard"><div class="crumb"><i class="cdot" style="background:' + ccol(it.c) + '"></i>' + esc(ct(it.c, it.t)) + " · " + esc(qq.t) + (s[cur.k] && s[cur.k].w > 1 ? " · " + s[cur.k].w + ". kez" : "") + "</div>"
      + qHTML(qq) + '<ul class="opts">' + qq.o.map((o, i) => '<li><button class="opt" data-i="' + i + '"><span class="bub">' + L[i] + "</span><span>" + o + "</span></button></li>").join("") + '</ul><div id="fbx"></div></div>';
    $$(".opt", box).forEach(b => b.onclick = () => {
      const i = +b.dataset.i, ok = i === qq.a;
      $$(".opt", box).forEach((x, j) => { x.disabled = true; if (j === qq.a) x.classList.add("ok"); else if (j === i) x.classList.add("bad"); else x.classList.add("dim"); });
      $("#fbx").innerHTML = '<div class="fb ' + (ok ? "ok" : "bad") + '"><h4>' + (ok ? "Doğru." : "Yanlış. Doğru cevap: " + L[qq.a]) + "</h4><p>" + qq.e + '</p><div class="src">Kaynak: ' + esc(qq.s) + "</div></div>"
        + slideBtn(blob, qid) + '<div class="qnav"><button class="ml-rep" id="rqb">⚑ Hata bildir</button><button class="btn primary" id="nx">Devam →</button></div>';
      $("#rqb").onclick = () => reportSheet({ tid, qid, t: it.t, c: it.c, no: blob.data.findIndex(x => x.id === qid) + 1, q: strip(qq.q) });
      gradeOnly(ok, { t: qq.t, c: it.c });
      $("#nx").onclick = () => { pos++; draw(); $("#rv").parentNode.scrollTop = 0; };
    });
  };
  const gradeOnly = (ok, meta) => {
    const cur = queue[pos], st = srsLoad(), e = st[cur.k] || { b: 0, w: 0 };
    if (meta) {
      const qh = Object.assign({}, PS.get("qh", {})), h = qh[cur.k] = Object.assign({ n: 0, k: 0 }, qh[cur.k]);
      h.n++; if (ok) h.k++; h.l = ok ? 1 : 0; h.t = meta.t; h.c = meta.c; h.at = Date.now(); h.r = 0;
      PS.set("qh", qh); PS.set("days", addDayAnswers(Object.assign({}, PS.get("days", {})), 1));
    }
    const F = finalInfo();
    if (finalBack(e)) {                          // final döneminde geri gelen öğrenilmiş soru
      e.fr = F.key;
      if (ok) { nOk++; e.u = Date.now(); st[cur.k] = e; srsSave(st); return; }
      e.m = 0;
    }
    if (ok) { nOk++; if (!cur.again) { e.b = (e.b || 0) + 1; if (e.b >= INT.length) e.m = 1; e.due = addDays(today(), INT[Math.min(e.b, INT.length - 1)]); } }
    else { nBad++; e.b = 0; e.w = (e.w || 0) + 1; e.due = addDays(today(), 1); if (!cur.again) queue.push({ k: cur.k, again: true }); }
    e.u = Date.now(); st[cur.k] = e; srsSave(st);
  };
  const grade = ok => { gradeOnly(ok); pos++; draw(); };
  if (!queue.length) { $("#rv").innerHTML = '<div class="card empty">Şu an tekrar edilecek soru yok.</div>'; return; }
  draw();
}

/* ---------- progress ---------- */
function topicTotals() {
  const T = new Map();
  S.cat.items.filter(i => i.k === "test").forEach(it => {
    if (!T.has(it.c)) T.set(it.c, new Map());
    const m = T.get(it.c);
    (it.tp || []).forEach(([t, n]) => m.set(t, (m.get(t) || 0) + n));
  });
  return T;
}
function mastery() {
  const M = new Map();
  Object.values(PS.get("qh", {})).forEach(h => {
    if (!h.c || !h.t) return;
    if (!M.has(h.c)) M.set(h.c, new Map());
    const m = M.get(h.c), o = m.get(h.t) || { seen: 0, ok: 0, n: 0, k: 0 };
    o.seen++; o.ok += h.l ? 1 : 0; o.n += h.n; o.k += h.k; m.set(h.t, o);
  });
  return M;
}
const weakTopics = () => { const W = []; mastery().forEach((m, c) => m.forEach((o, t) => { if (o.seen >= 3 && o.ok / o.seen < 0.6) W.push([c, t]); })); return W; };
function viewProgress() {
  setNav("ilerleme");
  const days = PS.get("days", {}), t = today();
  let streak = 0, d = dayN(days, t) ? t : addDays(t, -1); while (dayN(days, d)) { streak++; d = addDays(d, -1); }
  const qh = Object.values(PS.get("qh", {})), total = Object.keys(days).reduce((a, x) => a + dayN(days, x), 0);
  const seen = qh.length, okNow = qh.filter(h => h.l).length;
  const arr = []; for (let i = 13; i >= 0; i--) { const x = addDays(t, -i); arr.push([x, dayN(days, x)]); }
  const max = Math.max(10, ...arr.map(x => x[1]));
  const T = topicTotals(), M = mastery();
  const courseBlocks = Array.from(T.entries()).sort((a, b) => (M.get(b[0]) || new Map()).size - (M.get(a[0]) || new Map()).size).map(([c, tm]) => {
    const mm = M.get(c) || new Map();
    const rows = Array.from(tm.entries()).map(([tp, n]) => ({ tp, n, o: mm.get(tp) })).sort((a, b) => {
      const pa = a.o && a.o.seen >= 3 ? a.o.ok / a.o.seen : 2, pb = b.o && b.o.seen >= 3 ? b.o.ok / b.o.seen : 2; return pa - pb || b.n - a.n; });
    const seenC = rows.reduce((x, r) => x + (r.o ? r.o.seen : 0), 0), totC = rows.reduce((x, r) => x + r.n, 0);
    return '<details class="card mcard"' + (mm.size ? " open" : "") + '><summary><i class="cdot" style="background:' + ccol(c) + '"></i><b>' + esc(c) + '</b><span class="muted small">' + seenC + " / " + totC + " soru görüldü</span></summary>"
      + rows.map(r => {
        const pc = r.o && r.o.seen ? Math.round(100 * r.o.ok / r.o.seen) : null, weak = r.o && r.o.seen >= 3 && pc < 60;
        return '<div class="mrow' + (weak ? " weak" : "") + '"><span class="tn">' + esc(r.tp) + (weak ? ' <span class="wtag">zayıf</span>' : "") + '</span><span class="mb"><i style="width:' + (pc || 0) + '%"></i></span><span class="pc">' + (pc == null ? "–" : "%" + pc) + '</span><span class="cv">' + (r.o ? r.o.seen : 0) + "/" + r.n + "</span></div>";
      }).join("") + "</details>";
  }).join("");
  const H = PS.get("hist", []).slice().reverse();
  const real = PS.get("real", {});
  const ks = S.cat.kurullar.filter(k => S.cat.items.some(i => i.g === k.id && i.k === "test"));
  const W = weakTopics();
  main().innerHTML = bar({ title: "İlerleme", crumb: "Bu cihazdaki çalışman" }) + '<div class="page narrow">'
    + '<div class="stat4"><div class="card"><b>' + streak + '</b><span>günlük seri</span></div><div class="card"><b>' + dayN(days, t) + '</b><span>bugün</span></div><div class="card"><b>' + total + '</b><span>toplam cevap</span></div><div class="card"><b>' + (seen ? "%" + Math.round(100 * okNow / seen) : "–") + '</b><span>son cevaplarda başarı</span></div></div>'
    + '<h2 class="sec">Son 14 gün</h2><div class="card bars">' + arr.map(([x, n]) => '<div class="bcol" title="' + fdate(x) + ": " + n + ' soru"><span class="bn">' + (n || "") + '</span><i style="height:' + Math.round(100 * n / max) + '%"></i><span class="bd">' + (+x.slice(8)) + "</span></div>").join("") + "</div>"
    + '<h2 class="sec">Konu hakimiyeti</h2><p class="note" style="margin-top:-4px">Her konuda çözdüğün soruların son cevabına göre. En az 3 soru çözülen ve %60’ın altında kalan konular zayıf sayılır.</p>'
    + (W.length ? '<div class="row-btns" style="margin-bottom:10px"><a class="btn flame" href="#/karma?w=1">' + icon("mix") + "Zayıf " + W.length + " konudan karma deneme</a></div>" : "")
    + (courseBlocks || '<div class="card empty">Henüz test yok.</div>')
    + '<h2 class="sec">Deneme geçmişi</h2>' + (H.length ? '<div class="card">' + H.slice(0, 40).map(h => {
      return '<div class="crow"><i class="cdot" style="background:' + ccol(h.c) + '"></i><div class="txt"><b>' + esc(ct(h.c, h.t)) + '</b><div class="muted small">' + fdate(isoDay(new Date(h.at)), true) + " · " + h.ok + "D " + h.bad + "Y " + (h.n - h.ok - h.bad) + 'B</div></div><span class="n">' + h.ok + "/" + h.n + " · %" + Math.round(100 * h.ok / h.n) + "</span></div>";
    }).join("") + "</div>" : '<div class="card empty">Bitirdiğin denemeler burada listelenir.</div>')
    + (ks.length ? '<h2 class="sec">Kurul sınavı ile karşılaştır</h2><p class="note" style="margin-top:-4px">Kurul sınavından aldığın puanı (100 üzerinden) yaz; denemelerdeki başarı yüzdenle yan yana görürsün. Denemeler seni doğru ölçüyor mu, buradan anlarsın.</p><div class="card">'
      + ks.map(k => {
        const hs = H.filter(h => h.g === k.id), avg = hs.length ? Math.round(100 * hs.reduce((a, h) => a + h.ok / h.n, 0) / hs.length) : null, r = real[k.id] || {};
        const rp = r.p != null ? Math.round(r.p) : r.net != null && r.n ? Math.round(100 * r.net / r.n) : null;
        return '<div class="crow realrow"><div class="txt"><b>Kurul ' + k.no + '</b><div class="muted small">Denemelerde ' + (avg == null ? "henüz sonuç yok" : "%" + avg + " (" + hs.length + " deneme)") + (rp != null ? " · kurulda " + rp + " puan" : "") + "</div></div>"
          + '<input class="realin" type="number" min="0" max="100" step="0.5" inputmode="decimal" placeholder="Puan" data-rk="' + k.id + '" data-rf="p" value="' + (r.p ?? "") + '"></div>';
      }).join("") + "</div>" : "")
    + "</div>";
  $$("[data-rk]").forEach(inp => inp.onchange = () => {
    const R = Object.assign({}, PS.get("real", {})), o = Object.assign({}, R[inp.dataset.rk]);
    const v = parseFloat(inp.value); if (isNaN(v)) delete o[inp.dataset.rf]; else o[inp.dataset.rf] = v;
    o.at = Date.now(); R[inp.dataset.rk] = o; PS.set("real", R); viewProgress();
  });
}
async function viewMix(q) {
  setNav("karma");
  const tests = S.cat.items.filter(i => i.k === "test");
  const courses = Array.from(new Set(tests.map(i => i.c)));
  const T = topicTotals(), M = mastery(), W = weakTopics(), qh = PS.get("qh", {});
  const g = q.get("g"), fin = q.get("final") === "1";
  const st = { c: new Set(), t: new Set(), n: fin ? 80 : 20, f: "all" };
  if (q.get("w") === "1" && W.length) { W.forEach(([c, t]) => { if (!g || tests.some(i => i.c === c && i.g === g)) { st.c.add(c); st.t.add(c + "|" + t); } }); }
  if (fin) { const dn = donemOf(currentKurul().id).id; tests.filter(i => donemOf(i.g).id === dn).forEach(i => st.c.add(i.c)); }
  if (!st.c.size) { const k = g || currentKurul().id; tests.filter(i => i.g === k).forEach(i => st.c.add(i.c)); if (!st.c.size) courses.forEach(c => st.c.add(c)); }
  if (!st.t.size) Array.from(st.c).forEach(c => (T.get(c) || new Map()).forEach((n, t) => st.t.add(c + "|" + t)));
  let loaded = false;
  const pool = () => {
    const out = [];
    tests.filter(i => st.c.has(i.c)).forEach(it => (S.tests[it.id] ? S.tests[it.id].data : []).forEach(qq => {
      if (!st.t.has(it.c + "|" + qq.t)) return;
      const h = qh[it.id + "|" + qq.id];
      if (st.f === "new" && h) return;
      if (st.f === "wrong" && !(h && !h.l)) return;
      out.push([it.id, qq.id]);
    }));
    return out;
  };
  const draw = () => {
    const sc = main().scrollTop;
    const avail = loaded ? pool().length : 0, take = st.n ? Math.min(st.n, avail) : avail;
    main().innerHTML = bar({ title: fin ? "Final denemesi" : "Karma deneme", crumb: fin ? "Bütün kurulların sorularından" : "Testlerdeki sorulardan yeni bir deneme" }) + '<div class="page narrow mixp">'
      + '<div class="flabel">Dersler</div><div class="chips" style="flex-wrap:wrap">' + courses.map(c => '<button class="chip' + (st.c.has(c) ? " on" : "") + '" data-c="' + esc(c) + '"><i class="cdot" style="background:' + ccol(c) + '"></i>' + esc(c) + "</button>").join("") + "</div>"
      + '<div class="flabel" style="margin-top:14px">Konular</div>'
      + Array.from(st.c).map(c => { const tm = T.get(c) || new Map(), mm = M.get(c) || new Map();
        return '<div class="card tlist"><div class="th"><b>' + esc(c) + '</b><button class="btn ghost" data-all="' + esc(c) + '">Hepsi</button><button class="btn ghost" data-none="' + esc(c) + '">Hiçbiri</button></div>'
          + Array.from(tm.entries()).map(([t, n]) => { const o = mm.get(t), pc = o && o.seen ? Math.round(100 * o.ok / o.seen) : null, key = c + "|" + t;
            return '<label class="tl"><input type="checkbox" data-t="' + esc(key) + '"' + (st.t.has(key) ? " checked" : "") + '><span class="tn">' + esc(t) + (o && o.seen >= 3 && pc < 60 ? ' <span class="wtag">zayıf</span>' : "") + '</span><span class="muted small">' + n + " soru" + (pc != null ? " · %" + pc : "") + "</span></label>"; }).join("") + "</div>"; }).join("")
      + '<div class="flabel" style="margin-top:14px">Hangi sorular</div><div class="chips" style="flex-wrap:wrap">'
      + [["all", "Hepsi"], ["new", "Hiç çözmediklerim"], ["wrong", "Yanlış yaptıklarım"]].map(([v, l]) => '<button class="chip' + (st.f === v ? " on" : "") + '" data-f="' + v + '">' + l + "</button>").join("") + "</div>"
      + '<div class="flabel" style="margin-top:14px">Soru sayısı</div><div class="chips">' + [10, 20, 40, 80, 0].map(n => '<button class="chip' + (st.n === n ? " on" : "") + '" data-n="' + n + '">' + (n || "Hepsi") + "</button>").join("") + "</div>"
      + '<p class="note">Sorular mevcut testlerden gelir; kaynak, “Slayta git” ve tekrar listesi aynen çalışır. Çalışma, sınav ve zamana karşı modları deneme açılınca seçilir.</p>'
      + '<div class="gobar"><span class="muted small">' + (loaded ? "Seçimde " + avail + " soru" : "Sorular hazırlanıyor…") + '</span><button class="btn primary go" id="mk"' + (take ? "" : " disabled") + ">" + icon("mix") + "Başla · " + take + " soru</button></div></div>";
    main().scrollTop = sc;
    $$("[data-c]").forEach(b => b.onclick = () => { const c = b.dataset.c; if (st.c.has(c)) st.c.delete(c); else { st.c.add(c); (T.get(c) || new Map()).forEach((n, t) => st.t.add(c + "|" + t)); } draw(); });
    $$("[data-t]").forEach(i => i.onchange = () => { if (i.checked) st.t.add(i.dataset.t); else st.t.delete(i.dataset.t); draw(); });
    $$("[data-all]").forEach(b => b.onclick = () => { const c = b.dataset.all; (T.get(c) || new Map()).forEach((n, t) => st.t.add(c + "|" + t)); draw(); });
    $$("[data-none]").forEach(b => b.onclick = () => { const c = b.dataset.none; Array.from(st.t).forEach(k => { if (k.split("|")[0] === c) st.t.delete(k); }); draw(); });
    $$("[data-f]").forEach(b => b.onclick = () => { st.f = b.dataset.f; draw(); });
    $$("[data-n]").forEach(b => b.onclick = () => { st.n = +b.dataset.n; draw(); });
    $("#mk").onclick = () => {
      let P2 = pool();
      if (!P2.length) { toast("Bu seçimde soru kalmadı."); return; }
      P2 = P2.map(x => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
      if (st.n) P2 = P2.slice(0, st.n);
      const old = PS.get("mix", null);
      if (old) { const e = Object.assign({}, PS.get("eng", {})); delete e[engKey(old.k)]; PS.set("eng", e); LS.del(engKey(old.k)); }
      const cs = Array.from(st.c);
      PS.set("mix", { at: Date.now(), k: "mix:" + Date.now(), t: (fin ? "Final denemesi · " : "Karma deneme · ") + P2.length + " soru", c: cs.length > 2 ? cs.length + " ders" : cs.join(" + "), ids: P2,
        d: (st.f === "new" ? "Hiç çözmediğin" : st.f === "wrong" ? "Yanlış yaptığın" : "Seçtiğin konulardan") + " sorular, karışık sırayla." });
      location.hash = "#/t/mix";
    };
  };
  draw();
  await Promise.all(tests.map(it => loadTest(it).catch(() => null)));
  if (parseHash().parts[0] !== "karma") return;
  loaded = true; draw();
}

/* ---------- anatomi Latincesi ---------- */
const LATITEM = { id: "lat", k: "lat", c: "Anatomi Latincesi", t: "Kelime ve terimler", g: "" };
const GR = { ns: "tekil", gs: "tekil, -in hâli", np: "çoğul", gp: "çoğul, -in hâli" };
const GN = { m: "eril", f: "dişil", n: "nötr" };
let latP = null;
function loadLat() {
  if (!latP) latP = fetchJSON("d/" + S.cat.lat.x, S.cat.lat.v).then(D => {
    D.byL = {}; D.w.forEach((e, i) => { if (!(e.l in D.byL)) D.byL[e.l] = i; });
    D.exBy = {}; D.ex.forEach((e, i) => { D.exBy[e[0]] = i; });
    D.catName = Object.fromEntries(D.cats);
    D.card = qid => latCard(D, qid);
    return D;
  });
  return latP;
}
const lastVowel = s => { const m = s.match(/[aıoueiöü](?=[^aıoueiöü]*$)/); return m ? m[0] : "e"; };
const trPlPos = s => s + ("aıou".includes(lastVowel(s)) ? "ı" : "i");
function latDecode(D, input) {
  const raw = input.toLowerCase().replace(/[(),;:]/g, " ").split(/\s+/).filter(Boolean);
  const toks = raw.map(r => {
    const w0 = r.replace(/\.+$/, ""), ab = r.endsWith(".") && D.ab[w0];
    const w = ab || w0;
    return { raw: r, w, abbr: !!ab, c: D.f[w] || [] };
  });
  const W = c => D.w[c[0]], isGen = g => g === "gs" || g === "gp";
  let head = null;
  toks.forEach((t, i) => {
    const C = t.c;
    if (!C.length) { t.pick = null; return; }
    let p = null;
    if (i === 0 || !head) p = C.find(c => W(c).k === "n" && (c[1] === "ns" || c[1] === "np")) || C[0];
    else {
      const hg = D.w[head[0]].g + head[1];
      p = C.find(c => W(c).k === "s" && c[1] === hg);
      for (let j = i - 1; j > 0 && !p; j--) {
        const q = toks[j].pick;
        if (q && W(q).k === "n" && isGen(q[1])) p = C.find(c => W(c).k === "s" && c[1] === W(q).g + q[1]);
      }
      if (!p) p = C.find(c => W(c).k === "n" && isGen(c[1]) && t.w !== W(c).l) || C.find(c => W(c).k === "n" && isGen(c[1]));
      if (!p) p = C.find(c => W(c).c === "islev") || C.find(c => W(c).k === "s") || C[0];
    }
    t.pick = p;
    if (!head && p && W(p).k === "n") head = p;
  });
  return { toks, head };
}
function latReading(D, dec) {
  const T = dec.toks;
  if (!T.length || !T[0].pick || D.w[T[0].pick[0]].k !== "n" || T.some(t => !t.pick)) return "";
  const h = T[0].pick, hw = D.w[h[0]], plural = h[1] === "np", gens = [], mods = [];
  let last = null;
  T.slice(1).forEach(t => {
    const w = D.w[t.pick[0]], g = t.pick[1];
    if (w.k === "n" && (g === "gs" || g === "gp")) { last = { tr: g === "gs" ? w.tg : w.tgp, adj: [] }; gens.push(last); }
    else if (w.k === "s" && last && (g.slice(1) === "gs" || g.slice(1) === "gp")) last.adj.push(w.s);
    else mods.push(w.s);
  });
  const genPart = gens.slice().reverse().map(g => g.adj.slice().reverse().concat(g.tr).join(" ")).join(" ");
  const headTr = gens.length ? (plural ? trPlPos(hw.tpl) : hw.tp) : (plural ? hw.tpl : hw.s);
  return [genPart, mods.slice().reverse().join(" "), headTr].filter(Boolean).join(" ");
}
function latGloss(D, t) {
  if (!t.pick) {
    const af = D.af.find(a => a[2].some(p => t.w.startsWith(p) && t.w.length > p.length + 3));
    return { lat: t.raw, lem: "", gram: "", tr: af ? '<span class="muted">Sözlükte yok. Ön ek: <b>' + esc(af[0]) + "</b> " + esc(af[1]) + "</span>" : '<span class="muted">Sözlükte yok</span>', miss: 1 };
  }
  const w = D.w[t.pick[0]], g = t.pick[1];
  let tr;
  if (w.k === "n") tr = g === "gs" ? "“" + w.tg + "”" : g === "gp" ? "“" + w.tgp + "”" : g === "np" ? w.tpl : w.s;
  else tr = w.s;
  const gram = w.k === "n" ? GR[g] : GN[g[0]] + " · " + GR[g.slice(1)];
  const full = w.tr;
  if (w.k === "s" || (w.k === "n" && g === "ns")) {          // kısa ad tam anlamın başıysa tek satır yeter
    if (full.startsWith(tr)) return { lat: t.abbr ? t.raw + " (" + t.w + ")" : t.w, lem: w.l, gram, tr: esc(full), note: w.n };
  }
  return { lat: t.abbr ? t.raw + " (" + t.w + ")" : t.w, lem: w.l, gram, tr: esc(tr), full, note: w.n };
}
function latDecodeHTML(D, input, opts) {
  opts = opts || {};
  const dec = latDecode(D, input);
  if (!dec.toks.length) return "";
  const norm = dec.toks.map(t => t.w).join(" "), ei = D.exBy[norm];
  const read = ei != null ? D.ex[ei][1] : latReading(D, dec);
  const rows = dec.toks.map(t => latGloss(D, t));
  return '<div class="card lxdec">' + (opts.title === false ? "" : '<div class="lxterm">' + esc(norm) + "</div>")
    + (read ? '<div class="lxread">' + (ei != null ? "" : '<span class="tag">kabaca</span>') + esc(read) + "</div>" : "")
    + '<div class="lxw">' + rows.map(r => '<div class="lxwr' + (r.miss ? " miss" : "") + '"><div class="a"><b>' + esc(r.lat) + "</b>"
      + (r.lem && r.lem !== r.lat ? '<span class="muted"> ← ' + esc(r.lem) + "</span>" : "") + (r.gram ? '<span class="gr">' + esc(r.gram) + "</span>" : "") + "</div>"
      + '<div class="b">' + r.tr + (r.full && r.full !== r.tr ? '<span class="muted small"> · ' + esc(r.full) + "</span>" : "") + (r.note ? '<div class="muted small">' + esc(r.note) + "</div>" : "") + "</div></div>").join("") + "</div></div>";
}
function latCard(D, qid) {
  const [t, key] = [qid.slice(0, 1), qid.slice(2)];
  if (t === "w") {
    const i = D.byL[key]; if (i == null) return null;
    const w = D.w[i];
    return [D.catName[w.c] || "Kelime", "<b>" + esc(w.l) + '</b><div class="muted small" style="margin-top:8px">' + esc(w.d) + "</div>", esc(w.tr) + (w.n ? '<div class="muted small" style="margin-top:6px">' + esc(w.n) + "</div>" : "")];
  }
  const i = D.exBy[key]; if (i == null) return null;
  const e = D.ex[i];
  return [e[2], "<b>" + esc(e[0]) + "</b>", esc(e[1]) + '<div class="small" style="margin-top:10px;text-align:left">' + latDecodeHTML(D, e[0], { title: false }) + "</div>"];
}
function srsMarkWrong(key) {
  const S2 = srsLoad(), e = S2[key];
  S2[key] = { b: 0, due: addDays(today(), 1), w: (e ? e.w : 0) + 1, t: Date.now(), u: Date.now() };
  srsSave(S2); updateBadge();
}
const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rnd = a => a[Math.floor(Math.random() * a.length)];
function latQuestion(D, mode) {
  const mk = (stem, right, wrong, exp, key, sub) => {
    const o = shuf([right].concat(wrong.slice(0, 4)));
    return { stem, sub, o, a: o.indexOf(right), exp, key };
  };
  if (mode === "lt" || mode === "tl") {
    const i = Math.floor(Math.random() * D.ex.length), me = new Set(D.ex[i][0].split(" "));
    const near = D.ex.map((e, j) => [j, e[0].split(" ").filter(x => me.has(x)).length + (e[2] === D.ex[i][2] ? 0.6 : 0) + Math.random() * 0.5])
      .filter(([j]) => j !== i && D.ex[j][1] !== D.ex[i][1] && D.ex[j][0] !== D.ex[i][0]).sort((a, b) => b[1] - a[1]).map(x => x[0]);
    const plain = t => t.replace(/\s*\([^)]*\)/g, "");
    const seen = new Set([plain(D.ex[i][1])]), pick = [];
    near.forEach(j => { const v = mode === "lt" ? plain(D.ex[j][1]) : D.ex[j][0]; if (!seen.has(v) && pick.length < 4) { seen.add(v); pick.push(v); } });
    const e = D.ex[i];
    return mode === "lt" ? mk("<i>" + esc(e[0]) + "</i>", plain(e[1]), pick, latDecodeHTML(D, e[0], { title: false }), "t:" + e[0], "Bu terim ne demek?")
      : mk(esc(e[1]), e[0], pick, latDecodeHTML(D, e[0]), "t:" + e[0], "Latincesi hangisi?");
  }
  if (mode === "kel") {
    // aynı anlama gelen ya da çok yakın kelimeler aynı soruda şık olmasın
    const SYN = [["fibularis", "peroneus"], ["pectoralis", "thoracicus", "pectus", "thorax"], ["frontalis", "coronalis"], ["ventralis", "anterior"], ["dorsalis", "posterior", "dorsum"],
      ["cranialis", "superior"], ["caudalis", "inferior"], ["internus", "medialis"], ["externus", "lateralis"], ["magnus", "major", "maximus"], ["minor", "minimus"],
      ["vastus", "latus", "latissimus"], ["teres", "rotundus"], ["medius", "medianus", "intermedius"], ["cavus", "cavitas", "cavum"], ["os", "ossa"], ["cervix", "collum", "cervicalis"],
      ["venter", "abdomen", "abdominalis"], ["calx", "calcaneus", "malleolus"], ["tempus", "temporalis"], ["spina", "spinosus", "columna", "vertebra"], ["coxa", "gluteus"]];
    const syn = l => new Set([].concat(...SYN.filter(g => g.includes(l))));
    // "zigomatik", "deltoid" gibi Latinceden gelen ad soruyu ele verir: parantezin içi ya da dışından Latinceye benzemeyeni seç
    const mean = w => {
      const t = w.tr.replace(/:.*$/, "").trim(), m = t.match(/^(.*?)\s*\((.*)\)\s*$/), parts = m ? [m[1], m[2]] : [t];
      const like = x => fold(x).replace(/[^a-z]/g, "").slice(0, 4) === fold(w.l).replace(/[^a-z]/g, "").slice(0, 4);
      return (parts.find(x => !like(x)) || parts[0]).replace(/[;,].*$/, "").trim();
    };
    for (let k = 0; k < 20; k++) {
      const w = rnd(D.w), bad = syn(w.l), same = shuf(D.w.filter(x => x !== w && x.c === w.c)), other = shuf(D.w.filter(x => x !== w && x.c !== w.c && x.k === w.k));
      const right = mean(w), used = new Set([right, w.s]), wr = [];
      same.concat(other).forEach(x => { const v = mean(x); if (wr.length < 4 && !used.has(v) && !used.has(x.s) && !bad.has(x.l) && x.tr.split(/[ (;,]/)[0] !== w.tr.split(/[ (;,]/)[0]) { used.add(v); used.add(x.s); wr.push(v); } });
      if (wr.length === 4) return mk("<i>" + esc(w.l) + "</i>", right, wr, "<b>" + esc(w.l) + "</b> (" + esc(w.d) + "): " + esc(w.tr) + (w.n ? " · " + esc(w.n) : ""), "w:" + w.l, "Anlamı hangisi?");
    }
  }
  // dilbilgisi: çoğul / -in hâli
  const nouns = D.w.filter(w => w.k === "n" && w.c !== "hareket");
  for (let k = 0; k < 30; k++) {
    const w = rnd(nouns), ask = rnd(["gs", "np", "gp"]), right = w.f[ask];
    if (ask !== "np" && right === w.l) continue;
    const ns = w.l, gs = w.f.gs;
    const nstem = ns.replace(/(us|um|on|a|is|en|ex|ix|er|or|as|es|u|os|ys)$/, ""), gstem = gs.replace(/(ae|is|i|us|ei)$/, "");
    const END = { gs: ["ae", "i", "is", "us", "ei", "orum"], np: ["ae", "i", "a", "es", "us", "ina", "ia"], gp: ["arum", "orum", "um", "ium", "uum", "is"] }[ask];
    const cand = new Set();
    [nstem, gstem].forEach(st => END.forEach(e => cand.add(st + e)));
    cand.delete(right);
    const wr = shuf(Array.from(cand).filter(x => x.length >= 4 && x[0] === ns[0]));
    if (wr.length < 4) continue;
    const q = { gs: "-in hâli (tekil)", np: "çoğulu", gp: "çoğul -in hâli" }[ask];
    return mk("<i>" + esc(ns) + "</i> (" + esc(w.s) + ")", right, wr,
      "<b>" + esc(ns) + "</b>: tekil -in hâli <b>" + esc(w.f.gs) + "</b> (" + esc(w.tg) + "), çoğul <b>" + esc(w.f.np) + "</b>, çoğul -in hâli <b>" + esc(w.f.gp) + "</b> (" + esc(w.tgp) + ").", "w:" + w.l, "Bu ismin " + q + " hangisi?");
  }
}
const LATMODES = [["lt", "Terimi çöz", "Latince terim → Türkçesi"], ["tl", "Terimi bul", "Türkçe → Latince terim"], ["kel", "Kelimeler", "Latince kelime → anlamı"], ["dil", "Çoğul ve -in hâli", "fossa → fossae, foramen → foramina"]];

/* ---------- terimler sayfası ---------- */
async function viewLexicon(q) {
  if (!S.cat.lex && !S.cat.lat) return notFound();
  setNav("sozluk");
  const OLD = ["dt", "kok", "kk"];
  let tab = q.get("t") || (S.cat.lat ? "coz" : "dt");
  if (tab === "terim") tab = "dt";
  if (!S.cat.lat && !OLD.includes(tab)) tab = "dt";
  main().innerHTML = bar({ title: "Anatomi Latincesi", crumb: "Terim çözücü, kelimeler, kökler" }) + '<div class="page narrow" id="lx"><div class="loading"><div class="spin"></div></div></div>';
  const TABS = [["coz", "Çözücü"], ["kel", "Kelimeler"], ["dil", "Dilbilgisi"], ["alis", "Alıştır"], ["kart", "Kartlar"], ["sl", "Slaytlarda"], ["dt", "Kökler"]].filter(([k]) => S.cat.lat || k === "dt");
  const cur = OLD.includes(tab) ? "dt" : tab;
  const top = TABS.length > 1 ? '<div class="seg scroll">' + TABS.map(([k, l]) => '<a class="' + (cur === k ? "on" : "") + '" href="#/sozluk?t=' + k + '">' + l + "</a>").join("") + "</div>" : "";
  if (OLD.includes(tab)) return viewRoots(q, tab, top);
  const D = await loadLat();
  if (parseHash().parts[0] !== "sozluk") return;
  const box = $("#lx"), NOTE = '<p class="note">Bu bölüm ders kaynaklarından değil; standart anatomi Latincesinden (Terminologia Anatomica) Claude hazırladı. Anatomi slaytları geldikçe slaytlardaki terimler de eklenir.</p>';
  if (tab === "coz") {
    const v0 = q.get("q") || "";
    const groups = [];
    D.ex.forEach(e => { let g = groups.find(x => x[0] === e[2]); if (!g) groups.push(g = [e[2], []]); g[1].push(e); });
    box.innerHTML = top + '<div class="sbox">' + icon("search") + '<input id="lq" type="search" placeholder="Örn. m. flexor digitorum profundus" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + esc(v0) + '"></div><div id="lxo"></div>'
      + '<h2 class="sec">Örnek terimler · ' + D.ex.length + "</h2>"
      + groups.map(([g, es]) => '<details class="card lxgrp"><summary>' + esc(g) + ' <span class="muted">' + es.length + "</span></summary>" + es.map(e => '<a class="lxr lxa" href="#/sozluk?t=coz&q=' + encodeURIComponent(e[0]) + '"><b>' + esc(e[0]) + '</b><span class="muted">' + esc(e[1]) + "</span></a>").join("") + "</details>").join("") + NOTE;
    const inp = $("#lq"), out = $("#lxo");
    const run = () => {
      const v = inp.value.trim();
      replaceHash("#/sozluk?t=coz" + (v ? "&q=" + encodeURIComponent(v) : ""));
      out.innerHTML = v ? latDecodeHTML(D, v) : '<p class="note">Bir terim yaz ya da aşağıdan bir örneğe dokun. Kısaltmalar da olur: m., n., a., v., lig.</p>';
    };
    inp.oninput = run; run();
    if (v0) $("#lxo").scrollIntoView({ block: "nearest" });
    return;
  }
  if (tab === "kel") {
    const st = { q: q.get("q") || "", c: q.get("c") || "" };
    const draw = () => {
      const f = fold(st.q.trim());
      const list = D.w.filter(w => (!st.c || w.c === st.c) && (!f || fold(w.l).includes(f) || fold(w.tr).includes(f) || Object.values(w.k === "n" ? w.f : w.f.m).some(x => fold(x).includes(f))));
      box.innerHTML = top + '<div class="sbox">' + icon("search") + '<input id="lq" type="search" placeholder="Latince ya da Türkçe: fossa, delik, kısa" autocomplete="off" autocapitalize="off" value="' + esc(st.q) + '"></div>'
        + '<div class="chips" style="margin-bottom:12px"><button class="chip' + (st.c ? "" : " on") + '" data-c="">Hepsi</button>' + D.cats.map(([k, l]) => '<button class="chip' + (st.c === k ? " on" : "") + '" data-c="' + k + '">' + esc(l) + "</button>").join("") + "</div>"
        + (list.length ? '<div class="card">' + list.map(w => '<div class="lxr"><div class="lxt"><b>' + esc(w.l) + '</b><span class="muted small">' + esc(w.d) + '</span></div><div class="lxg">' + esc(w.tr) + "</div>" + (w.n ? '<div class="muted small">' + esc(w.n) + "</div>" : "") + "</div>").join("") + "</div>" : '<div class="card empty">Bu aramaya uyan kelime yok.</div>') + NOTE;
      const lq = $("#lq");
      lq.oninput = () => { st.q = lq.value; const pos = lq.selectionStart; draw(); const l2 = $("#lq"); l2.focus(); l2.setSelectionRange(pos, pos); };
      $$(".chip", box).forEach(b => b.onclick = () => { st.c = b.dataset.c; draw(); });
    };
    draw(); return;
  }
  if (tab === "dil") {
    box.innerHTML = top + D.ls.map(([t, h], i) => '<details class="card lxles"' + (i === 0 ? " open" : "") + "><summary>" + esc(t) + '</summary><div class="lxbody">' + h + "</div></details>").join("") + NOTE;
    return;
  }
  if (tab === "sl") {
    const refLink = r => { const it = S.byId[r[0]]; return it ? '<a href="#/d/' + r[0] + "/" + r[1] + "?h=" + r[1] + '">' + esc(it.t) + " · " + (it.k === "slayt" ? "slayt " : "s. ") + r[1] + "</a>" : ""; };
    box.innerHTML = top + (D.sl.length ? '<p class="note">Slaytlarında ve notlarında geçen ' + D.sl.length + ' Latince terim. Terime dokununca çözülür.</p><div class="card">'
      + D.sl.map(s => '<div class="lxr"><div class="lxt"><a href="#/sozluk?t=coz&q=' + encodeURIComponent(s[0]) + '"><b>' + esc(s[0]) + "</b></a>" + (s[1] > 1 ? '<span class="muted small">' + s[1] + " kez</span>" : "") + '</div><div class="lxref">' + s[2].slice(0, 4).map(refLink).join("") + "</div></div>").join("") + "</div>"
      : '<div class="card empty"><b>Henüz yok</b><p>Anatomi ve Histoloji slaytları eklendikçe, slaytlarda geçen Latince terimler burada listelenir; her biri çözülür ve geçtiği slayta bağlanır. Slaytı açtığında da sayfadaki terimleri gösteren bir düğme çıkar.</p></div>');
    return;
  }
  if (tab === "kart") {
    const decks = [["kel", "Bütün kelimeler"]].concat(D.cats.map(([k, l]) => [k, l])).concat([["ter", "Örnek terimler"]]);
    const st = { d: q.get("d") || "kel", i: 0, back: false };
    const deck = () => st.d === "ter" ? D.ex.map(e => "t:" + e[0]) : D.w.filter(w => st.d === "kel" || w.c === st.d).map(w => "w:" + w.l);
    let order = shuf(deck());
    const draw = () => {
      const k = order[st.i % order.length], c = latCard(D, k);
      box.innerHTML = top + '<div class="chips" style="margin-bottom:12px">' + decks.map(([k2, l]) => '<button class="chip' + (st.d === k2 ? " on" : "") + '" data-d="' + k2 + '">' + esc(l) + "</button>").join("") + "</div>"
        + '<div class="qprog"><span>' + (st.i % order.length + 1) + " / " + order.length + '</span><div class="prog"><i style="width:' + Math.round(100 * ((st.i % order.length) + 1) / order.length) + '%;background:var(--accent)"></i></div></div>'
        + '<div class="card flash' + (st.back ? " back" : "") + '" id="fl"><div><div class="side-l">' + esc(c[0]) + '</div><div class="fx" style="margin-top:10px">' + (st.back ? c[2] : c[1]) + "</div>" + (st.back ? "" : '<div class="muted small" style="margin-top:14px">Anlamını görmek için dokun</div>') + "</div></div>"
        + '<div class="qnav">' + (st.back ? '<button class="btn" id="no">Bilemedim</button><button class="btn primary" id="yes">Bildim</button>' : '<button class="btn primary" id="flip">Çevir</button>') + "</div>"
        + '<p class="note">“Bilemedim” dediklerin Tekrar listesine düşer.</p>';
      const nx = () => { st.i++; st.back = false; draw(); };
      $("#fl").onclick = () => { st.back = !st.back; draw(); };
      const fl = $("#flip"); if (fl) fl.onclick = () => { st.back = true; draw(); };
      const y = $("#yes"); if (y) y.onclick = nx;
      const n = $("#no"); if (n) n.onclick = () => { srsMarkWrong("lat|" + k); toast("Tekrar listesine eklendi"); nx(); };
      $$(".chip", box).forEach(b => b.onclick = () => { st.d = b.dataset.d; st.i = 0; st.back = false; order = shuf(deck()); draw(); });
    };
    draw(); return;
  }
  // alıştır
  const mode = q.get("m");
  if (!mode) {
    box.innerHTML = top + '<p class="note">10 soruluk kısa turlar, her soru 5 şıklı. Yanlış yaptığın kelime ve terimler Tekrar listesine düşer.</p>'
      + LATMODES.map(([k, l, d]) => '<a class="card tile" href="#/sozluk?t=alis&m=' + k + '" style="margin-bottom:10px"><span class="txt"><b>' + l + '</b><span class="muted small">' + d + "</span></span>" + icon("chev", "chev") + "</a>").join("") + NOTE;
    return;
  }
  const R = { n: 10, i: 0, ok: 0, qs: [] };
  for (let k = 0; k < R.n; k++) { const qq = latQuestion(D, mode); if (qq) R.qs.push(qq); }
  const L5 = ["A", "B", "C", "D", "E"], title = (LATMODES.find(m => m[0] === mode) || [])[1] || "";
  const draw = () => {
    if (R.i >= R.qs.length) {
      box.innerHTML = top + '<div class="card empty"><div style="font:700 26px var(--f-cond);color:var(--ink)">' + R.ok + " / " + R.qs.length + "</div><p>" + esc(title) + '</p><div class="row-btns" style="justify-content:center"><a class="btn primary" href="#/sozluk?t=alis&m=' + mode + "&r=" + Date.now() + '">Yeni tur</a><a class="btn" href="#/sozluk?t=alis">Başka alıştırma</a></div></div>';
      return;
    }
    const qq = R.qs[R.i];
    box.innerHTML = top + '<div class="qprog"><span>' + (R.i + 1) + " / " + R.qs.length + '</span><div class="prog"><i style="width:' + Math.round(100 * R.i / R.qs.length) + '%;background:var(--accent)"></i></div></div>'
      + '<div class="card qcard"><div class="crumb">' + esc(title) + " · " + esc(qq.sub) + '</div><p class="stem lxstem">' + qq.stem + '</p><ul class="opts">'
      + qq.o.map((o, i) => '<li><button class="opt" data-i="' + i + '"><span class="bub">' + L5[i] + "</span><span>" + esc(o) + "</span></button></li>").join("") + '</ul><div id="fbx"></div></div>';
    $$(".opt", box).forEach(b => b.onclick = () => {
      const i = +b.dataset.i, ok = i === qq.a;
      $$(".opt", box).forEach((x, j) => { x.disabled = true; x.classList.add(j === qq.a ? "ok" : j === i ? "bad" : "dim"); });
      if (ok) R.ok++; else srsMarkWrong("lat|" + qq.key);
      PS.set("days", addDayAnswers(Object.assign({}, PS.get("days", {})), 1));
      $("#fbx").innerHTML = '<div class="fb ' + (ok ? "ok" : "bad") + '"><h4>' + (ok ? "Doğru." : "Yanlış. Doğru cevap: " + L5[qq.a]) + '</h4><div class="lxfb">' + qq.exp + '</div></div><div class="qnav"><button class="btn primary" id="nx">Devam →</button></div>';
      $("#nx").onclick = () => { R.i++; draw(); window.scrollTo(0, 0); const m = main(); if (m) m.scrollTop = 0; };
    });
  };
  draw();
}
function latSheet(title, html) {
  const bg = document.createElement("div");
  bg.className = "sheet-bg";
  bg.innerHTML = '<div class="sheet" role="dialog" aria-label="' + esc(title) + '"><div class="sheet-h"><b>' + esc(title) + '</b><button class="ibtn" data-x title="Kapat">' + icon("close") + '</button></div><div class="sheet-b">' + html + '<p class="note">Terime dokunup ayrıntısını Anatomi Latincesi › Çözücü\'de görebilirsin.</p></div></div>';
  let tok = null;
  const close = fromPop => { if (!bg.isConnected) return; bg.remove(); if (!fromPop) ovDone(tok); };
  bg.onclick = e => { if (e.target === bg || e.target.closest("[data-x]")) close(false); };
  document.body.appendChild(bg);
  tok = ovOpen(() => close(true));
  S.cleanup.push(() => bg.remove());
}
// Yalnız yerel denetimde (tools/check_site.sh, 127.0.0.1) testlerin erişebilmesi için
if (location.hostname === "127.0.0.1") window.__ml = { loadLat: () => loadLat(), latQuestion: (D, m) => latQuestion(D, m), latDecodeHTML: (D, t) => latDecodeHTML(D, t), latSheet: (t, h) => latSheet(t, h), srs: () => srsLoad(), prune: () => pruneCache(), mergeP: (a, b) => mergeP(a, b), nav: () => S.nav };
async function latPageTerms(itId, page) {
  const D = await loadLat(), pg = (D.pg[itId] || {})[String(page)] || [];
  return { D, terms: pg.map(i => D.sl[i][0]) };
}

async function viewRoots(q, tab, top) {
  if (!S.cat.lex) { $("#lx").innerHTML = top + '<div class="card empty">Kök sözlüğü henüz yok.</div>'; return; }
  const L = await loadLex();
  if (parseHash().parts[0] !== "sozluk") return;
  const st = { q: q.get("q") || "", n: 60 };
  const seg = t => t[1].filter(p => p[1] != null).map(p => '<span class="mp mp-' + L.roots[p[1]][0] + '" title="' + esc(L.roots[p[1]][2]) + '">' + esc(p[0]) + "</span>").join("");
  const gloss = t => t[1].filter(p => p[1] != null).map(p => esc(L.roots[p[1]][2].split(/[;(]/)[0].trim())).join(" + ");
  const refLink = r => { const it = S.byId[r[0]]; return it ? '<a href="#/d/' + r[0] + "/" + r[1] + "?h=" + r[1] + '">' + esc(it.t) + " · " + (it.k === "slayt" ? "slayt " : "s. ") + r[1] + "</a>" : ""; };
  const draw = () => {
    const f = fold(st.q.trim());
    const tabs = top + '<div class="seg sub">' + [["dt", "Ders terimleri"], ["kok", "Kökler"], ["kk", "Kök kartları"]].map(([k, l]) => '<a class="' + (tab === k ? "on" : "") + '" href="#/sozluk?t=' + k + '">' + l + "</a>").join("") + "</div>";
    let body = "";
    if (tab === "dt") {
      const list = L.terms.filter(t => !f || fold(t[0]).includes(f) || t[1].some(p => p[1] != null && fold(L.roots[p[1]][2]).includes(f)));
      body = '<p class="note">Biyokimya, Tıbbi Biyoloji gibi derslerin slaytlarında geçen ' + L.terms.length + ' terim, köklerine ayrılmış hâlde: <span class="mp mp-on">ön ek</span> <span class="mp mp-kok">kök</span> <span class="mp mp-son">son ek</span>. Ayrıştırma otomatik; nadiren yanlış olabilir.</p>'
        + (list.length ? '<div class="card">' + list.slice(0, st.n).map(t => '<div class="lxr"><div class="lxt"><b>' + esc(t[0]) + '</b><span class="lxs">' + seg(t) + '</span></div><div class="lxg">' + gloss(t) + '</div><div class="lxref">' + t[3].slice(0, 3).map(refLink).join("") + (t[2] > 1 ? '<span class="muted">' + t[2] + " kez geçiyor</span>" : "") + "</div></div>").join("") + "</div>"
          + (list.length > st.n ? '<div class="row-btns" style="justify-content:center;margin-top:12px"><button class="btn" id="more">Daha fazla (' + (list.length - st.n) + ")</button></div>" : "")
          : '<div class="card empty">Bu aramaya uyan terim yok.</div>');
    } else if (tab === "kok") {
      const groups = ["on", "kok", "son"].map(tp => {
        const rows = L.roots.map((r, i) => [r, i]).filter(([r, i]) => r[0] === tp && (!f || fold(r[1]).includes(f) || fold(r[2]).includes(f) || L.ex[i].some(ti => fold(L.terms[ti][0]).includes(f))))
          .sort((a, b) => L.ex[b[1]].length - L.ex[a[1]].length || a[0][1].localeCompare(b[0][1], "tr"));
        return rows.length ? '<h2 class="sec">' + { on: "Ön ekler", kok: "Kökler", son: "Son ekler" }[tp] + " · " + rows.length + '</h2><div class="card">' + rows.map(([r, i]) => '<div class="lxr"><div class="lxt"><b class="mp mp-' + r[0] + '">' + esc(r[1]) + "</b><span>" + esc(r[2]) + '</span></div><div class="lxg muted">' + esc(r[3]) + "</div>"
          + (L.ex[i].length ? '<div class="lxref">' + L.ex[i].slice(0, 4).map(ti => '<a href="#/sozluk?t=dt&q=' + encodeURIComponent(L.terms[ti][0]) + '">' + esc(L.terms[ti][0]) + "</a>").join("") + "</div>" : "") + "</div>").join("") + "</div>" : "";
      }).join("");
      body = groups || '<div class="card empty">Bu aramaya uyan kök yok.</div>';
    } else {
      const used = L.roots.map((r, i) => i).filter(i => L.ex[i].length).sort((a, b) => L.ex[b].length - L.ex[a].length);
      const s2 = st.k || (st.k = { order: used, i: 0, back: false });
      const ri = s2.order[s2.i % s2.order.length], c = L.cards[ri];
      body = '<div class="qprog"><span>' + (s2.i % s2.order.length + 1) + " / " + s2.order.length + '</span><div class="prog"><i style="width:' + Math.round(100 * ((s2.i % s2.order.length) + 1) / s2.order.length) + '%;background:var(--accent)"></i></div><button class="ibtn" id="shf" title="Karıştır">' + icon("shuffle") + "</button></div>"
        + '<div class="card flash' + (s2.back ? " back" : "") + '" id="fl"><div><div class="side-l">' + esc(c[0]) + (s2.back ? " · anlamı" : "") + '</div><div class="fx" style="margin-top:10px">' + (s2.back ? c[2] : c[1]) + "</div>" + (s2.back ? "" : '<div class="muted small" style="margin-top:14px">Anlamını görmek için dokun</div>') + "</div></div>"
        + '<div class="qnav">' + (s2.back ? '<button class="btn" id="no">Bilemedim</button><button class="btn primary" id="yes">Bildim</button>' : '<button class="btn primary" id="flip">Çevir</button>') + "</div>"
        + '<p class="note">Slaytlarında en sık geçen kökler önce gelir. “Bilemedim” dediklerin Tekrar listesine düşer.</p>';
    }
    $("#lx").innerHTML = (tab !== "kk" ? '<div class="sbox">' + icon("search") + '<input id="lq" type="search" placeholder="Terim, kök ya da anlam: hepat, kan, emi" autocomplete="off" value="' + esc(st.q) + '"></div>' : "") + tabs + body;
    const lq = $("#lq");
    if (lq) lq.oninput = () => { st.q = lq.value; st.n = 60; const pos = lq.selectionStart; draw(); const l2 = $("#lq"); l2.focus(); l2.setSelectionRange(pos, pos); };
    const mb = $("#more"); if (mb) mb.onclick = () => { st.n += 120; draw(); };
    if (tab === "kk") {
      const s2 = st.k, nx = () => { s2.i++; s2.back = false; draw(); };
      $("#fl").onclick = () => { s2.back = !s2.back; draw(); };
      const fl = $("#flip"); if (fl) fl.onclick = () => { s2.back = true; draw(); };
      const y = $("#yes"); if (y) y.onclick = nx;
      const n = $("#no"); if (n) n.onclick = () => {
        const S2 = srsLoad(), key = "lex|" + s2.order[s2.i % s2.order.length], e = S2[key];
        S2[key] = { b: 0, due: addDays(today(), 1), w: (e ? e.w : 0) + 1, t: Date.now(), u: Date.now() }; srsSave(S2); updateBadge();
        toast("Tekrar listesine eklendi"); nx();
      };
      $("#shf").onclick = () => { s2.order = s2.order.slice().sort(() => Math.random() - .5); s2.i = 0; s2.back = false; draw(); };
    }
  };
  draw();
}

/* ---------- search ---------- */
async function loadIndex() {
  if (S.index) return S.index;
  const raw = await fetchJSON("d/s", S.cat.v);
  const ws = t => String(t).replace(/\s+/g, " ");
  const pages = [];
  Object.entries(raw.d).forEach(([id, arr]) => { if (S.byId[id]) arr.forEach((t, i) => { if (t) { const tt = ws(t); pages.push({ id, p: i + 1, t: tt, f: fold(tt) }); } }); });
  const qs = raw.q.filter(x => S.byId[x[0]]).map(([id, qid, t]) => { const tt = ws(t); return { id, qid, t: tt, f: fold(tt) }; });
  return (S.index = { pages, qs });
}
// "sodyum pompası" → yalnız yan yana geçenler (ekler serbest); tırnaksız kelimeler sayfanın herhangi bir yerinde olabilir
const reEsc = x => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function parseQuery(qv) {
  const phrases = [], rest = [];
  const re = /"([^"]*)("|$)/g;
  let last = 0, m;
  while ((m = re.exec(qv))) { rest.push(qv.slice(last, m.index)); const w = fold(m[1]).split(/[\s\-–]+/).filter(Boolean); if (w.length) phrases.push(w); last = re.lastIndex; if (!m[2]) break; }
  rest.push(qv.slice(last));
  const terms = fold(rest.join(" ")).split(/[\s"]+/).filter(x => x.length >= 2);
  const P = phrases.filter(w => w.join("").length >= 2).map(w => new RegExp("(^|[^a-z0-9])(" + w.map(reEsc).join("[ \\-–]+") + ")", "g"));
  // tırnaksız iki-üç kelime yan yana geçiyorsa o sayfa öne çıksın
  const adj = !P.length && terms.length > 1 ? new RegExp("(^|[^a-z0-9])(" + terms.map(reEsc).join("[a-z0-9]*[ \\-–]+") + ")", "g") : null;
  return { P, terms, adj, ok: P.length || terms.length };
}
function countRe(re, f) { re.lastIndex = 0; let n = 0; while (re.exec(f)) { n++; if (n > 50) break; } return n; }
function scoreQ(Q, f) {
  let n = 0;
  for (const re of Q.P) { const c = countRe(re, f); if (!c) return -1; n += 3 * c; }
  for (const t of Q.terms) { const c = f.split(t).length - 1; if (!c) return -1; n += c; }
  if (Q.adj) n += 5 * countRe(Q.adj, f);
  return n;
}
function snippet(o, Q) {
  const spans = [];
  Q.P.concat(Q.adj ? [Q.adj] : []).forEach(re => { re.lastIndex = 0; let m; while ((m = re.exec(o.f))) { const x = m.index + m[1].length; spans.push([x, x + m[2].length]); if (spans.length > 40) break; } });
  Q.terms.forEach(t => { let j = o.f.indexOf(t); while (j >= 0) { spans.push([j, j + t.length]); j = o.f.indexOf(t, j + t.length); } });
  spans.sort((x, y) => x[0] - y[0]);
  const i = spans.length ? spans[0][0] : 0;
  const a = Math.max(0, i - 70), b = Math.min(o.t.length, i + 170);
  let out = (a ? "…" : ""), k = a;
  spans.forEach(([x, y]) => { if (x < k || y > b) return; out += esc(o.t.slice(k, x)) + "<mark>" + esc(o.t.slice(x, y)) + "</mark>"; k = y; });
  return out + esc(o.t.slice(k, b)) + (b < o.t.length ? "…" : "");
}
function viewSearch(q0) {
  setNav("ara");
  main().innerHTML = bar({ title: "Ara", crumb: "Slaytlar, notlar, sorular ve kartlar" }) + '<div class="page narrow">'
    + '<div class="sbox">' + icon("search") + '<input id="sq" type="search" placeholder="Örn. Henderson, peptid bağı, &quot;sodyum pompası&quot;" autocomplete="off" value="' + esc(q0) + '"></div><div id="sr"></div></div>';
  const inp = $("#sq"), out = $("#sr");
  let tm = 0;
  const run = async () => {
    const qv = inp.value.trim();
    replaceHash("#/ara" + (qv ? "?q=" + encodeURIComponent(qv) : ""));
    const Q = parseQuery(qv);
    if (!Q.ok) { out.innerHTML = '<p class="note">En az iki harf yaz. Türkçe karakterler fark etmez: “ozellik” de “özellik”i bulur. Tırnak içine yazdığın kelimeler yalnız yan yana geçtiği yerlerde aranır: <b>"sodyum pompası"</b>.</p>'; return; }
    if (!S.index) out.innerHTML = '<div class="loading"><div><div class="spin"></div>Arama dizini hazırlanıyor…</div></div>';
    const I = await loadIndex();
    if (inp.value.trim() !== qv) return;
    const score = f => scoreQ(Q, f);
    const ph = [], qh = [];
    I.pages.forEach(o => { const sc = score(o.f); if (sc > 0) ph.push([sc, o]); });
    I.qs.forEach(o => { const sc = score(o.f); if (sc > 0) qh.push([sc, o]); });
    ph.sort((a, b) => b[0] - a[0]); qh.sort((a, b) => b[0] - a[0]);
    const pr = ph.slice(0, 60).map(([, o]) => { const it = S.byId[o.id]; return '<a class="hit" href="#/d/' + o.id + "/" + o.p + "?h=" + o.p + '"><div class="h"><i class="cdot" style="background:' + ccol(it.c) + '"></i>' + esc(it.t) + '<span class="pg-n">' + (it.k === "slayt" ? "slayt " : "s. ") + o.p + '</span></div><div class="s">' + snippet(o, Q) + "</div></a>"; }).join("");
    const qr = qh.slice(0, 40).map(([, o]) => { const it = S.byId[o.id]; return '<div class="hit" data-qi="' + esc(o.id) + '" data-qq="' + esc(o.qid) + '"><div class="h"><i class="cdot" style="background:' + ccol(it.c) + '"></i>' + esc(ct(it.c, it.t)) + '</div><div class="s">' + snippet(o, Q) + "</div></div>"; }).join("");
    out.innerHTML = (pr ? '<h2 class="sec">Slayt ve notlar · ' + ph.length + '</h2><div class="card list">' + pr + "</div>" : "")
      + (qr ? '<h2 class="sec">Sorular ve kartlar · ' + qh.length + '</h2><div class="card list">' + qr + "</div>" : "")
      + (!pr && !qr ? '<div class="card empty">“' + esc(qv) + "” için sonuç yok." + (Q.P.length ? " Tırnağı kaldırırsan kelimeler ayrı ayrı da aranır." : "") + "</div>" : "");
  };
  inp.addEventListener("input", () => { clearTimeout(tm); tm = setTimeout(run, 220); });
  out.addEventListener("click", async e => {
    const h = e.target.closest("[data-qi]");
    if (!h) return;
    const it = S.byId[h.dataset.qi], blob = await loadTest(it);
    if (it.k === "kart") { const c = blob.cards[+h.dataset.qq]; sheet('<p class="muted small">' + esc(it.c) + " · " + esc(c[0]) + '</p><h3 style="font-family:var(--f-ui);font-size:18px">' + c[1] + '</h3><div class="fb ok"><p>' + c[2] + '</p></div><div class="row-btns" style="margin-top:14px"><a class="btn" href="#/c/' + it.id + '" data-close>Kartlara git</a><button class="btn" data-close>Kapat</button></div>'); return; }
    const qq = blob.data.find(x => x.id === h.dataset.qq), L = ["A", "B", "C", "D", "E"];
    const sh = sheet('<p class="muted small">' + esc(ct(it.c, it.t)) + " · " + esc(qq.t) + '</p><div class="qcard" style="padding:0">' + qHTML(qq) + '<ul class="opts">' + qq.o.map((o, i) => '<li><div class="opt' + (i === qq.a ? " ok" : " dim") + '"><span class="bub">' + L[i] + "</span><span>" + o + "</span></div></li>").join("")
      + '</ul><div class="fb"><p>' + qq.e + '</p><div class="src">Kaynak: ' + esc(qq.s) + "</div></div>" + slideBtn(blob, qq.id) + '</div><div class="row-btns" style="margin-top:14px"><a class="btn" href="#/t/' + it.id + '" data-close>Teste git</a><button class="btn" data-close>Kapat</button><button class="ml-rep" id="srq">⚑ Hata bildir</button></div>');
    $("#srq", sh).onclick = () => { sh.close(); reportSheet({ tid: it.id, qid: qq.id, t: it.t, c: it.c, no: blob.data.findIndex(x => x.id === qq.id) + 1, q: strip(qq.q) }); };
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
  const ks = S.cat.kurullar.filter(k => S.cat.items.some(i => i.g === k.id)).concat(specialGs().map(kurulById));
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  const syncTxt = !syncOn() ? "Senkron kapalı: ilerleme yalnız bu cihazda." : SY.err ? "Senkron hatası: " + SY.err : SY.last ? "Senkron açık · son eşitleme " + new Date(SY.last).toLocaleTimeString("tr", { hour: "2-digit", minute: "2-digit" }) : "Senkron açık";
  main().innerHTML = bar({ title: "Ayarlar" }) + '<div class="page narrow">'
    + '<h2 class="sec">Profil</h2><div class="card set"><div class="row"><span class="av">' + esc((P.name || "?").slice(0, 1).toLocaleUpperCase("tr")) + '</span><div class="txt"><b>' + esc(P.name) + "</b><span>" + esc(syncTxt) + "</span></div>"
    + (syncOn() ? '<button class="btn" id="syn">Eşitle</button>' : "") + '<button class="btn" id="psw">Değiştir</button></div>'
    + (syncOn() ? '<div class="row"><div class="txt"><b>Senkron anahtarı</b><span>Bu cihazda kayıtlı. Kaldırırsan ilerleme yalnız bu cihazda kalır.</span></div><button class="btn danger" id="stdel">Kaldır</button></div>'
      : '<form class="row" id="stf"><div class="txt"><b>Cihazlar arası senkron</b><span>GitHub anahtarını (yalnız “gist” yetkili) bu cihazda bir kez gir; aynı profil adıyla her cihazda aynı ilerleme.</span>'
        + '<input id="stin" type="password" autocomplete="off" placeholder="ghp_…" class="stin"></div><button class="btn primary">Kaydet</button></form>')
    + "</div>"
    + '<h2 class="sec">Uygulama</h2><div class="card set">'
    + '<div class="row"><img src="icons/64.png" width="40" height="40" style="border-radius:10px" alt=""><div class="txt"><b>' + NAME + " " + VERSION + '</b><span>İçerik ' + fdate(stampIso(S.cat.v), true) + " tarihinde güncellendi · " + S.cat.items.length + " öğe</span></div>"
    + '<button class="btn" id="chk">Denetle</button></div>'
    + '<a class="row" href="#/yenilikler"><div class="txt"><b>Yenilikler</b><span>Sürüm ' + VERSION + " · neler değişti</span></div>" + icon("chev", "chev") + "</a>"
    + (standalone ? "" : '<div class="row"><div class="txt"><b>Ana ekrana yükle</b><span>Uygulama gibi açılır, çevrimdışı da çalışır.</span></div>' + (installEvt ? '<button class="btn primary" id="inst">Yükle</button>' : '<a class="btn" href="#/kurulum">Nasıl?</a>') + "</div>")
    + "</div>"
    + '<h2 class="sec">Çevrimdışı</h2><div class="card set">'
    + ks.map(k => { const its = S.cat.items.filter(i => i.g === k.id && i.k !== "video"); const sz = its.reduce((n, i) => n + (i.sz || 0), 0);
      return '<div class="row"><div class="txt"><b>' + esc(k.no ? "Kurul " + k.no : k.name) + "</b><span>" + its.length + " öğe · yaklaşık " + fmtMB(sz) + '</span></div><button class="btn" data-off="' + k.id + '">' + icon("dl") + "İndir</button></div>"; }).join("")
    + '<div class="row"><div class="txt"><span>' + (est ? "Bu cihazda kullanılan: " + fmtMB(est.usage || 0) : "") + " Açtığın slaytlar zaten kendiliğinden saklanır; “İndir” bütün kurulu önceden indirir.</span></div></div></div>"
    + '<h2 class="sec">İlerleme</h2><div class="card set">'
    + '<div class="row"><div class="txt"><b>Yedek al</b><span>' + (syncOn() ? "İlerlemen zaten senkronda; yine de dosya olarak saklayabilirsin." : "Senkron kapalıyken ilerleme bu cihazda durur; cihaz değiştirirken yedeği taşı.") + '</span></div><button class="btn" id="bk">İndir</button></div>'
    + '<div class="row"><div class="txt"><b>Yedekten yükle</b><span>Başka cihazdan aldığın yedek dosyasını seç.</span></div><label class="btn">Seç<input type="file" accept="application/json,.json" id="rs" hidden></label></div>'
    + "</div>"
    + repSection()
    + '<h2 class="sec">Cihaz</h2><div class="card set"><div class="row"><div class="txt"><b>Bu cihazdan çıkış yap</b><span>Anahtar ve indirilen içerik silinir; profiller ve ilerleme kalır.</span></div><button class="btn danger" id="lo">' + icon("out") + "Çıkış</button></div></div>"
    + "</div>";
  $("#chk").onclick = async () => { await checkUpdate(true); };
  bindRepSection();
  const ib = $("#inst"); if (ib) ib.onclick = async () => { installEvt.prompt(); await installEvt.userChoice.catch(() => {}); installEvt = null; viewSettings(); };
  $$("[data-off]").forEach(b => b.onclick = () => offline(b, b.dataset.off));
  $("#psw").onclick = () => { saveProfile(); LS.del("ml.prof"); location.hash = ""; location.reload(); };
  const stf = $("#stf");
  if (stf) stf.onsubmit = async e => {
    e.preventDefault();
    const tok = $("#stin").value.trim(), btn = stf.querySelector("button");
    if (!tok) return;
    btn.disabled = true; btn.textContent = "Deneniyor…";
    try {
      const r = await fetch("https://api.github.com/gists?per_page=1", { cache: "no-store", headers: { Authorization: "Bearer " + tok, Accept: "application/vnd.github+json" } });
      if (!r.ok) throw new Error(r.status === 401 ? "Anahtar geçersiz." : "GitHub " + r.status);
      LS.set("ml.st", tok); SY.gist = null;
      await syncNow({ quiet: true });
      toast(SY.err ? "Kaydedildi ama eşitlenemedi: " + SY.err : "Senkron açıldı");
      shell(); viewSettings();
    } catch (err) { btn.disabled = false; btn.textContent = "Kaydet"; toast(String(err.message || err)); }
  };
  const sd = $("#stdel"); if (sd) sd.onclick = () => { LS.del("ml.st"); LS.del("ml.gist"); SY.gist = null; viewSettings(); toast("Senkron bu cihazda kapatıldı"); };
  const sb = $("#syn"); if (sb) sb.onclick = async () => { sb.disabled = true; sb.textContent = "…"; await syncNow({ quiet: true }); viewSettings(); toast(SY.err ? "Eşitlenemedi: " + SY.err : "Eşitlendi"); };
  $("#bk").onclick = () => {
    saveProfile();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ medlock: 2, at: new Date().toISOString(), profile: P })], { type: "application/json" }));
    a.download = "medlock-" + slug(P.name || "profil") + "-" + today() + ".json"; a.click();
  };
  $("#rs").onchange = async e => {
    try {
      const j = JSON.parse(await e.target.files[0].text());
      if (j.medlock !== 2 || !j.profile) throw 0;
      P = mergeP(P, Object.assign({}, j.profile, { id: P.id, name: P.name }));
      saveProfile(); syncSoon(); toast("Yedek bu profile eklendi"); updateBadge();
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
function repSection() {
  const reps = openReps(), errs = LS.get("ml.errs", []);
  return '<h2 class="sec" id="hb">Hata bildirimleri</h2><div class="card set">'
    + (reps.length ? reps.map(r => '<div class="row"><div class="txt"><b>' + esc(r.c + " · " + r.t + (r.no > 0 ? " · " + r.no + ". soru" : "")) + "</b><span>" + esc(reasonLabel(r.r)) + (r.n ? " · " + esc(r.n) : "") + '</span></div><button class="ibtn" data-rdel="' + esc(r.tid + "|" + r.qid) + '" aria-label="Sil">' + icon("close") + "</button></div>").join("")
      : '<div class="row"><div class="txt"><span>Bir sorunun açıklamasındaki “Hata bildir”e dokunduğunda burada birikir.</span></div></div>')
    + (errs.length ? '<div class="row"><div class="txt"><b>Uygulama hataları · ' + errs.length + "</b><span>" + esc(errs[errs.length - 1].m.slice(0, 90)) + "</span></div></div>" : "")
    + (reps.length || errs.length ? '<div class="row" style="justify-content:flex-end"><button class="btn primary" id="rcopy">' + icon("copy") + 'Kopyala</button><button class="btn" id="rclr">Temizle</button></div>' : "")
    + "</div>" + (reps.length || errs.length ? '<p class="note">“Kopyala”ya dokunup Claude’a yapıştır. Düzeltildikten sonra “Temizle”.</p>' : "");
}
function bindRepSection() {
  $$("[data-rdel]").forEach(b => b.onclick = () => {
    const M = Object.assign({}, PS.get("rep", {})), r = M[b.dataset.rdel];
    if (r) { M[b.dataset.rdel] = Object.assign({}, r, { x: 1, at: Date.now() }); PS.set("rep", M); }
    viewSettings();
  });
  const cp = $("#rcopy");
  if (cp) cp.onclick = async () => {
    const txt = reportText();
    try { await navigator.clipboard.writeText(txt); toast("Kopyalandı · Claude’a yapıştırabilirsin"); }
    catch (e) {
      const bg = sheet('<h3>Hata bildirimleri</h3><p class="muted small">Metni seçip kopyala.</p><textarea class="rnote" rows="12" readonly>' + esc(txt) + '</textarea><div class="row-btns" style="margin-top:10px"><button class="btn" data-close>Kapat</button></div>');
      const ta = $("textarea", bg); ta.focus(); ta.select();
    }
  };
  let sure = false;
  const cl = $("#rclr");
  if (cl) cl.onclick = () => {
    if (!sure) { sure = true; cl.textContent = "Emin misin?"; return; }
    const M = Object.assign({}, PS.get("rep", {}));
    Object.keys(M).forEach(k => { if (!M[k].x) M[k] = Object.assign({}, M[k], { x: 1, at: Date.now() }); });
    PS.set("rep", M); LS.del("ml.errs"); viewSettings(); toast("Temizlendi");
  };
}
async function offline(btn, g) {
  const its = S.cat.items.filter(i => i.g === g && i.k !== "video");
  const urls = [];
  its.forEach(it => {
    if (it.k === "test" || it.k === "kart") urls.push("d/" + it.x + "?v=" + it.v);
    else { urls.push("d/" + it.x + "/t?v=" + it.v); for (let p = 1; p <= it.n; p++) urls.push("d/" + it.x + "/" + p + "?v=" + it.v); }
  });
  urls.push("d/s?v=" + S.cat.v);                         // arama ve Anatomi Latincesi de çevrimdışı çalışsın
  ["lat", "lex"].forEach(k => { if (S.cat[k]) urls.push("d/" + S.cat[k].x + "?v=" + S.cat[k].v); });
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
const passive = () => { const a = parseHash().parts[0]; return !a || a === "lib" || a === "ayarlar" || a === "kurulum" || a === "cikmis" || a === "yeni" || a === "yenilikler" || (a === "tekrar" && !parseHash().q.get("s")); };
// Kabuk (index, app.js, css, motor) önbellekten açılır; yeni sürüm çıkınca hepsi birlikte yenilenir.
async function updateShell(target) {
  if (!("caches" in window)) return true;
  try {
    const files = ["./", "index.html", "app.js", "app.css", "engine.html", "manifest.webmanifest"];
    const rs = await Promise.all(files.map(f => fetch(f, { cache: "reload" })));
    if (rs.some(r => !r.ok)) return false;
    if (!(await rs[2].clone().text()).includes('const APPV = "' + target + '"')) return false;   // sunucu henüz eski dosyayı veriyor
    const c = await caches.open("ml-shell-1");
    await Promise.all(rs.map((r, i) => c.put(files[i], r)));
    return true;
  } catch (e) { return false; }
}
// Cihazdaki önbellekten eski sürüm blobları silinir (her içerik güncellemesinde arama dizini ve değişen dosyalar
// yeniden indiriliyor; silinmezse aylar içinde yüzlerce MB birikir).
async function pruneCache() {
  if (!("caches" in window) || !S.cat) return;
  try {
    const c = await caches.open("ml-data-1"), keys = await c.keys();
    const want = new Map([["d/c", S.ver.c], ["d/s", S.cat.v]]);
    S.cat.items.forEach(it => { if (it.x) want.set("d/" + it.x, it.v); });
    ["lat", "lex"].forEach(k => { if (S.cat[k]) want.set("d/" + S.cat[k].x, S.cat[k].v); });
    let n = 0;
    for (const req of keys) {
      const u = new URL(req.url), m = u.pathname.match(/\/(d\/[^/]+)(\/[^/]+)?$/);
      if (!m) continue;
      if (want.get(m[1]) !== u.searchParams.get("v")) { await c.delete(req); n++; }
    }
    return n;
  } catch (e) { return 0; }
}
let updBusy = false;
async function checkUpdate(manual) {
  if (updBusy) return;
  updBusy = true;
  try { await checkUpdate2(manual); } finally { updBusy = false; }
}
async function checkUpdate2(manual) {
  let j;
  try { j = await fetchV(manual ? 10000 : 6000); } catch (e) { if (manual) toast("Bağlantı yok."); return; }
  LS.set("ml.v", Object.assign({}, j, { c: S.ver.c }));     // katalog aşağıda gerçekten yüklenince güncellenir
  let changed = false;
  if (j.c !== S.ver.c) {
    const old = new Set(S.cat.items.map(i => i.id));
    try {
      const cat = await fetchJSON("d/c", j.c);
      S.ver = Object.assign({}, S.ver, { c: j.c }); setCatalog(cat); S.index = null; S.tests = {}; S.texts = {}; latP = null; lexP = null; changed = true;
      LS.set("ml.v", j);
      const added = cat.items.filter(i => !old.has(i.id));
      toast(added.length ? "Yeni: " + added.slice(0, 2).map(i => i.t).join(", ") + (added.length > 2 ? " ve " + (added.length - 2) + " öğe daha" : "") : "İçerik güncellendi", null, null, 5000);
      footNote();
      setTimeout(pruneCache, 3000);
      if (passive()) { shell(); route(); }
    } catch (e) {}
  }
  if (APPV && j.app !== APPV) {
    let tried = ""; try { tried = sessionStorage.getItem("ml.updt") || ""; } catch (e) {}
    if (tried === j.app && !manual) return;                  // bu oturumda denendi; döngüye girme
    try { sessionStorage.setItem("ml.updt", j.app); } catch (e) {}
    if (!(await updateShell(j.app))) { if (manual) toast("Yeni sürüm sunucuda henüz hazır değil; birkaç dakika sonra tekrar dene."); return; }
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
  if (!PID || !LS.get(PKEY(PID), null)) await viewProfiles(); else useProfile(PID);
  shell();
  if (location.hash === "#/kurulum" && S.cat) location.hash = "#/ayarlar";
  if (history.state && history.state.ov) { ovSkip = 1; history.go(-history.state.ov); }   // yenilemeden kalan katman kaydı
  navDepth();
  route();
  // ağ işleri ekranı bekletmez: senkron ve sürüm denetimi arka planda (senkron değişiklik getirirse ekran yenilenir)
  if (syncOn()) syncNow();
  setTimeout(() => checkUpdate(false), 300);
  setTimeout(pruneCache, 8000);
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => p || navigator.storage.persist()).catch(() => {}); } catch (e) {}
  try { if (sessionStorage.getItem("ml.upd")) { sessionStorage.removeItem("ml.upd"); toast("Güncellendi"); } } catch (e) {}
  setInterval(() => checkUpdate(false), 15 * 60e3);
  setInterval(() => syncNow(), 5 * 60e3);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") { checkUpdate(false); syncNow(); }
    else { saveProfile(); clearTimeout(syncT); syncNow({ quiet: true }); }
  });
  window.addEventListener("pagehide", saveProfile);
}
function viewProfiles() {
  return new Promise(resolve => {
    const list = profilesLocal().slice();
    const draw = note => {
      app().innerHTML = '<div class="gate"><div class="gate-card"><img src="icons/192.png" alt=""><h1>Kim çalışıyor?</h1><p>İlerlemen, tekrar listen ve işaretlerin profiline kaydedilir'
        + (syncOn() ? "; bütün cihazlarında aynı görünür." : ".") + '</p><div class="plist">'
        + list.map(x => '<button class="pbtn" data-id="' + esc(x.id) + '"><span class="av">' + esc((x.name || "?").slice(0, 1).toLocaleUpperCase("tr")) + "</span>" + esc(x.name) + "</button>").join("")
        + '</div><form id="pf" class="pnew"><input id="pn" placeholder="' + (list.length ? "Yeni profil: adın" : "Adın") + '" maxlength="24" autocomplete="off" required><button class="btn primary">' + (list.length ? "Ekle" : "Başla") + "</button></form>"
        + '<div class="err">' + esc(note || "") + "</div></div></div>";
      $$(".pbtn").forEach(b => b.onclick = () => { const x = list.find(y => y.id === b.dataset.id); useProfile(x.id, x.name); resolve(); });
      $("#pf").onsubmit = e => { e.preventDefault(); const name = $("#pn").value.trim(); if (!name) return; useProfile(slug(name) || "p" + Date.now().toString(36), name); resolve(); };
    };
    draw();
    if (syncOn()) remoteAll().then(all => {
      let add = false;
      Object.values(all).forEach(d => { if (d && d.id && !list.some(x => x.id === d.id)) { list.push({ id: d.id, name: d.name }); add = true; } });
      if (add && $("#pf")) draw();
    }).catch(() => { if ($("#pf")) draw("Senkrona ulaşılamadı; bu cihazdaki profiller gösteriliyor."); });
  });
}
window.addEventListener("hashchange", () => { navDepth(); OV.length = 0; if (S.cat) route(); else if (!KEY) viewLogin(); });
if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).catch(() => {});
(async () => {
  if (!window.crypto || !crypto.subtle) { app().innerHTML = '<div class="gate"><div class="gate-card"><h1>' + NAME + "</h1><p>Bu tarayıcı desteklenmiyor. Güncel Chrome ya da Safari kullan.</p></div></div>"; return; }
  if (await unlockSaved()) start(); else viewLogin();
})();
})();
