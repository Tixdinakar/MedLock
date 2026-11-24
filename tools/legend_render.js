// tools/legend.py için: lejant HTML parçalarını A4 PDF'e çevirir (Playwright). Kullanım: node legend_render.js işler.json
const { chromium } = require("playwright"); const fs = require("fs");
const NOTE_CSS = "@page { size: A4; margin: 16mm 15mm 18mm; }\n* { box-sizing: border-box; }\nbody { font-family: \"Inter\", \"Noto Sans\", \"DejaVu Sans\", sans-serif; font-size: 10.6pt; line-height: 1.5; color: #1d2433; margin: 0; }\n.eb { color: #2f55c7; font-weight: 700; letter-spacing: .06em; font-size: 9pt; text-transform: uppercase; }\nh1 { font-size: 21pt; margin: 2pt 0 2pt; color: #141a26; line-height: 1.15; }\n.src { color: #6a7385; font-size: 9.5pt; margin-bottom: 8pt; padding-bottom: 8pt; border-bottom: 2px solid #2f55c7; }\nh2 { font-size: 13.5pt; color: #1f2d57; margin: 14pt 0 5pt; display: flex; justify-content: space-between; align-items: baseline; break-after: avoid; }\nh2 .n { color: #2f55c7; margin-right: 6pt; }\nh2 small { color: #8a92a3; font-weight: 400; font-size: 8.5pt; }\nh3 { font-size: 11pt; margin: 8pt 0 3pt; color: #1f2d57; break-after: avoid; }\nul { margin: 3pt 0 6pt; padding-left: 15pt; } li { margin: 1.5pt 0; }\np { margin: 3pt 0 6pt; }\ntable { width: 100%; border-collapse: collapse; margin: 5pt 0 8pt; font-size: 9.6pt; } tr { break-inside: avoid; }\nth { background: #eaf0fb; text-align: left; font-weight: 600; }\nth, td { border: 1px solid #d5dcea; padding: 4pt 6pt; vertical-align: top; }\n.box { background: #edf2fd; border-left: 4px solid #2f55c7; border-radius: 4pt; padding: 6pt 9pt; margin: 7pt 0; break-inside: avoid; }\n.box b.t { display: block; color: #2f55c7; font-size: 8.6pt; letter-spacing: .05em; text-transform: uppercase; margin-bottom: 2pt; }\n.warn { background: #fff4e5; border-left-color: #e08a00; } .warn b.t { color: #b36b00; }\n.hoca { background: #fdeef0; border-left-color: #d0394f; } .hoca b.t { color: #b42339; }\n.ex { background: #f2f7ef; border-left-color: #3d8b3d; } .ex b.t { color: #2e6e2e; }\n.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 10pt; }\n.k { font-weight: 700; }\nsvg { display: block; margin: 4pt auto; max-width: 100%; }\n.cap { text-align: center; color: #6a7385; font-size: 8.6pt; margin-top: -2pt; }\n";
(async () => {
  const jobs = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const css = NOTE_CSS + `
  .lg{columns:2;column-gap:14pt;margin:3pt 0 6pt}.lg .r{break-inside:avoid;display:flex;gap:6pt;padding:2.2pt 0;border-bottom:1px solid #e6ebf4;font-size:9.4pt;line-height:1.35}
  .lg .r b{flex:0 0 22%;color:#1f2d57;word-break:break-word}.lg.ab .r b{flex-basis:24%}.nt{color:#6a7385;font-size:9pt;margin:0 0 2pt}
  h2{font-size:12pt;margin:10pt 0 3pt;border-bottom:1px solid #d5dcea;padding-bottom:2pt}`;
  const b = await chromium.launch();
  for (const j of jobs) {
    const pg = await b.newPage();
    await pg.setContent('<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>' + css + '</style></head><body>' + fs.readFileSync(j.src, "utf8") + "</body></html>", { waitUntil: "load" });
    await pg.pdf({ path: j.out, format: "A4", printBackground: true, displayHeaderFooter: true, headerTemplate: "<span></span>",
      footerTemplate: '<div style="font-size:8px;color:#6a7385;width:100%;padding:0 15mm;font-family:sans-serif">' + j.title.replace(/&/g,"&amp;").replace(/</g,"&lt;") + '</div>',
      margin: { top: "16mm", bottom: "18mm", left: "15mm", right: "15mm" } });
    await pg.close();
  }
  await b.close();
})();

(async () => {
  const jobs = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const css = NOTE_CSS + `
  .lg{columns:2;column-gap:14pt;margin:3pt 0 6pt}.lg .r{break-inside:avoid;display:flex;gap:6pt;padding:2.2pt 0;border-bottom:1px solid #e6ebf4;font-size:9.4pt;line-height:1.35}
  .lg .r b{flex:0 0 22%;color:#1f2d57;word-break:break-word}.lg.ab .r b{flex-basis:24%}.nt{color:#6a7385;font-size:9pt;margin:0 0 2pt}
  h2{font-size:12pt;margin:10pt 0 3pt;border-bottom:1px solid #d5dcea;padding-bottom:2pt}`;
  const b = await chromium.launch();
  for (const j of jobs) {
    const pg = await b.newPage();
    await pg.setContent('<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>' + css + '</style></head><body>' + fs.readFileSync(j.src, "utf8") + "</body></html>", { waitUntil: "load" });
    await pg.pdf({ path: j.out, format: "A4", printBackground: true, displayHeaderFooter: true, headerTemplate: "<span></span>",
      footerTemplate: '<div style="font-size:8px;color:#6a7385;width:100%;padding:0 15mm;font-family:sans-serif">' + j.title.replace(/&/g,"&amp;").replace(/</g,"&lt;") + '</div>',
      margin: { top: "16mm", bottom: "18mm", left: "15mm", right: "15mm" } });
    await pg.close();
  }
  await b.close();
})();
