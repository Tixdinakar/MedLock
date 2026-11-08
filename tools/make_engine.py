#!/usr/bin/env python3
"""Bir test HTML'inden (Astronomican test motoru) MedLock'un ortak engine.html şablonunu üretir.

  python3 tools/make_engine.py test.html

Testin CFG/DATA kısmı çıkarılır, yerine /*ML_DATA*/ konur; MedLock köprüsü (Slayta git,
yanlış listesi, tekrar kaydı) için birkaç küçük yama yapılır. Şablon içerik taşımaz, açık durabilir.
"""
import json, os, re, sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def rep(s, a, b):
    assert s.count(a) == 1, (a[:60], s.count(a))
    return s.replace(a, b)


BRIDGE_CSS = """<style>
.ml-go{display:flex;align-items:center;gap:8px;margin-top:10px;width:100%;text-align:left;font:600 13px/1.35 var(--f-ui,system-ui);
  color:var(--form,#0f5c63);background:var(--surface,#fff);border:1px solid var(--line,#ddd);border-radius:10px;padding:9px 12px;cursor:pointer}
.ml-go:hover{border-color:var(--form,#0f5c63)}
.ml-go .ml-ic{flex:none;width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.ml-go .ml-t{flex:1;min-width:0}
.ml-go .ml-t small{display:block;font-weight:500;color:var(--muted,#666);font-size:12px}
.ml-go .ml-arrow{flex:none;font-weight:700}
.ml-decks{display:grid;gap:10px}
.ml-deck{border:1px solid var(--line,#ddd);border-radius:10px;padding:10px 12px}
.ml-deck b{display:block;font-size:14px;margin-bottom:6px}
.ml-deck .ml-n{font-weight:500;color:var(--muted,#666);font-size:12.5px;margin-left:6px}
.ml-chips{display:flex;flex-wrap:wrap;gap:6px}
.ml-chip{font:600 12.5px var(--f-mono,monospace);border:1px solid var(--line,#ddd);background:var(--surface,#fff);color:var(--ink,#111);
  border-radius:999px;padding:5px 10px;cursor:pointer}
.ml-chip:hover{border-color:var(--form,#0f5c63);color:var(--form,#0f5c63)}
.ml-chip.est{border-style:dashed}
.ml-note{font-size:12.5px;color:var(--muted,#666);margin:8px 0 0}
</style>"""


