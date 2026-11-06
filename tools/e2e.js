// MedLock uçtan uca denetim (Playwright). Kullanım:
//   MEDLOCK_PASS=... node tools/e2e.js [http://127.0.0.1:8765/] [ekran-görüntüsü-klasörü]
// ya da: bash tools/check_site.sh   (repoyu yerelde sunup bunu çalıştırır)
// Telefon ve tablet boyutunda: giriş, kütüphane, slayt, test + "Slayta git", sonuç paneli, tekrar, arama, kartlar.
const { chromium } = require("playwright");
const BASE = process.argv[2] || "http://127.0.0.1:8765/";
const OUT = process.argv[3] || "";
const PASS = process.env.MEDLOCK_PASS;
if (!PASS) { console.error("MEDLOCK_PASS yok"); process.exit(2); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fails = [], notes = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };

(async () => {
  const b = await chromium.launch();
  for (const [name, vp] of [["tablet", { width: 1180, height: 820 }], ["telefon", { width: 390, height: 844 }]]) {
    const ctx = await b.newContext({ viewport: vp, serviceWorkers: "block" });
    const pg = await ctx.newPage();
    pg.on("pageerror", e => fails.push(name + " sayfa hatası: " + e.message));
    const shot = async n => { if (OUT) await pg.screenshot({ path: OUT + "/" + name + "-" + n + ".png" }); };
    try {
      await pg.goto(BASE);
      await pg.waitForSelector("#pw", { timeout: 20000 });
      await pg.fill("#pw", PASS);
      await pg.click("#lb");
      await pg.waitForSelector(".hero", { timeout: 30000 });
      await shot("1-ana");
      await pg.goto(BASE + "#/lib"); await pg.waitForSelector(".kurul");
      const kurul = await pg.$eval(".kurul", a => a.getAttribute("href"));
      await pg.goto(BASE + kurul); await pg.waitForSelector(".course");
      const course = await pg.$eval(".course", a => a.getAttribute("href"));
      await pg.goto(BASE + course); await pg.waitForSelector(".it");
      await shot("2-ders");
      const links = await pg.$$eval(".it", as => as.map(a => a.getAttribute("href")));
      const doc = links.find(h => h.startsWith("#/d/"));
      if (doc) {
        await pg.goto(BASE + doc); await pg.waitForSelector(".pg img", { timeout: 20000 });
        ok(await pg.$$eval(".pg img", x => x.length) > 0, name + ": slayt görseli yüklenmedi");
        await shot("3-slayt");
      }
      // test: kütüphanedeki herhangi bir test
      await pg.goto(BASE + "#/");
      const testHref = await pg.evaluate(() => { const a = [...document.querySelectorAll('a[href^="#/t/"]')][0]; return a && a.getAttribute("href"); })
        || await (async () => { await pg.goto(BASE + course); return pg.evaluate(() => { const a = [...document.querySelectorAll('a[href^="#/t/"]')][0]; return a && a.getAttribute("href"); }); })();
      if (testHref) {
        await pg.goto(BASE + testHref);
        const fr = await (await pg.waitForSelector(".tpane iframe", { timeout: 20000 })).contentFrame();
        await fr.waitForSelector("button.go", { timeout: 20000 });
        await fr.click("button.go"); await sleep(400);
        await fr.click('[data-act="choose"][data-i="0"]'); await sleep(400);
        const go = await fr.$(".ml-go");
        notes.push(name + ": " + testHref + " ilk soruda Slayta git " + (go ? "var" : "yok"));
        if (go) { await go.click(); await sleep(1200); ok(await pg.$(".spane:not([hidden]) .pg"), name + ": slayt paneli açılmadı"); await shot("4-test-slayt"); }
        await pg.evaluate(() => { const c = document.querySelector("#spane [data-sclose]"); if (c) c.click(); });
        await fr.click('[data-act="finish-ask"]').catch(() => {}); await sleep(200);
        await fr.click('[data-act="finish"]').catch(() => {}); await sleep(500);
        ok(await fr.$(".result"), name + ": test sonucu açılmadı");
      } else notes.push(name + ": test bulunamadı");
      await pg.goto(BASE + "#/tekrar"); await pg.waitForSelector(".stat3");
      await pg.goto(BASE + "#/ara?q=protein"); await pg.waitForSelector(".hit, .empty", { timeout: 30000 });
      notes.push(name + ": arama 'protein' " + (await pg.$$eval(".hit", x => x.length)) + " sonuç");
      await shot("5-arama");
      await pg.goto(BASE + "#/ayarlar"); await pg.waitForSelector(".set");
    } catch (e) { fails.push(name + ": " + e.message.split("\n")[0]); }
    await ctx.close();
  }
  await b.close();
  console.log(JSON.stringify({ ok: !fails.length, fails, notes }, null, 1));
  process.exit(fails.length ? 1 : 0);
})();
