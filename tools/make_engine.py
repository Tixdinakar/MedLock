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
    out = pre + "/*ML_DATA*/" + post
    assert "</script>" in post
    open(os.path.join(REPO, "engine.html"), "w", encoding="utf8").write(out)
    print("engine.html", len(out))


if __name__ == "__main__":
    build(sys.argv[1])