# MedLock'a özgü motor değişiklikleri. build() bunları uygular; mevcut engine.html'e uygulamak için:
#   python3 tools/make_engine.py --apply
ML_CSS = """<style>
/* MedLock içinde: başlık uygulamanın üst çubuğunda; motorun büyük başlığı gizli, araç satırı ince */
html.ml .cover h1{display:none}
html.ml .cover{padding-top:14px}
html.ml .eyebrow{margin-bottom:4px}
html.ml .top{padding-block:8px;margin-bottom:12px;flex-wrap:nowrap}
html.ml .top .brand{display:none}
html.ml .top .tools{flex:1;flex-wrap:nowrap;gap:6px;min-width:0}
html.ml .top .tools .sp{flex:1}
html.ml .top .tools .btn{padding:6px 11px;font-size:13px}
html.ml .top .chip{padding:3px 9px;font-size:12px}
/* başlat düğmesi ekranın altında sabit */
.gobar{position:fixed;left:0;right:0;bottom:0;z-index:20;display:flex;justify-content:center;padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px));background:color-mix(in srgb,var(--bg) 90%,transparent);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-top:1px solid var(--line)}
.gobar .go{width:100%;max-width:520px;justify-content:center;padding:12px 16px;font-size:15px}
body.has-gobar{padding-bottom:84px}
.ml-rep{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;gap:6px;margin-top:10px;font:600 12.5px var(--f-ui,system-ui);color:var(--muted,#666);padding:4px 2px}
.ml-rep:hover{color:var(--bad,#b00)}
.ml-gss{margin-left:14px;color:var(--form,#0f5c63)}
.ml-gsd{margin-left:14px;cursor:default;color:var(--ok,#1b7f3b)}
.ml-ozet{all:unset;box-sizing:border-box;cursor:pointer;margin-left:6px;font:600 12px var(--f-ui,system-ui);color:var(--form,#0f5c63);text-decoration:underline;text-underline-offset:2px}
.ml-cx .ml-ic{color:#b7791f}
</style>"""
PATCHES = [
    # yatay tablet ve PC: soru sütunu geniş, yazı büyük (tabletin genişliği boşa gitmesin)
    ("/* --- ortak motor eklemeleri --- */",
     "/* --- ortak motor eklemeleri --- */\n@media (min-width:1000px){html .quiz{max-width:1000px}html .stem{font-size:21px;max-width:none}html .roman{font-size:19px;max-width:none}html .opt{font-size:18.5px;padding:12px 14px;grid-template-columns:34px minmax(0,1fr)}html .bub{width:34px;height:34px}html .passage{font-size:18px}html .fb{font-size:16.5px;max-width:none}html .fb h4{font-size:16.5px}html .qnum{font-size:42px}html .topic,html .count{font-size:14.5px}}"),
    # Buğra'nın sınavlarında net yok (yanlış doğruyu götürmez): sonuçta net gösterilmez
    ("'B · net ' + num(s.net) + '</span></div>'", "'B</span></div>'"),
    ("+ '<div class=\"n\"><b>' + num(st.net) + '</b><span>Net (4 yanlış 1 doğruyu götürür)</span></div><div><b>' + pct(st.ok, st.total) + '</b><span>Başarı</span></div></div></div>'",
     "+ '<div class=\"n\"><b>' + pct(st.ok, st.total) + '</b><span>Başarı</span></div></div></div>'"),
    # MedLock içinde mi? (başlık gizleme vb. için)
    ("<script>window.ML=(function(){try{return parent.MLBridge(window)}catch(e){return null}})();</script>",
     "<script>window.ML=(function(){try{return parent.MLBridge(window)}catch(e){return null}})();if(window.ML)document.documentElement.classList.add(\"ml\");</script>\n" + ML_CSS),
    # tek başlık: araç satırı kısa mod adıyla, düğmeler sağda
    ("h += '<div class=\"tools\"><span class=\"chip\">' + MODE_NAME[r.mode] + '</span>'",
     "h += '<div class=\"tools\"><span class=\"chip\">' + (window.ML ? MODE_SHORT : MODE_NAME)[r.mode] + '</span>'"),
    ("+ '<button class=\"btn ghost\" type=\"button\" data-act=\"home\">Kapak</button>'\n      + (r.finished",
     "+ '<span class=\"sp\"></span><button class=\"btn ghost\" type=\"button\" data-act=\"home\">Kapak</button>'\n      + (r.finished"),
    ("h += '<div class=\"tools\"><button class=\"btn ghost\" type=\"button\" data-act=\"home\">Kapak</button></div>';",
     "h += '<div class=\"tools\"><span class=\"sp\"></span><button class=\"btn ghost\" type=\"button\" data-act=\"home\">Kapak</button></div>';"),
    ("const MODE_NAME = { study:\"Çalışma modu\", exam:\"Sınav modu\", timed:\"Zamana karşı\" };",
     "const MODE_NAME = { study:\"Çalışma modu\", exam:\"Sınav modu\", timed:\"Zamana karşı\" };\nconst MODE_SHORT = { study:\"Çalışma\", exam:\"Sınav\", timed:\"Zamana karşı\" };"),
    # başlat düğmesi: ekranın altında sabit çubuk, seçili soru sayısıyla
    ("    + '<button class=\"btn primary go\" type=\"submit\">Denemeye başla</button>'\n    + resume\n    + '</form>'",
     "    + resume\n    + '</form>'\n    + '<div class=\"gobar\"><button class=\"btn primary go\" type=\"submit\" form=\"setup\">Başla · <span id=\"go-n\">' + nSel + '</span> soru</button></div>'"),
    ("  top.hidden = S.view === \"start\";",
     "  top.hidden = S.view === \"start\";\n  document.body.classList.toggle(\"has-gobar\", S.view === \"start\");"),
    ("  [\"all\",\"custom\"].concat(CFG.courses.map(c => c.code)).forEach(k => { const el = document.getElementById(\"n-\" + k); if(el) el.textContent = setIds(k).length; });",
     "  [\"all\",\"custom\"].concat(CFG.courses.map(c => c.code)).forEach(k => { const el = document.getElementById(\"n-\" + k); if(el) el.textContent = setIds(k).length; });\n  const gn = document.getElementById(\"go-n\"); if(gn) gn.textContent = setIds(S.set).length;"),
    # optik form: başka sorunun satırına dokunmak önce o soruya götürür; işaret yalnız açık sorunun satırında değişir
    ("return '<div class=\"row ' + CC(q.c) + (k === r.cur ? \" cur\" : \"\") + '\">",
     "return '<div class=\"row ' + CC(q.c) + (k === r.cur ? \" cur\" : \"\") + '\" data-act=\"jump\" data-k=\"' + k + '\">"),
    ("      const k = +el.dataset.k, i = +el.dataset.i; r.cur = k; r.confirm = false;\n      if(r.mode !== \"study\" && !r.finished){ const id = r.ids[k]; if(r.ans[id] === i) delete r.ans[id]; else r.ans[id] = i; }\n      save(); render(); if(r.mode === \"study\" || r.finished) bringCardIntoView();\n      break;",
     "      const k = +el.dataset.k, i = +el.dataset.i;\n      if(k !== r.cur){ r.cur = k; r.confirm = false; save(); render(); bringCardIntoView(); break; }\n      choose(i);\n      break;"),
    ("+ '<small>Numaraya dokun, o soruya git</small></button>'",
     "+ '<small>Satıra dokun, o soruya git; şıkkı orada işaretle</small></button>'"),
    # hata bildir; doğru ama tahminle bildiysen tekrar listesine ekle
    ("+ '</div>' + (window.ML ? ML.btn(q.id) : '') + '</div>';",
     "+ '</div>' + (window.ML ? ML.btn(q.id) : '') + (window.ML && ML.rep ? ML.rep(q.id) : '') + (window.ML && ML.guess && st === \"ok\" ? ML.guess(q.id) : '') + '</div>';"),
    # her cevap bir kez sayılsın (MedLock tekrar ve günlük sayaç)
    ("S.run = { mlid: Date.now(), label, ids:list,", "S.run = { mlid: Date.now(), mlc: [], label, ids:list,"),
    # karma deneme kendiliğinden başlar (mod MedLock'un karma ekranında seçilir; ikinci bir kapak açılmaz)
    ("function boot(data){\n  if(data && data.S && data.S.v === 2) S = data.S;\n  render();\n}",
     "function boot(data){\n  if(data && data.S && data.S.v === 2) S = data.S;\n  if(CFG.autostart && !S.run){ const A = CFG.autostart; S.mode = A.mode || \"study\"; startRun(DATA.map(q => q.id), A.label || (DATA.length + \" soru\"), S.mode, A.minutes || DATA.length); return; }\n  render();\n}"),
    # zayıf konu: en az 3 cevaplı soru; yarıda bitirilen denemede boşlar sayılmaz
    ("  const topics = order.map(key => { const s = stats(r, groups[key]); return { key, c:key.split(\"|\")[0], t:key.split(\"|\")[1], s, p: s.ok / s.total }; })\n    .sort((x, y) => x.p - y.p || y.s.total - x.s.total);\n  const weakN = topics.filter(o => o.p < 0.6).length;\n  const trows = topics.map(o => '<tr class=\"' + (o.p < 0.6 ? \"weak\" : \"\") + '\"><td><span class=\"tname\">' + (multi ? '<span class=\"cchip ' + CC(o.c) + '\">' + esc(COURSES[o.c].short) + '</span>' : '') + esc(o.t) + (o.p < 0.6 ? ' <span class=\"wtag\">zayıf</span>' : '') + '</span></td>'",
     "  const full = answered(r) >= 0.8 * r.ids.length;\n  const topics = order.map(key => { const s = stats(r, groups[key]), base = full ? s.total : s.ok + s.bad; return { key, c:key.split(\"|\")[0], t:key.split(\"|\")[1], s, p: base ? s.ok / base : 1, w: base >= 3 && s.ok / base < 0.6 }; })\n    .sort((x, y) => (y.w ? 1 : 0) - (x.w ? 1 : 0) || x.p - y.p || y.s.total - x.s.total);\n  const weakN = topics.filter(o => o.w).length;\n  const trows = topics.map(o => '<tr class=\"' + (o.w ? \"weak\" : \"\") + '\"><td><span class=\"tname\">' + (multi ? '<span class=\"cchip ' + CC(o.c) + '\">' + esc(COURSES[o.c].short) + '</span>' : '') + esc(o.t) + (o.w ? ' <span class=\"wtag\">zayıf</span>' + (window.ML && ML.ozet ? ML.ozet(groups[o.key], o.t) : '') : '') + '</span></td>'"),
    ("(weakN ? '<p class=\"note\">%60\\'ın altındaki ' + weakN + ' konu zayıf olarak işaretli.</p>' : '')",
     "'<p class=\"note\">' + (weakN ? 'En az 3 sorusunu cevapladığın ve %60’ın altında kalan ' + weakN + ' konu zayıf olarak işaretli.' : 'Zayıf konu yok.') + (full ? '' : ' Denemeyi yarıda bitirdiğin için boşlar zayıf sayılmadı.') + '</p>'"),
    ("+ (window.ML ? ML.panel(wrong.map(o => o.id)) : '')",
     "+ (window.ML ? ML.panel(wrong.filter(o => full || status(r, o.id) === \"bad\").map(o => o.id)) : '')"),
]


