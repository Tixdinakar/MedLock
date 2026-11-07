// MedLock uçtan uca denetim (Playwright). Kullanım:
//   MEDLOCK_PASS=... node tools/e2e.js [http://127.0.0.1:8765/] [ekran-görüntüsü-klasörü]
// ya da: bash tools/check_site.sh   (repoyu yerelde sunup bunu çalıştırır)
// Telefon ve tablet boyutunda: giriş, kütüphane, yol (breadcrumb), slayt, test + "Slayta git", optik form, hata bildir,
// sonuç, çıkmışlar, karma deneme, tekrar, tırnaklı arama, ayarlar; en sonda çevrimdışı açılış süresi.
const { chromium } = require("playwright");
const BASE = process.argv[2] || "http://127.0.0.1:8765/";
const OUT = process.argv[3] || "";
const PASS = process.env.MEDLOCK_PASS;
if (!PASS) { console.error("MEDLOCK_PASS yok"); process.exit(2); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fails = [], notes = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };

async function login(pg) {
  await pg.goto(BASE);
  await pg.waitForSelector("#pw", { timeout: 20000 });
  await pg.fill("#pw", PASS);
  await pg.click("#lb");
  await pg.waitForSelector(".hero, #pn", { timeout: 30000 });
  if (await pg.$("#pn")) { await pg.fill("#pn", "Denetim"); await pg.click("#pf button"); }
  await pg.waitForSelector(".hero", { timeout: 30000 });
}
async function openTest(pg, href) {
  await pg.goto(BASE + href);
  const fr = await (await pg.waitForSelector(".tpane iframe", { timeout: 20000 })).contentFrame();
  await fr.waitForSelector("button.go", { timeout: 20000 });
  return fr;
}

