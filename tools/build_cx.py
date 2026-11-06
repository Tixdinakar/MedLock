"""Çıkmış sorularını MedLock'ta çözülebilir teste çevirir (test öğesi, cx=1, kurul sayfasında "Çıkmışlar" altında).

Soruların kaynağı şifreli olarak d/cx/<kod> içinde durur (bk = Biyokimya, tb = Tıbbi Biyoloji, bf = Biyofizik).
Soru alanları: pg (çıkmış PDF'indeki sayfa), t (konu = slayt destesinin adı), q, o (5 şık), a (doğru şık 0-4),
isteğe bağlı l (I-II-III öncülleri), q2, e (açıklama), sd + sp (kaynak deste id'si ve slayt no), quote (slayttan alıntı),
drop (1 = içeriği kaynaklarda yok, teste girmez; slaytı gelince drop'u kaldırıp sd/sp/quote ekle).
sd/sp yoksa en benzer slayt otomatik bulunur (konunun destesinde), zayıfsa kaynak çıkmışın kendi sayfası olur.

kullanım:
  build_cx.py <kod> [--dry]                 d/cx/<kod>'dan testi yeniden kurar
  build_cx.py <kod> --src sorular.json      json'u d/cx/<kod>'a şifreli yazar, sonra kurar
  build_cx.py <kod> --dump sorular.json     d/cx/<kod>'u düzenlemek için json olarak dışarı yazar (commit etme!)
"""
import sys, os, json, re, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import medlock as M

SPEC = {
    "bk": dict(file="bk.json", id="bk-k1-cikmis", course="Biyokimya", code="bk", hoca="Nesrin Özcanlı",
               src="biyokimya-kurul-1-cikmislar", title="Kurul 1 Çıkmış Soruları"),
    "tb": dict(file="tb.json", id="tb-k1-cikmis", course="Tıbbi Biyoloji ve Genetik", code="tb", hoca="Zeynep Akbulut",
               src="tibbi-biyoloji-kurul-1-cikmislar", title="Kurul 1 Çıkmış Soruları"),
    "bf": dict(file="bf.json", id="bf-k1-cikmis", course="Biyofizik", code="bf", hoca="Esra M. Aydoğmuş",
               src="biyofizik-kurul-1-cikmislar", title="Kurul 1 Çıkmış Soruları"),
}
L = ["A", "B", "C", "D", "E"]
code = sys.argv[1]
sp = SPEC[code]
V = M.Vault(M.REPO)
if "--src" in sys.argv:
    V.put_json(f"d/cx/{code}", json.load(open(sys.argv[sys.argv.index("--src") + 1], encoding="utf8")))
qs = V.get_json(f"d/cx/{code}")
if "--dump" in sys.argv:
    json.dump(qs, open(sys.argv[sys.argv.index("--dump") + 1], "w", encoding="utf8"), ensure_ascii=False, indent=1)
    sys.exit(0)
src = V.item(sp["src"])
decks = [it for it in V.cat["items"] if it["c"] == sp["course"] and it["k"] in ("slayt", "not", "ozet")]
pages = []
for d in decks:
    for i, t in enumerate(V.get_json(f"d/{d['x']}/t"), 1):
        pages.append((d, i, t))
sim = M.Sim([p[2] for p in pages])
DF = collections.Counter()
for p in pages:
    DF.update(set(w.lower() for w in re.findall(r"[A-Za-zÇĞİÖŞÜçğıöşüâî]{3,}", p[2])))


def clean_ratio(s):
    ws = [w.lower() for w in re.findall(r"[A-Za-zÇĞİÖŞÜçğıöşüâî]{3,}", s)]
    return sum(DF[w] >= 2 for w in ws) / len(ws) if ws else 0


def topic_idx(t):
    t = M.tr_lower(t or "")
    ix = [i for i, p in enumerate(pages) if t and (M.tr_lower(p[0]["t"]) == t or M.tr_lower(p[0]["t"]).startswith(t))]
    return ix


def strip(s):
    return re.sub(r"<[^>]+>", "", s)