# 1.3 (8 Kasım): emin değilim işareti, boş/emin değilim süzgeci, bitirirken "boşlara dön", optik form sol kenarda
# sekme ve "yana sabitle" (sol/sağ sütun), tam ekranda araç satırı yer açar, test sonu yorumu.
PATCHES += [
    # süzgeç: boşlar / emin olmadıklarım (açık soru hep görünür kalır, cevaplayınca gezinme bozulmasın)
    (r"""  if(!(r.finished && r.onlyWrong)) return all;
  return all.filter(i => status(r, r.ids[i]) !== "ok");
}""",
     r"""  if(r.finished && r.onlyWrong) return all.filter(i => status(r, r.ids[i]) !== "ok");
  if(r.filter === "empty") return all.filter(i => r.ans[r.ids[i]] === undefined || i === r.cur);
  if(r.filter === "uns") return all.filter(i => (r.uns && r.uns[r.ids[i]]) || i === r.cur);
  return all;
}
const nEmpty = r => r.ids.filter(id => r.ans[id] === undefined).length;
const nUns = r => r.ids.filter(id => r.uns && r.uns[id]).length;
function setFilter(f){
  const r = S.run; r.filter = f || ""; r.onlyWrong = false; r.confirm = false;
  if(r.filter){
    const ok = r.filter === "empty" ? (i => r.ans[r.ids[i]] === undefined) : (i => !!(r.uns && r.uns[r.ids[i]]));
    const f2 = r.ids.map((_, i) => i).find(ok);
    if(f2 !== undefined) r.cur = f2;
  }
  save(); render(); bringCardIntoView();
}
const DOCKK = "ml.optdock";
function dockSide(){ try{ return localStorage.getItem(DOCKK) || ""; }catch(e){ return ""; } }
function lastDock(){ try{ return localStorage.getItem(DOCKK + ".last") || "l"; }catch(e){ return "l"; } }
function setDock(d){ try{ if(d){ localStorage.setItem(DOCKK, d); localStorage.setItem(DOCKK + ".last", d); } else localStorage.removeItem(DOCKK); }catch(e){} }"""),
    # soru kartı: "?" (emin değilim) ve süzgeç satırı
    (r"""function quizHTML(){""",
     r"""function unsHTML(r, id){
  const on = !!(r.uns && r.uns[id]);
  if(r.finished) return on ? '<span class="unsb on" title="Emin olmadığını işaretlemiştin">?</span>' : '';
  return '<button type="button" class="unsb' + (on ? ' on' : '') + '" data-act="unsure" aria-pressed="' + on + '" title="Bu sorudan emin değilim">?</button>';
}
function filterHTML(r){
  const u = nUns(r), ch = (f, t) => '<button type="button" class="fchip' + ((r.filter || "") === f && !r.onlyWrong ? ' on' : '') + '" data-act="filt" data-f="' + f + '">' + t + '</button>';
  if(r.finished) return u ? '<div class="qfilt">' + ch("", "Hepsi") + ch("uns", "Emin olmadıklarım · " + u) + '</div>' : '';
  const e = nEmpty(r);
  if(!r.filter && !u && e === r.ids.length) return '';
  return '<div class="qfilt">' + ch("", "Hepsi · " + r.ids.length) + ch("empty", "Boş · " + e) + ch("uns", "Emin değilim · " + u) + '</div>';
}
function quizHTML(){"""),
    (r"""<span class="count">Soru ' + (k + 1) + ' / ' + r.ids.length + '</span></div>'""",
     r"""<span class="count">Soru ' + (k + 1) + ' / ' + r.ids.length + '</span>' + unsHTML(r, id) + '</div>'"""),
    (r"""    + review
    + '<div class="qhead">'""",
     r"""    + review + filterHTML(r)
    + '<div class="qhead">'"""),
    # optik form: emin olmadığın sorular renkli; sol kenarda sekme; yana sabitleme
    (r"""(k === r.cur ? " cur" : "") + '" data-act="jump" data-k=""",
     r"""(k === r.cur ? " cur" : "") + (r.uns && r.uns[id] ? " uns" : "") + '" data-act="jump" data-k="""),
    (r"""<span><i class="k"></i>doğru şık</span>'""",
     r"""<span><i class="k"></i>doğru şık</span><span><i class="u"></i>emin değildim</span>'"""),
    (r"""'<span><i class="s"></i>işaretli</span><span><i></i>boş</span>';""",
     r"""'<span><i class="s"></i>işaretli</span><span><i></i>boş</span><span><i class="u"></i>emin değilim</span>';"""),
    (r"""  return '<aside class="sheet' + (sheetOpen ? " open" : "") + '" aria-label="Optik form">'
    + '<button type="button" class="sheet-head" data-act="sheet" aria-expanded="' + sheetOpen + '"><b>CEVAP KÂĞIDI <span>' + answered(r) + '/' + r.ids.length + ' <span class="arrow">' + (sheetOpen ? "▴" : "▾") + '</span></span></b>'""",
     r"""  const dk = dockSide(), open = sheetOpen || !!dk;
  const tools = dk ? '<button type="button" class="stb" data-act="dock" data-d="">Sabitlemeyi kaldır</button><span class="seg"><button type="button" class="stb' + (dk === "l" ? " on" : "") + '" data-act="dock" data-d="l">Solda</button><button type="button" class="stb' + (dk === "r" ? " on" : "") + '" data-act="dock" data-d="r">Sağda</button></span>'
    : '<button type="button" class="stb" data-act="dock" data-d="' + lastDock() + '">Yana sabitle</button><span class="snote">Optik ekranın bir yanında sütun olur, soru kalan alana sığar</span>';
  return '<aside class="sheet' + (open ? " open" : "") + (dk ? " docked" : "") + '" aria-label="Optik form">'
    + '<button type="button" class="sheet-head" data-act="sheet" aria-expanded="' + open + '"><b><span class="sh-t">CEVAP KÂĞIDI</span> <span>' + answered(r) + '/' + r.ids.length + ' <span class="arrow">' + (dk ? "✕" : open ? "✕" : "▸") + '</span></span></b>'"""),
    (r"""    + '<div class="sheet-body">' + blocks + '<div class="legend">' + leg + '</div></div></aside>';""",
     r"""    + '<div class="sheet-tools">' + tools + '</div>'
    + '<div class="sheet-body">' + blocks + '<div class="legend">' + leg + '</div></div></aside>';"""),
    (r"""  document.body.classList.toggle("has-gobar", S.view === "start");""",
     r"""  document.body.classList.toggle("has-gobar", S.view === "start");
  const dk = S.view === "quiz" ? dockSide() : "";
  document.body.classList.toggle("dock-l", dk === "l"); document.body.classList.toggle("dock-r", dk === "r");"""),
    (r"""    case "sheet": sheetOpen = !sheetOpen; render(); break;""",
     r"""    case "sheet": if(dockSide()){ setDock(""); sheetOpen = false; } else sheetOpen = !sheetOpen; render(); break;
    case "dock": setDock(el.dataset.d); sheetOpen = false; render(); break;
    case "unsure": if(r && !r.finished){ const id = r.ids[r.cur]; r.uns = r.uns || {}; if(r.uns[id]) delete r.uns[id]; else r.uns[id] = 1; save(); render(); } break;
    case "filt": if(r) setFilter(el.dataset.f); break;"""),
    # bitirirken: boşlara / emin olmadıklarına dön
    (r"""(empty ? empty + " soru boş." : "Bütün soruları cevapladın.") + '</p>'""",
     r"""(empty ? empty + " soru boş." : "Bütün soruları cevapladın.") + (nUns(r) ? " " + nUns(r) + " soruda emin değilim dedin." : "") + '</p>'"""),
    (r"""<button class="btn" type="button" data-act="finish-cancel">Devam et</button></div>';""",
     r"""<button class="btn" type="button" data-act="finish-cancel">Hayır, devam et</button>'
      + (empty ? '<button class="btn" type="button" data-act="filt" data-f="empty">Boşlara dön (' + empty + ')</button>' : '')
      + (nUns(r) ? '<button class="btn" type="button" data-act="filt" data-f="uns">Emin olmadıklarıma dön (' + nUns(r) + ')</button>' : '')
      + '</div>';"""),
    (r"""function finish(timeUp){ const r = S.run; r.finished = true; r.timeUp = !!timeUp; r.confirm = false; r.onlyWrong = false;""",
     r"""function finish(timeUp){ const r = S.run; r.finished = true; r.timeUp = !!timeUp; r.confirm = false; r.onlyWrong = false; r.filter = "";"""),
    (r"""      r.onlyWrong = el.dataset.only === "1";
      r.cur = Math.min(+el.dataset.k || 0, r.ids.length - 1);""",
     r"""      r.onlyWrong = el.dataset.only === "1"; r.filter = el.dataset.f || "";
      r.cur = Math.min(+el.dataset.k || 0, r.ids.length - 1);
      if(r.filter === "uns"){ const f = r.ids.findIndex(id => r.uns && r.uns[id]); if(f >= 0) r.cur = f; }"""),
    (r"""      r.onlyWrong = !r.onlyWrong;""", r"""      r.onlyWrong = !r.onlyWrong; r.filter = "";"""),
    # sonuç: emin olmadıklarını incele, yanlış listesinde işaret, test yorumu
    (r"""+ '<button class="btn" type="button" data-act="review" data-k="0" data-only="0">Bütün cevapları incele</button>'""",
     r"""+ '<button class="btn" type="button" data-act="review" data-k="0" data-only="0">Bütün cevapları incele</button>'
    + (nUns(r) ? '<button class="btn" type="button" data-act="review" data-k="0" data-only="0" data-f="uns">Emin olmadıklarını incele (' + nUns(r) + ')</button>' : '')"""),
    (r"""+ '<button class="btn ghost" type="button" data-act="home">Yeni deneme</button></div>'
    + split""",
     r"""+ '<button class="btn ghost" type="button" data-act="home">Yeni deneme</button></div>'
    + (window.ML && ML.fb ? ML.fb(r.mlid, st.ok, st.total) : '')
    + split"""),
    (r"""+ esc(q.t) + '</span><p>' + esc(plain(q.q))""",
     r"""+ esc(q.t) + (r.uns && r.uns[o.id] ? ' <span class="wtag u">emin değildin</span>' : '') + '</span><p>' + esc(plain(q.q))"""),
    # görünüm
    (r""".sheet.open .sheet-body{display:block;max-height:min(62vh, 560px)}""",
     r""".sheet.open .sheet-body{display:block;max-height:min(62vh, 560px)}
/* 1.3 optik: kapalıyken sol kenarda ortalı dikey sekme (Sonraki düğmesini örtmez); açıkken soldan panel; "Yana sabitle" ile sütun */
.sheet{left:0;right:auto;top:50%;bottom:auto;transform:translateY(-50%);border-radius:0 12px 12px 0;border-left:0}
.sheet:not(.open){box-shadow:0 3px 12px rgba(0,0,0,.2)}
.sheet:not(.open) .sheet-head{padding:12px 6px}
.sheet:not(.open) .sheet-head b{writing-mode:vertical-rl;transform:rotate(180deg);display:flex;align-items:center;gap:8px;font-size:11.5px;letter-spacing:.14em}
.sheet:not(.open) .sheet-head b span{font-size:10.5px}
.sheet:not(.open) .sheet-head .arrow{display:none}
.sheet:not(.open) .sheet-tools{display:none}
.sheet.open{width:min(420px, calc(100vw - 24px));max-height:calc(100vh - 24px)}
.sheet-tools{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;padding:9px 12px 2px}
.stb{all:unset;box-sizing:border-box;cursor:pointer;font:600 12.5px var(--f-ui,system-ui);border:1px solid var(--line);border-radius:999px;padding:4px 11px;color:var(--ink);background:var(--surface)}
.stb.on{background:var(--form);border-color:var(--form);color:var(--surface)}
.sheet-tools .seg{display:inline-flex;gap:4px}
.snote{font-size:11px;color:var(--muted);flex:1 1 150px}
body{--dw:clamp(176px, 30vw, 300px)}
.sheet.docked{top:0;bottom:0;transform:none;border-radius:0;width:var(--dw);max-width:none;max-height:none;box-shadow:none;display:flex;flex-direction:column}
.sheet.docked .sheet-head small{display:none}
.sheet.docked .sheet-body{max-height:none;flex:1;min-height:0}
.sheet.docked .blk{grid-template-columns:1fr}
.sheet.docked .sheet-tools .seg{margin-left:0}
body.dock-l .sheet.docked{left:0;right:auto;border:0;border-right:1px solid var(--line)}
body.dock-r .sheet.docked{right:0;left:auto;border:0;border-left:1px solid var(--line)}
body.dock-l .app{padding-left:var(--dw)}
body.dock-r .app{padding-right:var(--dw)}
.row.uns .no{background:#f5b301;color:#3a2a00;border-radius:4px}
.legend i.u{background:#f5b301;border-color:#f5b301;border-radius:3px}
.unsb{all:unset;box-sizing:border-box;cursor:pointer;flex:none;width:30px;height:30px;margin-left:8px;border-radius:50%;border:1.5px solid var(--line);display:inline-grid;place-items:center;font:700 15px var(--f-ui,system-ui);color:var(--muted);background:var(--surface)}
.unsb.on{background:#f5b301;border-color:#f5b301;color:#3a2a00}
.qfilt{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}
.fchip{all:unset;box-sizing:border-box;cursor:pointer;font:600 12.5px var(--f-ui,system-ui);border:1px solid var(--line);border-radius:999px;padding:4px 11px;color:var(--muted);background:var(--surface)}
.fchip.on{border-color:var(--form);color:var(--form);background:var(--form-soft)}
.wtag.u{color:#7a5600;background:#fff1c2}
/* MedLock tam ekranındayken sağ üstteki çıkış düğmesine yer */
html.mlfs .top{padding-right:56px}
html.mlfs body.dock-r .sheet.docked .sheet-head{padding-right:56px}
.ml-fb .ml-fq{display:grid;gap:6px;margin:0 0 10px}
.ml-fb .ml-fq>span{font-size:12.5px;font-weight:600;color:var(--muted)}
.ml-fb .ml-chip.on{background:var(--form);border-color:var(--form);color:var(--surface)}
.ml-fb textarea{width:100%;box-sizing:border-box;font:inherit;font-size:14px;border:1px solid var(--line);border-radius:10px;padding:8px 10px;background:var(--surface);color:var(--ink);resize:vertical}
.ml-fb .ml-fsave{margin-top:8px}
.ml-fb .ml-done{font-size:13px;color:var(--ok);font-weight:600;margin:8px 0 0}"""),
]


