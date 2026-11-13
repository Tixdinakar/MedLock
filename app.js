/* MedLock — kişisel ders arşivi. İçerik şifreli (AES-GCM); anahtar giriş şifresinden türetilir. */
(() => {
"use strict";

const NAME = "MedLock";
// Sürüm: büyük güncelleme +0.1 (1.1 → 1.2), küçük düzeltme +0.0.1 (1.1.1 → 1.1.2). Her arayüz değişikliğinde CHANGES'in başına kısa not ekle.
const VERSION = "1.3.4";
const CHANGES = [
  { v: "1.3.4", d: "2026-11-13", l: [
    "Profil seçme ekranındayken geri tuşuna basınca ya da eşitleme bitince çıkan hata düzeldi",
  ] },
  { v: "1.3.3", d: "2026-11-13", l: [
    "Ana sayfada kurul kartı ile Karma, Çıkmışlar ve Latince kutuları hep en üstte",
    "Slayt ve notlarda üstte “Cihaza indir” düğmesi: belge PDF olarak İndirilenler klasörüne iner",
    "Tam ekran düğmesi slaytta üst çubuğa, yakınlaştırmanın yanına taşındı",
    "Düello’da Eşitle’ye basınca uygulamanın donması düzeldi; internet takılırsa 20 saniyede vazgeçip söyler",
  ] },
  { v: "1.3.2", d: "2026-11-08", l: [
    "Testte işlem alanı: kalemle yaz, parmakla sayfayı kaydır; silgi, geri al, temizle. Hesaplı sorularda kendiliğinden açık, diğerlerinde “İşlem alanı”na dokun",
    "Sonuçtaki “Bakman gereken slaytlar”: bir numaraya dokununca o destenin bütün işaretli sayfaları vurgulu açılır; üstteki ‹ › ile aralarında geçersin",
  ] },
  { v: "1.3.1", d: "2026-11-08", l: [
    "Hocanın derste vurguladığı ya da \"soru olarak geldi\" dediği yerler slaytın altında işaretli; slaytın sonunda listesi, ders sayfasında sayısı var (ses kaydı olan derslerde)",
    "Kurul sayfasında \"Çevrimdışı indir\"; sınava 1 hafta kala ana sayfadaki sınav satırında da çıkıyor, indirilmişse \"İndirildi\" yazıyor",
  ] },
  { v: "1.3", d: "2026-11-08", l: [
    "Testte “?” düğmesi: emin olmadığın soruyu işaretle; optik formda sarı görünür, doğru bilsen de ertesi gün tekrar sorulur",
    "Test içinde “Boş” ve “Emin değilim” süzgeci; bitirirken “Boşlara dön” ve “Emin olmadıklarıma dön”",
    "Optik form sol kenarda, ortada küçük bir sekme; artık Sonraki düğmesini örtmüyor. İçindeki “Yana sabitle” ile solda ya da sağda sütun olur, soru kalan alana sığar",
    "Slayt ve testte tam ekran düğmesi: üst ve alt çubuklar gizlenir; sağ üstteki düğmeyle ya da geri tuşuyla çıkılır",
    "Test bitince “Test nasıldı?”: zorluk ve sorular hakkında kısa yorum; hata bildirimleriyle birlikte Ayarlar’dan kopyalanır",
  ] },
  { v: "1.2.2", d: "2026-11-08", l: [
    "Sayfayı aşağı çekince alttaki çubuğun kaybolması düzeldi",
  ] },
  { v: "1.2.1", d: "2026-11-08", l: [
    "Seçmeli ve ortak derslerin (ATA, Türk Dili) sınav uyarısı ana sayfada 5 gün önceden çıkar (önceden 3 hafta)",
    "Ekoloji vizesi (27 Kasım) ve ATA 151 · Türk Dili finali (30 Aralık) eklendi",
  ] },
  { v: "1.2", d: "2026-11-08", l: [
    "Ana sayfada “Bugün” kartı: yaklaşan sınav, bekleyen tekrar, yarım kalan bütün testlerin ve okumaların, sıradaki ders",
    "Alttaki çubukta “Diğer”: İlerleme, Saat, Düello, Karma, Çıkmışlar, Latince ve Ayarlar buradan açılır",
    "Saat: kronometre ve çalışma turu (Pomodoro 25/5, 50/10, Serbest). Ekran kararmaz, aşama değişince telefon titrer, ses çıkmaz; süre derse göre kaydedilir",
    "Düello: Efe’yle bugün kim ne kadar çalıştı, kaç soru çözdü; ortak seri ve haftalık ortak hedef",
    "Ders sayfası konulara göre: her slaytın notu, özeti ve testleri bir arada, “çıkmışta N soru” etiketiyle; ders içinde arama. Slaytın sonunda “Okudum” ve “Bu desteden 10 soru”",
    "Karma deneme tek ekranda ve kurul seçerek; kurul provası: gerçek sınav gibi 100 soru, 100 dakika, ders saatine göre dağılım",
    "Tekrar: yaklaşan sınavın soruları önce gelir, sınavdan önceki 3 gün öğrendiklerin bir kez daha sorulur, şıkların yeri karışır, “Tahmin ettim” düğmesi; yanlışta soru en başa dönmez",
    "İlerleme yalnız ilk denemeyi sayar (cevabını az önce gördüğün soru başarını şişirmez) ve kurula göre ayrılır; aynı konunun farklı adları tek konu oldu; günlük soru sayısı artık doğru; seri haftada 1 gün arayla bozulmaz",
    "Arama ekli kelimeleri de bulur (kültürünün → kültür), sonuçlar desteye göre toplu",
    "Sınav geçince puanın bir kez sorulur; test sonucunda zayıf konunun yanında “özetten oku”; çıkmışlarda “Çıkmışın aslı” o sayfayı açar, yan taranmış sayfalar düzeldi",
  ] },
  { v: "1.1.9", d: "2026-11-08", l: [
    "Yatay tablette ve bilgisayarda test ekranı genişledi, soru ve şıklar büyüdü",
  ] },
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
const APPV = "cb539f133d";                            // arayüz sürümü; tools/medlock.py stamp yazar
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
  full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  unfull: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
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
  more: '<circle cx="5.5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18.5" cy="12" r="1.5"/>',
  clock: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.6 2.6M9.5 3h5M12 3v2.5"/>',
  duel: '<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M3 19.5c.5-3.5 2.6-5.5 5-5.5s4.5 2 5 5.5M13.5 15.2c.9-.8 1.9-1.2 3-1.2 2.1 0 3.7 1.6 4 4.5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  pause: '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
  stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="2"/>',
  flame: '<path d="M12 21c-3.6 0-6-2.4-6-5.6 0-3.2 2.2-5 3.4-7.6.4 1.6 1.4 2.6 2.4 3 .2-3 1.4-5.4 3.6-7.3-.2 3 .9 4.6 2 6.4.8 1.3 1.6 2.6 1.6 4.6C19 18.6 15.6 21 12 21z"/>',
  today: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 9.5h16M8.5 3v4M15.5 3v4"/>',
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
// Konu adı karşılaştırması: aynı konu testlerde farklı yazılmış olabilir ("Asitler ve Bazlar" / "Asitler – Bazlar", "Biyolojik oksidasyon")
const tnorm = t => fold(String(t || "")).replace(/[^a-z0-9°]+/g, " ").replace(/(^| )(ve|ile)(?= |$)/g, " ").replace(/\s+/g, " ").trim();
const fmtDur = s => { s = Math.max(0, Math.round(s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? h + " sa " + m + " dk" : m + " dk"; };
const weekStart = iso => { const d = new Date(iso + "T12:00"); return addDays(iso, -((d.getDay() + 6) % 7)); };   // haftanın pazartesisi
const shuffled = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

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
// Yaklaşan sınavlar: kurul sınavı (kurulun son günü) ve katalogdaki "sinavlar" (ortak/seçmeli ders vizeleri). Dönem finali final dönemiyle ayrıca gelir.
function upcomingExams(within) {
  const t = today(), out = [];
  S.cat.kurullar.forEach(k => { if (k.end && k.end >= t && dayDiff(t, k.end) <= within) out.push({ d: k.end, key: "k:" + k.id + ":" + k.end, c: "Kurul " + k.no, label: "Kurul " + k.no + " sınavı", has: it => it && it.g === k.id }); });
  (S.cat.sinavlar || []).forEach(x => {
    if (x.d < t || dayDiff(t, x.d) > within || donemler().some(d => d.name === x.c)) return;
    out.push({ d: x.d, key: "s:" + x.d + ":" + x.c, c: x.c, label: x.c + " " + (x.t || "sınavı").toLocaleLowerCase("tr"), has: it => it && it.c === x.c });
  });
  return out.sort((a, b) => a.d.localeCompare(b.d));
}
// Sınav öncesi son tur: sınavdan önceki 3 gün, o sınavın derslerinden öğrenilmiş sorular bir kez daha gelir
const EXW = 3;
function examBackKey(k, e, X) {
  if (!e || !e.m) return null;
  const it = srsKeyItem(k), x = it && (X || upcomingExams(EXW)).find(x => x.has(it));
  return x && e.xr !== x.key ? x.key : null;
}
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
  const s = srsLoad(), t = today(), X = upcomingExams(EXW);
  return Object.keys(s).filter(k => finalBack(s[k]) || examBackKey(k, s[k], X) || (!s[k].m && (all || s[k].due <= t)));
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
// Konu hakimiyeti yalnız ilk denemeden: aynı soru aynı gün ikinci kez (tekrarda yeniden sorulduğunda, yanlışları yeniden çözerken) sayılmaz
function qhRecord(qh, key, ok, meta) {
  const d = today(), h = qh[key] = Object.assign({ n: 0, k: 0 }, qh[key]);
  if (h.d === d) return false;
  h.d = d; h.n++; if (ok) h.k++; h.l = ok ? 1 : 0; h.t = meta.t; h.c = meta.c; h.at = Date.now();
  h.hh = (h.hh || []).concat([[d, ok ? 1 : 0]]).slice(-6);
  return true;
}
// Bütün ekranlarda aynı konu adı: (ders, konu) için testlerde en çok geçen yazılış; katalogdaki "ta" eşlemesi
// (medlock.py konu-ad) aynı konunun farklı adlarını birleştirir, eski adla kaydedilmiş geçmiş de yeni adla görünür
let TN = null, TNc = null, TA = null;
function tname(c, t) {
  if (TNc !== S.cat) {
    TNc = S.cat; TN = new Map(); TA = new Map(); const cnt = new Map();
    Object.entries(S.cat.ta || {}).forEach(([cc, m]) => Object.entries(m || {}).forEach(([o, n]) => TA.set(cc + "|" + tnorm(o), n)));
    S.cat.items.forEach(it => { if (it.k === "test") (it.tp || []).forEach(([x0, n]) => { const x = TA.get(it.c + "|" + tnorm(x0)) || x0, k = it.c + "|" + tnorm(x), m = cnt.get(k) || new Map(); m.set(x, (m.get(x) || 0) + n); cnt.set(k, m); }); });
    cnt.forEach((m, k) => TN.set(k, Array.from(m.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr"))[0][0]));
  }
  const a = TA.get(c + "|" + tnorm(t)) || t;
  return TN.get(c + "|" + tnorm(a)) || a;
}
// Çalışma süresi (Saat): tm[gün][cihaz][ders] = saniye
const tmDay = (tm, d) => { let s = 0; Object.values((tm || {})[d] || {}).forEach(m => Object.values(m || {}).forEach(x => { s += x || 0; })); return s; };
function tmAdd(course, sec) {
  if (!(sec >= 1) || !P) return;
  const tm = Object.assign({}, PS.get("tm", {})), d = today();
  tm[d] = Object.assign({}, tm[d]); const m = tm[d][DEV] = Object.assign({}, tm[d][DEV]);
  m[course] = Math.round((m[course] || 0) + sec);
  PS.set("tm", tm);
}
// Seri: en az 1 soru çözülen ya da Saat'le 15 dk çalışılan her gün 1 artar; haftada (Pzt–Paz) 1 gün ara serbest
const STREAK_TXT = "Seri, en az 1 soru çözdüğün ya da Saat’le 15 dakika çalıştığın her gün 1 artar. Haftada 1 gün ara verirsen bozulmaz.";
const dayActive = (prof, d) => dayN((prof && prof.days) || {}, d) > 0 || tmDay(prof && prof.tm, d) >= 900;
function streakOf(act) {
  const t = today(), used = new Set();
  let n = 0, d = act(t) ? t : addDays(t, -1);
  for (let i = 0; i < 1500; i++) {
    if (act(d)) n++;
    else { const w = weekStart(d); if (used.has(w) || (!n && i > 0)) break; used.add(w); }
    d = addDays(d, -1);
  }
  return n;
}
const myStreak = () => streakOf(d => dayActive(P, d));
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
const blankProfile = (id, name) => ({ v: 1, id, name, at: Date.now(), srs: {}, tres: {}, hist: [], qh: {}, days: {}, bm: {}, real: {}, eng: {}, rot: {}, last: {}, rep: {}, rd: {}, tm: {}, dz: null, mix: null });
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
  ["tres", "qh", "bm", "real", "eng", "rot", "last", "rep", "rd"].forEach(k => { o[k] = mergeMap(a[k], b[k], "at"); });
  const newer = (x, y) => !x ? y : !y ? x : (y.at || 0) > (x.at || 0) ? y : x;
  o.mix = newer(a.mix, b.mix); o.dz = newer(a.dz, b.dz);
  o.tm = {};                                       // çalışma süresi: gün › cihaz › ders, her cihazın en büyük değeri
  [a.tm || {}, b.tm || {}].forEach(T => Object.entries(T).forEach(([d, devs]) => {
    o.tm[d] = Object.assign({}, o.tm[d]);
    Object.entries(devs || {}).forEach(([dev, m]) => { const x = o.tm[d][dev] = Object.assign({}, o.tm[d][dev]); Object.entries(m || {}).forEach(([c, s]) => { x[c] = Math.max(x[c] || 0, s || 0); }); });
  }));
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
// Tarayıcının İngilizce ağ hatası yerine Türkçe
const netMsg = m => /failed to fetch|networkerror|load failed|network request failed/i.test(m || "") ? "Bağlantı kurulamadı; internet açıkken yeniden dene." : m;
const syncOn = () => !!syncToken();
// Ağ takılırsa senkron sonsuza dek beklemesin (eskiden "Eşitle" donup kalıyordu)
async function fetchT(u, o, ms) {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms || 20000);
  try { return await fetch(u, Object.assign({}, o, { signal: ac.signal })); }
  catch (e) { throw ac.signal.aborted ? new Error("Bağlantı zaman aşımına uğradı; internet açıkken yeniden dene.") : e; }
  finally { clearTimeout(t); }
}
async function gh(method, path, body) {
  const r = await fetchT("https://api.github.com" + path, {
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
    if (f.truncated) c = await (await fetchT(f.raw_url, { cache: "no-store" })).text();
    try { out[m[1]] = await decJSON(c); } catch (e) {}
  }
  return out;
}
let syncT = 0;
function syncSoon() { if (!syncOn()) return; clearTimeout(syncT); syncT = setTimeout(() => syncNow(), 5000); }
// Senkron sürerken yeniden çağrılırsa aynı işi bekler (eskiden hemen dönüyordu; Düello bunu sonsuz döngüye sokup uygulamayı donduruyordu)
function syncNow(opts) {
  if (!syncOn() || !P) return Promise.resolve(false);
  if (SY.p) { SY.again = true; return SY.p; }
  SY.p = syncRun(opts).finally(() => { SY.p = null; });
  return SY.p;
}
async function syncRun(opts) {
  SY.busy = true;
  let changedLocal = false;
  try {
    const all = await remoteAll(), remote = all[P.id];
    SY.others = Object.values(all).filter(x => x && x.id && x.id !== P.id);   // düello: aynı senkrondaki diğer profiller
    const before = JSON.stringify(P);
    const merged = mergeP(P, remote);
    changedLocal = JSON.stringify(merged) !== before;
    P = merged; saveProfile();
    if (!remote || JSON.stringify(remote) !== JSON.stringify(merged)) {
      await gh("PATCH", "/gists/" + (await findGist()), { files: { ["p-" + P.id + ".txt"]: { content: await encJSON(P) } } });
    }
    SY.last = Date.now(); SY.err = "";
  } catch (e) { SY.err = netMsg(String(e.message || e)); }
  SY.busy = false;
  if (SY.again) { SY.again = false; syncSoon(); }
  if (changedLocal && !(opts && opts.quiet) && passive()) { updateBadge(); route(); }
  return changedLocal;
}

/* ---------- toast ---------- */
let toastT = 0, toastAt = 0;
function toast(msg, act, fn, ms) {
  toastAt = Date.now();
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
    + '<a data-nav="saat" href="#/saat">' + icon("clock") + 'Saat</a>'
    + '<a data-nav="duello" href="#/duello">' + icon("duel") + 'Düello</a>'
    + '<a data-nav="karma" href="#/karma">' + icon("mix") + 'Karma deneme</a>'
    + (S.cat.lex || S.cat.lat ? '<a data-nav="sozluk" href="#/sozluk">' + icon("lex") + 'Anatomi Latincesi</a>' : "")
    + '<a data-nav="ara" href="#/ara">' + icon("search") + 'Ara</a>'
    + '<div class="sep"></div><a data-nav="ayarlar" href="#/ayarlar">' + icon("set") + 'Ayarlar</a></nav>'
    + '<div class="clockchip cc-s" hidden></div><div class="foot" id="side-foot"></div></aside>'
    + '<main class="main" id="main"></main>'
    + '<div class="clockchip cc-m" hidden></div>'
    + '<nav class="tabs">'
    + '<a data-nav="home" href="#/">' + icon("home") + 'Ana sayfa</a>'
    + '<a data-nav="lib" href="#/lib">' + icon("lib") + 'Kütüphane</a>'
    + '<a data-nav="tekrar" href="#/tekrar">' + icon("rep") + 'Tekrar<span class="badge" data-badge hidden></span></a>'
    + '<a data-nav="ara" href="#/ara">' + icon("search") + 'Ara</a>'
    + '<button type="button" data-nav="diger" id="morebtn" aria-haspopup="menu">' + icon("more") + 'Diğer</button>'
    + '</nav></div>';
  $("#morebtn").onclick = openMore;
  updateBadge();
  footNote();
  clockTick();
}
// Alttaki "Diğer": yukarı doğru açılan menü (telefonun geri tuşu kapatır)
const MOREKEYS = ["ilerleme", "saat", "duello", "karma", "cikmis", "sozluk", "isaretler", "ayarlar"];
function moreItems() {
  return [["ilerleme", "#/ilerleme", "chart", "İlerleme", "Seri, konu hakimiyeti, deneme geçmişi"],
    ["saat", "#/saat", "clock", "Saat", "Kronometre ve çalışma turu"],
    ["duello", "#/duello", "duel", "Düello", "Bugün kim ne kadar çalıştı"],
    ["karma", "#/karma", "mix", "Karma deneme", "Kurul provası ya da seçtiğin konulardan"],
    cxAny() && ["cikmis", "#/cikmis", "star", "Çıkmışlar", "Çöz ya da orijinalini aç"],
    (S.cat.lex || S.cat.lat) && ["sozluk", "#/sozluk", "lex", "Anatomi Latincesi", "Terim çözücü, kelimeler"],
    ["isaretler", "#/isaretler", "bm", "İşaretli sayfalar", ""],
    ["ayarlar", "#/ayarlar", "set", "Ayarlar", "Profil, senkron, çevrimdışı"]].filter(Boolean);
}
function openMore() {
  const old = $(".more-bg"); if (old) { old.close(); return; }
  const bg = document.createElement("div"); bg.className = "more-bg";
  bg.innerHTML = '<nav class="more" role="menu">' + moreItems().map(([k, h, ic, l, d]) => '<a href="' + h + '" role="menuitem"' + (curHash().startsWith(h) ? ' class="on"' : "") + ">" + icon(ic) + "<span><b>" + l + "</b>" + (d ? "<small>" + d + "</small>" : "") + "</span></a>").join("") + "</nav>";
  let tok = null;
  const close = fromPop => { if (!bg.isConnected) return; bg.remove(); $("#morebtn") && $("#morebtn").classList.remove("open"); if (!fromPop) ovDone(tok); };
  bg.close = () => close(false);
  bg.addEventListener("click", e => { if (e.target === bg) close(false); });
  document.body.appendChild(bg); $("#morebtn").classList.add("open");
  tok = ovOpen(() => close(true));
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
    a.classList.toggle("on", k === key || ((key.startsWith("k:") || key === "cikmis" || key === "yeni") && k === "lib" && !a.classList.contains("sub")) || (k === "diger" && MOREKEYS.concat(["yenilikler", "kurulum"]).includes(key)));
  });
  $("#shell").classList.toggle("immersive", !!immersive);   // alttaki sekme çubuğu hiç gizlenmez; yatay tablette yalnız yan menü gizlenir
  tabH();
}
// testten açılan slayt paneli telefonda alttaki çubuğun üstünde biter
function tabH() { const t = $(".tabs"), c = $(".cc-m"); document.documentElement.style.setProperty("--tabh", ((t ? t.offsetHeight : 0) + (c && !c.hidden ? c.offsetHeight : 0)) + "px"); }
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
  if (!m) return;   // profil seçim ekranı açıkken (kabuk henüz yok) geri tuşu ya da senkron ekranı çizmeye kalkmasın
  m.scrollTop = 0;
  requestAnimationFrame(fitCrumbs);
  const tt = $("#toast"); if (tt && Date.now() - toastAt > 600) tt.classList.remove("show");   // önceki ekranın bildirimi yeni ekranda kalmasın
  clockTick();
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
    if (a === "saat") return viewClock();
    if (a === "duello") return viewDuel();
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
  if (opts && opts.tag) m.push(opts.tag);
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
// Yaklaşan sınav uyarısı (katalogda "sinavlar": [{d, c, t, w}]; medlock.py sinav ile eklenir), w gün (yoksa 21) önceden; Bugün kartının ilk satırı
function examRows() {
  const t = today(), L = (S.cat.sinavlar || []).filter(x => x.d >= t && dayDiff(t, x.d) <= (x.w || 21));   // w: kaç gün önceden (seçmeliler 5)
  S.cat.kurullar.forEach(k => { if (k.end && k.end >= t && dayDiff(t, k.end) <= 14 && S.cat.items.some(i => i.g === k.id)) L.push({ d: k.end, c: "Kurul " + k.no, t: "sınavı", g: k.id }); });
  return L.sort((a, b) => a.d.localeCompare(b.d)).map(x => {
    const n = dayDiff(t, x.d), its = x.g ? [] : S.cat.items.filter(i => i.c === x.c), g = x.g || (its[0] && its[0].g);
    const wd = new Date(x.d + "T12:00").toLocaleDateString("tr", { weekday: "long" });
    const pick = k => its.filter(i => i.k === k && !i.cx).sort((a, b) => (b.d || "").localeCompare(a.d || ""))[0];
    const oz = pick("ozet"), ts = pick("test");
    return '<div class="trow exam' + (n <= 2 ? " soon" : "") + '"><span class="ex-n">' + (n === 0 ? "Bugün" : n === 1 ? "Yarın" : n + " gün") + '</span><span class="tx"><b>' + esc(x.c) + " · " + esc(x.t || "Sınav") + '</b><small>' + fdate(x.d) + " " + wd + "</small>"
      + '<span class="row-btns">' + (x.g ? '<a class="btn sm" href="#/karma?g=' + x.g + '&prova=1">Prova</a><a class="btn sm" href="#/lib/' + x.g + '">Kurul</a>'
        : (oz ? '<a class="btn sm" href="#/d/' + oz.id + '/1">Özet</a>' : "") + (ts ? '<a class="btn sm" href="#/t/' + ts.id + '">Deneme</a>' : "") + (g ? '<a class="btn sm" href="#/lib/' + g + "/" + slug(x.c) + '">Ders</a>' : ""))
      + (g && n <= 7 && S.cat.items.some(i => i.g === g && i.k !== "video") ? '<button class="btn sm" data-off="' + g + '">' + icon("dl") + "İndir</button>" : "") + "</span></span></div>";
  }).join("");
}
// Kaldığın yer: bütün yarım testler, yarım karma deneme ve sonuna kadar okunmamış slaytlar (en yeni üstte)
function contList() {
  const out = [], R = testRes(), rd = Object.assign({}, PS.get("rd", {}));
  Object.entries(R).forEach(([id, r]) => { const it = S.byId[id]; if (it && !r.fin && r.done > 0)
    out.push({ at: r.at, html: '<a class="trow" href="#/t/' + id + '">' + kindBox(it.cx ? "cikmis" : "test") + '<span class="tx"><b>' + esc(ct(it.c, it.t)) + '</b><small class="ip">Devam ediyor · ' + r.done + " / " + r.n + "</small></span>" + icon("chev", "chev") + "</a>" }); });
  const M = PS.get("mix", null), e = M && PS.get("eng", {})[engKey(M.k)], run = e && e.s && e.s.run;
  if (run && !run.finished && Object.keys(run.ans || {}).length)
    out.push({ at: e.at, html: '<a class="trow" href="#/t/mix">' + kindBox("test") + '<span class="tx"><b>' + esc(M.t) + '</b><small class="ip">Devam ediyor · ' + Object.keys(run.ans).length + " / " + run.ids.length + "</small></span>" + icon("chev", "chev") + "</a>" });
  const L = getLast("doc"); if (L && !rd[L.id]) rd[L.id] = { p: L.p, m: L.p, at: L.at };
  Object.entries(rd).forEach(([id, o]) => { const it = S.byId[id]; if (it && !o.ok && o.p > 1 && o.p < it.n && Date.now() - (o.at || 0) < 30 * 864e5)
    out.push({ at: o.at, html: '<a class="trow" href="#/d/' + id + "/" + o.p + '">' + kindBox(it.k) + '<span class="tx"><b>' + esc(it.t) + '</b><small>' + esc(it.c) + " · " + (it.k === "slayt" ? "slayt " : "sayfa ") + o.p + " / " + it.n + "</small></span>" + icon("chev", "chev") + "</a>" }); });
  return out.sort((a, b) => b.at - a.at).slice(0, 4).map(x => x.html);
}
// Sıradaki okunmamış ders: içinde bulunulan kurulda en eski, okundu işaretlenmemiş slayt
function nextUnread(k) {
  const rd = PS.get("rd", {});
  const decks = S.cat.items.filter(i => i.g === k.id && i.k === "slayt" && !(rd[i.id] && rd[i.id].ok)).sort((a, b) => (a.d || "").localeCompare(b.d || ""));
  return decks.find(d => !rd[d.id]) || decks[0] || null;
}
function kurulPrep(g) {
  const rd = PS.get("rd", {}), qh = PS.get("qh", {});
  const decks = S.cat.items.filter(i => i.g === g && i.k === "slayt"), read = decks.filter(d => rd[d.id] && rd[d.id].ok).length;
  const tests = S.cat.items.filter(i => i.g === g && i.k === "test" && !i.cx), nQ = tests.reduce((a, t) => a + (t.n || 0), 0), ids = new Set(tests.map(t => t.id));
  let solved = 0; Object.keys(qh).forEach(key => { if (ids.has(key.split("|")[0])) solved++; });
  return { decks: decks.length, read, nQ, solved };
}
const prepLine = (p, short) => [p.decks ? p.read + "/" + p.decks + " deste okundu" : "", p.nQ ? p.solved + "/" + p.nQ + " soru çözüldü" : short ? "" : "henüz test yok"].filter(Boolean).join(" · ");
const newbie = () => !Object.keys(PS.get("days", {})).length && !Object.keys(PS.get("qh", {})).length && !Object.keys(PS.get("tres", {})).length;
function welcomeCard() {
  if (LS.get("ml.seenv", null) != null || !newbie()) return "";
  return '<div class="card upd welcome" id="updc"><div class="uh"><span class="k">Hoş geldin</span><b>' + NAME + '</b><button class="ibtn" id="updx" aria-label="Kapat">' + icon("close") + "</button></div>"
    + '<ol class="wsteps"><li><b>Kütüphane</b>’den kurulunu ve dersini aç, slaytı oku.</li><li>Test çöz: yanlışların <b>Tekrar</b>’a düşer, ertesi gün yeniden sorulur.</li><li>Her gün buradaki <b>Bugün</b> kartını bitir; serin böyle büyür.</li></ol>'
    + '<div class="row-btns"><button class="btn primary" id="updok">Tamam</button></div></div>';
}
function syncHint() {
  if (syncOn() || LS.get("ml.syh", null)) return "";
  return '<div class="card tile synch" id="synch"><span class="big">' + icon("rep") + '</span><span class="txt"><b>Senkron kapalı</b><span class="muted small">İlerlemen yalnız bu cihazda. Başka cihazda da çalışıyorsan anahtarı Ayarlar’dan bir kez gir; aynı adla açtığın profil birleşir.</span></span>'
    + '<span class="row-btns"><a class="btn" href="#/ayarlar">Ayarlar</a><button class="btn ghost" id="syhx">Gerek yok</button></span></div>';
}
function viewHome() {
  setNav("home");
  const k = currentKurul(), t = today(), F = finalInfo();
  const total = dayDiff(k.start, k.end) + 1, gone = Math.min(Math.max(dayDiff(k.start, t) + 1, 0), total);
  const week = Math.max(1, Math.ceil(gone / 7)), weeks = Math.ceil(total / 7), left = dayDiff(t, k.end);
  const due = srsDue(), tracked = srsDue(true).length;
  const byC = new Map(); due.forEach(key => { const it = srsKeyItem(key); if (it) byC.set(it.c, (byC.get(it.c) || 0) + 1); });
  const bms = bmLoad().filter(b => S.byId[b.id]);
  const started = t >= k.start, lastWeek = started && left >= 0 && left <= 7;
  const days = PS.get("days", {}), sk = myStreak(), nToday = dayN(days, t), tmT = tmDay(PS.get("tm", {}), t);
  const hasCx = cxAny(), cont = contList(), nx = started && nextUnread(k), prep = kurulPrep(k.id);
  const todayCard = '<div class="card today"><div class="th">' + icon("today") + "<b>Bugün</b>"
    + '<span class="sk' + (dayActive(P, t) ? " on" : "") + '" title="' + esc(STREAK_TXT) + '">' + icon("flame") + sk + " gün</span>"
    + '<span class="muted small">' + nToday + " soru" + (tmT ? " · " + fmtDur(tmT) : "") + "</span></div>"
    + examRows()
    + (due.length ? '<a class="trow due" href="#/tekrar?s=1"><span class="ti">' + icon("rep") + '</span><span class="tx"><b>' + due.length + ' soru tekrar bekliyor</b><small>' + Array.from(byC.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, n]) => esc(c) + " " + n).join(" · ") + '</small></span><span class="btn flame sm">Başla</span></a>'
      : '<a class="trow" href="#/tekrar"><span class="ti">' + icon("rep") + '</span><span class="tx"><b>Bugün tekrar yok</b><small>' + (tracked ? "Listede " + tracked + " soru" : "Testte yanlışların buraya düşer") + "</small></span>" + icon("chev", "chev") + "</a>")
    + (cont.length ? '<div class="tsub">Kaldığın yer</div>' + cont.join("") : "")
    + (nx ? '<div class="tsub">Sıradaki</div><a class="trow" href="#/d/' + nx.id + '/1">' + kindBox(nx.k) + '<span class="tx"><b>' + esc(nx.t) + "</b><small>" + esc(nx.c) + " · " + nx.n + " slayt" + (deckQn(nx.id) ? " · " + deckQn(nx.id) + " soru" : "") + "</small></span>" + icon("chev", "chev") + "</a>" : "")
    + "</div>";
  const hero = F && F.on
    ? '<div class="card hero"><div class="k">Final dönemi · ' + esc(F.d.name) + (F.est ? " · tarihler tahmini" : "") + "</div><h3>Final sınavları</h3>"
      + '<div class="meta"><span>' + fdate(F.start) + " – " + fdate(F.end, true) + "</span><span>Bütün kurulların soruları tekrar ve denemelerde</span></div>"
      + '<div class="row-btns"><a class="btn" href="#/karma?final=1">' + icon("mix") + "Final denemesi</a>" + (hasCx ? '<a class="btn" href="#/cikmis">' + icon("star") + "Çıkmışlar</a>" : "") + "</div></div>"
    : '<div class="card hero"><div class="k">Kurul ' + k.no + (started ? " · " + week + ". hafta / " + weeks : " · yakında") + (lastWeek ? ' <span class="lw">Son hafta</span>' : "") + '</div><h3>' + esc(k.name) + "</h3>"
      + '<div class="prog"><i style="width:' + Math.round(100 * gone / total) + '%"></i></div>'
      + '<div class="meta"><span>' + fdate(k.start) + " – " + fdate(k.end) + "</span>" + (left >= 0 ? "<span>Kurul sınavına <b>" + left + " gün</b></span>" : "") + "</div>"
      + (prepLine(prep, 1) ? '<div class="meta prep"><span>' + prepLine(prep, 1) + "</span></div>" : "")
      + '<div class="row-btns"><a class="btn" href="#/lib/' + k.id + '">Kurula git ' + icon("chev") + "</a>"
      + (prep.nQ ? '<a class="btn" href="#/karma?g=' + k.id + '&prova=1">' + icon("test") + "Kurul provası</a>" : "")
      + (lastWeek ? '<a class="btn" href="#/karma?w=1&g=' + k.id + '">' + icon("mix") + "Zayıf konulardan</a>" : "")
      + "</div></div>";
  main().innerHTML = bar({ title: NAME, crumb: fdate(t, true) + (P && P.name ? " · " + esc(P.name) : ""), actions: '<a class="ibtn" href="#/ayarlar" aria-label="Ayarlar">' + icon("set") + "</a>" })
    + '<div class="page">' + hero   // kurul kartı ve kutular hep en üstte (Buğra'nın isteği)
    + '<div class="grid tiles4" style="margin-top:12px">'
    + '<a class="card tile" href="#/karma"><span class="big">' + icon("mix") + '</span><span class="txt"><b>Karma deneme</b><span class="muted small">Kurul provası ya da seçtiğin konulardan</span></span>' + icon("chev", "chev") + "</a>"
    + (hasCx ? '<a class="card tile" href="#/cikmis"><span class="big">' + icon("star") + '</span><span class="txt"><b>Çıkmışlar</b><span class="muted small">' + cxCount() + " ders · çöz ya da orijinalini aç</span></span>" + icon("chev", "chev") + "</a>" : "")
    + (S.cat.lex || S.cat.lat ? '<a class="card tile" href="#/sozluk"><span class="big">' + icon("lex") + '</span><span class="txt"><b>Anatomi Latincesi</b><span class="muted small">' + (S.cat.lat ? "Terim çözücü, " + S.cat.lat.n + " kelime, alıştırma" : "Latince ve Yunanca kökler") + "</span></span>" + icon("chev", "chev") + "</a>" : "")
    + "</div>"
    + (welcomeCard() || updCard()) + scoreCard() + todayCard
    + syncHint() + installCard()
    + (bms.length ? '<h2 class="sec">İşaretli sayfalar' + (bms.length > 4 ? ' · <a href="#/isaretler" style="color:var(--accent)">tümü (' + bms.length + ")</a>" : "") + '</h2><div class="card list">' + bms.slice(0, 4).map(bmRow).join("") + "</div>" : "")
    + '<h2 class="sec sec-a">Son eklenenler<a href="#/yeni">Tümü ' + icon("chev") + '</a></h2><div class="card list">' + S.cat.items.slice(0, 5).map(it => itemRow(it, { course: 1, noHoca: 1 })).join("") + "</div>"
    + "</div>";
  bindUpd(); bindScoreCard();
  const sx = $("#syhx"); if (sx) sx.onclick = () => { LS.set("ml.syh", 1); $("#synch").remove(); };
  bindOff();
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
    + '<div class="page">' + (k.start ? '<p class="muted small" style="margin:0 0 6px">' + fdate(k.start, true) + " – " + fdate(k.end, true) + (k.end >= today() ? " · kurul sınavına " + dayDiff(today(), k.end) + " gün" : "") + "</p>" : "")
    + (() => { const pr = kurulPrep(g), L = prepLine(pr, 1); return L || pr.nQ ? '<div class="kprep"><span class="muted small">' + L + "</span>" + (pr.nQ && k.no ? '<a class="btn sm" href="#/karma?g=' + g + '&prova=1">' + icon("test") + "Kurul provası</a>" : "") + "</div>" : ""; })()
    + (S.cat.items.some(i => i.g === g && i.k !== "video") ? '<div class="kprep"><span class="muted small">Çevrimdışı: internet olmadan da açılsın diye bütün kurulu indir (yaklaşık ' + fmtMB(offSize(g)) + ")</span>" + '<button class="btn sm" data-off="' + g + '">' + icon("dl") + "İndir</button></div>" : "")
    + (cs.length ? '<div class="card list crs">' + cs.map(o => {
      const cnt = KORDER.map(kk => [kk, o.items.filter(i => i.k === kk && !(kk === "test" && i.cx)).length]).filter(x => x[1]).map(x => "<span><b>" + x[1] + "</b> " + KIND[x[0]].l.toLowerCase() + "</span>").join("");
      return '<a class="course" href="#/lib/' + g + "/" + slug(o.c) + '"><span class="bar-c" style="background:' + ccol(o.c) + '"></span><span class="txt"><b>' + esc(o.c) + '</b><span class="cnt">' + cnt + "</span></span>" + icon("chev", "chev") + "</a>";
    }).join("") + "</div>" : '<div class="card empty">Bu kurula henüz içerik eklenmedi. Ders dosyaları Drive’a yüklendikçe burada görünecek.</div>')
    + kurulSection(g, "test", k.no ? "Bu kuruldaki testler" : "Testler", "test")
    + (cx ? '<h2 class="sec" id="sec-cikmis">Çıkmışlar</h2><div class="card list"><a class="it" href="#/cikmis?g=' + g + '">' + kindBox("cikmis") + '<div class="txt"><div class="t">Kurul ' + esc(k.no) + ' çıkmışları</div><div class="m"><span>' + cx.rows.map(r => esc(r.c)).join(" · ") + "</span></div></div>" + icon("chev", "chev") + "</a></div>" : "")
    + "</div>";
  const sec = parseHash().q.get("s");
  if (sec) { const el = document.getElementById("sec-" + sec); if (el) el.scrollIntoView(); }
  bindOff();
}
function kurulSection(g, kind, title, id) {
  const its = S.cat.items.filter(i => i.g === g && i.k === kind && !i.cx);
  return its.length ? '<h2 class="sec" id="sec-' + id + '">' + title + '</h2><div class="card list">' + its.map(it => itemRow(it, { prefix: 1, noHoca: 1 })).join("") + "</div>" : "";
}
// Okuma durumu: rd[id] = {p: son sayfa, m: en ileri sayfa, ok: okundu işareti}
function rdSet(id, p, ok) {
  const R = Object.assign({}, PS.get("rd", {})), o = Object.assign({ p: 1, m: 0 }, R[id]);
  if (p) { o.p = p; o.m = Math.max(o.m || 0, p); }
  if (ok !== undefined) o.ok = ok ? 1 : 0;
  o.at = Date.now(); R[id] = o; PS.set("rd", R); return o;
}
const cxDeckN = deck => S.cat.items.filter(t => t.k === "test" && t.cx).reduce((a, t) => a + ((t.dk || []).find(d => d[0] === deck) || [0, 0])[1], 0);
function rdTag(it) {
  const o = PS.get("rd", {})[it.id];
  return o && o.ok ? '<span class="tag ok">' + icon("check") + "okundu</span>" : o && o.m > 1 ? '<span class="tag">' + (it.k === "slayt" ? "slayt " : "s. ") + o.m + "/" + it.n + "</span>" : "";
}
function viewCourse(g, cs) {
  const k = kurulById(g);
  const items = courseItems(g, cs);
  if (!k || !items.length) return notFound();
  setNav("k:" + g);
  const c = items[0].c, fk = g + "/" + cs;
  const F = S.filters[fk] || (S.filters[fk] = { h: "", k: "", q: "", by: "konu" });
  const hocas = Array.from(new Set(items.map(i => i.h).filter(Boolean)));
  const kinds = KORDER.filter(kk => items.some(i => i.k === kk));
  // Konu = slayt destesi; not/özet/video "kn" ile, test ağırlıklı destesiyle bağlanır
  const decks = items.filter(i => i.k === "slayt");
  const groups = decks.map(d => ({ d, its: [d] })), byDeck = new Map(groups.map(G => [G.d.id, G]));
  const multi = [], loose = [], cxs = [];
  items.forEach(it => {
    if (it.k === "slayt") return;
    if (it.k === "cikmis" || (it.k === "test" && it.cx)) { cxs.push(it); return; }
    if (it.k === "test") { const top = (it.dk || [])[0]; if (top && byDeck.has(top[0]) && top[1] >= 0.6 * (it.n || 1)) byDeck.get(top[0]).its.push(it); else multi.push(it); return; }
    const kn = [].concat(it.kn || []).filter(id => byDeck.has(id));
    if (kn.length) kn.forEach(id => byDeck.get(id).its.push(it)); else loose.push(it);
  });
  const okRow = it => (!F.h || it.h === F.h) && (!F.k || it.k === F.k);
  const qf = () => fold(F.q || "").trim();
  const hitT = (t, q) => !q || fold(t || "").includes(q);
  const grp = (title, its, extra, open) => {
    const q = qf(), vis = its.filter(okRow).filter(it => !q || hitT(title, q) || hitT(it.t, q) || hitT(it.h, q));
    if (!vis.length) return "";
    return '<div class="kgrp"><div class="kh"><b>' + esc(title) + "</b>" + (extra || "") + '</div><div class="card list">' + vis.map(it => itemRow(it, { noHoca: !!F.h, tag: it.k === "slayt" || it.k === "not" || it.k === "ozet" ? rdTag(it) : "" })).join("") + "</div></div>";
  };
  const render = () => {
    let rows = "";
    if (F.by === "konu") {
      rows = groups.sort((a, b) => (b.d.d || "").localeCompare(a.d.d || "")).map(G => {
        const n = deckQn(G.d.id), cx = cxDeckN(G.d.id);
        const hv = (G.d.hv || []).length;
        return grp(G.d.t, G.its, (cx ? '<span class="tag cx">' + icon("star") + "çıkmışta " + cx + " soru</span>" : "") + (hv ? '<span class="tag hv">' + icon("star") + "hoca " + hv + " yer vurguladı</span>" : "") + (n ? '<span class="tag">' + n + " soru</span>" : ""));
      }).join("")
        + grp("Birden çok konudan testler", multi) + grp(groups.length ? "Diğer notlar" : "Notlar ve dosyalar", loose) + grp("Çıkmışlar", cxs);
    } else {
      const q = qf(); let lastM = "";
      items.filter(okRow).filter(it => !q || hitT(it.t, q) || hitT(it.h, q)).forEach(it => {
        const m = it.dq ? "Tarihsiz" : it.d ? MONTHS[+it.d.slice(5, 7) - 1] + " " + it.d.slice(0, 4) : "";
        if (m !== lastM) { if (rows) rows += "</div>"; rows += '<div class="month">' + m + '</div><div class="card list">'; lastM = m; }
        rows += itemRow(it, { noHoca: !!F.h, tag: rdTag(it) });
      });
      if (rows) rows += "</div>";
    }
    $("#flt").innerHTML = '<div class="chips"><button class="chip' + (F.by === "konu" ? " on" : "") + '" data-f="by" data-v="konu">Konuya göre</button><button class="chip' + (F.by === "tarih" ? " on" : "") + '" data-f="by" data-v="tarih">Tarihe göre</button></div>'
      + (hocas.length > 1 ? '<div class="flabel">Hoca</div><div class="chips">' + chip("h", "", "Tümü", items.length) + hocas.map(h => chip("h", h, h, items.filter(i => i.h === h).length)).join("") + "</div>" : "")
      + (kinds.length > 1 ? '<div class="flabel">Tür</div><div class="chips">' + chip("k", "", "Tümü", null) + kinds.map(kk => chip("k", kk, KIND[kk].l, items.filter(i => i.k === kk && (!F.h || i.h === F.h)).length)).join("") + "</div>" : "");
    const pend = (S.cat.todo || []).filter(t => t.g === g && slug(t.c) === cs && (!F.k || t.kind === F.k) && (!F.h || t.h === F.h));
    if (pend.length && !qf()) rows += '<div class="month">Eklenmeyi bekleyen</div><div class="card list">' + pend.map(t => '<div class="it pend">' + kindBox(t.kind)
      + '<div class="txt"><div class="t">' + esc(t.t) + '</div><div class="m"><span>Drive’da · ' + Math.round((t.kb || 0) / 1024) + " MB</span><span>Dosya büyük olduğu için otomatik çekilemedi; sohbete ek olarak gönderilince eklenir.</span></div></div></div>").join("") + "</div>";
    $("#rows").innerHTML = rows || '<div class="card empty">' + (qf() ? "Başlıklarda “" + esc(F.q) + "” geçmiyor." : "Bu filtreye uyan öğe yok.") + "</div>";
  };
  // Ders içi arama: başlıkları süzer, slayt ve notların içinde geçen sayfaları da gösterir
  let tq = 0;
  const contentHits = async () => {
    const qv = (F.q || "").trim(), box = $("#chits"); if (!box) return;
    if (qv.length < 2) { box.innerHTML = ""; return; }
    const I = await loadIndex(); if ((F.q || "").trim() !== qv || !$("#chits")) return;
    const ids = new Set(items.map(i => i.id)), H = searchHits(I, qv, o => ids.has(o.id));
    box.innerHTML = H.docs.length ? '<h2 class="sec">İçerikte geçenler · ' + H.docs.reduce((a, d) => a + d.pages.length, 0) + " sayfa</h2>" + docHitsHTML(H, 8) : "";
  };
  const chip = (f, v, l, n) => '<button class="chip' + (F[f] === v ? " on" : "") + '" data-f="' + f + '" data-v="' + esc(v) + '">' + esc(l) + (n != null ? '<span class="n">' + n + "</span>" : "") + "</button>";
  main().innerHTML = bar({ title: c, crumb: crumbFor(g, null), back: "#/lib/" + g })
    + '<div class="page"><div class="sbox csrch">' + icon("search") + '<input id="cq" type="search" placeholder="Bu derste ara: konu, başlık ya da slayttaki bir kelime" autocomplete="off" value="' + esc(F.q || "") + '"></div>'
    + '<div class="filters" id="flt"></div><div id="rows"></div><div id="chits"></div></div>';
  $("#flt").addEventListener("click", e => { const b = e.target.closest("[data-f]"); if (!b) return; F[b.dataset.f] = b.dataset.v; render(); });
  $("#cq").addEventListener("input", e => { F.q = e.target.value; render(); clearTimeout(tq); tq = setTimeout(contentHits, 260); });
  render(); if (F.q) contentHits();
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
// Hocanın derste vurguladığı yerler (ses kaydı dökümünden; katalogda it.hv = [{p, t: "dk:sn", s: ses dosyası, n: not, q: 1 = "soru olarak geldi" dedi}])
const hvList = (it, p) => (it.hv || []).filter(h => !p || h.p === p).sort((a, b) => a.p - b.p);
function hvBadge(it, p) {
  const L = hvList(it, p);
  return L.length ? ' <button class="hvb" data-hv="' + p + '">' + icon("star") + (L.some(h => h.q) ? "Hoca: soru olarak geldi" : "Hoca vurguladı") + "</button>" : "";
}
function hvRows(it, L, jump) {
  return L.map(h => (jump ? '<button class="hvr" data-hvp="' + h.p + '">' : '<div class="hvr">')
    + '<b>' + (it.k === "slayt" ? "Slayt " : "Sayfa ") + h.p + (h.q ? ' <span class="tag cx">' + icon("star") + "soru olarak geldi</span>" : "") + "</b><span>" + esc(h.n) + '</span><small>Ses kaydı: ' + esc(h.s) + ", " + esc(h.t) + "</small>" + (jump ? "</button>" : "</div>")).join("");
}
function hvSheet(it, p) {
  sheet("<h3>Hoca derste vurguladı</h3>" + hvRows(it, hvList(it, p)) + '<p class="muted small">Ders kaydının yapay zekâ dökümünden; döküm birebir değil, slaytla karşılaştırılarak yazıldı.</p><div class="row-btns" style="margin-top:10px"><button class="btn" data-close>Kapat</button></div>');
}
function mountDoc(el, it, page, opts) {
  opts = opts || {};
  const hl = new Set(opts.highlight || []);
  // est: true (hepsi tahmini) ya da tahmini sayfaların kümesi
  const isEst = p => opts.est instanceof Set ? opts.est.has(p) : !!opts.est;
  const hls = Array.from(hl).sort((a, b) => a - b);
  let html = hls.length > 1 ? '<div class="hlnav"><div><button type="button" class="ibtn" data-hn="-1" aria-label="Önceki işaretli sayfa">' + icon("back") + '</button><span>İşaretli <b class="hli">–</b> / ' + hls.length + '</span><button type="button" class="ibtn" data-hn="1" aria-label="Sonraki işaretli sayfa">' + icon("back") + "</button></div></div>" : "";
  for (let p = 1; p <= it.n; p++) {
    // sayfa numarası ve "soruyla ilgili" etiketi görselin üstüne değil altına yazılır
    html += '<figure class="pg' + ((it.r || 1.333) < 1 ? " portrait" : "") + (hl.has(p) ? " hl" : "") + '" data-p="' + p + '"><div class="pgi"><div class="ph" style="--ar:' + (it.r || 1.333) + '">' + p + "</div></div>"
      + '<figcaption class="pn">' + p + " / " + it.n + (hl.has(p) ? ' <b class="hlt">' + (isEst(p) ? "tahmini sayfa" : "soruyla ilgili") + "</b>" : "") + hvBadge(it, p) + "</figcaption></figure>";
  }
  el.innerHTML = html + (opts.foot || "");
  el.querySelectorAll("[data-hv]").forEach(b => b.onclick = e => { e.stopPropagation(); hvSheet(it, +b.dataset.hv); });
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
    hlLbl();
  };
  const hlLbl = () => { const b = el.querySelector(".hli"); if (b) { const i = hls.filter(x => x <= curP).length; b.textContent = hls.includes(curP) || i ? String(i || 1) : "–"; } };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(calc); };
  el.addEventListener("scroll", onScroll, { passive: true });
  figs.forEach(f => io.observe(f));
  const goto = (p, smooth) => { const f = el.querySelector('[data-p="' + Math.min(Math.max(p, 1), it.n) + '"]'); if (f) { loadP(f); el.scrollTo({ top: f.offsetTop - 8, behavior: smooth ? "smooth" : "auto" }); } };
  requestAnimationFrame(() => { goto(page); hlLbl(); });
  el.querySelectorAll("[data-hn]").forEach(b => b.onclick = () => {
    const d = +b.dataset.hn, t = d > 0 ? hls.find(x => x > curP) : hls.slice().reverse().find(x => x < curP);
    if (t) { curP = t; goto(t, true); opts.onPage && opts.onPage(t); hlLbl(); } else toast(d > 0 ? "Son işaretli sayfadasın" : "İlk işaretli sayfadasın");
  });
  const reload = p => {
    const f = el.querySelector('[data-p="' + p + '"]'); if (!f) return;
    const img = f.querySelector("img"); if (img) { const ph = document.createElement("div"); ph.className = "ph"; ph.style.setProperty("--ar", img.naturalWidth / img.naturalHeight); img.replaceWith(ph); }
    f.dataset.l = ""; loadP(f);
  };
  return { goto, reload, destroy() { io.disconnect(); el.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); }, get page() { return curP; } };
}
/* ---------- cihaza indir: sayfa görsellerinden PDF (cihazda yapılır, internete bir şey gitmez) ---------- */
async function docPDF(it, prog) {
  const E = new TextEncoder(), parts = [], off = [];
  let len = 0;
  const put = x => { const u = typeof x === "string" ? E.encode(x) : x; parts.push(u); len += u.length; };
  put("%PDF-1.4\n"); put(new Uint8Array([37, 226, 227, 207, 211, 10]));
  const R = PS.get("rot", {}), kids = [];
  for (let p = 1; p <= it.n; p++) {
    prog && prog(p);
    const bmp = await createImageBitmap(new Blob([await fetchBlob("d/" + it.x + "/" + p, it.v)], { type: "image/webp" }));
    const a = (R[it.x + "/" + p] || {}).a || 0, side = a % 180 !== 0;
    const c = document.createElement("canvas"); c.width = side ? bmp.height : bmp.width; c.height = side ? bmp.width : bmp.height;
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
    g.translate(c.width / 2, c.height / 2); g.rotate(a * Math.PI / 180); g.drawImage(bmp, -bmp.width / 2, -bmp.height / 2); bmp.close && bmp.close();
    const jb = new Uint8Array(await (await new Promise(r => c.toBlob(r, "image/jpeg", 0.86))).arrayBuffer());
    const pw = c.width >= c.height ? 842 : 595, ph = Math.round(pw * c.height / c.width * 100) / 100;
    const n = 3 + (p - 1) * 3, cs = "q " + pw + " 0 0 " + ph + " 0 0 cm /I Do Q";
    off[n] = len; put(n + " 0 obj\n<< /Type /XObject /Subtype /Image /Width " + c.width + " /Height " + c.height + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + jb.length + " >>\nstream\n"); put(jb); put("\nendstream\nendobj\n");
    off[n + 1] = len; put((n + 1) + " 0 obj\n<< /Length " + cs.length + " >>\nstream\n" + cs + "\nendstream\nendobj\n");
    off[n + 2] = len; put((n + 2) + " 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + pw + " " + ph + "] /Resources << /XObject << /I " + n + " 0 R >> >> /Contents " + (n + 1) + " 0 R >>\nendobj\n");
    kids.push((n + 2) + " 0 R");
  }
  off[1] = len; put("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  off[2] = len; put("2 0 obj\n<< /Type /Pages /Kids [" + kids.join(" ") + "] /Count " + kids.length + " >>\nendobj\n");
  const N = off.length, x = len;
  put("xref\n0 " + N + "\n0000000000 65535 f \n" + off.slice(1).map(o => String(o).padStart(10, "0") + " 00000 n \n").join(""));
  put("trailer\n<< /Size " + N + " /Root 1 0 R >>\nstartxref\n" + x + "\n%%EOF\n");
  return new Blob(parts, { type: "application/pdf" });
}
async function docDownload(it, btn) {
  if (btn.disabled) return;
  btn.disabled = true;
  try {
    const blob = await docPDF(it, p => toast("PDF hazırlanıyor · " + p + " / " + it.n, null, null, 60000));
    const name = (it.t || "MedLock").replace(/[\\/:*?"<>|]+/g, " ").trim() + ".pdf";
    const u = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 120000);
    toast("İndirildi: " + name + " (İndirilenler klasörü)");
  } catch (e) { logErr(e, "pdf"); toast("PDF hazırlanamadı" + (navigator.onLine ? "" : ": internet yok, sayfalar önbellekte değil")); }
  btn.disabled = false;
}
function viewDoc(id, page, q) {
  const it = S.byId[id];
  if (!it || it.k === "test" || it.k === "kart") return notFound();
  setNav("lib", true);
  const k = kurulById(it.g);
  const back = "#/lib/" + it.g + "/" + slug(it.c);
  main().innerHTML = '<div class="fill">' + bar({
    title: it.t, solid: 1, back, crumb: crumbFor(it.g, it.c),
    actions: (S.cat.lat && (S.cat.lat.ids || []).includes(it.id) ? '<button class="ibtn" id="latb" title="Bu sayfadaki Latince terimler">' + icon("lex") + "</button>" : "") + '<button class="ibtn" id="fsb" title="Tam ekran" aria-label="Tam ekran">' + icon("full") + '</button><button class="ibtn" id="zmb" title="Yakınlaştır">' + icon("zoom") + '</button><button class="ibtn" id="rotb" title="Sayfayı döndür">' + icon("rot") + '</button><button class="ibtn" id="bmb" title="Bu sayfayı işaretle">' + icon(bmHas(it.id, page) ? "bmf" : "bm") + '</button><button class="ibtn" id="dlb" title="Cihaza indir (PDF)" aria-label="Cihaza indir">' + icon("dl") + '</button><button class="pgc" id="pgc">' + page + " / " + it.n + "</button>",
  }) + '<div class="doc" id="doc" tabindex="-1"></div></div>';
  const rel = S.cat.items.filter(t => t.k === "test" && (t.dk || []).some(d => d[0] === it.id));
  const first = !PS.get("rd", {})[it.id], nq = deckQn(it.id), canRead = it.k !== "cikmis" && it.k !== "soru";
  const hvL = hvList(it);
  const foot = '<div class="doc-foot">'
    + (hvL.length ? '<b>Hocanın derste vurguladıkları</b><div class="hvl">' + hvRows(it, hvL, 1) + "</div>" : "")
    + (canRead || nq ? '<div class="rdrow">' + (canRead ? '<button class="btn" id="rdok"></button>' : "")
      + (nq ? '<button class="btn" id="dq10">' + icon("test") + "Bu " + (it.k === "slayt" ? "desteden" : "dosyadan") + " " + Math.min(10, nq) + " soru</button>" : "") + "</div>" : "")
    + (rel.length ? '<b>Bu ' + (it.k === "slayt" ? "slayttan" : "dosyadan") + " soru olan testler</b><div class=\"row-btns\">"
      + rel.map(t => '<a class="btn" href="#/t/' + t.id + '">' + icon("test") + esc(t.c === it.c ? t.t : t.c + " · " + t.t) + ' <span class="muted">' + (t.dk.find(d => d[0] === it.id)[1]) + " soru</span></a>").join("") + "</div>" : "")
    + "</div>";
  const hraw = (q && q.get("h") || "").split(",").filter(Boolean);
  const hl = hraw.map(x => +x.replace("~", "")).filter(Boolean), hest = new Set(hraw.filter(x => x[0] === "~").map(x => +x.slice(1)));
  let saveT = 0;
  const V = mountDoc($("#doc"), it, page, {
    highlight: hl, est: q && q.get("e") === "1" ? true : hest, foot,
    onPage: p => {
      $("#pgc").textContent = p + " / " + it.n;
      $("#bmb").innerHTML = icon(bmHas(it.id, p) ? "bmf" : "bm");
      clearTimeout(saveT);
      // sayfa adresi yazılmadan başka yere geçildiyse yazma (yoksa yol düğmesine basınca slayta geri döner)
      saveT = setTimeout(() => { if (!location.hash.startsWith("#/d/" + it.id + "/")) return; replaceHash("#/d/" + it.id + "/" + p + (hl.length ? "?" + q.toString() : "")); setLast("doc", { id: it.id, p }); rdSet(it.id, p); }, 400);
    },
  });
  setLast("doc", { id: it.id, p: page }); rdSet(it.id, page);
  fsBind();
  $("#dlb").onclick = () => docDownload(it, $("#dlb"));
  $$("[data-hvp]").forEach(b => b.onclick = () => V.goto(+b.dataset.hvp, true));
  S.cleanup.push(() => { clearTimeout(saveT); V.destroy(); });
  // Okudum işareti ve deste testi (sayfaların sonunda)
  const rb = $("#rdok"), drawRd = () => { const ok = (PS.get("rd", {})[it.id] || {}).ok; rb.className = "btn" + (ok ? " done" : " primary"); rb.innerHTML = icon("check") + (ok ? "Okundu" : "Okudum"); };
  if (rb) { drawRd(); rb.onclick = () => { const ok = !(PS.get("rd", {})[it.id] || {}).ok; rdSet(it.id, null, ok); drawRd(); toast(ok ? "Okundu olarak işaretlendi" : "İşaret kaldırıldı"); }; }
  const dq = $("#dq10"); if (dq) dq.onclick = () => { dq.disabled = true; startDeckQuiz(it.id, 10).finally(() => { dq.disabled = false; }); };
  // Ön test: deste ilk kez açılınca, sorusu varsa okumadan önce 5 soru (isteğe bağlı)
  if (first && it.k === "slayt" && nq >= 5) {
    $("#doc").insertAdjacentHTML("beforebegin", '<div class="pretest"><span class="txt"><b>Okumadan önce 5 soru?</b><small>Bilmemen normal: önce denemek, okuyunca daha iyi akılda kalmasını sağlar. İsteğe bağlı.</small></span>'
      + '<button class="btn primary sm" id="ptgo">Dene</button><button class="ibtn" id="ptx" aria-label="Kapat">' + icon("close") + "</button></div>");
    $("#ptgo").onclick = () => startDeckQuiz(it.id, 5, true);
    $("#ptx").onclick = () => $(".pretest").remove();
  }
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
function openSlide(docId, pages, est, start) {
  start = start || pages[0];
  const isEst = p => est instanceof Set ? est.has(p) : !!est;
  const hq = pages.map(p => (isEst(p) && est instanceof Set ? "~" : "") + p).join(",") + (est === true ? "&e=1" : "");
  const it = S.byId[docId];
  if (!it) return toast("Bu kaynak henüz kütüphanede yok.");
  const wasOpen = $("#spane") && !$("#spane").hidden;
  closeSlide(true);
  let pane = $("#spane");
  if (!pane) { pane = document.createElement("aside"); pane.className = "spane"; pane.id = "spane"; pane.dataset.float = "1"; document.body.appendChild(pane); }
  pane.hidden = false;
  pane.innerHTML = '<div class="shead"><button class="ibtn" data-sclose aria-label="Kapat">' + icon(innerWidth < 900 ? "back" : "close") + '</button><div class="t">' + esc(it.t)
    + "<small>" + (est === true ? "Tahmini " : "") + (it.k === "slayt" ? "slayt " : "sayfa ") + esc(pages.length > 6 ? pages.length + " sayfa işaretli" : pages.map(p => (isEst(p) && est instanceof Set ? "~" : "") + p).join(", ")) + " · " + esc(it.c) + '</small></div><a class="ibtn" href="#/d/' + it.id + "/" + start + "?h=" + hq + '" title="Tam ekran aç">' + icon("expand") + '</a></div><div class="doc"></div>';
  pane._v = mountDoc($(".doc", pane), it, start, { highlight: pages, est });
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
/* ---------- tam ekran (slayt ve test) ----------
   Üst çubuk, alt sekmeler ve yan menü gizlenir; sağ üstte çıkış düğmesi. Geri tuşu önce tam ekrandan çıkar (ovOpen). */
let FS = null;
function fsBind() { const b = $("#fsb"); if (b) b.onclick = fsEnter; S.cleanup.push(() => fsExit(true)); }
function fsFrame(on) { const fr = $(".tpane iframe"); try { if (fr && fr.contentDocument) fr.contentDocument.documentElement.classList.toggle("mlfs", on); } catch (e) {} }
function fsEnter() {
  if (FS) return;
  const sh = $("#shell"); if (!sh) return;
  sh.classList.add("fs");
  const x = document.createElement("button");
  x.type = "button"; x.className = "fsx"; x.title = "Tam ekrandan çık"; x.setAttribute("aria-label", "Tam ekrandan çık"); x.innerHTML = icon("unfull");
  x.onclick = () => fsExit(false);
  document.body.appendChild(x);
  fsFrame(true);
  try { const de = document.documentElement, p = de.requestFullscreen && de.requestFullscreen({ navigationUI: "hide" }); if (p && p.catch) p.catch(() => {}); } catch (e) {}
  FS = { x, tok: null };
  FS.tok = ovOpen(() => fsExit(true));
}
function fsExit(fromPop) {
  if (!FS) return;
  const f = FS; FS = null;
  const sh = $("#shell"); if (sh) sh.classList.remove("fs");
  f.x.remove(); fsFrame(false);
  if (document.fullscreenElement) { try { const p = document.exitFullscreen(); if (p && p.catch) p.catch(() => {}); } catch (e) {} }
  if (!fromPop) ovDone(f.tok); else { const i = OV.indexOf(f.tok); if (i >= 0) OV.splice(i, 1); }
}
document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && FS) fsExit(false); });
window.MLBridge = function (win) {
  const C = S.cur;
  if (!C) return null;
  win.addEventListener("error", e => logErr(e.error || e.message, "test"));
  win.addEventListener("click", e => {
    const fz = e.target.closest && e.target.closest("[data-mlfz],[data-mlfs],[data-mlfsave],[data-mlfedit]");
    if (fz) { e.preventDefault(); return fbClick(C, fz); }
    const rb = e.target.closest && e.target.closest("[data-mlr]");
    if (rb) { e.preventDefault(); return reportQ(C, rb.dataset.mlr); }
    const gb = e.target.closest && e.target.closest("[data-mlg]");
    if (gb) { e.preventDefault(); guessAdd(C, gb.dataset.mlg); gb.outerHTML = '<span class="ml-rep ml-gsd">Tekrar listesine eklendi · yarın sorulacak</span>'; return; }
    const ob = e.target.closest && e.target.closest("[data-mlo]");
    if (ob) { e.preventDefault(); return navTo("#/d/" + ob.dataset.mlo + "/" + (ob.dataset.mlp || 1) + "?h=" + (ob.dataset.mlp || 1)); }
    const b = e.target.closest && e.target.closest("[data-ml],[data-mld]");
    if (!b) return;
    e.preventDefault();
    if (b.dataset.ml) { const r = C.blob.refs[b.dataset.ml]; if (r) openSlide(r[0], r[1], r[2]); }
    else if (b.dataset.mlh) {
      const h = b.dataset.mlh.split(",");
      openSlide(b.dataset.mld, h.map(x => +x.replace("~", "")), new Set(h.filter(x => x[0] === "~").map(x => +x.slice(1))), +b.dataset.mlp);
    } else openSlide(b.dataset.mld, b.dataset.mlp.split(",").map(Number), b.dataset.est === "1");
  });
  return {
    btn(qid) {
      const r = C.blob.refs[qid], d = r && S.byId[r[0]];
      if (!d) return cxOrig(C.byQ[qid]);
      return '<button type="button" class="ml-go" data-ml="' + esc(qid) + '">' + icon("slide", "ml-ic") + '<span class="ml-t">Slayta git<small>' + esc(d.t) + " · " + (r[2] ? "tahmini " : "") + pagesLabel(d, r[1]) + '</small></span><span class="ml-arrow">→</span></button>' + cxOrig(C.byQ[qid]);
    },
    guess(qid) { return (C.guessed || (C.guessed = new Set())).has(qid) ? '<span class="ml-rep ml-gsd">Tekrar listesine eklendi · yarın sorulacak</span>' : '<button type="button" class="ml-rep ml-gss" data-mlg="' + esc(qid) + '" title="Doğru ama emin değildim">Tahmin ettim · tekrara ekle</button>'; },
    ozet(ids, t) { return ozetLink(C, ids, t); },
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
        const ps = Array.from(o.pages.entries()).sort((a, b) => a[0] - b[0]);
        const all = ps.map(([p, est]) => (est ? "~" : "") + p).join(",");
        const chips = ps.map(([p, est]) =>
          '<button type="button" class="ml-chip' + (est ? " est" : "") + '" data-mld="' + id + '" data-mlp="' + p + '" data-mlh="' + all + '">' + (est ? "~" : "") + p + "</button>").join("");
        return '<div class="ml-deck"><b>' + esc(d.t) + '<span class="ml-n">' + o.n + " soru</span></b><div class=\"ml-chips\">" + chips
          + (ps.length > 1 ? '<button type="button" class="ml-chip ml-all" data-mld="' + id + '" data-mlp="' + ps[0][0] + '" data-mlh="' + all + '">Hepsi · ' + ps.length + " sayfa →</button>" : "") + "</div></div>";
      }).join("");
      return '<div class="panel"><h2>Bakman gereken slaytlar</h2><div class="ml-decks">' + rows + '</div><p class="ml-note">Numaraya dokununca deste o sayfada açılır; bu destedeki bütün işaretli sayfalar vurgulu olur, üstteki ‹ › ile aralarında geçersin. Kesikli çerçeveli (~) numaralar tahminidir.</p></div>';
    },
    rep(qid) { return '<button type="button" class="ml-rep" data-mlr="' + esc(qid) + '">⚑ Hata bildir</button>'; },
    fb(run, ok, n) { return fbPanel(C, run, ok, n); },
    save(state) { onEngineSave(C, state); },
  };
};
// Çıkmış sorusunun açıklamasındaki "Çıkmışın aslı: <PDF adı>, sayfa N" dokunulabilir olsun
function cxOrig(q) {
  const m = q && String(q.e || "").replace(/<[^>]+>/g, " ").match(/Çıkmışın asl[ıi]\s*:\s*([^,]+?),\s*(?:sayfa|s\.)\s*(\d+)/);
  if (!m) return "";
  const t = fold(m[1].trim()), d = S.cat.items.find(i => i.k === "cikmis" && fold(i.t) === t) || S.cat.items.find(i => i.k === "cikmis" && fold(i.t).startsWith(t.slice(0, 18)));
  if (!d) return "";
  return '<button type="button" class="ml-go ml-cx" data-mld="' + d.id + '" data-mlp="' + m[2] + '" data-est="0">' + icon("star", "ml-ic") + '<span class="ml-t">Çıkmışın aslı<small>' + esc(d.t) + " · sayfa " + m[2] + '</small></span><span class="ml-arrow">→</span></button>';
}
// Doğru ama tahminle bilinen soru tekrar listesine girer (yarın sorulur, aralık uzamaz)
function guessAdd(C, qid) {
  const key = C.src ? C.src[qid] : C.it.id + "|" + qid, st = srsLoad(), e = Object.assign({ b: 0, w: 0, t: Date.now() }, st[key]);
  e.m = 0; e.due = addDays(today(), 1); e.u = Date.now(); st[key] = e; srsSave(st); updateBadge();
  (C.guessed || (C.guessed = new Set())).add(qid);
}
// Zayıf konunun yanında "özetten oku": konunun sorularının destesine bağlı özet (yoksa not, yoksa deste), konu adının geçtiği sayfa
const docsFor = deckId => S.cat.items.filter(i => (i.k === "ozet" || i.k === "not") && [].concat(i.kn || []).includes(deckId)).sort((a, b) => (a.k === "ozet" ? 0 : 1) - (b.k === "ozet" ? 0 : 1) || (b.d || "").localeCompare(a.d || ""));
function bestPage(it, words) {
  const T = S.texts[it.id]; if (!T || !words.length) return 1;
  // her kelime: geçiyorsa 1 + sıklık payı (giriş sayfası her konuyu bir kez anar; konunun anlatıldığı sayfa öne çıksın)
  let best = 1, bs = 0; T.forEach((x, i) => { const f = fold(String(x || "")); const sc = words.reduce((a, w) => { const c = f.split(w).length - 1; return a + (c ? 1 + Math.min(c, 9) / 3 : 0); }, 0); if (sc > bs) { bs = sc; best = i + 1; } });
  return best;
}
function ozetLink(C, ids, t) {
  const cnt = new Map(); (ids || []).forEach(id => { const r = C.blob.refs[id]; if (r) cnt.set(r[0], (cnt.get(r[0]) || 0) + 1); });
  const deck = Array.from(cnt.entries()).sort((a, b) => b[1] - a[1]).map(x => x[0])[0];
  if (!deck || !S.byId[deck]) return "";
  const o = docsFor(deck)[0], target = o || S.byId[deck];
  const p = bestPage(target, tnorm(t).split(" ").filter(w => w.length > 3).map(w => w.slice(0, 6)));
  return ' <button type="button" class="ml-ozet" data-mlo="' + target.id + '" data-mlp="' + p + '">' + (o ? (o.k === "ozet" ? "özetten oku" : "nottan oku") : "slayttan oku") + " →</button>";
}
// Test açılınca konuların özet/not metinleri arka planda yüklenir ("özetten oku" doğru sayfayı bulsun)
function preloadOzet(it) { (it.dk || []).forEach(([deck]) => { const o = docsFor(deck)[0] || S.byId[deck]; if (o && o.x) loadTexts(o).catch(() => {}); }); }
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
  // Her cevap bir kez sayılır: denemede sayılanlar r.mlc'de durur (eskiden soru başına son deneme tutuluyordu;
  // tekrarda çözülen soru, deneme yeniden kaydedilince bir daha sayılıyordu)
  if (!r.mlc) r.mlc = r.mode === "study" || r.finished ? r.ids.filter(id => r.ans[id] !== undefined) : [];   // 1.2'den önce başlamış deneme
  const srs = srsLoad(), qh = Object.assign({}, PS.get("qh", {})), td = today();
  let ch = false, chq = false, nNew = 0;
  r.ids.forEach(id => {
    const q = C.byQ[id], a = r.ans[id];
    if (!q || a === undefined || !(r.finished || r.mode === "study")) return;
    const key = C.src ? C.src[id] : C.it.id + "|" + id;
    if (r.mlc.indexOf(id) < 0) {
      r.mlc.push(id); nNew++; chq = true;
      qhRecord(qh, key, a === q.a, { t: q.t, c: C.srcC ? C.srcC[id] : C.it.c });
    }
    if (a === q.a) {                             // doğrular tekrar listesine girmez; "emin değilim" dediysen girer (Tahmin ettim gibi, yarın)
      if (r.uns && r.uns[id]) { const e = srs[key]; if (!(e && e.r === r.mlid)) { srs[key] = Object.assign({ b: 0, w: 0, t: Date.now() }, e, { m: 0, due: addDays(td, 1), u: Date.now(), r: r.mlid }); ch = true; } }
      return;
    }
    const e = srs[key];
    if (e && e.r === r.mlid) return;
    srs[key] = { b: 0, due: addDays(td, 1), w: (e ? e.w : 0) + 1, r: r.mlid, t: Date.now(), u: Date.now() };
    ch = true;
  });
  if (chq) { PS.set("qh", qh); PS.set("days", addDayAnswers(Object.assign({}, PS.get("days", {})), nNew)); }
  if (ch) { srsSave(srs); updateBadge(); }
  const eng = Object.assign({}, PS.get("eng", {}));
  eng[C.ekey] = { at: Date.now(), s: JSON.parse(JSON.stringify(st)) };
  PS.set("eng", eng);
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
    data.push(Object.assign({}, q, { id: nid, t: tname(S.byId[tid].c, q.t) }));
    if (b.refs && b.refs[qid]) refs[nid] = b.refs[qid];
    src[nid] = tid + "|" + qid; srcC[nid] = S.byId[tid].c;
    b.cfg.courses.forEach(c => { if (!courses.has(c.code)) courses.set(c.code, c); });
  });
  const cfg = { key: M.k, title: M.t, sub: data.length + " soru", eyebrow: NAME + " · karma deneme", lede: M.d || "", courses: Array.from(courses.values()), perQuestion: 1, autostart: M.auto ? Object.assign({ label: M.t }, M.auto) : null };
  return { blob: { cfg, data, refs }, src, srcC };
}
async function viewTest(id) {
  let it, blob, extra = {}, back;
  if (id === "mix") {
    const M = PS.get("mix", null);
    if (!M) return notFound();
    it = { id: "mix", k: "test", t: M.t, c: M.c || "Karma", g: M.g || "", n: M.ids.length, h: "", back: M.back };
    back = M.back || "#/karma";
  } else {
    it = S.byId[id];
    if (!it || it.k !== "test") return notFound();
    back = "#/lib/" + it.g + "/" + slug(it.c);
  }
  setNav("lib", true);
  main().innerHTML = '<div class="fill">' + bar({
    title: it.t, solid: 1, back, crumb: id === "mix" ? crumbs([[it.back ? "Desteye dön" : "Karma deneme", it.back || "#/karma"], [it.c, ""]]) : it.cx ? crumbs([["Tıp", "#/lib"], ["Çıkmışlar", "#/cikmis?g=" + it.g], [it.c, "#/lib/" + it.g + "/" + slug(it.c)]]) : crumbFor(it.g, it.c),
    actions: '<button class="ibtn" id="fsb" title="Tam ekran">' + icon("full") + "</button>" + (id === "mix" ? "" : '<button class="ibtn" id="tinfo" title="Testin kaynakları">' + icon("info") + "</button>"),
  }) + '<div class="tsplit"><div class="tpane"><div class="loading"><div><div class="spin"></div>Test açılıyor…</div></div></div><aside class="spane" id="spane" hidden></aside></div></div>';
  if (id === "mix") { const m = await mixBlob(PS.get("mix", null)); blob = m.blob; extra = { mix: 1, src: m.src, srcC: m.srcC }; }
  else {                                            // konu adları her yerde aynı (tname); önbellekteki test değişmez
    blob = await loadTest(it);
    blob = Object.assign({}, blob, { data: blob.data.map(q => { const t = tname(it.c, q.t); return t === q.t ? q : Object.assign({}, q, { t }); }) });
  }
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
  fr.srcdoc = tpl.replace("/*ML_DATA*/", () => "const CFG = " + jsLit(Object.assign({}, blob.cfg, { key: ekey, perQuestion: 1 })) + ";\nconst DATA = " + jsLit(blob.data));
  if (id === "mix") new Set(blob.data.map(q => (blob.refs[q.id] || [])[0]).filter(Boolean)).forEach(d => preloadOzet({ dk: [[d]] })); else preloadOzet(it);
  fr.addEventListener("load", () => { if (FS) fsFrame(true); });
  $(".tpane").replaceChildren(fr);
  const ti = $("#tinfo"); if (ti) ti.onclick = () => testInfo(it);
  fsBind();
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

/* ---------- test sonu yorumu (hata bildirimleriyle birlikte birikir) ---------- */
const FBZ = ["Kolay", "Uygun", "Zor"];
const FBS = ["Kaynağa uygundu", "Kaynakta olmayan soru vardı", "Fazla ayrıntıcı", "Cevap şıktan belli oluyordu", "Açıklamalar yetersiz"];
const fbKey = (C, run) => (C.it.id || "mix") + "|fb:" + run;
function fbPanel(C, run, ok, n, edit) {
  const cur = PS.get("rep", {})[fbKey(C, run)], old = cur && !cur.x ? cur : null, sc = old && old.sc ? old.sc : ok + "/" + n;
  const head = '<div class="panel ml-fb" data-run="' + run + '" data-sc="' + sc + '"><h2>Test nasıldı?</h2>';
  if (old && !edit) return head + '<p class="ml-done">Yorumun kaydedildi' + (old.z ? " · " + esc(old.z) : "") + (old.s && old.s.length ? " · " + esc(old.s.join(", ")) : "") + "</p>"
    + (old.n ? '<p class="ml-note">' + esc(old.n) + "</p>" : "") + '<button type="button" class="ml-rep" data-mlfedit="1">Düzenle</button></div>';
  const z = old ? old.z : "", ss = old ? old.s || [] : [];
  return head
    + '<div class="ml-fq"><span>Zorluk</span><div class="ml-chips">' + FBZ.map(x => '<button type="button" class="ml-chip' + (z === x ? " on" : "") + '" data-mlfz="' + x + '">' + x + "</button>").join("") + "</div></div>"
    + '<div class="ml-fq"><span>Sorular</span><div class="ml-chips">' + FBS.map(x => '<button type="button" class="ml-chip' + (ss.includes(x) ? " on" : "") + '" data-mlfs="' + x + '">' + x + "</button>").join("") + "</div></div>"
    + '<textarea rows="2" maxlength="800" placeholder="İstersen kısaca yaz: neyi beğendin, ne eksikti?">' + esc(old ? old.n || "" : "") + "</textarea>"
    + '<button type="button" class="btn ml-fsave" data-mlfsave="1">Kaydet</button>'
    + '<p class="ml-note">Ayarlar › Hata bildirimleri’nde birikir; oradan kopyalayıp Claude’a yapıştırırsın.</p></div>';
}
function fbClick(C, el) {
  const box = el.closest(".ml-fb"); if (!box) return;
  const run = box.dataset.run, [ok, n] = (box.dataset.sc || "0/0").split("/");
  if (el.dataset.mlfz) { box.querySelectorAll("[data-mlfz]").forEach(b => b.classList.toggle("on", b === el && !el.classList.contains("on"))); return; }
  if (el.dataset.mlfs) { el.classList.toggle("on"); return; }
  if (el.dataset.mlfedit) { box.outerHTML = fbPanel(C, run, ok, n, true); return; }
  const z = (box.querySelector("[data-mlfz].on") || {}).textContent || "", s = Array.from(box.querySelectorAll("[data-mlfs].on")).map(b => b.textContent), note = box.querySelector("textarea").value.trim();
  if (!z && !s.length && !note) return toast("Bir şey seç ya da yaz");
  const M = Object.assign({}, PS.get("rep", {}));
  M[fbKey(C, run)] = { k: "fb", tid: C.it.id || "mix", qid: "fb:" + run, t: C.it.t, c: C.it.c, sc: box.dataset.sc, z, s, n: note, at: Date.now(), x: 0 };
  PS.set("rep", M);
  box.outerHTML = fbPanel(C, run, ok, n);
  toast("Yorum kaydedildi");
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
    if (r.k === "fb") {
      L.push((i + 1) + ") Test yorumu · " + r.c + " · " + r.t + " [" + r.tid + "]" + (r.sc ? " · sonuç " + r.sc : ""));
      if (r.z) L.push("   Zorluk: " + r.z); if (r.s && r.s.length) L.push("   Sorular: " + r.s.join(", ")); if (r.n) L.push("   Not: " + r.n); L.push(""); return;
    }
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
  const s = srsLoad(), t = today(), keys = Object.keys(s), X = upcomingExams(EXW), X7 = upcomingExams(7);
  const back = k => finalBack(s[k]) || !!examBackKey(k, s[k], X);
  const active = keys.filter(k => (!s[k].m || back(k)) && srsKeyItem(k));
  const due = active.filter(k => s[k].due <= t || back(k));
  const fb = active.filter(k => finalBack(s[k])).length, xb = active.filter(k => !finalBack(s[k]) && examBackKey(k, s[k], X)).length;
  const tomorrow = active.filter(k => !back(k) && s[k].due === addDays(t, 1)).length;
  const week = active.filter(k => !back(k) && s[k].due > t && s[k].due <= addDays(t, 7)).length;
  const learned = keys.filter(k => s[k].m).length;
  const exDue = X7.map(x => ({ x, n: due.filter(k => x.has(srsKeyItem(k))).length })).filter(o => o.n);
  const byC = new Map();
  active.forEach(k => { const it = srsKeyItem(k); const key = it.c; if (!byC.has(key)) byC.set(key, { due: 0, all: 0 }); const o = byC.get(key); o.all++; if (s[k].due <= t || back(k)) o.due++; });
  main().innerHTML = bar({ title: "Tekrar", crumb: "Yanlış yaptığın ve tahmin ettiğin sorular" }) + '<div class="page narrow">'
    + (fb ? '<div class="card fnote"><b>Final dönemi</b> · Daha önce öğrendiğin ' + fb + " soru bir kez daha soruluyor. Doğru bilirsen yine öğrenildi sayılır.</div>" : "")
    + (xb ? '<div class="card fnote"><b>Sınav öncesi son tur</b> · ' + X.map(x => esc(x.label) + " (" + fdate(x.d) + ")").join(", ") + ": öğrendiğin " + xb + " soru bir kez daha soruluyor. Doğru bilirsen yine öğrenildi sayılır.</div>" : "")
    + (exDue.length ? '<div class="card fnote">' + exDue.map(o => "<b>" + esc(o.x.label) + "</b> · " + fdate(o.x.d) + " · " + o.n + " sorusu önce gelir").join("<br>") + "</div>" : "")
    + '<div class="stat3"><div class="card"><b style="color:var(--flame)">' + due.length + '</b><span>bugün</span></div><div class="card"><b>' + tomorrow + '</b><span>yarın</span></div><div class="card"><b>' + week + "</b><span>bu hafta</span></div></div>"
    + '<div class="row-btns" style="margin:14px 0 4px">' + (due.length ? '<a class="btn flame" href="#/tekrar?s=1">' + icon("rep") + "Tekrara başla (" + due.length + ")</a>" : "")
    + (active.length ? '<a class="btn' + (due.length ? "" : " primary") + '" href="#/tekrar?s=1&all=1">Hepsini çalış (' + active.length + ")</a>" : "") + "</div>"
    + (byC.size ? '<h2 class="sec">Derslere göre</h2><div class="card">' + Array.from(byC.entries()).sort((a, b) => b[1].due - a[1].due || b[1].all - a[1].all).map(([c, o]) =>
      '<div class="crow"><i class="cdot" style="background:' + ccol(c) + '"></i><div class="txt"><b>' + esc(c) + '</b></div><span class="n">' + o.due + " / " + o.all + '</span><a class="btn" href="#/tekrar?s=1&c=' + encodeURIComponent(c) + (o.due ? "" : "&all=1") + '">Çalış</a></div>').join("") + "</div>" : "")
    + resultsHTML()
    + '<h2 class="sec">Nasıl çalışır</h2><p class="note">Testte yanlış yaptığın her soru buraya düşer ve ertesi gün sorulur. Doğru bildikçe aralık uzar: 1, 3, 7, 14, 30 gün. 30 günlük aralıktan sonra da doğru bilirsen soru öğrenildi sayılır'
    + (learned ? " (şimdiye kadar " + learned + ")" : "") + ". Yanlış yaparsan aralık bir basamak geri iner, soru ertesi gün yine gelir. Doğru ama tahminle bildiğin soruda “Tahmin ettim”e dokun; o da listeye girer. "
    + "Yaklaşan sınavın soruları önce gelir; sınavdan önceki " + EXW + " gün o sınavın öğrendiğin soruları bir kez daha sorulur. Şıkların yeri her seferinde karışır (“hepsi”, “I ve II” gibi şıklı sorular hariç). Kartlarda “Bilemedim” dediklerin de buraya gelir."
    + (finalInfo() ? " Final döneminde (" + fdate(finalInfo().start) + " – " + fdate(finalInfo().end, true) + ") öğrenilmiş sorular bir kez daha gelir." : "") + "</p>"
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
// Şıkları birbirine dayanan sorular karıştırılmaz ("hepsi", "I ve II", "A ve B"...)
const NOSHUF = /(hepsi|hiçbiri|hicbiri|tümü|tumu|yukarıdaki|yukaridaki|^\s*[IVX]+(\s*(,|ve|-|–)\s*[IVX]+)+\s*$|\b[A-E] ve [A-E]\b)/i;
const optOrder = qq => qq.o.some(o => NOSHUF.test(strip(o))) ? qq.o.map((_, i) => i) : shuffled(qq.o.map((_, i) => i));
async function viewSession(q) {
  setNav("tekrar", true);
  const s = srsLoad(), t = today(), all = q.get("all") === "1", cf = q.get("c"), X = upcomingExams(EXW), X7 = upcomingExams(7);
  let keys = Object.keys(s).filter(k => (finalBack(s[k]) || examBackKey(k, s[k], X) || (!s[k].m && (all || s[k].due <= t))) && srsKeyItem(k) && (!cf || srsKeyItem(k).c === cf));
  // yaklaşan sınavın (7 gün içinde) soruları önce, en yakın sınav en önde; gerisi karışık
  const rank = k => { const i = X7.findIndex(x => x.has(srsKeyItem(k))); return i < 0 ? 99 : i; };
  keys = shuffled(keys).sort((a, b) => rank(a) - rank(b));
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
      const st2 = srsLoad(), tm1 = addDays(today(), 1), nTom = Object.keys(st2).filter(k => !st2[k].m && st2[k].due === tm1 && srsKeyItem(k)).length;
      box.innerHTML = '<div class="card empty"><div style="font:700 26px var(--f-cond);color:var(--ink)">Bitti</div><p>' + nOk + " doğru · " + nBad + " yanlış</p>"
        + '<p class="muted small">Bugün ' + dayN(PS.get("days", {}), today()) + " soru · seri " + myStreak() + " gün · yarın " + nTom + " soru</p>"
        + '<div class="row-btns" style="justify-content:center"><a class="btn primary" href="#/tekrar">Tekrar sayfası</a><a class="btn" href="#/">Ana sayfa</a></div></div>';
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
    const L = ["A", "B", "C", "D", "E"], ord = optOrder(qq), ca = ord.indexOf(qq.a);
    box.innerHTML = head + '<div class="card qcard"><div class="crumb"><i class="cdot" style="background:' + ccol(it.c) + '"></i>' + esc(ct(it.c, it.t)) + " · " + esc(tname(it.c, qq.t)) + (s[cur.k] && s[cur.k].w > 1 ? " · " + s[cur.k].w + ". kez" : "") + "</div>"
      + qHTML(qq) + '<ul class="opts">' + ord.map((oi, i) => '<li><button class="opt" data-i="' + i + '"><span class="bub">' + L[i] + "</span><span>" + qq.o[oi] + "</span></button></li>").join("") + '</ul><div id="fbx"></div></div>';
    $$(".opt", box).forEach(b => b.onclick = () => {
      const i = +b.dataset.i, ok = i === ca;
      $$(".opt", box).forEach((x, j) => { x.disabled = true; if (j === ca) x.classList.add("ok"); else if (j === i) x.classList.add("bad"); else x.classList.add("dim"); });
      $("#fbx").innerHTML = '<div class="fb ' + (ok ? "ok" : "bad") + '"><h4>' + (ok ? "Doğru." : "Yanlış. Doğru cevap: " + L[ca]) + "</h4><p>" + qq.e + '</p><div class="src">Kaynak: ' + esc(qq.s) + "</div></div>"
        + slideBtn(blob, qid) + '<div class="qnav"><button class="ml-rep" id="rqb">⚑ Hata bildir</button>' + (ok ? '<button class="btn ghost" id="gss" title="Doğru ama emin değildim: yarın yeniden sorulsun">Tahmin ettim</button>' : "") + '<button class="btn primary" id="nx">Devam →</button></div>';
      $("#rqb").onclick = () => reportSheet({ tid, qid, t: it.t, c: it.c, no: blob.data.findIndex(x => x.id === qid) + 1, q: strip(qq.q) });
      gradeOnly(ok, { t: qq.t, c: it.c });
      const g = $("#gss"); if (g) g.onclick = () => { guessed(); g.outerHTML = '<span class="muted small gsd">Yarın yeniden sorulacak</span>'; };
      $("#nx").onclick = () => { pos++; draw(); $("#rv").parentNode.scrollTop = 0; };
    });
  };
  const gradeOnly = (ok, meta) => {
    const cur = queue[pos], st = srsLoad(), e = Object.assign({ b: 0, w: 0 }, st[cur.k]);
    cur.prev = st[cur.k] ? JSON.parse(JSON.stringify(st[cur.k])) : null;
    if (meta && !cur.again) {                     // aynı oturumda yeniden sorulan (cevabı az önce görülmüş) soru sayılmaz
      const qh = Object.assign({}, PS.get("qh", {})); qhRecord(qh, cur.k, ok, meta); PS.set("qh", qh);
      PS.set("days", addDayAnswers(Object.assign({}, PS.get("days", {})), 1));
    }
    const F = finalInfo(), fb = finalBack(e), xk = !fb && examBackKey(cur.k, e, X);
    if (fb || xk) {                               // öğrenilmiş soru: final dönemi ya da sınav öncesi son tur
      if (fb) e.fr = F.key; else e.xr = xk;
      if (ok) { nOk++; e.u = Date.now(); st[cur.k] = e; srsSave(st); return; }
      e.m = 0;
    }
    if (ok) { nOk++; if (!cur.again) { e.b = (e.b || 0) + 1; if (e.b >= INT.length) e.m = 1; e.due = addDays(today(), INT[Math.min(e.b, INT.length - 1)]); } }
    else { nBad++; e.due = addDays(today(), 1); if (!cur.again) { e.b = Math.max(0, (e.b || 0) - 1); e.w = (e.w || 0) + 1; queue.push({ k: cur.k, again: true }); } }
    e.u = Date.now(); st[cur.k] = e; srsSave(st);
  };
  const guessed = () => {                         // doğru ama tahmin: aralık uzamaz, yarın yeniden sorulur
    const cur = queue[pos], st = srsLoad(), e = Object.assign({ b: 0, w: 0 }, cur.prev || st[cur.k]);
    e.m = 0; e.due = addDays(today(), 1); e.u = Date.now(); st[cur.k] = e; srsSave(st); updateBadge();
  };
  const grade = ok => {                           // kart: bir kez sayılır (seri için)
    if (!queue[pos].again) PS.set("days", addDayAnswers(Object.assign({}, PS.get("days", {})), 1));
    gradeOnly(ok); pos++; draw();
  };
  if (!queue.length) { $("#rv").innerHTML = '<div class="card empty">Şu an tekrar edilecek soru yok.</div>'; return; }
  draw();
}

/* ---------- progress ---------- */
function topicTotals(gs) {
  const T = new Map();
  S.cat.items.filter(i => i.k === "test" && (!gs || gs.has(i.g))).forEach(it => {
    if (!T.has(it.c)) T.set(it.c, new Map());
    const m = T.get(it.c);
    (it.tp || []).forEach(([t, n]) => { const x = tname(it.c, t); m.set(x, (m.get(x) || 0) + n); });
  });
  return T;
}
function mastery(gs) {
  const M = new Map();
  Object.entries(PS.get("qh", {})).forEach(([k, h]) => {
    if (!h || !h.c || !h.t) return;
    if (gs) { const it = S.byId[k.split("|")[0]]; if (!it || !gs.has(it.g)) return; }
    if (!M.has(h.c)) M.set(h.c, new Map());
    const m = M.get(h.c), t = tname(h.c, h.t), o = m.get(t) || { seen: 0, ok: 0, n: 0, k: 0 };
    o.seen++; o.ok += h.l ? 1 : 0; o.n += h.n; o.k += h.k; m.set(t, o);
  });
  return M;
}
const weakTopics = gs => { const W = []; mastery(gs).forEach((m, c) => m.forEach((o, t) => { if (o.seen >= 3 && o.ok / o.seen < 0.6) W.push([c, t]); })); return W; };
// İlk denemede doğru: son N günde her sorunun o günkü ilk cevabı (tekrarda aynı oturumda yeniden sorulan sayılmaz)
function firstTry(nDays) {
  const from = addDays(today(), -(nDays - 1)); let n = 0, k = 0;
  Object.values(PS.get("qh", {})).forEach(h => ((h && h.hh) || []).forEach(([d, ok]) => { if (d >= from) { n++; k += ok; } }));
  return { n, k };
}
// Kurul seçici (Karma ve İlerleme): testi olan kurullar, ortak dersler ve "Hepsi"
function kurulChoices() {
  const has = g => S.cat.items.some(i => i.g === g && i.k === "test");
  const L = S.cat.kurullar.filter(k => has(k.id)).map(k => ({ id: k.id, l: "Kurul " + k.no }));
  specialGs().filter(has).forEach(g => L.push({ id: g, l: SPECIAL[g] }));
  return L;
}
function kurulDefault() { const L = kurulChoices(), c = currentKurul(); return L.some(x => x.id === c.id) ? c.id : "all"; }
const kchips = (sel, attr) => '<div class="chips kchips">' + kurulChoices().concat([{ id: "all", l: "Hepsi" }]).map(x => '<button class="chip' + (sel === x.id ? " on" : "") + '" ' + attr + '="' + x.id + '">' + esc(x.l) + "</button>").join("") + "</div>";
// Sınav puanları: kurul sınavı ve ortak ders sınavları geçince ana sayfada bir kez sorulur (real[anahtar] = {p, x})
function pastExams() {
  const t = today(), out = [];
  S.cat.kurullar.forEach(k => { if (k.end && k.end < t && S.cat.items.some(i => i.g === k.id)) out.push({ key: k.id, d: k.end, label: "Kurul " + k.no + " sınavı", g: k.id }); });
  (S.cat.sinavlar || []).forEach(x => { if (x.d < t && !donemler().some(d => d.name === x.c)) out.push({ key: "s:" + x.d + ":" + x.c, d: x.d, label: x.c + " " + (x.t || "sınavı").toLocaleLowerCase("tr"), c: x.c }); });
  return out.sort((a, b) => b.d.localeCompare(a.d));
}
function scoreSheet(x, done) {
  const r = PS.get("real", {})[x.key] || {};
  const bg = sheet("<h3>" + esc(x.label) + '</h3><p class="muted small">' + fdate(x.d, true) + ' · 100 üzerinden puanın</p><div class="row-btns"><input id="scv" class="realin" type="number" min="0" max="100" step="0.5" inputmode="decimal" placeholder="Puan" value="' + (r.p ?? "") + '"><button class="btn primary" id="scs">Kaydet</button><button class="btn" data-close>Vazgeç</button></div>');
  const inp = $("#scv", bg); setTimeout(() => inp.focus(), 50);
  $("#scs", bg).onclick = () => {
    const v = parseFloat(String(inp.value).replace(",", ".")); if (isNaN(v) || v < 0 || v > 100) { toast("0 ile 100 arasında bir puan yaz"); return; }
    const R = Object.assign({}, PS.get("real", {})); R[x.key] = { p: v, at: Date.now() }; PS.set("real", R); bg.close(); toast("Kaydedildi"); done && done();
  };
}
function scoreCard() {
  const R = PS.get("real", {}), x = pastExams().find(x => dayDiff(x.d, today()) <= 30 && !(R[x.key] && (R[x.key].p != null || R[x.key].x)));
  if (!x) return "";
  return '<div class="card scorec" data-sk="' + esc(x.key) + '"><div class="txt"><b>' + esc(x.label) + ' nasıl geçti?</b><span class="muted small">Puanını yaz; İlerleme’de denemelerdeki başarınla yan yana durur.</span></div>'
    + '<div class="row-btns"><button class="btn primary" data-sc="1">Puanı yaz</button><button class="btn ghost" data-sc="0">Geç</button></div></div>';
}
function bindScoreCard() {
  const c = $(".scorec"); if (!c) return;
  const x = pastExams().find(x => x.key === c.dataset.sk);
  $$("[data-sc]", c).forEach(b => b.onclick = () => {
    if (b.dataset.sc === "1") return scoreSheet(x, () => route());
    const R = Object.assign({}, PS.get("real", {})); R[x.key] = Object.assign({}, R[x.key], { x: 1, at: Date.now() }); PS.set("real", R); c.remove();
  });
}
function viewProgress() {
  setNav("ilerleme");
  const days = PS.get("days", {}), t = today(), tm = PS.get("tm", {});
  const sel = S.pk || (S.pk = kurulDefault()), gs = sel === "all" ? null : new Set([sel]);
  const arr = []; for (let i = 13; i >= 0; i--) { const x = addDays(t, -i); arr.push([x, dayN(days, x)]); }
  const max = Math.max(10, ...arr.map(x => x[1]));
  let wkQ = 0, wkT = 0; for (let x = weekStart(t); x <= t; x = addDays(x, 1)) { wkQ += dayN(days, x); wkT += tmDay(tm, x); }
  const ft = firstTry(7);
  const T = topicTotals(gs), M = mastery(gs);
  const courseBlocks = Array.from(T.entries()).sort((a, b) => (M.get(b[0]) || new Map()).size - (M.get(a[0]) || new Map()).size).map(([c, tm2]) => {
    const mm = M.get(c) || new Map();
    const rows = Array.from(tm2.entries()).map(([tp, n]) => ({ tp, n, o: mm.get(tp) })).sort((a, b) => {
      const pa = a.o && a.o.seen >= 3 ? a.o.ok / a.o.seen : a.o ? 1.5 : 2, pb = b.o && b.o.seen >= 3 ? b.o.ok / b.o.seen : b.o ? 1.5 : 2; return pa - pb || b.n - a.n; });
    const seenC = rows.reduce((x, r) => x + (r.o ? r.o.seen : 0), 0), totC = rows.reduce((x, r) => x + r.n, 0);
    const shown = rows.filter(r => r.o), rest = rows.length - shown.length;
    return '<details class="card mcard"' + (mm.size ? " open" : "") + '><summary><i class="cdot" style="background:' + ccol(c) + '"></i><b>' + esc(c) + '</b><span class="muted small">' + seenC + " / " + totC + " soru görüldü</span></summary>"
      + (mm.size ? shown : rows).map(r => {
        const pc = r.o && r.o.seen ? Math.round(100 * r.o.ok / r.o.seen) : null, weak = r.o && r.o.seen >= 3 && pc < 60;
        return '<div class="mrow' + (weak ? " weak" : "") + '"><span class="tn">' + esc(r.tp) + (weak ? ' <span class="wtag">zayıf</span>' : "") + '</span><span class="mb"><i style="width:' + (pc || 0) + '%"></i></span><span class="pc">' + (pc == null ? "–" : "%" + pc) + '</span><span class="cv">' + (r.o ? r.o.seen : 0) + "/" + r.n + "</span></div>";
      }).join("") + (mm.size && rest ? '<div class="mrow more"><span class="tn muted">' + rest + " konudan henüz soru çözmedin</span></div>" : "") + "</details>";
  }).join("");
  const H = PS.get("hist", []).slice().reverse().filter(h => !gs || gs.has(h.g));
  const W = weakTopics(gs), R = PS.get("real", {});
  const scores = pastExams().filter(x => R[x.key] && R[x.key].p != null);
  main().innerHTML = bar({ title: "İlerleme", crumb: syncOn() ? "Bütün cihazlarındaki çalışman" : "Bu cihazdaki çalışman" }) + '<div class="page narrow">'
    + '<div class="stat4"><div class="card"><b>' + myStreak() + '</b><span>günlük seri</span></div><div class="card"><b>' + dayN(days, t) + '</b><span>bugün soru</span></div>'
    + '<div class="card"><b>' + (wkT ? fmtDur(wkT) : wkQ) + "</b><span>" + (wkT ? "bu hafta çalışma" : "bu hafta soru") + '</span></div><div class="card"><b>' + (ft.n ? "%" + Math.round(100 * ft.k / ft.n) : "–") + "</b><span>ilk denemede doğru · 7 gün</span></div></div>"
    + '<p class="note">' + STREAK_TXT + " “İlk denemede doğru”, bir sorunun o günkü ilk cevabıdır; tekrarda cevabını az önce gördüğün soru sayılmaz.</p>"
    + '<h2 class="sec">Son 14 gün</h2><div class="card bars">' + arr.map(([x, n]) => '<div class="bcol" title="' + fdate(x) + ": " + n + ' soru"><span class="bn">' + (n || "") + '</span><i style="height:' + Math.round(100 * n / max) + '%"></i><span class="bd">' + (+x.slice(8)) + "</span></div>").join("") + "</div>"
    + '<h2 class="sec">Konu hakimiyeti</h2>' + kchips(sel, "data-pk")
    + '<p class="note" style="margin-top:6px">Her konuda soruların ilk denemedeki son sonucuna göre. En az 3 soru çözülen ve %60’ın altında kalan konular zayıf sayılır.</p>'
    + (W.length ? '<div class="row-btns" style="margin-bottom:10px"><a class="btn flame" href="#/karma?w=1' + (gs ? "&g=" + sel : "") + '">' + icon("mix") + "Zayıf " + W.length + " konudan karma deneme</a></div>" : "")
    + (courseBlocks || '<div class="card empty">Bu seçimde henüz test yok.</div>')
    + (scores.length ? '<h2 class="sec">Sınav puanların</h2><div class="card">' + scores.map(x => {
      const hs = PS.get("hist", []).filter(h => x.g ? h.g === x.g : h.c === x.c), avg = hs.length ? Math.round(100 * hs.reduce((a, h) => a + h.ok / h.n, 0) / hs.length) : null;
      return '<div class="crow"><div class="txt"><b>' + esc(x.label) + '</b><div class="muted small">' + fdate(x.d, true) + (avg != null ? " · denemelerde %" + avg + " (" + hs.length + ")" : "") + '</div></div><span class="n">' + R[x.key].p + ' puan</span><button class="btn ghost" data-sx="' + esc(x.key) + '">Değiştir</button></div>';
    }).join("") + "</div>" : "")
    + '<h2 class="sec">Deneme geçmişi</h2>' + (H.length ? '<div class="card">' + H.slice(0, 40).map(h => {
      return '<div class="crow"><i class="cdot" style="background:' + ccol(h.c) + '"></i><div class="txt"><b>' + esc(ct(h.c, h.t)) + '</b><div class="muted small">' + fdate(isoDay(new Date(h.at)), true) + " · " + h.ok + "D " + h.bad + "Y " + (h.n - h.ok - h.bad) + 'B</div></div><span class="n">' + h.ok + "/" + h.n + " · %" + Math.round(100 * h.ok / h.n) + "</span></div>";
    }).join("") + "</div>" : '<div class="card empty">Bitirdiğin denemeler burada listelenir.</div>')
    + "</div>";
  $$("[data-pk]").forEach(b => b.onclick = () => { S.pk = b.dataset.pk; const y = main().scrollTop; viewProgress(); main().scrollTop = y; });
  $$("[data-sx]").forEach(b => b.onclick = () => scoreSheet(pastExams().find(x => x.key === b.dataset.sx), () => viewProgress()));
}
// Toplam soruyu derslere ağırlığa göre böler; havuzu yetmeyen dersin payı diğerlerine geçer
function allocate(total, weights, caps) {
  const res = new Map(); let left = total, act = Array.from(caps.keys()).filter(c => caps.get(c) > 0);
  while (left > 0 && act.length) {
    const W = act.reduce((a, c) => a + Math.max(weights.get(c) || 0, 0.01), 0);
    const fl = act.map(c => { const x = left * Math.max(weights.get(c) || 0, 0.01) / W; return [c, Math.floor(x), x - Math.floor(x)]; });
    let rem = left - fl.reduce((a, x) => a + x[1], 0), given = 0;
    fl.sort((a, b) => b[2] - a[2]).forEach(x => { if (rem > 0) { x[1]++; rem--; } });
    fl.forEach(([c, k]) => { const g = Math.min(k, caps.get(c) - (res.get(c) || 0)); res.set(c, (res.get(c) || 0) + g); given += g; });
    left -= given; act = act.filter(c => (res.get(c) || 0) < caps.get(c));
    if (!given) break;
  }
  return res;
}
// Kurul provası / final denemesi: gerçek biçimde 100 soru, 100 dk; dersler arası dağılım ders saatine göre (katalogda kurullar[].saat)
async function buildProva(gids, isFinal) {
  const tests = S.cat.items.filter(i => i.k === "test" && gids.includes(i.g));
  await Promise.all(tests.map(it => loadTest(it).catch(() => null)));
  const qh = PS.get("qh", {}), pool = new Map(), w = new Map();
  tests.forEach(it => (S.tests[it.id] ? S.tests[it.id].data : []).forEach(q => { if (!pool.has(it.c)) pool.set(it.c, []); pool.get(it.c).push([it.id, q.id]); }));
  gids.forEach(g => { const k = kurulById(g) || {}, sa = k.saat || {}; pool.forEach((_, c) => {
    const h = sa[c] != null ? sa[c] : S.cat.items.filter(i => i.g === g && i.c === c && i.k === "slayt").length;
    w.set(c, (w.get(c) || 0) + h); }); });
  const caps = new Map(Array.from(pool.entries()).map(([c, L]) => [c, L.length]));
  const total = Math.min(100, Array.from(caps.values()).reduce((a, b) => a + b, 0));
  const al = allocate(total, w, caps), ids = [];
  Array.from(al.entries()).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => {
    const L = shuffled(pool.get(c)).sort((a, b) => (qh[a[0] + "|" + a[1]] ? 1 : 0) - (qh[b[0] + "|" + b[1]] ? 1 : 0));   // önce hiç çözülmemişler
    shuffled(L.slice(0, n)).forEach(x => ids.push(x));
  });
  const ks = gids.map(kurulById).filter(Boolean), lab = isFinal ? "Final denemesi" : ks.length === 1 ? (ks[0].no ? "Kurul " + ks[0].no + " provası" : ks[0].name + " provası") : "Prova";
  return { at: Date.now(), k: "mix:" + Date.now(), t: lab + " · " + ids.length + " soru", c: al.size > 2 ? al.size + " ders" : Array.from(al.keys()).join(" + "), ids,
    d: "Gerçek sınav biçiminde: " + ids.length + " soru, " + ids.length + " dakika; dersler arası dağılım ders saatine göre.", auto: { mode: "timed", minutes: ids.length } };
}
// Bir destenin soruları (testlerdeki "Slayta git" bağlantılarından): deste sonu testi ve okumadan önce ön test
async function deckQs(deckId) {
  const tests = S.cat.items.filter(t => t.k === "test" && (t.dk || []).some(d => d[0] === deckId));
  const out = [];
  for (const t of tests) { const b = await loadTest(t).catch(() => null); if (b) Object.entries(b.refs || {}).forEach(([qid, r]) => { if (r[0] === deckId) out.push([t.id, qid]); }); }
  return out;
}
const deckQn = deckId => S.cat.items.filter(t => t.k === "test").reduce((a, t) => a + ((t.dk || []).find(d => d[0] === deckId) || [0, 0])[1], 0);
async function startDeckQuiz(deckId, n, pre) {
  const d = S.byId[deckId], qh = PS.get("qh", {});
  let L = shuffled(await deckQs(deckId));
  if (!L.length) return toast("Bu desteden henüz soru yok.");
  L = L.sort((a, b) => (qh[a[0] + "|" + a[1]] ? 1 : 0) - (qh[b[0] + "|" + b[1]] ? 1 : 0)).slice(0, n);
  PS.set("mix", { at: Date.now(), k: "mix:" + Date.now(), t: (pre ? "Ön test · " : "Deste testi · ") + L.length + " soru", c: d.c, ids: shuffled(L), back: "#/d/" + deckId + "/1",
    d: pre ? "Okumadan önce dene: bilmemen normal; cevabı görüp sonra okuyunca daha iyi aklında kalır." : d.t + " destesinden sorular.", auto: { mode: "study" } });
  navTo("#/t/mix");
}
async function viewMix(q) {
  setNav("karma");
  const tests = S.cat.items.filter(i => i.k === "test");
  const fin = q.get("final") === "1", F = finalInfo();
  const st = { k: q.get("g") || (fin ? "all" : kurulDefault()), c: new Set(), t: new Set(), n: 20, f: "all", mode: "study", min: 0 };
  const inK = it => st.k === "all" || it.g === st.k;
  const T = () => topicTotals(st.k === "all" ? null : new Set([st.k]));
  const courses = () => Array.from(new Set(tests.filter(inK).map(i => i.c)));
  const resetSel = () => { st.c = new Set(courses()); st.t = new Set(); Array.from(st.c).forEach(c => (T().get(c) || new Map()).forEach((n, t) => st.t.add(c + "|" + t))); };
  resetSel();
  if (q.get("w") === "1") {
    const W = weakTopics(st.k === "all" ? null : new Set([st.k]));
    if (W.length) { st.c = new Set(W.map(x => x[0])); st.t = new Set(W.map(([c, t]) => c + "|" + t)); }
  }
  let loaded = false;
  const qh = PS.get("qh", {});
  const pool = () => {
    const out = [];
    tests.filter(i => inK(i) && st.c.has(i.c)).forEach(it => (S.tests[it.id] ? S.tests[it.id].data : []).forEach(qq => {
      if (!st.t.has(it.c + "|" + tname(it.c, qq.t))) return;
      const h = qh[it.id + "|" + qq.id];
      if (st.f === "new" && h) return;
      if (st.f === "wrong" && !(h && !h.l)) return;
      out.push([it.id, qq.id]);
    }));
    return out;
  };
  const go = (M, rep) => {
    const old = PS.get("mix", null);
    if (old) { const e = Object.assign({}, PS.get("eng", {})); delete e[engKey(old.k)]; PS.set("eng", e); LS.del(engKey(old.k)); }
    PS.set("mix", M);
    if (rep) { replaceHash("#/t/mix"); route(); } else navTo("#/t/mix");   // rep: "Prova" bağlantısıyla gelindi; geri tuşu provayı yeniden başlatmasın
  };
  const ks = st.k !== "all" && kurulById(st.k);
  const draw = () => {
    const sc = main().scrollTop, TT = T(), M2 = mastery(st.k === "all" ? null : new Set([st.k]));
    const avail = loaded ? pool().length : 0, take = st.n ? Math.min(st.n, avail) : avail;
    const k = st.k !== "all" && kurulById(st.k);
    const pn = k && k.no ? Math.min(100, kurulPrep(k.id).nQ) : 0;
    const presets = (pn ? '<button class="card tile preset" id="prova"><span class="big">' + icon("test") + '</span><span class="txt"><b>Kurul ' + k.no + ' provası</b><span class="muted small">'
      + (pn >= 100 ? "Gerçek biçimde 100 soru, 100 dakika" : "Sınav gibi soru başına 1 dakika; şimdilik " + pn + " soru (gerçeği 100)") + "; dersler ders saatine göre</span></span>" + icon("chev", "chev") + "</button>" : "")
      + (fin || (F && F.on) ? '<button class="card tile preset" id="finp"><span class="big">' + icon("mix") + '</span><span class="txt"><b>Final denemesi</b><span class="muted small">Bütün kurullardan 100 soru, 100 dakika</span></span>' + icon("chev", "chev") + "</button>" : "");
    main().innerHTML = bar({ title: fin ? "Final denemesi" : "Karma deneme", crumb: "Testlerdeki sorulardan yeni bir deneme" }) + '<div class="page narrow mixp">'
      + (presets ? '<div class="presets">' + presets + "</div>" : "")
      + '<div class="flabel">Kurul</div>' + kchips(st.k, "data-k")
      + '<div class="flabel" style="margin-top:14px">Dersler</div><div class="chips" style="flex-wrap:wrap">' + courses().map(c => '<button class="chip' + (st.c.has(c) ? " on" : "") + '" data-c="' + esc(c) + '"><i class="cdot" style="background:' + ccol(c) + '"></i>' + esc(c) + "</button>").join("") + "</div>"
      + '<div class="flabel" style="margin-top:14px">Konular</div>'
      + Array.from(st.c).map(c => { const tm = TT.get(c) || new Map(), mm = M2.get(c) || new Map();
        return '<details class="card tlist"' + (st.c.size <= 2 ? " open" : "") + '><summary class="th"><b>' + esc(c) + '</b><span class="muted small">' + Array.from(tm.keys()).filter(t => st.t.has(c + "|" + t)).length + " / " + tm.size + ' konu</span><button class="btn ghost" data-all="' + esc(c) + '">Hepsi</button><button class="btn ghost" data-none="' + esc(c) + '">Hiçbiri</button></summary>'
          + Array.from(tm.entries()).map(([t, n]) => { const o = mm.get(t), pc = o && o.seen ? Math.round(100 * o.ok / o.seen) : null, key = c + "|" + t;
            return '<label class="tl"><input type="checkbox" data-t="' + esc(key) + '"' + (st.t.has(key) ? " checked" : "") + '><span class="tn">' + esc(t) + (o && o.seen >= 3 && pc < 60 ? ' <span class="wtag">zayıf</span>' : "") + '</span><span class="muted small">' + n + " soru" + (pc != null ? " · %" + pc : "") + "</span></label>"; }).join("") + "</details>"; }).join("")
      + '<div class="flabel" style="margin-top:14px">Hangi sorular</div><div class="chips" style="flex-wrap:wrap">'
      + [["all", "Hepsi"], ["new", "Hiç çözmediklerim"], ["wrong", "Yanlış yaptıklarım"]].map(([v, l]) => '<button class="chip' + (st.f === v ? " on" : "") + '" data-f="' + v + '">' + l + "</button>").join("") + "</div>"
      + '<div class="flabel" style="margin-top:14px">Soru sayısı</div><div class="chips">' + [10, 20, 40, 80, 0].map(n => '<button class="chip' + (st.n === n ? " on" : "") + '" data-n="' + n + '">' + (n || "Hepsi") + "</button>").join("") + "</div>"
      + '<div class="flabel" style="margin-top:14px">Nasıl çözeceksin</div><div class="chips">' + [["study", "Çalışma"], ["exam", "Sınav"], ["timed", "Zamana karşı"]].map(([v, l]) => '<button class="chip' + (st.mode === v ? " on" : "") + '" data-m="' + v + '">' + l + "</button>").join("") + "</div>"
      + (st.mode === "timed" ? '<div class="minrow2"><input id="mmin" type="number" min="1" max="600" inputmode="numeric" value="' + (st.min || take || 20) + '"><span>dakika · sınavdaki gibi soru başına 1 dakika</span></div>' : "")
      + '<p class="note">' + (st.mode === "study" ? "Çalışma: her cevaptan sonra doğru şık ve açıklama görünür." : st.mode === "exam" ? "Sınav: cevaplar en sonda değerlendirilir; işaretini değiştirebilirsin." : "Zamana karşı: süre bitince deneme kendiliğinden biter.") + " Kaynak, “Slayta git” ve tekrar listesi aynen çalışır.</p>"
      + '<div class="gobar"><span class="muted small">' + (loaded ? "Seçimde " + avail + " soru" : "Sorular hazırlanıyor…") + '</span><button class="btn primary go" id="mk"' + (take ? "" : " disabled") + ">" + icon("mix") + "Başla · " + take + " soru</button></div></div>";
    main().scrollTop = sc;
    $$("[data-k]").forEach(b => b.onclick = () => { st.k = b.dataset.k; resetSel(); draw(); });
    $$("[data-c]").forEach(b => b.onclick = () => { const c = b.dataset.c; if (st.c.has(c)) st.c.delete(c); else { st.c.add(c); (TT.get(c) || new Map()).forEach((n, t) => st.t.add(c + "|" + t)); } draw(); });
    $$("[data-t]").forEach(i => i.onchange = () => { if (i.checked) st.t.add(i.dataset.t); else st.t.delete(i.dataset.t); draw(); });
    $$("[data-all]").forEach(b => b.onclick = e => { e.preventDefault(); const c = b.dataset.all; (TT.get(c) || new Map()).forEach((n, t) => st.t.add(c + "|" + t)); draw(); });
    $$("[data-none]").forEach(b => b.onclick = e => { e.preventDefault(); const c = b.dataset.none; Array.from(st.t).forEach(k => { if (k.split("|")[0] === c) st.t.delete(k); }); draw(); });
    $$("[data-f]").forEach(b => b.onclick = () => { st.f = b.dataset.f; draw(); });
    $$("[data-n]").forEach(b => b.onclick = () => { st.n = +b.dataset.n; st.min = 0; draw(); });
    $$("[data-m]").forEach(b => b.onclick = () => { st.mode = b.dataset.m; draw(); });
    const mi = $("#mmin"); if (mi) mi.onchange = () => { st.min = Math.max(1, Math.min(600, parseInt(mi.value, 10) || 0)); };
    const pv = $("#prova"); if (pv) pv.onclick = async () => { pv.disabled = true; const M = await buildProva([st.k]); if (!M.ids.length) { pv.disabled = false; return toast("Bu kurulda henüz soru yok."); } go(M); };
    const fp = $("#finp"); if (fp) fp.onclick = async () => { fp.disabled = true; const dn = donemOf(currentKurul().id).id; const M = await buildProva(S.cat.kurullar.filter(k => (k.dn || "d1") === dn).map(k => k.id).concat(specialGs().filter(g => (kurulById(g).dn || "d1") === dn)), true); go(M); };
    $("#mk").onclick = () => {
      let P2 = pool();
      if (!P2.length) { toast("Bu seçimde soru kalmadı."); return; }
      P2 = shuffled(P2); if (st.n) P2 = P2.slice(0, st.n);
      const cs = Array.from(new Set(P2.map(x => S.byId[x[0]].c)));
      go({ at: Date.now(), k: "mix:" + Date.now(), t: (fin ? "Final denemesi · " : "Karma deneme · ") + P2.length + " soru", c: cs.length > 2 ? cs.length + " ders" : cs.join(" + "), ids: P2,
        d: (st.f === "new" ? "Hiç çözmediğin" : st.f === "wrong" ? "Yanlış yaptığın" : "Seçtiğin konulardan") + " sorular, karışık sırayla.", auto: { mode: st.mode, minutes: st.mode === "timed" ? (st.min || P2.length) : 0 } });
    };
  };
  draw();
  await Promise.all(tests.map(it => loadTest(it).catch(() => null)));
  if (parseHash().parts[0] !== "karma") return;
  loaded = true; draw();
  if (q.get("prova") === "1" && ks && ks.no) {
    const M = await buildProva([st.k]);
    if (parseHash().parts[0] !== "karma") return;
    if (M.ids.length) go(M, true); else toast("Bu kurulda henüz soru yok.");
  }
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
// Türkçe ek: "kültürünün", "dondurulması" gibi ekli kelime sonuç vermezse ilk 5 harfiyle (köküyle) de aranır
function stemQ(Q) {
  const T = Q.terms.map(t => t.length > 5 ? t.slice(0, 5) : t);
  return T.some((x, i) => x !== Q.terms[i]) ? Object.assign({}, Q, { terms: T, adj: null }) : null;
}
function searchHits(I, qv, keep) {
  const Q = parseQuery(qv);
  if (!Q.ok) return { Q, docs: [], qs: [], np: 0 };
  const run = (QQ, list) => { const out = []; list.forEach(o => { if (keep && !keep(o)) return; const sc = scoreQ(QQ, o.f); if (sc > 0) out.push([sc, o, QQ === Q ? 0 : 1]); }); return out; };
  const ph = run(Q, I.pages), qh = run(Q, I.qs), Q2 = stemQ(Q);
  const add = (L, list) => { if (L.length >= 3 || !Q2) return; const seen = new Set(L.map(x => x[1])); run(Q2, list).forEach(x => { if (!seen.has(x[1])) L.push([x[0] / 10, x[1], 1]); }); };
  add(ph, I.pages); add(qh, I.qs);
  ph.sort((a, b) => b[0] - a[0]); qh.sort((a, b) => b[0] - a[0]);
  const D = new Map();                              // sayfalar belgeye göre toplanır: bir deste bir satır
  ph.forEach(([sc, o, st]) => { if (!D.has(o.id)) D.set(o.id, { id: o.id, sc, pages: [], o, st }); D.get(o.id).pages.push(o.p); });
  return { Q, Q2, docs: Array.from(D.values()).sort((a, b) => b.sc - a.sc), qs: qh, np: ph.length };
}
function docHitsHTML(H, max) {
  return '<div class="card list">' + H.docs.slice(0, max || 30).map(d => {
    const it = S.byId[d.id], Q = d.st ? H.Q2 : H.Q, top = d.pages.slice(0, 8), more = d.pages.length - top.length;
    return '<div class="hit dhit"><a class="h" href="#/d/' + d.id + "/" + d.o.p + "?h=" + top.join(",") + '"><i class="cdot" style="background:' + ccol(it.c) + '"></i>' + esc(it.t) + '<span class="pg-n">' + d.pages.length + (it.k === "slayt" ? " slayt" : " sayfa") + "</span></a>"
      + '<a class="s" href="#/d/' + d.id + "/" + d.o.p + "?h=" + d.o.p + '">' + snippet(d.o, Q) + "</a>"
      + (d.pages.length > 1 ? '<div class="pchips">' + top.slice().sort((a, b) => a - b).map(p => '<a class="pchip" href="#/d/' + d.id + "/" + p + "?h=" + p + '">' + p + "</a>").join("") + (more > 0 ? '<span class="muted small">+' + more + "</span>" : "") + "</div>" : "")
      + "</div>";
  }).join("") + "</div>";
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
    if (!parseQuery(qv).ok) { out.innerHTML = '<p class="note">En az iki harf yaz. Türkçe karakterler fark etmez: “ozellik” de “özellik”i bulur; ekli kelime sonuç vermezse kökü de aranır. Tırnak içine yazdığın kelimeler yalnız yan yana geçtiği yerlerde aranır: <b>"sodyum pompası"</b>.</p>'; return; }
    if (!S.index) out.innerHTML = '<div class="loading"><div><div class="spin"></div>Arama dizini hazırlanıyor…</div></div>';
    const I = await loadIndex();
    if (inp.value.trim() !== qv) return;
    const H = searchHits(I, qv);
    const qr = H.qs.slice(0, 40).map(([, o, st]) => { const it = S.byId[o.id]; return '<div class="hit" data-qi="' + esc(o.id) + '" data-qq="' + esc(o.qid) + '"><div class="h"><i class="cdot" style="background:' + ccol(it.c) + '"></i>' + esc(ct(it.c, it.t)) + '</div><div class="s">' + snippet(o, st ? H.Q2 : H.Q) + "</div></div>"; }).join("");
    out.innerHTML = (H.docs.length ? '<h2 class="sec">Slayt ve notlar · ' + H.docs.length + " belge, " + H.np + " sayfa</h2>" + docHitsHTML(H, 30) : "")
      + (qr ? '<h2 class="sec">Sorular ve kartlar · ' + H.qs.length + '</h2><div class="card list">' + qr + "</div>" : "")
      + (!H.docs.length && !qr ? '<div class="card empty">“' + esc(qv.replace(/"/g, "")) + "” için sonuç yok." + (H.Q.P.length ? " Tırnağı kaldırırsan kelimeler ayrı ayrı da aranır." : "") + "</div>" : "");
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
  run();
  if (innerWidth >= 900 || !q0) inp.focus();
}

/* ---------- Saat: kronometre ve çalışma turu ----------
   Süre zaman damgasından hesaplanır (uygulama arka plana geçse de doğru kalır); çalışma süresi derse göre tm'ye yazılır.
   Ekran açık kalır (Saat ekranındayken), aşama değişince telefon titrer; ses yok (kütüphane). */
const TECH = {
  sw: { l: "Kronometre", d: "Başlat, dilediğin kadar çalış, bitir." },
  p25: { l: "Pomodoro 25/5", d: "25 dk çalışma, 5 dk mola; her 4 turda 15 dk uzun mola.", w: 25, b: 5, lb: 15 },
  p50: { l: "50/10", d: "50 dk çalışma, 10 dk mola.", w: 50, b: 10 },
  flow: { l: "Serbest", d: "Odağın dağılana kadar çalış, “Mola”ya dokun: çalıştığın sürenin beşte biri kadar mola." },
};
const clkGet = () => LS.get("ml.clk", null) || { tech: "p25", course: "", run: false, phase: "idle", acc: 0, t0: 0, len: 0, cyc: 0, fl: 0 };
const clkSet = c => LS.set("ml.clk", c);
const clkEl = c => c.acc + (c.run ? (Date.now() - c.t0) / 1000 : 0);
const fmtClock = s => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ":" + pad(m) : pad(m)) + ":" + pad(x); };
let wakeL = null;
async function wake(on) {
  try {
    if (on && !wakeL && "wakeLock" in navigator && document.visibilityState === "visible") { wakeL = await navigator.wakeLock.request("screen"); wakeL.addEventListener("release", () => { wakeL = null; }); }
    if (!on && wakeL) { const w = wakeL; wakeL = null; await w.release(); }
  } catch (e) { wakeL = null; }
}
const buzz = () => { try { navigator.vibrate && navigator.vibrate([280, 140, 280]); } catch (e) {} };
function clkFlush(c) {                           // çalışma süresinin yazılmamış kısmını derse ekle
  if (c.phase !== "work") return;
  const d = Math.floor(clkEl(c) - (c.fl || 0));
  if (d >= 1) { tmAdd(c.course || "Genel", d); c.fl = (c.fl || 0) + d; }
}
function clkStartPhase(c, phase, len, at) { c.phase = phase; c.len = len; c.acc = 0; c.fl = 0; c.t0 = at || Date.now(); c.run = true; }
// Geri sayımlı aşama bittiyse sonrakine geç (uygulama arka plandaysa kaçırılan geçişler de işlenir)
function clkAdvance(c) {
  let moved = false;
  for (let i = 0; i < 50 && c.run && c.len > 0 && clkEl(c) >= c.len; i++) {
    const T = TECH[c.tech] || TECH.sw, end = c.t0 + (c.len - c.acc) * 1000;
    if (c.phase === "work") {
      const d = Math.floor(c.len - (c.fl || 0)); if (d >= 1) tmAdd(c.course || "Genel", d);
      c.cyc = (c.cyc || 0) + 1;
      const lb = T.lb && c.cyc % 4 === 0;
      clkStartPhase(c, "break", (lb ? T.lb : T.b || 5) * 60, end);
    } else {
      if (c.tech === "flow") { clkStartPhase(c, "work", 0, end); }
      else clkStartPhase(c, "work", (T.w || 25) * 60, end);
    }
    moved = true;
  }
  return moved;
}
function clkAction(a) {
  const c = clkGet(), T = TECH[c.tech] || TECH.sw;
  if (a === "start") {
    if (c.phase === "idle") { c.cyc = 0; clkStartPhase(c, "work", T.w ? T.w * 60 : 0); }
    else if (!c.run) { c.t0 = Date.now(); c.run = true; }
  } else if (a === "pause") { if (c.run) { clkFlush(c); c.acc = clkEl(c); c.run = false; } }
  else if (a === "stop") { clkFlush(c); const w = c.phase === "work" ? clkEl(c) : 0; Object.assign(c, { run: false, phase: "idle", acc: 0, t0: 0, len: 0, cyc: 0, fl: 0 }); if (w >= 60) toast("Kaydedildi: " + fmtDur(w) + " · " + (c.course || "Genel")); }
  else if (a === "break" && c.phase === "work") { clkFlush(c); const w = clkEl(c); c.cyc = (c.cyc || 0) + 1; clkStartPhase(c, "break", Math.min(30, Math.max(3, Math.round(w / 60 / 5))) * 60); }
  else if (a === "skip" && c.phase === "break") { clkStartPhase(c, "work", T.w ? T.w * 60 : 0); }
  clkSet(c); clockTick(true);
}
let clkI = 0, clkLast = 0;
function clockTick(force) {
  const c = clkGet();
  if (c.run && clkAdvance(c)) { clkSet(c); buzz(); toast(c.phase === "break" ? "Mola: " + Math.round(c.len / 60) + " dk" : "Çalışma başladı", null, null, 5000); }
  if (c.run && c.phase === "work" && (force || Date.now() - clkLast > 15000)) { clkLast = Date.now(); clkFlush(c); clkSet(c); }
  // Saat ekranının dışındayken sayaç şeridi (her saniye yalnız süre yazısı değişir; dokunma kaybolmasın)
  const onClock = parseHash().parts[0] === "saat", show = c.phase !== "idle" && !onClock;
  let vis = false;
  $$(".clockchip").forEach(ch => {
    if (ch.hidden === show) { ch.hidden = !show; vis = true; }
    if (!show) return;
    const sig = c.phase + (c.run ? 1 : 0) + (c.course || "");
    if (ch.dataset.sig !== sig) {
      ch.dataset.sig = sig;
      ch.innerHTML = '<a href="#/saat">' + icon(c.phase === "break" ? "pause" : "clock") + "<b></b><span>" + (c.phase === "break" ? "Mola" : esc(c.course || "Genel")) + (c.run ? "" : " · duraklatıldı") + "</span><i>Saat ›</i></a>";
    }
    ch.querySelector("b").textContent = fmtClock(c.len ? c.len - clkEl(c) : clkEl(c));
  });
  if (vis) tabH();
  if (onClock) drawClock(c);
  if (c.phase !== "idle" && !clkI) clkI = setInterval(() => clockTick(), 1000);
  if (c.phase === "idle" && clkI) { clearInterval(clkI); clkI = 0; }
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { clockTick(true); if (parseHash().parts[0] === "saat" && clkGet().run) wake(true); } });
function clockCourses() {
  const k = currentKurul(), L = Array.from(new Set(S.cat.items.filter(i => i.g === k.id || SPECIAL[i.g]).map(i => i.c)));
  return L.concat(["Genel"]);
}
function drawClock(c) {
  const big = $("#cbig"); if (!big) return;
  const T = TECH[c.tech] || TECH.sw, el = clkEl(c), cd = c.len > 0;
  big.textContent = fmtClock(cd ? c.len - el : el);
  $("#cph").textContent = c.phase === "idle" ? "Hazır" : c.phase === "break" ? "Mola" + (c.run ? "" : " · duraklatıldı") : "Çalışma" + (c.tech !== "sw" ? " · " + ((c.cyc || 0) + 1) + ". tur" : "") + (c.run ? "" : " · duraklatıldı");
  const bar = $("#cbar"); if (bar) bar.style.width = cd ? Math.min(100, 100 * el / c.len) + "%" : "0%";
  $("#ccard").className = "card clock " + c.phase + (c.run ? " run" : "");
  $("#cbtns").innerHTML = c.phase === "idle" ? '<button class="btn primary big" data-ca="start">' + icon("play") + "Başlat</button>"
    : (c.run ? '<button class="btn big" data-ca="pause">' + icon("pause") + "Duraklat</button>" : '<button class="btn primary big" data-ca="start">' + icon("play") + "Devam</button>")
      + (c.tech === "flow" && c.phase === "work" ? '<button class="btn big" data-ca="break">Mola ver</button>' : "")
      + (c.phase === "break" ? '<button class="btn big" data-ca="skip">Molayı geç</button>' : "")
      + '<button class="btn ghost big" data-ca="stop">' + icon("stop") + "Bitir</button>";
  $$("[data-ca]").forEach(b => b.onclick = () => { clkAction(b.dataset.ca); const c2 = clkGet(); wake(c2.run); });
  $$("[data-tech]").forEach(b => { b.disabled = c.phase !== "idle"; });
  const cs = $("#ccourse"); if (cs) cs.disabled = c.phase !== "idle" && c.run;
  const sm = $("#csum"), k = String(tmDay(PS.get("tm", {}), today()));
  if (sm && sm.dataset.k !== k) { sm.dataset.k = k; sm.innerHTML = clockSum(); }
}
// Bugün ve bu hafta (Saat ekranının altı; süre yazıldıkça yenilenir)
function clockSum() {
  const tm = PS.get("tm", {}), t = today();
  const byC = new Map(); Object.values(tm[t] || {}).forEach(m => Object.entries(m || {}).forEach(([k, s]) => byC.set(k, (byC.get(k) || 0) + s)));
  const wk = []; for (let x = weekStart(t), i = 0; i < 7; i++, x = addDays(x, 1)) wk.push([x, tmDay(tm, x)]);
  const max = Math.max(3600, ...wk.map(x => x[1]));
  return '<h2 class="sec">Bugün · ' + fmtDur(tmDay(tm, t)) + "</h2>" + (byC.size ? '<div class="card">' + Array.from(byC.entries()).sort((a, b) => b[1] - a[1]).map(([k, s]) => '<div class="crow"><i class="cdot" style="background:' + ccol(k) + '"></i><div class="txt"><b>' + esc(k) + '</b></div><span class="n">' + fmtDur(s) + "</span></div>").join("") + "</div>" : '<div class="card empty">Bugün Saat’le çalışma kaydı yok.</div>')
    + '<h2 class="sec">Bu hafta · ' + fmtDur(wk.reduce((a, x) => a + x[1], 0)) + '</h2><div class="card bars">' + wk.map(([x, s]) => '<div class="bcol" title="' + fdate(x) + ": " + fmtDur(s) + '"><span class="bn">' + (s >= 60 ? Math.round(s / 60) : "") + '</span><i style="height:' + Math.round(100 * s / max) + '%"></i><span class="bd">' + ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"][dayDiff(weekStart(t), x)] + "</span></div>").join("") + "</div>";
}
function viewClock() {
  setNav("saat");
  const c = clkGet(), courses = clockCourses();
  if (!c.course || !courses.includes(c.course)) { c.course = courses[0]; clkSet(c); }
  main().innerHTML = bar({ title: "Saat", crumb: "Kronometre ve çalışma turu" }) + '<div class="page narrow">'
    + '<div class="card clock" id="ccard"><div class="chips tchips">' + Object.entries(TECH).map(([k, x]) => '<button class="chip' + (c.tech === k ? " on" : "") + '" data-tech="' + k + '">' + x.l + "</button>").join("") + "</div>"
    + '<p class="muted small tdesc">' + esc((TECH[c.tech] || TECH.sw).d) + "</p>"
    + '<label class="csel"><span>Ders</span><select id="ccourse">' + courses.map(x => "<option" + (x === c.course ? " selected" : "") + ">" + esc(x) + "</option>").join("") + "</select></label>"
    + '<div class="cbig" id="cbig">00:00</div><div class="cph" id="cph"></div><div class="cprog"><i id="cbar"></i></div><div class="row-btns cbtns" id="cbtns"></div>'
    + '<p class="note">Saat ekranı açıkken ekran kararmaz; aşama değişince telefon titrer, ses çıkmaz. Uygulamadan çıksan da süre doğru sayılır.</p></div>'
    + '<div id="csum">' + clockSum() + "</div>"
    + '<p class="note">Sütunlardaki sayılar dakika. ' + STREAK_TXT + '</p><div class="row-btns"><a class="btn" href="#/duello">' + icon("duel") + "Düello</a></div></div>";
  $$("[data-tech]").forEach(b => b.onclick = () => { const x = clkGet(); if (x.phase !== "idle") return; x.tech = b.dataset.tech; clkSet(x); viewClock(); });
  $("#ccourse").onchange = e => { const x = clkGet(); clkFlush(x); x.course = e.target.value; x.fl = Math.floor(clkEl(x)); clkSet(x); };
  clockTick(true);
  if (c.run) wake(true);
  S.cleanup.push(() => wake(false));
}

/* ---------- Düello: senkrondaki diğer profille yan yana (aynı senkron anahtarı) ---------- */
function weekSum(prof, f) { let a = 0; for (let x = weekStart(today()); x <= today(); x = addDays(x, 1)) a += f(prof, x); return a; }
const qOf = (prof, d) => dayN((prof && prof.days) || {}, d), tOf = (prof, d) => tmDay(prof && prof.tm, d);
function duelSyncBtn() {
  const b = $("#dsyn"); if (!b) return;
  b.onclick = async () => {
    b.disabled = true; b.textContent = "Eşitleniyor…";
    await syncNow({ quiet: true });
    if (parseHash().parts[0] !== "duello") return;   // bu arada başka ekrana geçildiyse o ekranı bozma
    viewDuel();
    toast(SY.err ? "Eşitlenemedi: " + SY.err : "Eşitlendi");
  };
}
function viewDuel() {
  setNav("duello");
  const t = today(), O = SY.others || [];
  const head = bar({ title: "Düello", crumb: "Bugün kim ne kadar çalıştı" }) + '<div class="page narrow">';
  if (!syncOn()) { main().innerHTML = head + '<div class="card empty">Düello için senkron gerekli: ikiniz de aynı senkron anahtarını kendi cihazınızda girin, profilleriniz yan yana görünür.<div class="row-btns" style="justify-content:center;margin-top:12px"><a class="btn primary" href="#/ayarlar">Ayarlar</a></div></div></div>'; return; }
  if (!O.length) {
    const wait = !SY.last && !SY.err;
    main().innerHTML = head + '<div class="card empty">' + (SY.last ? "Senkronda başka profil yok. Arkadaşın aynı anahtarla senkronu açınca burada görünür." : SY.err ? "Eşitlenemedi: " + esc(SY.err) : "Senkron bekleniyor…") + '<div class="row-btns" style="justify-content:center;margin-top:12px"><button class="btn" id="dsyn">Eşitle</button></div></div></div>';
    duelSyncBtn();
    // ilk açılışta bir kez eşitle (sonuç ne olursa olsun yeniden denemez; denemek için Eşitle)
    if (wait && !SY.dt) { SY.dt = 1; syncNow({ quiet: true }).then(() => { if (parseHash().parts[0] === "duello") viewDuel(); }); }
    return;
  }
  // ortak hedef: kim en son değiştirdiyse onunki
  const people = [P].concat(O), goal = (people.map(p => p === P ? PS.get("dz", null) : p.dz).filter(x => x && x.goal).sort((a, b) => (b.at || 0) - (a.at || 0))[0] || {}).goal || 500;
  const col = (pr, i) => {
    const tq = qOf(pr, t), tt = tOf(pr, t);
    return '<div class="dcol' + (i === 0 ? " me" : "") + '"><span class="av">' + esc((pr.name || "?").slice(0, 1).toLocaleUpperCase("tr")) + '</span><b>' + esc(i === 0 ? "Sen" : pr.name) + "</b>"
      + '<div class="dv"><span class="dt">' + fmtDur(tt) + '</span><small>çalışma</small></div><div class="dv"><span class="dt">' + tq + '</span><small>soru</small></div>'
      + '<div class="dw muted small">Bu hafta ' + fmtDur(weekSum(pr, tOf)) + " · " + weekSum(pr, qOf) + " soru</div>"
      + '<div class="muted small">' + icon("flame") + streakOf(d => dayActive(pr, d)) + " gün seri</div></div>";
  };
  const lead = people.slice().sort((a, b) => tOf(b, t) - tOf(a, t) || qOf(b, t) - qOf(a, t))[0];
  const tie = people.every(p => tOf(p, t) === tOf(lead, t) && qOf(p, t) === qOf(lead, t));
  const o = O[0], joint = streakOf(d => dayActive(P, d) && dayActive(o, d)), wq = people.reduce((a, p) => a + weekSum(p, qOf), 0);
  main().innerHTML = head
    + '<div class="card duel"><div class="dlead">' + (tie ? "Bugün berabersiniz" : (lead === P ? "Bugün öndesin" : "Bugün " + esc(lead.name) + " önde")) + "</div>"
    + '<div class="dcols">' + people.map(col).join("") + "</div></div>"
    + '<h2 class="sec">Ortak</h2><div class="card set"><div class="row"><div class="txt"><b>' + icon("flame") + " Ortak seri · " + joint + " gün</b><span>İkiniz de çalıştığınız her gün 1 artar; haftada 1 gün ara serbest.</span></div></div>"
    + '<div class="row"><div class="txt"><b>Haftalık ortak hedef · ' + wq + " / " + goal + ' soru</b><div class="prog" style="margin-top:6px"><i style="width:' + Math.min(100, Math.round(100 * wq / goal)) + '%"></i></div><span>Pazartesi sıfırlanır. İkinizin bu hafta çözdüğü sorular toplanır.</span></div>'
    + '<button class="btn" id="dgoal">Değiştir</button></div></div>'
    + '<p class="note">Süre Saat’le tutulur (Saat ekranında ders seçip başlat); sorular testler ve tekrardan sayılır. Son eşitleme ' + (SY.last ? new Date(SY.last).toLocaleTimeString("tr", { hour: "2-digit", minute: "2-digit" }) : "–") + '.</p>'
    + '<div class="row-btns"><button class="btn" id="dsyn">' + icon("rep") + 'Eşitle</button><a class="btn" href="#/saat">' + icon("clock") + "Saat</a></div></div>";
  duelSyncBtn();
  $("#dgoal").onclick = () => {
    const bg = sheet('<h3>Haftalık ortak hedef</h3><p class="muted small">İkinizin bir haftada birlikte çözeceği soru sayısı</p><div class="row-btns"><input id="gv" class="realin" type="number" min="10" max="5000" step="10" inputmode="numeric" value="' + goal + '"><button class="btn primary" id="gs">Kaydet</button><button class="btn" data-close>Vazgeç</button></div>');
    $("#gs", bg).onclick = () => { const v = parseInt($("#gv", bg).value, 10); if (!(v >= 10)) return; PS.set("dz", { goal: v, at: Date.now() }); bg.close(); viewDuel(); };
  };
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
  bindOff();
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
    } catch (err) { btn.disabled = false; btn.textContent = "Kaydet"; toast(netMsg(String(err.message || err))); }
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
    + (reps.length ? reps.map(r => '<div class="row"><div class="txt"><b>' + esc((r.k === "fb" ? "Test yorumu · " : "") + r.c + " · " + r.t + (r.no > 0 ? " · " + r.no + ". soru" : "")) + "</b><span>" + esc(r.k === "fb" ? [r.z].concat(r.s || []).filter(Boolean).join(", ") : reasonLabel(r.r)) + (r.n ? " · " + esc(r.n) : "") + '</span></div><button class="ibtn" data-rdel="' + esc(r.tid + "|" + r.qid) + '" aria-label="Sil">' + icon("close") + "</button></div>").join("")
      : '<div class="row"><div class="txt"><span>Bir sorunun açıklamasındaki “Hata bildir”e dokunduğunda ya da test sonundaki “Test nasıldı?”yı doldurduğunda burada birikir.</span></div></div>')
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
// Çevrimdışı: bir kurulun (ya da ortak derslerin) bütün dosyaları cihaz önbelleğine (ml-data-1) iner
function offUrls(g) {
  const urls = [];
  S.cat.items.filter(i => i.g === g && i.k !== "video").forEach(it => {
    if (it.k === "test" || it.k === "kart") urls.push("d/" + it.x + "?v=" + it.v);
    else { urls.push("d/" + it.x + "/t?v=" + it.v); for (let p = 1; p <= it.n; p++) urls.push("d/" + it.x + "/" + p + "?v=" + it.v); }
  });
  urls.push("d/s?v=" + S.cat.v);                         // arama ve Anatomi Latincesi de çevrimdışı çalışsın
  ["lat", "lex"].forEach(k => { if (S.cat[k]) urls.push("d/" + S.cat[k].x + "?v=" + S.cat[k].v); });
  return urls;
}
const offSize = g => S.cat.items.filter(i => i.g === g && i.k !== "video").reduce((n, i) => n + (i.sz || 0), 0);
let OFFK = null;                                          // önbellekteki adresler (bir kez okunur, indirince yenilenir)
async function offKeys(fresh) {
  if (!("caches" in window)) return new Set();
  if (!OFFK || fresh) { try { OFFK = new Set((await (await caches.open("ml-data-1")).keys()).map(r => r.url)); } catch (e) { OFFK = new Set(); } }
  return OFFK;
}
async function offMiss(g) { const K = await offKeys(); return offUrls(g).filter(u => !K.has(new URL(u, location.href).href)).length; }
// data-off düğmeleri: indirildiyse "İndirildi", eksik varsa "Güncelle", hiç yoksa "İndir · boyut"
async function bindOff() {
  const bs = $$("[data-off]"); if (!bs.length) return;
  for (const b of bs) {
    b.onclick = () => offline(b, b.dataset.off);
    if (b.dataset.busy) continue;
    const g = b.dataset.off, miss = await offMiss(g), all = offUrls(g).length;
    b.classList.toggle("done", !miss);
    b.innerHTML = !miss ? icon("check") + "İndirildi" : icon("dl") + (miss < all ? "Güncelle" : "İndir" + (b.dataset.sz ? " · " + fmtMB(offSize(g)) : ""));
  }
}
async function offline(btn, g) {
  const urls = offUrls(g);
  if (btn.dataset.busy) return;
  btn.dataset.busy = 1; btn.disabled = true;
  let done = 0, fail = 0, i = 0;
  const worker = async () => { while (i < urls.length) { const u = urls[i++]; try { const r = await fetch(u); if (!r.ok) fail++; await r.arrayBuffer(); } catch (e) { fail++; } done++; if (done % 10 === 0 || done === urls.length) btn.textContent = Math.round(100 * done / urls.length) + "%"; } };
  await Promise.all(Array.from({ length: 6 }, worker));
  delete btn.dataset.busy; btn.disabled = false;
  await offKeys(true);
  if (btn.isConnected) bindOff();
  toast(fail ? fail + " dosya indirilemedi; bağlantıyı kontrol edip tekrar dene." : (g === "ortak" ? "Ortak dersler" : "Kurul") + " çevrimdışı kullanıma hazır.");
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