def best_sentence(text, query):
    qt = set(M.toks(query))
    sents = [s.strip() for s in re.split(r"(?<=[.!?…:])\s+|\s{2,}|[•➢▪●■◆]|\s(?=\d+\.\s)", text) if 25 < len(s.strip()) < 400]
    sents = [s for s in sents if clean_ratio(s) >= 0.8]
    if not sents:
        return ""
    sc = [(len(qt & set(M.toks(s))), -abs(len(s) - 140), s) for s in sents]
    sc.sort(reverse=True)
    return sc[0][2] if sc[0][0] >= 2 else ""


data, report = [], collections.Counter()
dropped = 0
for n, q in enumerate(qs, 1):
    if q.get("drop"):
        dropped += 1
        continue
    good = q["o"][q["a"]]
    query = " ".join([strip(q["q"]), strip(" ".join(q.get("l", []))), strip(good), strip(good)])
    order, sc = sim.rank(query)
    tix = [i for i, p in enumerate(pages) if p[0]["id"] == q["sd"]] if q.get("sd") else topic_idx(q["t"])
    if tix:
        order = sorted(tix, key=lambda i: -sc[i])
    if q.get("sp") and tix:
        best = next(i for i in tix if pages[i][1] == q["sp"])
    else:
        best = order[0]
    d, pg, text = pages[best]
    quote = q.get("quote") or best_sentence(text, query)
    ok = not q.get("nos") and bool(quote) and (sc[best] >= 0.15 or bool(q.get("sp")))
    if ok:
        unit = "slayt" if d["k"] == "slayt" else "sayfa"
        s = f"{d['t']}, {unit} {pg}"
        report["slayt"] += 1
    else:
        s = f"{src['t']}, sayfa {q['pg']}"
        quote = ""
        report["eşleşme yok"] += 1
    e = q.get("e") or ""
    if not e:
        e = "Doğru cevap: " + good + "."
    if quote:
        e += " Slaytta: “" + quote.replace("<", "&lt;") + "”"
    elif not ok:
        e += " <i>Bu sorunun karşılığı ders slaytlarında bulunamadı; konu henüz işlenmemiş olabilir.</i>"
    e += f"<br><small>Çıkmışın aslı: {src['t']}, sayfa {q['pg']}</small>"
    item = {"id": f"{code}cx-{n:03d}", "c": sp["code"], "t": q["t"], "q": q["q"], "p": q.get("p"), "l": q.get("l"),
            "e": e, "s": s, "o": q["o"], "a": q["a"]}
    if q.get("q2"):
        item["q2"] = q["q2"]
    data.append(item)
    if "--dry" in sys.argv:
        print(f"{n:3d} {sc[best]:.2f} {L[q['a']]} {s[:55]:55s} | {quote[:70]}")

topics = []
for q in data:
    if q["t"] not in topics:
        topics.append(q["t"])
cfg = {"key": f"cx:{code}:k1:v1", "title": f"{sp['course']} · {sp['title']}", "sub": f"{len(data)} soru",
       "eyebrow": "Kurul I · çıkmış sorular", "lede": "Önceki yılların sınav ve telafi sorularından derlendi. Her açıklamada ilgili slayt ve çıkmışın asıl sayfası var." + (f" Karşılığı bu yılın slaytlarında olmayan {dropped} soru geçersiz sayılıp çıkarıldı." if dropped else ""),
       "courses": [{"code": sp["code"], "short": sp["course"], "long": sp["course"]}], "perQuestion": 1}
print(report, "çıkarılan", dropped)
if "--dry" not in sys.argv:
    it = M.add_test(V, cfg, data, id=sp["id"], kurul="k1", course=sp["course"], hoca=sp["hoca"], title=sp["title"],
                    date="2026-10-23T08:30", sub="çözülebilir")
    it["cx"] = 1
    it["dq"] = 1
    print(M.compute_refs(V))
    print(M.build_index(V))
    V.save()
    print("eklendi", it["id"], it["n"])