# 1.3.1 işlem alanı
PATCHES += [
    (r"""function unsHTML(r, id){""",
     r"""/* 1.3.1 işlem alanı: kalem yazar, parmak sayfayı kaydırır (isteğe bağlı parmakla da yazılır); silgi, geri al, temizle */
const SCRK = KEY + ".scr";
let SCR = {}; try{ SCR = JSON.parse(sessionStorage.getItem(SCRK) || "{}") || {}; }catch(e){ SCR = {}; }
const scrUI = { open:{}, finger:false, tool:"pen", big:false };
try{ scrUI.finger = localStorage.getItem("ml.scrf") === "1"; }catch(e){}
let scrRO = null;
function scrSave(){ try{ sessionStorage.setItem(SCRK, JSON.stringify(SCR)); }catch(e){} }
function isCalc(q){
  const t = plain((q.p || "") + " " + q.q + " " + (q.q2 || "") + " " + (q.l || []).join(" ") + " " + (q.o || []).join(" "));
  return /\d/.test(t) && /hesapla|kaçtır|kaç olur|kaç olarak|kaç bulunur|değeri nedir|değeri kaç|ortalama|standart sapma|varyans|medyan|ortanca|yüzde/i.test(t) && (t.match(/\d+(?:[.,]\d+)?/g) || []).length >= 2;
}
function scrHTML(id){
  const q = byId[id], has = SCR[id] && SCR[id].s && SCR[id].s.length;
  const open = scrUI.open[id] !== undefined ? scrUI.open[id] : (has || isCalc(q));
  if(!open) return '<button type="button" class="scr-open" data-act="scr" data-t="open">✎ İşlem alanı</button>';
  const b = (t, l, on) => '<button type="button" class="stb' + (on ? " on" : "") + '" data-act="scr" data-t="' + t + '">' + l + '</button>';
  return '<div class="scr" id="scr"><div class="scr-bar"><b>İşlem alanı</b>'
    + b("pen", "Kalem", scrUI.tool === "pen") + b("er", "Silgi", scrUI.tool === "er") + b("undo", "Geri al") + b("clr", "Temizle")
    + b("fin", "Parmakla da yaz", scrUI.finger) + b("big", scrUI.big ? "Küçült" : "Büyüt") + b("close", "Kapat") + '</div>'
    + '<canvas id="scrc"' + (scrUI.big ? ' class="big"' : '') + ' aria-label="İşlem alanı"></canvas>'
    + '<p class="scr-n">' + (scrUI.finger ? "Parmak da yazıyor; sayfayı alanın dışından kaydır." : "Kalem yazar, parmak sayfayı kaydırır. Kalemin silgi tuşu da siler.") + ' Çizimler bu test açıkken her soruda ayrı durur.</p></div>';
}
function scrMount(){
  if(scrRO){ scrRO.disconnect(); scrRO = null; }
  const cv = document.getElementById("scrc"); if(!cv || !S.run) return;
  const id = S.run.ids[S.run.cur];
  const d = SCR[id] || (SCR[id] = { w:0, s:[] });
  const ctx = cv.getContext("2d");
  let W = 0, H = 0, cur = null, erasing = false, pid = null;
  const k = () => W / (d.w || W || 1);
  const ink = () => getComputedStyle(cv).color;
  const line = (st, from) => {
    const f = k(); ctx.strokeStyle = ink(); ctx.fillStyle = ctx.strokeStyle; ctx.lineCap = "round"; ctx.lineJoin = "round";
    if(st.length === 1){ ctx.beginPath(); ctx.arc(st[0][0] * f, st[0][1] * f, 1.5, 0, 7); ctx.fill(); return; }
    for(let i = Math.max(1, from || 1); i < st.length; i++){
      const a = st[i - 1], b = st[i];
      ctx.lineWidth = (1.3 + 2.4 * b[2] / 100) * Math.max(.6, f);
      ctx.beginPath(); ctx.moveTo(a[0] * f, a[1] * f); ctx.lineTo(b[0] * f, b[1] * f); ctx.stroke();
    }
  };
  const draw = () => { ctx.clearRect(0, 0, W, H); d.s.forEach(st => line(st)); };
  const size = () => {
    const rc = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    W = rc.width; H = rc.height; if(!W) return;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if(!d.w) d.w = W;
    draw();
  };
  const pos = e => { const rc = cv.getBoundingClientRect(), f = k(); return [Math.round((e.clientX - rc.left) / f * 10) / 10, Math.round((e.clientY - rc.top) / f * 10) / 10, Math.round((e.pressure > 0 ? e.pressure : .5) * 100)]; };
  const canDraw = e => e.pointerType === "pen" || e.pointerType === "mouse" || scrUI.finger;
  const setTA = e => { cv.style.touchAction = (e.pointerType === "pen" || scrUI.finger) ? "none" : "pan-y"; };
  const eraseAt = p => { const R = 12 / k(), n = d.s.length; d.s = d.s.filter(st => !st.some(q => Math.abs(q[0] - p[0]) < R && Math.abs(q[1] - p[1]) < R)); if(d.s.length !== n) draw(); };
  cv.style.touchAction = scrUI.finger ? "none" : "pan-y";
  cv.addEventListener("pointerover", setTA);
  cv.addEventListener("pointerdown", e => {
    setTA(e);
    if(!canDraw(e) || pid !== null) return;
    e.preventDefault(); pid = e.pointerId; try{ cv.setPointerCapture(pid); }catch(_){}
    erasing = scrUI.tool === "er" || (e.buttons & 32) === 32 || e.button === 5;
    const p = pos(e);
    if(erasing) eraseAt(p); else { cur = [p]; d.s.push(cur); line(cur); }
  });
  cv.addEventListener("pointermove", e => {
    if(e.pointerId !== pid){ if(pid === null) setTA(e); return; }
    e.preventDefault();
    const evs = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
    (evs.length ? evs : [e]).forEach(ev => { const p = pos(ev); if(erasing) eraseAt(p); else if(cur){ cur.push(p); line(cur, cur.length - 1); } });
  });
  const end = e => { if(e.pointerId !== pid) return; pid = null; scrSave(); cur = null; erasing = false; };
  cv.addEventListener("pointerup", end);
  cv.addEventListener("pointercancel", e => { if(e.pointerId === pid && cur && cur.length < 3){ d.s.splice(d.s.indexOf(cur), 1); draw(); } end(e); });
  size();
  if(window.ResizeObserver){ scrRO = new ResizeObserver(() => { if(!cv.isConnected) return; const rc = cv.getBoundingClientRect(); if(Math.abs(rc.width - W) > 1 || Math.abs(rc.height - H) > 1) size(); }); scrRO.observe(cv); }
}
function unsHTML(r, id){"""),
    (r"""+ fb + '</div></article>'
    + nav + confirm""",
     r"""+ fb + '</div></article>'
    + scrHTML(id) + nav + confirm"""),
    (r"""if(S.view === "quiz" && S.run) v.innerHTML = quizHTML();""",
     r"""if(S.view === "quiz" && S.run){ v.innerHTML = quizHTML(); scrMount(); }"""),
    (r"""    case "finish": finish(false); break;""",
     r"""    case "scr": {
      if(!r) break;
      const id = r.ids[r.cur], t = el.dataset.t;
      if(t === "open"){ scrUI.open[id] = true; render(); const s = document.getElementById("scr"); if(s) s.scrollIntoView({ block:"nearest", behavior:"smooth" }); }
      else if(t === "close"){ scrUI.open[id] = false; render(); }
      else if(t === "pen" || t === "er"){ scrUI.tool = t; render(); }
      else if(t === "undo"){ const d = SCR[id]; if(d && d.s.length){ d.s.pop(); scrSave(); render(); } }
      else if(t === "clr"){ if(SCR[id]){ SCR[id].s = []; scrSave(); render(); } }
      else if(t === "fin"){ scrUI.finger = !scrUI.finger; try{ localStorage.setItem("ml.scrf", scrUI.finger ? "1" : "0"); }catch(e){} render(); }
      else if(t === "big"){ scrUI.big = !scrUI.big; render(); }
      break;
    }
    case "finish": finish(false); break;"""),
    (r""".ml-fb .ml-done{font-size:13px;color:var(--ok);font-weight:600;margin:8px 0 0}""",
     r""".ml-fb .ml-done{font-size:13px;color:var(--ok);font-weight:600;margin:8px 0 0}
/* 1.3.1 işlem alanı */
.scr-open{all:unset;box-sizing:border-box;cursor:pointer;display:block;margin:10px 0 0;padding:9px 14px;border:1px dashed var(--line);border-radius:10px;font:600 13px var(--f-ui,system-ui);color:var(--muted);text-align:center}
.scr{margin:10px 0 0}
.scr-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 6px}
.scr-bar b{font:700 12.5px var(--f-ui,system-ui);color:var(--muted);margin-right:4px}
.scr canvas{display:block;width:100%;height:240px;box-sizing:border-box;border:1px dashed var(--line);border-radius:10px;background:var(--surface) radial-gradient(circle, var(--line) 1px, transparent 1.3px) 0 0/24px 24px;color:var(--ink);cursor:crosshair;touch-action:pan-y}
.scr canvas.big{height:min(70vh, 560px)}
.scr-n{font-size:11.5px;color:var(--muted);margin:5px 2px 0}
.ml-chip.ml-all{font-family:var(--f-ui,system-ui)}"""),
]


