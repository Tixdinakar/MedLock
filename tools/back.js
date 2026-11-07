// Geri tuşu denetimi (check_site.sh çalıştırır). Telefonun geri tuşu = page.goBack(), sol üstteki ok = .bar [data-back]
const { chromium } = require("playwright");
const BASE = process.argv[2], PASS = process.env.MEDLOCK_PASS;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fails = [], log = [];
const ok = (c, m) => { if (!c) fails.push(m); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const pg = await ctx.newPage();
  pg.on("pageerror", e => fails.push("JS: " + e.message));
  const H = () => decodeURIComponent(pg.url().split("#")[1] || "/");
  const tap = async sel => { await pg.click(sel); await sleep(450); };
  const sysBack = async () => { await pg.goBack({ waitUntil: "commit" }).catch(() => {}); await sleep(450); };
  const step = async (n, fn) => { try { await fn(); } catch (e) { fails.push(n + ": " + e.message.split("\n")[0]); } };
  await pg.goto(BASE); await pg.waitForSelector("#pw"); await pg.fill("#pw", PASS); await pg.click("#lb");
  await pg.waitForSelector("#pn", { timeout: 30000 }); await pg.fill("#pn", "Geri"); await pg.click("#pf button"); await pg.waitForSelector(".hero");
  const depth = () => pg.evaluate(() => window.__ml.nav());

  await step("yolla yukarı, sonra ok", async () => {
    await tap('.tabs a[href="#/lib"]'); await tap('a.kurul[href="#/lib/k2"]'); await tap('a.course[href="#/lib/k2/biyokimya"]');
    await tap('a.it[href^="#/d/"]'); await pg.waitForSelector(".pg img");
    const d0 = await depth();
    await tap('.bar .crumb a[href="#/lib/k2"]');
    ok(H() === "/lib/k2" && (await depth()) === d0 - 2, "yol: Kurul II'ye geçmişte geri dönülmedi (" + H() + ", derinlik " + (await depth()) + ")");
    await tap(".bar [data-back]");
    ok(H() === "/lib", "ok: Kurul II'den sonra " + H() + " (beklenen /lib)");
    await sysBack();
    ok(H() === "/", "telefon geri: Kütüphane'den sonra " + H() + " (beklenen ana sayfa)");
    log.push("1 tamam");
  });

  await step("sekmeler geçmişi şişirmez", async () => {
    await tap('.tabs a[href="#/tekrar"]'); await tap('.tabs a[href="#/ilerleme"]'); await tap('.tabs a[href="#/ara"]'); await tap('.tabs a[href="#/"]');
    ok((await depth()) === 1, "sekmeler: ana sayfaya dönünce derinlik " + (await depth()));
  });

  await step("testte slayt paneli", async () => {
    await tap('.tabs a[href="#/lib"]'); await tap('a.kurul[href="#/lib/k2"]'); await tap('a.course[href="#/lib/k2/biyokimya"]');
    await tap('a.it[href="#/t/bk-redoks-den"]');
    const fr = await (await pg.waitForSelector(".tpane iframe")).contentFrame();
    await fr.waitForSelector("button.go"); await fr.check('input[name="mode"][value="study"]'); await fr.click("button.go"); await sleep(300);
    await fr.click('[data-act="choose"][data-i="0"]'); await sleep(200);
    await fr.click(".ml-go"); await sleep(900);
    ok(await pg.$("#spane:not([hidden])"), "panel açılmadı");
    await sysBack();
    ok(H() === "/t/bk-redoks-den" && !(await pg.$("#spane:not([hidden]) .pg")), "telefon geri: panel kapanmadı ya da testten çıktı (" + H() + ")");
    // X ile kapat, sonra telefon geri: ölü basış olmamalı
    await fr.click(".ml-go"); await sleep(900);
    await pg.click("#spane [data-sclose]"); await sleep(500);
    ok(H() === "/t/bk-redoks-den", "X sonrası adres " + H());
    await sysBack();
    ok(H() === "/lib/k2/biyokimya", "X sonrası telefon geri: " + H() + " (beklenen ders sayfası)");
    log.push("3 tamam");
  });

  await step("alt pencere", async () => {
    await tap('a.it[href="#/t/bk-redoks-den"]'); await pg.waitForSelector("#tinfo");
    await tap("#tinfo"); ok(await pg.$(".sheet"), "bilgi penceresi açılmadı");
    await sysBack();
    ok(!(await pg.$(".sheet")) && H() === "/t/bk-redoks-den", "telefon geri: pencere kapanmadı ya da testten çıktı (" + H() + ")");
    await tap("#tinfo"); await tap(".sheet .dist a");
    await pg.waitForSelector(".pg img");
    ok(/^\/d\//.test(H()), "pencereden slayta gitmedi: " + H());
    await sysBack();
    ok(H() === "/t/bk-redoks-den", "slayttan telefon geri: " + H() + " (beklenen test, ara kayıt olmamalı)");
    await sysBack();
    ok(H() === "/lib/k2/biyokimya" || H() === "/lib/k1/biyokimya", "testten telefon geri: " + H());
    log.push("4 tamam");
  });

  await step("hata bildir kaydet", async () => {
    await pg.goto(BASE + "#/t/bk-redoks-mini");
    const fr = await (await pg.waitForSelector(".tpane iframe")).contentFrame();
    await fr.waitForSelector(".count, button.go");
    if (await fr.$("button.go")) { await fr.check('input[name="mode"][value="study"]'); await fr.click("button.go"); await sleep(300); }
    await fr.click('[data-act="choose"][data-i="0"]').catch(() => {}); await sleep(200);
    await fr.click(".ml-rep"); await pg.waitForSelector("#rsend"); await pg.click("#rsend"); await sleep(500);
    const before = H();
    await sysBack();
    ok(H() !== before, "kaydettikten sonra telefon geri ölü basış (" + H() + ")");
  });

  await step("arama", async () => {
    await pg.goto(BASE + "#/"); await sleep(300);
    await tap('.tabs a[href="#/ara"]');
    await pg.fill("#sq", "enzim"); await sleep(900);
    await tap(".hit[href^='#/d/'], a.hit");
    await sysBack();
    ok(/^\/ara\?q=enzim/.test(H()), "aramadan slayta, telefon geri: " + H());

  });

  await step("doğrudan açılan derin sayfa", async () => {
    const p2 = await ctx.newPage();
    await p2.goto(BASE + "#/lib/k2/biyokimya"); await p2.waitForSelector(".it");
    const L = await p2.evaluate(() => history.length);
    await p2.click(".bar [data-back]"); await sleep(500);
    ok(p2.url().endsWith("#/lib/k2"), "derin sayfada ok: " + p2.url());
    ok((await p2.evaluate(() => history.length)) === L, "derin sayfada ok geçmişe kayıt ekledi");
    await p2.close();
  });

  await step("slayt sayfa değişimi + ok", async () => {
    await pg.goto(BASE + "#/lib/k2/biyokimya"); await pg.waitForSelector(".it");
    await tap('a.it[href^="#/d/"]'); await pg.waitForSelector(".pg img");
    await pg.$eval("#doc", d => { d.scrollTop = d.scrollHeight / 2; }); await sleep(800);
    await tap(".bar [data-back]");
    ok(H() === "/lib/k2/biyokimya", "slayttan ok: " + H());
    await tap('a.it[href^="#/d/"]');
    log.push("geri dönülen sayfa: " + H());
  });

  await b.close();
  console.log(JSON.stringify({ ok: !fails.length, fails, log }, null, 1));
})();
