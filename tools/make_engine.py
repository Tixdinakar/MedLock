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
.ml-go .ml-ic{flex:none;width:18px;height:18px}
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
</style>"""
PATCHES = [
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
    # hata bildir
    ("+ '</div>' + (window.ML ? ML.btn(q.id) : '') + '</div>';",
     "+ '</div>' + (window.ML ? ML.btn(q.id) : '') + (window.ML && ML.rep ? ML.rep(q.id) : '') + '</div>';"),
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
        s = apply_patches(open(p, encoding="utf8").read())  # önce yamala: yama tutmazsa dosya boşalmasın
        open(p, "w", encoding="utf8").write(s)
        print("engine.html yamalandı")
    else:
        build(sys.argv[1])