def apply_patches(s, strict=True):
    for a, b in PATCHES:
        if b in s:
            continue
        if s.count(a) != 1:
            if strict:
                sys.exit("yama uygulanamadı: " + a[:70])
            continue
        s = s.replace(a, b)
    return s


def build(test_html):
    s = open(test_html, encoding="utf8").read()
    dec = json.JSONDecoder()
    a = s.index("const CFG = ")
    _, ce = dec.raw_decode(s, a + len("const CFG = "))
    d = s.index("const DATA = ", ce)
    _, de = dec.raw_decode(s, d + len("const DATA = "))
    pre, post = s[:a], s[de:]
    pre = re.sub(r"<html(?![^>]*\blang=)", '<html lang="tr"', pre, count=1)  # Türkçe büyük harf (i → İ)
    pre = re.sub(r"<title>.*?</title>", "<title>Test</title>", pre, count=1, flags=re.S)
    pre = rep(pre, "<body>", "<body>\n<script>window.ML=(function(){try{return parent.MLBridge(window)}catch(e){return null}})();</script>\n"
              + BRIDGE_CSS, ) if pre.count("<body>") == 1 else sys.exit("body?")
    post = rep(post, "<div class=\"src\">Kaynak: ' + esc(q.s) + '</div></div>'",
               "<div class=\"src\">Kaynak: ' + esc(q.s) + '</div>' + (window.ML ? ML.btn(q.id) : '') + '</div>'")
    post = rep(post, "+ '<div class=\"panel\"><h2>Yanlış ve boş sorular</h2>' + wl + '</div>'",
               "+ (window.ML ? ML.panel(wrong.map(o => o.id)) : '')\n    + '<div class=\"panel\"><h2>Yanlış ve boş sorular</h2>' + wl + '</div>'")
    post = rep(post, "function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }",
               "function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} try{ window.ML && ML.save(S); }catch(e){} }")
    post = rep(post, "S.run = { label, ids:list,", "S.run = { mlid: Date.now(), label, ids:list,")
    out = apply_patches(pre + "/*ML_DATA*/" + post)
    assert "</script>" in post
    open(os.path.join(REPO, "engine.html"), "w", encoding="utf8").write(out)
    print("engine.html", len(out))


if __name__ == "__main__":
    if sys.argv[1:] == ["--apply"]:
        p = os.path.join(REPO, "engine.html")
        # önce yamala: yama tutmazsa dosya boşalmasın. Mevcut motorda eski yamaların sonucu sonraki yamalarla
        # değişmiş olabilir; tutmayanlar atlanır ve listelenir (yeni yamanın tutması gerekir).
        s = apply_patches(open(p, encoding="utf8").read(), strict=False)
        miss = [a[:60] for a, b in PATCHES if b not in s]
        if miss: print("atlanan yama (öncekiyle değişmiş olabilir):", *miss, sep="\n  ")
        open(p, "w", encoding="utf8").write(s)
        print("engine.html yamalandı")
    else:
        build(sys.argv[1])