(async () => {
  const b = await chromium.launch();
  for (const [name, vp] of [["tablet", { width: 1180, height: 820 }], ["telefon", { width: 390, height: 844 }]]) {
    const ctx = await b.newContext({ viewport: vp, serviceWorkers: "block" });
    await ctx.route("https://api.github.com/**", r => r.abort());   // denetim gerçek senkron verisine dokunmasın
    await ctx.route("https://drive.google.com/**", r => r.abort());
    const pg = await ctx.newPage();
    pg.on("pageerror", e => fails.push(name + " sayfa hatası: " + e.message));
    const shot = async n => { if (OUT) await pg.screenshot({ path: OUT + "/" + name + "-" + n + ".png" }); };
    try {
      await login(pg);
      ok(await pg.$(".duo .tile.mini"), name + ": ana sayfada Tekrar/seri yan yana değil");
      ok(!(await pg.$('a.tile[href="#/ara"]')), name + ": ana sayfada hâlâ 'Her yerde ara' var");
      ok(await pg.$('a.tile[href="#/cikmis"]'), name + ": ana sayfada Çıkmışlar yok");
      ok((await pg.$$eval(".sec-a + .card .it", x => x.length)) <= 5, name + ": son eklenenler 5'ten fazla");
      await shot("1-ana");
      await pg.goto(BASE + "#/lib"); await pg.waitForSelector(".kurul");
      const libOrder = await pg.$$eval(".page > *", xs => xs.map(x => x.getAttribute("href") || x.className));
      ok(libOrder[0] && libOrder[0].includes("#/cikmis"), name + ": Kütüphane'nin başında Çıkmışlar yok");
      ok(libOrder[libOrder.length - 1] && libOrder[libOrder.length - 1].includes("#/sozluk"), name + ": Anatomi Latincesi Kütüphane'nin sonunda değil");
      const kurul = await pg.$eval(".kurul", a => a.getAttribute("href"));
      await pg.goto(BASE + kurul); await pg.waitForSelector(".course");
      ok(!(await pg.$(".course .h")), name + ": kurul sayfasında hoca adı var");
      await shot("2-kurul");
      const course = await pg.$eval(".course", a => a.getAttribute("href"));
      await pg.goto(BASE + course); await pg.waitForSelector(".it");
      const links = await pg.$$eval(".it", as => as.map(a => a.getAttribute("href")));
      const doc = links.find(h => h && h.startsWith("#/d/"));
      if (doc) {
        await pg.goto(BASE + doc); await pg.waitForSelector(".pg img", { timeout: 20000 });
        ok(await pg.$$eval(".pg img", x => x.length) > 0, name + ": slayt görseli yüklenmedi");
        const inside = await pg.$eval(".pg", f => !!f.querySelector(".pgi .pn"));
        ok(!inside && await pg.$(".pg > figcaption.pn"), name + ": sayfa numarası slaytın dışında değil");
        const cr = await pg.$$eval(".bar .crumb a", as => as.map(a => a.getAttribute("href")));
        ok(cr.length >= 4, name + ": slaytta yol (Tıp › Dönem › Kurul › Ders) eksik: " + cr.join(" "));
        // uzun başlık dikey ekranda kesilmemeli
        await pg.goto(BASE + "#/d/biyoistatistige-giris-tanimlar-ve-kullan/1"); await pg.waitForSelector(".bar h1");
        const h1 = await pg.$eval(".bar h1", h => ({ cut: h.scrollWidth > h.clientWidth + 2 || h.scrollHeight > h.clientHeight + 2, t: h.textContent }));
        ok(!h1.cut, name + ": uzun başlık kesiliyor: " + h1.t);
        await pg.goto(BASE + doc); await pg.waitForSelector(".pg img", { timeout: 20000 });
        await shot("3-slayt");
        const kHref = cr.find(h => /^#\/lib\/[^/]+$/.test(h));
        await pg.click('.bar .crumb a[href="' + kHref + '"]'); await pg.waitForSelector(".course", { timeout: 10000 });
        ok(pg.url().endsWith(kHref), name + ": yoldaki kurul bağlantısı çalışmadı");
      }
      // test: kurul sayfasındaki testler (ders adı önde)
      await pg.goto(BASE + kurul); await pg.waitForSelector(".course");
      const testHref = await pg.evaluate(() => { const a = [...document.querySelectorAll('#sec-test ~ .card a[href^="#/t/"], a[href^="#/t/"]')][0]; return a && a.getAttribute("href"); });
      if (testHref) {
        const pre = await pg.$eval('a[href="' + testHref + '"] .t', t => t.textContent);
        ok(/·/.test(pre), name + ": test başlığının önünde ders adı yok: " + pre);
        let fr = await openTest(pg, testHref);
        ok(!(await fr.$eval(".cover h1", h => getComputedStyle(h).display !== "none").catch(() => false)), name + ": testte motorun büyük başlığı görünüyor");
        const gb = await fr.$eval("button.go", btn => { const r = btn.getBoundingClientRect(); return { txt: btn.textContent, bottom: r.bottom, vh: innerHeight }; });
        ok(/Başla · \d+ soru/.test(gb.txt) && gb.vh - gb.bottom < 40, name + ": Başla çubuğu altta sabit değil: " + JSON.stringify(gb));
        await shot("4-test-kapak");
        await fr.click("button.go"); await sleep(400);
        const top = await fr.$eval(".top", t => ({ h: t.getBoundingClientRect().height, brand: getComputedStyle(t.querySelector(".brand")).display }));
        ok(top.brand === "none" && top.h < 70, name + ": test araç satırı ince değil: " + JSON.stringify(top));
        await fr.click('[data-act="choose"][data-i="0"]'); await sleep(400);
        const go = await fr.$(".ml-go");
        notes.push(name + ": " + testHref + " ilk soruda Slayta git " + (go ? "var" : "yok"));
        if (go) { await go.click(); await sleep(1200); ok(await pg.$(".spane:not([hidden]) .pg"), name + ": slayt paneli açılmadı"); await shot("5-test-slayt"); }
        await pg.evaluate(() => { const c = document.querySelector("#spane [data-sclose]"); if (c) c.click(); });
        // hata bildir
        const rb = await fr.$(".ml-rep");
        ok(rb, name + ": Hata bildir düğmesi yok");
        if (rb) {
          await rb.click(); await pg.waitForSelector("#rsend", { timeout: 5000 });
          await pg.fill("#rnote", "denetim notu"); await shot("6-hata-bildir");
          await pg.click("#rsend"); await sleep(300);
        }
        await fr.click('[data-act="finish-ask"]').catch(() => {}); await sleep(200);
        await fr.click('[data-act="finish"]').catch(() => {}); await sleep(500);
        ok(await fr.$(".result"), name + ": test sonucu açılmadı");
        // optik form: sınav modunda başka satıra dokununca önce o soruya gider, işaret koymaz
        await fr.click('[data-act="home"]').catch(() => {}); await sleep(300);
        await fr.check('input[name="mode"][value="exam"]'); await sleep(100);
        await fr.click("button.go"); await sleep(400);
        await fr.click('.sheet-head'); await sleep(200);
        await fr.click('.b[data-k="2"][data-i="1"]'); await sleep(300);
        let st = await fr.evaluate(() => ({ count: document.querySelector(".count").textContent, sel: document.querySelectorAll(".b.sel").length }));
        ok(/Soru 3 \//.test(st.count) && st.sel === 0, name + ": optik formda başka satır önce soruya gitmedi: " + JSON.stringify(st));
        await fr.click('.b[data-k="2"][data-i="1"]'); await sleep(300);
        st = await fr.evaluate(() => ({ sel: [...document.querySelectorAll(".b.sel")].map(b => b.dataset.k + ":" + b.dataset.i), open: !!document.querySelector(".sheet.open") }));
        ok(st.sel.join() === "2:1" && st.open, name + ": optik formda açık sorunun satırı işaretlemedi: " + JSON.stringify(st));
        await shot("7-optik");
      } else notes.push(name + ": test bulunamadı");
      // çıkmışlar
      await pg.goto(BASE + "#/cikmis"); await pg.waitForSelector(".cxc", { timeout: 10000 });
      const cx = await pg.$$eval(".cxc", cs => cs.map(c => c.querySelectorAll(".cxa").length));
      ok(cx.length && cx.every(n => n >= 2), name + ": çıkmışlar sayfasında test + PDF yan yana değil: " + cx.join(","));
      await shot("8-cikmislar");
      // karma deneme: altta Başla çubuğu
      await pg.goto(BASE + "#/karma"); await pg.waitForSelector(".gobar .go:not([disabled])", { timeout: 20000 });
      const mk = await pg.$eval(".gobar", g => { const r = g.getBoundingClientRect(); return { b: r.bottom, vh: document.querySelector("#main").getBoundingClientRect().bottom, t: g.textContent }; });
      ok(Math.abs(mk.vh - mk.b) < 4 && /Başla · \d+ soru/.test(mk.t), name + ": karma denemede Başla çubuğu altta değil: " + JSON.stringify(mk));
      await shot("9-karma");
      await pg.click(".gobar .go"); await pg.waitForSelector(".tpane iframe", { timeout: 20000 });
      await pg.goto(BASE + "#/tekrar"); await pg.waitForSelector(".stat3");
      // arama: tırnaklı ifade yalnız yan yana geçenleri bulur
      const count = async q => { await pg.goto(BASE + "#/ara?q=" + encodeURIComponent(q)); await pg.waitForSelector(".hit, .empty, .note", { timeout: 30000 }); await sleep(300); return pg.$$eval(".hit", x => x.length); };
      const loose = await count("peptid bağı"), exact = await count('"peptid bağı"');
      const marks = await pg.$$eval(".hit mark", ms => ms.slice(0, 8).map(m => m.textContent.toLocaleLowerCase("tr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i")));
      ok(exact > 0 && exact <= loose, name + ": tırnaklı arama beklenen gibi değil (" + exact + " / " + loose + ")");
      ok(marks.length && marks.every(m => /peptid[\s-]+bag/.test(m)), name + ": tırnaklı aramada vurgular ifadeyi kapsamıyor: " + marks.join(" | "));
      notes.push(name + ": arama peptid bağı " + loose + " sonuç, tırnaklı " + exact);
      await shot("10-arama");
      await pg.goto(BASE + "#/ayarlar"); await pg.waitForSelector(".set");
      ok(await pg.$("#rcopy"), name + ": Ayarlar'da hata bildirimi ve Kopyala yok");
      await pg.evaluate(() => document.getElementById("hb").scrollIntoView());
      await shot("11-ayarlar");
    } catch (e) { fails.push(name + ": " + e.message.split("\n")[0]); }
    await ctx.close();
  }
  // çevrimdışı: service worker açıkken bir kez girildikten sonra ağ yokken açılış
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });   // route yok: Playwright'ta route açıkken service worker atlanır
    const pg = await ctx.newPage();
    pg.on("pageerror", e => fails.push("çevrimdışı sayfa hatası: " + e.message));
    await login(pg);
    await pg.evaluate(() => navigator.serviceWorker.ready); await sleep(1500);
    await pg.reload(); await pg.waitForSelector(".hero", { timeout: 20000 }); await sleep(800);
    await ctx.setOffline(true);
    const t0 = Date.now();
    await pg.reload(); await pg.waitForSelector(".hero", { timeout: 15000 });
    const ms = Date.now() - t0;
    notes.push("çevrimdışı açılış " + ms + " ms");
    ok(ms < 2500, "çevrimdışı açılış yavaş: " + ms + " ms");
    await pg.goto(BASE + "#/lib"); await pg.waitForSelector(".kurul", { timeout: 5000 });
    await ctx.close();
  } catch (e) { fails.push("çevrimdışı: " + e.message.split("\n")[0]); }
  await b.close();
  console.log(JSON.stringify({ ok: !fails.length, fails, notes }, null, 1));
  process.exit(fails.length ? 1 : 0);
})();
