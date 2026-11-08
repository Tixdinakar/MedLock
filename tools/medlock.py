#!/usr/bin/env python3
"""MedLock bakım aracı.

Bütün içerik şifreli olarak repoda durur (d/ klasörü). Bu araç şifreyi
MEDLOCK_PASS ortam değişkeninden alır; şifre hiçbir dosyaya yazılmaz.

  export MEDLOCK_PASS=...            # şifre
  python3 tools/medlock.py cat       # kataloğu göster
  python3 tools/medlock.py add-doc dosya.pdf --kind slayt --kurul k2 --course Biyokimya --hoca "Hoca Adı" --title "..."
  python3 tools/medlock.py add-test test.html --kurul k2 --course Biyokimya --hoca "Hoca Adı" --title "..."
  python3 tools/medlock.py add-drive dosya.pdf --folder K2/Biyokimya --fid <driveId>   # tür/kurul/ders/hoca/başlığı kendisi tahmin eder
  python3 tools/medlock.py known     # kataloğun bildiği Drive id'leri (eklenmiş + atlanan + bekleyen)
  python3 tools/medlock.py todo <driveId> --folder K2/Biyokimya --name "dosya.pdf" --kb 19000   # indirilemeyen büyük dosya
  python3 tools/medlock.py skip <driveId>                                                     # bilerek eklenmeyecek dosya
  python3 tools/medlock.py set <id> t="Yeni başlık" h="Hoca"
  python3 tools/medlock.py rm <id>
  python3 tools/medlock.py refs      # test soruları -> slayt sayfaları (yeniden hesapla)
  python3 tools/medlock.py index     # arama dizinini yeniden kur
  python3 tools/medlock.py passwd    # MEDLOCK_NEWPASS ile şifreyi değiştir (içerik yeniden şifrelenmez)
  python3 tools/medlock.py check     # bütün blobları çözüp doğrula
  python3 tools/medlock.py stamp     # sadece arayüz dosyaları değiştiyse v.json'u yenile (cihazlar güncellenir)
  python3 tools/medlock.py add-video --folder K2/Biyokimya --fid <driveId> --name "Ders 3.mp4" [--by "Yükleyen"]   # video Drive'da kalır
  python3 tools/medlock.py final 2027-05-24 2027-06-18 # final sınavı dönemi (bu aralıkta öğrenilmiş sorular yeniden gelir)
  python3 tools/medlock.py scan      # şifre gerekmez: şifresiz içerik ya da anahtar sızıyor mu (pre-commit kancası da bunu çalıştırır)

Gereken: python3, cryptography, pillow, poppler-utils (pdftoppm, pdftotext, pdfinfo).
"""
import argparse, base64, collections, datetime, glob, gzip, hashlib, hmac, io, json, math, os, re, shutil
import subprocess, sys, tempfile, unicodedata

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

ITER = 600_000
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B64 = lambda b: base64.b64encode(b).decode()
KINDS = ["slayt", "not", "ozet", "cikmis", "soru", "ses", "test", "kart", "video"]
# Dönem katmanı: kurul id'leri bütün yıllarda tekildir (Dönem I: k1..k4, Dönem II: d2-k1.. gibi).
DONEMLER = [
    {"id": "d1", "no": "I", "name": "Dönem I", "yil": "2026–2027",
     "final": {"start": "2027-05-15", "end": "2027-07-15", "est": 1}},
]
# Ders adı değişiklikleri: eski ad verilirse yenisine çevrilir.
COURSE_RENAME = {"Psikoloji": "Davranış Bilimleri"}

KURULLAR = [
    {"id": "k1", "no": "I", "name": "Temel Bilimler I", "start": "2026-09-07", "end": "2026-10-23", "dn": "d1"},
    {"id": "k2", "no": "II", "name": "Temel Bilimler II", "start": "2026-10-26", "end": "2026-12-25", "dn": "d1"},
    {"id": "k3", "no": "III", "name": "Temel Bilimler III", "start": "2026-12-28", "end": "2027-03-15", "dn": "d1"},
    {"id": "k4", "no": "IV", "name": "Temel Bilimler IV", "start": "2027-03-16", "end": "2027-05-14", "dn": "d1"},
]
ORTAK = {"id": "ortak", "name": "Ortak Dersler", "dn": "d1"}


def ensure_schema(c):
    """Eski kataloglara dönem katmanını ekler (idempotent)."""
    c.setdefault("donemler", json.loads(json.dumps(DONEMLER)))
    for k in c.get("kurullar", []):
        k.setdefault("dn", "d1")
    if c.get("ortak"):
        c["ortak"].setdefault("dn", "d1")
    c.pop("secmeli", None)   # seçmeli dersler "ortak" altında
    return c


def kdf(password, salt, it):
    return PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=it).derive(password.encode())


class Vault:
    def __init__(self, repo=REPO, password=None, create=False):
        self.repo = repo
        password = password or os.environ.get("MEDLOCK_PASS")
        if not password:
            sys.exit("MEDLOCK_PASS ortam değişkeni yok.")
        kp = os.path.join(repo, "k.json")
        if os.path.exists(kp):
            K = json.load(open(kp))
            self.dek = None
            for e in K["keys"]:
                w = base64.b64decode(e["w"])
                try:
                    self.dek = AESGCM(kdf(password, base64.b64decode(e["salt"]), e["it"])).decrypt(w[:12], w[12:], None)
                    break
                except Exception:
                    pass
            if self.dek is None:
                sys.exit("Şifre yanlış.")
        elif create:
            self.dek = os.urandom(32)
            self._write_keys([self._wrap(password)])
        else:
            sys.exit("k.json yok; önce init.")
        self.ivk = hmac.new(self.dek, b"iv", "sha256").digest()
        self.nk = hmac.new(self.dek, b"name", "sha256").digest()
        self._cat = None

    # ---------- keys ----------
    def _wrap(self, password):
        salt = os.urandom(16)
        iv = os.urandom(12)
        w = iv + AESGCM(kdf(password, salt, ITER)).encrypt(iv, self.dek, None)
        return {"salt": B64(salt), "it": ITER, "w": B64(w)}

    def _write_keys(self, keys):
        json.dump({"v": 1, "keys": keys}, open(os.path.join(self.repo, "k.json"), "w"), indent=1)

    def passwd(self, new):
        self._write_keys([self._wrap(new)])

    # ---------- blobs ----------
    def hid(self, ident):
        return hmac.new(self.nk, ident.encode(), "sha256").hexdigest()[:12]

    def put(self, rel, data: bytes):
        iv = hmac.new(self.ivk, rel.encode() + hashlib.sha256(data).digest(), "sha256").digest()[:12]
        ct = iv + AESGCM(self.dek).encrypt(iv, data, None)
        p = os.path.join(self.repo, rel)
        if os.path.exists(p) and open(p, "rb").read() == ct:
            return False
        os.makedirs(os.path.dirname(p), exist_ok=True)
        open(p, "wb").write(ct)
        return True

    def get(self, rel) -> bytes:
        b = open(os.path.join(self.repo, rel), "rb").read()
        return AESGCM(self.dek).decrypt(b[:12], b[12:], None)

    def put_json(self, rel, obj):
        raw = json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode()
        return self.put(rel, gzip.compress(raw, 9, mtime=0))

    def get_json(self, rel):
        return json.loads(gzip.decompress(self.get(rel)))

    # ---------- catalog ----------
    @property
    def cat(self):
        if self._cat is None:
            if os.path.exists(os.path.join(self.repo, "d/c")):
                self._cat = self.get_json("d/c")
            else:
                self._cat = {"kurullar": KURULLAR, "ortak": ORTAK, "items": [], "skip": []}
            ensure_schema(self._cat)
        return self._cat

    def item(self, ident):
        for it in self.cat["items"]:
            if it["id"] == ident:
                return it
        return None

    def upsert(self, it):
        items = self.cat["items"]
        for i, o in enumerate(items):
            if o["id"] == it["id"]:
                items[i] = it
                return
        items.append(it)

    def new_id(self, base):
        base = slug(base)[:40] or "x"
        ident, n = base, 2
        while self.item(ident):
            ident, n = f"{base}-{n}", n + 1
        return ident

    def save(self):
        c = self.cat
        c["items"].sort(key=lambda o: o.get("d") or "", reverse=True)
        stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d%H%M%S")
        body = {k: v for k, v in c.items() if k not in ("v", "h")}
        h = hashlib.sha256(json.dumps(body, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:10]
        if c.get("h") != h:
            c["h"], c["v"] = h, stamp
        changed = self.put_json("d/c", c)
        vp = os.path.join(self.repo, "v.json")
        old = json.load(open(vp)) if os.path.exists(vp) else {}
        app = app_version(self.repo)
        if old.get("c") != c["v"] or old.get("app") != app:
            json.dump({"c": c["v"], "app": app}, open(vp, "w"))
        write_appv(self.repo, app)
        return changed


APPV_RE = re.compile(rb'const APPV = "[0-9a-f]*";')


def app_version(repo):
    """Arayüz dosyalarının özeti. app.js içindeki APPV satırı hesaba katılmaz (stamp onu bu değerle yazar)."""
    h = hashlib.sha256()
    for f in sorted(SHELL_FILES):
        p = os.path.join(repo, f)
        if os.path.exists(p):
            b = open(p, "rb").read()
            if f == "app.js":
                b = APPV_RE.sub(b'const APPV = "";', b)
            h.update(f.encode() + b)
    return h.hexdigest()[:10]


def write_appv(repo, app):
    """Uygulama kendi sürümünü bilsin diye app.js'e yazılır; v.json'daki sürümle karşılaştırıp kabuğu yeniler."""
    p = os.path.join(repo, "app.js")
    if not os.path.exists(p):
        return
    b = open(p, "rb").read()
    nb = APPV_RE.sub(b'const APPV = "' + app.encode() + b'";', b)
    if nb != b:
        open(p, "wb").write(nb)


SHELL_FILES = ["index.html", "app.js", "app.css", "engine.html", "manifest.webmanifest", "sw.js"]


def slug(s):
    s = norm(s)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def norm(s):
    s = s.replace("’", "'").replace("İ", "i").replace("I", "ı").lower()
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.replace("ı", "i")


def date_from_name(name):
    m = re.search(r"_(\d{2})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})", name)
    if not m:
        return None
    y, mo, d, H, M, S = (int(x) for x in m.groups())
    return f"20{y:02d}-{mo:02d}-{d:02d}T{H:02d}:{M:02d}"


# ---------- documents ----------
def ocr_pages(pdf, idxs, do_ocr=True):
    """Taranmış sayfalar: yön tespiti (tesseract OSD) ve Türkçe OCR. {sayfa: (metin|None, döndürme_açısı)}
    Açı PIL'in im.rotate(açı, expand=True) çağrısına uygundur (saat yönünün tersine derece)."""
    from concurrent.futures import ThreadPoolExecutor
    from PIL import Image
    env = dict(os.environ, OMP_THREAD_LIMIT="1")

    def one(i):
        tmp = tempfile.mkdtemp()
        try:
            subprocess.run(["pdftoppm", "-r", "200", "-f", str(i), "-l", str(i), "-gray", "-png", pdf, os.path.join(tmp, "o")], check=True)
            f = glob.glob(os.path.join(tmp, "o*.png"))[0]
            osd = subprocess.run(["tesseract", f, "-", "--psm", "0"], capture_output=True, text=True, env=env).stdout
            m, c = re.search(r"Rotate:\s*(\d+)", osd), re.search(r"Orientation confidence:\s*([\d.]+)", osd)
            hint = int(m.group(1)) if m and c and float(c.group(1)) >= 2 else 0
            # OSD yönü (90/270) sık karıştırıyor; adayları OCR güveniyle karşılaştır
            cands = [0] + ([90, 270] if hint in (90, 270) else [180] if hint == 180 else [])
            res = {}
            for a in cands:
                g = f
                if a:
                    g = os.path.join(tmp, f"r{a}.png")
                    Image.open(f).rotate(a, expand=True).save(g)
                tsv = subprocess.run(["tesseract", g, "-", "-l", "tur+eng", "tsv"], capture_output=True, text=True, env=env).stdout
                words, good = [], 0
                for row in tsv.splitlines()[1:]:
                    col = row.split("\t")
                    if len(col) < 12 or not col[11].strip():
                        continue
                    words.append(col[11])
                    try:
                        if float(col[10]) >= 85 and len(col[11]) >= 4:
                            good += 1
                    except ValueError:
                        pass
                res[a] = (good, " ".join(words))
            best = max(res, key=lambda a: res[a][0])
            angle = best if best and res[best][0] >= max(40, 2 * res[0][0]) else 0
            t = res[angle][1]
            return i, (t if do_ocr else None, angle)
        finally:
            shutil.rmtree(tmp)
    with ThreadPoolExecutor(os.cpu_count() or 4) as ex:
        return dict(ex.map(one, idxs))


# Sayfa görsel ayarları: yatay slaytlar 1100 px; dikey A4 (notlar, özetler, çıkmışlar) küçük yazı içerdiği için 1800 px.
LANDSCAPE = (1100, 52)
PORTRAIT = (1800, 62)


def render_pdf(pdf, out, ocr=True):
    """pdf -> out/1.webp, 2.webp ... + out/text.json ; returns n"""
    from PIL import Image
    os.makedirs(out, exist_ok=True)
    info = subprocess.run(["pdfinfo", pdf], capture_output=True, text=True).stdout
    size = [l for l in info.splitlines() if l.startswith("Page size:")][0].split(":", 1)[1].split("pts")[0]
    w, h = (float(x) for x in size.split("x"))
    tw, quality = LANDSCAPE if w >= h else PORTRAIT
    tmp = tempfile.mkdtemp()
    subprocess.run(["pdftoppm", "-scale-to-x", str(tw), "-scale-to-y", "-1", "-jpeg", "-jpegopt", "quality=92",
                    pdf, os.path.join(tmp, "p")], check=True)
    files = sorted(glob.glob(os.path.join(tmp, "p-*.jpg")), key=lambda p: int(p.rsplit("-", 1)[1][:-4]))
    txt = subprocess.run(["pdftotext", "-enc", "UTF-8", pdf, "-"], capture_output=True, text=True).stdout
    pages = txt.split("\f")[: len(files)]
    pages += [""] * (len(files) - len(pages))
    empty = [i for i, t in enumerate(pages, 1) if len(t.strip()) < 30]
    rot = {}
    if empty and shutil.which("tesseract"):          # taranmış sayfalar: yönü düzelt, OCR yap
        for i, (t, angle) in ocr_pages(pdf, empty, do_ocr=ocr).items():
            if t is not None:
                pages[i - 1] = t
            rot[i] = angle
    for i, p in enumerate(files, 1):
        im = Image.open(p).convert("RGB")
        if rot.get(i):
            im = im.rotate(rot[i], expand=True)
            if im.width > tw:
                im = im.resize((tw, round(im.height * tw / im.width)), Image.LANCZOS)
        im.save(os.path.join(out, f"{i}.webp"), "WEBP", quality=quality, method=5)
    shutil.rmtree(tmp)
    json.dump(pages, open(os.path.join(out, "text.json"), "w"), ensure_ascii=False)
    open(os.path.join(out, "done"), "w").write(str(len(files)))
    return len(files)


def add_doc(V, pdf=None, rendered=None, **meta):
    """meta: kind, kurul, course, hoca, title, date, id, src, approx"""
    tmp = None
    ident = meta.get("id") or V.new_id(meta["title"])
    old = V.item(ident) or {}
    keep = meta.get("keep_text") and old
    if rendered is None:
        tmp = tempfile.mkdtemp()
        render_pdf(pdf, tmp, ocr=not keep)
        rendered = tmp
    n = int(open(os.path.join(rendered, "done")).read())
    texts = json.load(open(os.path.join(rendered, "text.json")))
    if keep and old.get("n") == n:      # yalnız görseller yenileniyor: eski (OCR'lı) metinleri koru
        texts = V.get_json(f"d/{old['x']}/t")
    from PIL import Image
    w, h = Image.open(os.path.join(rendered, "1.webp")).size
    x = V.hid("doc:" + ident)
    hv = hashlib.sha256()
    size = 0
    for i in range(1, n + 1):
        b = open(os.path.join(rendered, f"{i}.webp"), "rb").read()
        hv.update(hashlib.sha256(b).digest())
        size += len(b)
        V.put(f"d/{x}/{i}", b)
    # drop pages beyond n if the deck got shorter
    for f in glob.glob(os.path.join(V.repo, "d", x, "*")):
        b = os.path.basename(f)
        if b.isdigit() and int(b) > n:
            os.remove(f)
    texts = [" ".join(t.split()) for t in texts]
    V.put_json(f"d/{x}/t", texts)
    date = meta.get("date") or (pdf and date_from_name(os.path.basename(pdf))) or old.get("d") \
        or datetime.datetime.now().strftime("%Y-%m-%dT%H:%M")
    it = {"id": ident, "k": meta["kind"], "g": meta["kurul"], "c": course_name(meta["course"]), "h": meta.get("hoca") or "",
          "t": meta["title"], "d": date, "n": n, "x": x, "r": round(w / h, 3), "v": hv.hexdigest()[:8], "sz": size}
    if meta.get("by"):
        it["u"] = meta["by"]
    if meta.get("approx"):
        it["dq"] = 1
    if meta.get("src"):
        it["src"] = meta["src"]
    if meta.get("sub"):
        it["m"] = meta["sub"]
    for k in ("dq", "al", "src", "m", "u", "kn"):     # yeniden eklemede eski alanları koru
        if k not in it and k in old:
            it[k] = old[k]
    V.upsert(it)
    if it["k"] in ("not", "ozet", "soru") and not it.get("kn"):
        assign_konu(V, [it])
    if tmp:
        shutil.rmtree(tmp)
    return it


# ---------- tests ----------
def parse_test_html(path):
    s = open(path, encoding="utf8").read()
    dec = json.JSONDecoder()
    c = s.index("const CFG = ") + len("const CFG = ")
    cfg, ce = dec.raw_decode(s, c)
    d = s.index("const DATA = ", ce) + len("const DATA = ")
    data, _ = dec.raw_decode(s, d)
    return cfg, data


def add_test(V, cfg, data, **meta):
    ident = meta.get("id") or V.new_id(meta["title"])
    x = V.hid("test:" + ident)
    blob = {"cfg": cfg, "data": data, "refs": {}}
    if os.path.exists(os.path.join(V.repo, "d", x)):
        try:
            blob["refs"] = V.get_json(f"d/{x}").get("refs", {})
        except Exception:
            pass
    topics = collections.Counter(q["t"] for q in data)
    it = {"id": ident, "k": "test", "g": meta["kurul"], "c": course_name(meta["course"]), "h": meta.get("hoca") or "",
          "t": meta["title"], "d": meta.get("date") or datetime.datetime.now().strftime("%Y-%m-%dT%H:%M"),
          "n": len(data), "x": x, "sk": cfg.get("key"), "tp": topics.most_common()}
    if meta.get("sub"):
        it["m"] = meta["sub"]
    V.upsert(it)
    write_test(V, it, blob)
    return it


def course_name(c):
    return COURSE_RENAME.get(c, c)


VIDEO_EXT = re.compile(r"\.(mp4|m4v|mov|webm|mkv|avi)$", re.I)


def add_video(V, fid, folder, name, **o):
    """Video MedLock'a yüklenmez; Drive'da durur, katalogda yalnız bağlantısı (şifreli) olur."""
    m = guess_meta(V, folder, VIDEO_EXT.sub(".pdf", name))
    m["date"] = o.get("date") or m["date"] or datetime.datetime.now().strftime("%Y-%m-%dT%H:%M")
    for k in ("kurul", "course", "hoca", "title"):
        if o.get(k):
            m[k] = o[k]
    src = "drive:" + fid
    old = next((it for it in V.cat["items"] if it.get("src") == src), None)
    ident = old["id"] if old else V.new_id("video-" + m["title"])
    it = {"id": ident, "k": "video", "g": m["kurul"], "c": course_name(m["course"]), "h": m["hoca"], "t": m["title"],
          "d": m["date"], "n": 0, "src": src}
    if o.get("by"):
        it["u"] = o["by"]
    if o.get("mb"):
        it["sz"] = int(float(o["mb"]) * 1048576)
    if o.get("dur"):
        it["dur"] = o["dur"]
    V.upsert(it)
    V.cat["todo"] = [t for t in V.cat.get("todo", []) if t["src"] != src]
    return it


def write_test(V, it, blob):
    V.put_json(f"d/{it['x']}", blob)
    raw = json.dumps(blob, ensure_ascii=False, sort_keys=True).encode()
    it["v"] = hashlib.sha256(raw).hexdigest()[:8]


def add_cards(V, cards, **meta):
    ident = meta.get("id") or V.new_id(meta["title"])
    x = V.hid("cards:" + ident)
    V.put_json(f"d/{x}", {"cards": cards})
    it = {"id": ident, "k": "kart", "g": meta["kurul"], "c": meta["course"], "h": meta.get("hoca") or "",
          "t": meta["title"], "d": meta.get("date"), "n": len(cards), "x": x,
          "v": hashlib.sha256(json.dumps(cards, ensure_ascii=False).encode()).hexdigest()[:8]}
    V.upsert(it)
    return it


# ---------- question -> slide refs ----------
STOP = set(norm(w) for w in """ve ile bir bu da de için olan olarak en daha çok gibi ya veya ki ne hangi
aşağıdaki aşağıdakilerden hangisi hangisidir değildir doğru yanlış olur ise her tüm kadar sonra önce
the of and in to is are a an by on for with as at from that this be or""".split())


def toks(s):
    return [w for w in re.findall(r"[a-z0-9]+", norm(s)) if len(w) > 2 and w not in STOP]


class Sim:
    def __init__(self, texts):
        docs = [collections.Counter(toks(t)) for t in texts]
        df = collections.Counter()
        for d in docs:
            df.update(d.keys())
        n = len(docs)
        self.idf = {w: math.log((n + 1) / (c + 0.5)) for w, c in df.items()}
        self.vecs = [self._vec(d) for d in docs]

    def _vec(self, cnt):
        v = {w: (1 + math.log(c)) * self.idf.get(w, 0) for w, c in cnt.items()}
        nrm = math.sqrt(sum(x * x for x in v.values())) or 1
        return {w: x / nrm for w, x in v.items()}

    def rank(self, text):
        q = self._vec(collections.Counter(toks(text)))
        sc = [sum(q.get(w, 0) * x for w, x in v.items()) for v in self.vecs]
        return sorted(range(len(sc)), key=lambda i: -sc[i]), sc


def parse_src(s):
    s = s.strip()
    est = "eklenemedi" in s
    s = re.sub(r"\s*\((?:slayt|sayfa) numarası eklenemedi\)", "", s)
    m = re.match(r"^(.*?)(?:,\s*|\s+)(?:slayt|slaytlar|s\.|sayfa)\s*([\d][\d,\s–\-]*)$", s)
    if not m:
        return s.strip(" ,"), None
    title, nums = m.group(1).strip(" ,"), m.group(2)
    pages = []
    for part in re.split(r"\s*,\s*", nums.strip(" ,")):
        if not part:
            continue
        r = [int(v) for v in re.split(r"\s*[–\-]\s*", part) if v]
        a, b = r[0], r[-1]
        pages += list(range(a, b + 1)) if a <= b <= a + 8 else [a]
    return title, pages


def qtext(q):
    o = q.get("o") or []
    a = q.get("a")
    good = o[a] if isinstance(a, int) and 0 <= a < len(o) else ""
    return " ".join(str(x) for x in [q.get("q", ""), good, q.get("e", "")])


TITLE_ALIASES = {}  # normalised test-source title -> doc id (filled from catalog "alias" fields)


def compute_refs(V, verbose=False):
    docs = [it for it in V.cat["items"] if it["k"] in ("slayt", "not", "ozet", "cikmis", "soru")]
    by_title = {}
    for it in docs:
        for t in [it["t"]] + it.get("al", []):
            by_title.setdefault(norm(t), it)
    sims = {}
    report = collections.Counter()
    for it in V.cat["items"]:
        if it["k"] != "test":
            continue
        blob = V.get_json(f"d/{it['x']}")
        refs, decks = {}, collections.Counter()
        for q in blob["data"]:
            title, pages = parse_src(q.get("s", ""))
            key = norm(title)
            d = by_title.get(key)
            if not d:
                c = [k for k in by_title if k.startswith(key[:16]) or key.startswith(k[:16])]
                same = [k for k in c if by_title[k]["c"] == it["c"]] or c
                d = by_title[same[0]] if len(set(by_title[k]["id"] for k in same)) == 1 else None
            if not d:
                report["kaynak bulunamadı: " + title[:50]] += 1
                continue
            decks[d["id"]] += 1
            if d["id"] not in sims:
                sims[d["id"]] = Sim(V.get_json(f"d/{d['x']}/t"))
            order, sc = sims[d["id"]].rank(qtext(q))
            if pages:
                pages = [p for p in pages if 1 <= p <= d["n"]]
            if pages:
                report["numaralı"] += 1
                report["numaralı ve benzerlik ilk 5"] += any(p - 1 in order[:5] for p in pages)
                refs[q["id"]] = [d["id"], pages]
            else:
                best = [order[0] + 1]
                if len(order) > 1 and sc[order[1]] > 0.85 * sc[order[0]] and abs(order[1] - order[0]) <= 2:
                    best.append(order[1] + 1)
                refs[q["id"]] = [d["id"], sorted(best), 1]
                report["tahmini"] += 1
        blob["refs"] = refs
        it["dk"] = decks.most_common()
        write_test(V, it, blob)
    return report


# ---------- search index ----------
def strip_html(s):
    return " ".join(re.sub(r"<[^>]+>", " ", s or "").split())


def build_index(V):
    D, Q = {}, []
    for it in V.cat["items"]:
        if it["k"] in ("slayt", "not", "ozet", "cikmis", "soru", "ses"):
            D[it["id"]] = V.get_json(f"d/{it['x']}/t")
        elif it["k"] == "test":
            b = V.get_json(f"d/{it['x']}")
            for q in b["data"]:
                opts = " · ".join(strip_html(o) for o in q.get("o", []))
                Q.append([it["id"], q["id"], strip_html(q.get("q")) + " — " + opts])
        elif it["k"] == "kart":
            b = V.get_json(f"d/{it['x']}")
            for i, c in enumerate(b["cards"]):
                Q.append([it["id"], i, strip_html(c[1]) + " — " + strip_html(c[2])])
    V.put_json("d/s", {"d": D, "q": Q})
    build_lexicon(V)
    build_latin(V)
    return len(D), len(Q)


# ---------- tıbbi terim sözlüğü ----------
_TRMAP = str.maketrans({"ç": "c", "ğ": "g", "ı": "i", "ö": "o", "ş": "s", "ü": "u", "â": "a", "î": "i", "û": "u"})
END = sorted(set("""lerinin larinin lerinde larinda lerinden larindan lerine larina lerini larini lerin larin lerde larda
lerden lardan lere lara leri lari ler lar nin nun den dan ten tan de da te ta in un ni nu yi yu ye ya si su sinin sunun
sine suna sini sunu sinde sunda i u e a dir dur tir tur dir li lu siz suz yle le la ki""".split()), key=len, reverse=True)


def _segmenter():
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import importlib, kokler
    importlib.reload(kokler)
    ROOTS, STOP = kokler.ROOTS, kokler.STOP
    forms = {}
    for i, r in enumerate(ROOTS):
        for f in r[2]:
            forms.setdefault(f, i)
    maxlen = max(map(len, forms))

    def seg(w):
        n = len(w)
        best = [None] * (n + 1)
        best[0] = (0, [])
        for i in range(n):
            if best[i] is None:
                continue
            sc, parts = best[i]
            real = [p for p in parts if p[1] is not None]
            only_prefix = all(ROOTS[p[1]][0] == "on" for p in real)
            for j in range(i + 1, min(n, i + maxlen) + 1):
                f = w[i:j]
                if f not in forms:
                    continue
                ri = forms[f]
                t = ROOTS[ri][0]
                if t == "on" and not only_prefix:
                    continue
                if t == "son" and not real:
                    continue
                cand = (sc + len(f) ** 2, parts + [(f, ri)])
                if best[j] is None or cand[0] > best[j][0]:
                    best[j] = cand
            if real and w[i] in "oiy" and i + 1 < n:
                cand = (sc, parts + [(w[i], None)])
                if best[i + 1] is None or cand[0] > best[i + 1][0]:
                    best[i + 1] = cand
        r = best[n]
        if not r:
            return None
        parts = r[1]
        real = [p for p in parts if p[1] is not None]
        if len(real) < 2 or len(real) > 6 or parts[-1][1] is None:
            return None
        if ROOTS[real[-1][1]][0] == "on" or max(len(p[0]) for p in real) < 3:
            return None
        if sum(len(p[0]) for p in real if len(p[0]) <= 2) > 4:
            return None
        return parts

    def ok_in(parts):
        """'-in' ile biten iki parçalı çözümlemelerde ilk parça uzun bir kök olmalı (melanin evet, fazın hayır)."""
        real = [p for p in parts if p[1] is not None]
        if real[-1][0] != "in" or len(real) > 2:
            return True
        return ROOTS[real[0][1]][0] == "kok" and len(real[0][0]) >= 5

    ENDSET = set(END)

    def analyse(word_folded, vocab=()):
        w = word_folded
        if len(w) < 6 or w in STOP:
            return None
        # Türkçe çekim ekini (enzimin, enzimine, hepatitin) at: metinde tek başına geçen en kısa gövdeyi bul
        for k in range(5, len(w)):
            st, tail = w[:k], w[k:]
            if len(tail) > 6 or st not in vocab:
                continue
            if tail in ENDSET or tail[:2] in ENDSET or tail[:3] in ENDSET:
                if st in forms:
                    return None                  # tek kökün çekimi (proteinin, sentezin)
                if st in STOP:
                    return None
                p = seg(st)
                if p and ok_in(p):
                    return st, p
        p = seg(w)
        if p and ok_in(p):
            return w, p
        for e in END:
            if w.endswith(e) and len(w) - len(e) >= 5:
                st = w[: -len(e)]
                if st in STOP:
                    return None
                p = seg(st)
                if p and ok_in(p):
                    return st, p
        return None
    return ROOTS, analyse


def build_latin(V):
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import importlib, anatomi
    importlib.reload(anatomi)
    return anatomi.build(V)


def build_lexicon(V):
    roots, analyse = _segmenter()
    terms, docs, vocab = {}, [], set()
    for it in V.cat["items"]:
        if it["k"] not in ("slayt", "not", "ozet", "cikmis", "soru", "ses"):
            continue
        texts = V.get_json(f"d/{it['x']}/t")
        docs.append((it, texts))
        for t in texts:
            vocab.update(tr_lower(w).translate(_TRMAP) for w in re.findall(r"[A-Za-zÇĞİÖŞÜçğıöşüâîû]{5,}", t))
    for it, texts in docs:
        for pi, t in enumerate(texts, 1):
            for tok in re.findall(r"[A-Za-zÇĞİÖŞÜçğıöşüâîû]{6,}", t):
                low = tr_lower(tok)
                fo = low.translate(_TRMAP)
                if len(fo) != len(low):
                    continue
                r = analyse(fo, vocab)
                if not r:
                    continue
                st, parts = r
                e = terms.get(st)
                if not e:
                    e = terms[st] = {"w": low[: len(st)], "p": parts, "n": 0, "r": []}
                e["n"] += 1
                ref = [it["id"], pi]
                if len(e["r"]) < 6 and ref not in e["r"] and not any(x[0] == it["id"] for x in e["r"]):
                    e["r"].append(ref)
    T = [[e["w"], [[f, ri] for f, ri in e["p"]], e["n"], e["r"]] for e in terms.values()]
    T.sort(key=lambda x: -x[2])
    R = [[r[0], r[1], r[3], r[4]] for r in roots]
    x = V.hid("lexicon")
    V.put_json(f"d/{x}", {"roots": R, "terms": T})
    blob = json.dumps(T, ensure_ascii=False, sort_keys=True) + json.dumps(R, ensure_ascii=False)
    V.cat["lex"] = {"x": x, "v": hashlib.sha256(blob.encode()).hexdigest()[:8], "n": len(T)}
    return len(R), len(T)


def check(V):
    n = 0
    for it in V.cat["items"]:
        if it["k"] == "video":
            continue
        if it["k"] in ("test", "kart"):
            V.get_json(f"d/{it['x']}")
            n += 1
        else:
            V.get_json(f"d/{it['x']}/t")
            for i in range(1, it["n"] + 1):
                V.get(f"d/{it['x']}/{i}")
                n += 1
    V.get_json("d/s")
    for k in ("lex", "lat"):
        if V.cat.get(k):
            V.get_json(f"d/{V.cat[k]['x']}")
            n += 1
    # d/ altındaki her dosya bu anahtarla çözülebilmeli (yanlışlıkla konmuş şifresiz ya da yabancı dosya kalmasın)
    bad = []
    for root, _, files in os.walk(os.path.join(V.repo, "d")):
        for f in files:
            rel = os.path.relpath(os.path.join(root, f), V.repo)
            try:
                V.get(rel)
            except Exception:
                bad.append(rel)
    if bad:
        sys.exit("çözülemeyen dosya (şifresiz ya da başka anahtarla): " + ", ".join(bad[:10]))
    appv = APPV_RE.search(open(os.path.join(V.repo, "app.js"), "rb").read())
    vj = json.load(open(os.path.join(V.repo, "v.json")))
    if vj.get("app") != app_version(V.repo) or not appv or appv.group(0) != b'const APPV = "' + vj["app"].encode() + b'";':
        sys.exit("arayüz sürümü eski: python3 tools/medlock.py stamp")
    js = open(os.path.join(V.repo, "app.js"), encoding="utf8").read()
    ver = re.search(r'const VERSION = "([\d.]+)";', js)
    first = re.search(r'const CHANGES = \[\s*\{ v: "([\d.]+)"', js)
    if not ver or not first or ver.group(1) != first.group(1):
        sys.exit("app.js: VERSION ile CHANGES'in ilk notu aynı sürüm olmalı (küçük düzeltme +0.0.1, büyük güncelleme +0.1)")
    return n


# ---------- şifresiz içerik denetimi (şifre gerekmez) ----------
ALLOWED = {"index.html", "app.js", "app.css", "engine.html", "sw.js", "manifest.webmanifest", "v.json", "k.json",
           "robots.txt", "README.md", "CLAUDE.md", ".gitignore", ".nojekyll"}
ALLOWED_RE = re.compile(r"^(icons/[\w.-]+\.png|tools/[\w.-]+\.(py|sh|js)|tools/hooks/[\w.-]+)$")
SECRET_RE = re.compile(rb"(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|gho_[A-Za-z0-9]{20,}|ghs_[A-Za-z0-9]{20,})")
PLAIN_MAGIC = (b"%PDF", b"\x1f\x8b\x08", b"RIFF", b"\x89PNG", b"\xff\xd8\xff", b"PK\x03\x04", b"ID3\x03", b"ID3\x04",
               b"<!doctype", b"<!DOCTYPE", b"<html", b"\x00\x00\x00\x18ftyp", b"\x00\x00\x00\x20ftyp")


def _printable(b):
    return sum(1 for c in b if 32 <= c < 127 or c in (9, 10, 13)) / max(1, len(b))


def _entropy(b):
    if not b:
        return 0.0
    cnt = collections.Counter(b)
    return -sum(c / len(b) * math.log2(c / len(b)) for c in cnt.values())


def scan_plain(repo=REPO):
    """Commit'e girecek dosyaları denetler: izin listesi dışında dosya, d/ altında şifresiz görünen dosya,
    anahtar/şifre sızıntısı. Sorun listesini döndürür (boşsa temiz)."""
    out = subprocess.run(["git", "-C", repo, "ls-files", "-co", "--exclude-standard"], capture_output=True, text=True)
    files = [f for f in out.stdout.splitlines() if f and os.path.isfile(os.path.join(repo, f))]
    pw = os.environ.get("MEDLOCK_PASS", "").encode()
    probs = []
    for f in files:
        p = os.path.join(repo, f)
        if f.startswith("d/"):
            b = open(p, "rb").read(4096)
            # şifreli blob rastgele görünür: bilinen dosya imzası, okunur metin ya da düşük entropi şifresiz demektir
            if b.startswith(PLAIN_MAGIC) or (len(b) >= 8 and _printable(b[:512]) > 0.85) or (len(b) >= 2048 and _entropy(b) < 7.5):
                probs.append("şifresiz görünüyor: " + f)
            continue
        if f not in ALLOWED and not ALLOWED_RE.match(f):
            probs.append("izin listesinde değil: " + f)
            continue
        if f.endswith(".png"):
            continue
        b = open(p, "rb").read()
        if SECRET_RE.search(b):
            probs.append("GitHub anahtarı var: " + f)
        if len(pw) >= 4 and pw in b:
            probs.append("şifre yazılı: " + f)
    return probs


# ---------- Drive'dan gelen dosyalar ----------
FOLDER_COURSE = {"TıbbiBiyoloji": "Tıbbi Biyoloji ve Genetik", "TıpTarihi": "Tıp Tarihi", "Biyokimya": "Biyokimya",
                 "Biyofizik": "Biyofizik", "Biyoistatistik": "Biyoistatistik", "Psikoloji": "Davranış Bilimleri",
                 "DavranışBilimleri": "Davranış Bilimleri", "Anatomi": "Anatomi", "Histoloji": "Histoloji ve Embriyoloji",
                 "Fizyoloji": "Fizyoloji"}
SMALL = {"ve", "ile", "de", "da", "için", "veya", "ya", "ki", "mi"}


def tr_lower(s):
    return s.replace("I", "ı").replace("İ", "i").lower()


def tr_title(s):
    out = []
    for i, w in enumerate(s.split()):
        lw = tr_lower(w)
        if i and lw in SMALL:
            out.append(lw)
        else:
            out.append((lw[:1].replace("i", "İ").replace("ı", "I").upper() + lw[1:]) if lw else lw)
    return " ".join(out)


def clean_title(fname):
    t = re.sub(r"\.pdf$", "", fname, flags=re.I)
    t = re.sub(r"_\d{6}_\d{6}(_\d+)?$", "", t)
    t = re.sub(r"[_]+", " ", t)
    t = re.sub(r"\s+", " ", t).strip(" -")
    letters = [c for c in t if c.isalpha()]
    if letters and sum(c.isupper() for c in letters) > 0.7 * len(letters):
        t = tr_title(t)
    return t


def kurul_for_date(iso):
    d = iso[:10]
    for k in KURULLAR:
        if k["start"] <= d <= k["end"]:
            return k["id"]
    nxt = [k for k in KURULLAR if d < k["start"]]
    return nxt[0]["id"] if nxt else KURULLAR[-1]["id"]


def guess_meta(V, folder, fname, texts=None, portrait=None):
    """Drive klasörü + dosya adından kurul/ders/tür/hoca/başlık tahmini."""
    parts = [p for p in folder.split("/") if p]
    kur = next((p.lower() for p in parts if re.fullmatch(r"[Kk][1-4]", p)), None)
    leaf = parts[-1] if parts else ""
    kind = "slayt"
    if leaf.endswith("Ses") or re.search(r"ses kayd", leaf, re.I):
        kind, leaf = "ses", re.sub(r"\s*Ses(\s*Kayıtları)?$", "", leaf)
    course = course_name(FOLDER_COURSE.get(leaf) or re.sub(r"(?<=[a-zçğıöşü])(?=[A-ZÇĞİÖŞÜ])", " ", leaf) or "Diğer")
    low = tr_lower(fname)
    if re.search(r"çıkmış|cikmis|çıkm", low):
        kind = "cikmis"
    elif kind != "ses" and re.search(r"soru", low):
        kind = "soru"
    elif kind != "ses" and (re.search(r"(^|[ _(])(el|not\w*|özet\w*|ozet\w*|rehber\w*|anlat[ıi]m\w*|ai|son)([ _.)]|$)", low)
                            or portrait):
        kind = "not"          # Samsung Notes çıktıları dikey A4; slaytlar yatay
    date = date_from_name(fname)
    kur = kur or (kurul_for_date(date) if date else kurul_for_date(datetime.date.today().isoformat()))
    # hoca: 1) PDF'in ilk sayfalarında geçen bilinen bir isim 2) aynı kurul+dersin en yeni hocası 3) aynı dersin herhangi bir hocası
    hocas = [it["h"] for it in V.cat["items"] if it.get("h")]
    hoca = ""
    if texts:
        head = norm(" ".join(texts[:2]))
        for h in sorted(set(hocas), key=len, reverse=True):
            ws = [w for w in re.findall(r"[a-z]+", norm(h)) if len(w) > 1]
            if len(ws) >= 2 and re.search(r"\b" + ws[0] + r"\W+(?:\w+\W+){0,2}" + ws[-1] + r"\b", head):
                hoca = h
                break
    if not hoca:
        same = [it for it in V.cat["items"] if it.get("h") and it["c"] == course and it["g"] == kur]
        same = same or [it for it in V.cat["items"] if it.get("h") and it["c"] == course]
        if same:
            hoca = max(same, key=lambda it: it.get("d") or "")["h"]
    title = clean_title(fname)
    if kind == "ses":
        title = re.sub(r"^(.*?)\s*(\d+)$", r"\1 Ses Kaydı \2", title)
    return {"kind": kind, "kurul": kur, "course": course, "hoca": hoca, "title": title, "date": date}


# ---------- konu bağları (1.2): not/özet/video → slayt destesi ----------
KN_GENERIC = {"hasta", "tibbi", "genel", "temel", "giris", "notu", "notla", "ozeti", "ozet", "ders", "dersi", "sinav", "konu", "anlat",
              "kurul", "cikmi", "soru", "sorul", "son", "tekra", "yapay", "zeka", "makal", "vize", "final", "rehbe", "calis", "komit"}


def _kn_stems(t, drop=()):
    return {w[:5] for w in toks(t) if len(w) > 3} - KN_GENERIC - set(drop)


def assign_konu(V, items=None, force=False, verbose=False):
    """Not, özet, video ve soru dosyalarını ilgili slayt destesine bağlar (katalogda "kn": deste id'si ya da listesi).
    Kural: deste başlığı öğe başlığında bütünüyle geçiyorsa o; değilse ortak (genel olmayan) kelimeler. Özet en çok 2 desteye
    bağlanır; daha çok desteye uyan özet genel sayılır. Elle verilen kn korunur (force ile yeniden hesaplanır)."""
    decks = [d for d in V.cat["items"] if d["k"] == "slayt"]
    done = []
    for it in (items or V.cat["items"]):
        if it["k"] not in ("not", "ozet", "video", "soru") or (it.get("kn") and not force):
            continue
        cand = [d for d in decks if d["g"] == it["g"] and d["c"] == it["c"]]
        cdrop = {w[:5] for w in toks(it["c"]) if len(w) > 3}
        parts = [x for x in re.split(r"\s*·\s*", it["t"]) if x.strip()] if "·" in it["t"] else [it["t"]]
        chosen = []
        for part in parts:
            pt = set(toks(part))
            full = [d for d in cand if toks(d["t"]) and set(toks(d["t"])) <= pt]
            if full:
                chosen += [max(full, key=lambda d: len(toks(d["t"])))]
                continue
            st = _kn_stems(part, cdrop)
            sc = sorted(((len(st & _kn_stems(d["t"], cdrop)), d) for d in cand), key=lambda x: -x[0])
            hits = [(n, d) for n, d in sc if n >= 1]
            if not hits:
                continue
            if it["k"] == "ozet" and len(parts) == 1:
                if len(hits) <= 2:
                    chosen += [d for n, d in hits]
            else:
                best = hits[0][0]
                top = [d for n, d in hits if n == best]
                if len(top) == 1:
                    chosen.append(top[0])
        ids = list(dict.fromkeys(d["id"] for d in chosen))
        if ids:
            it["kn"] = ids[0] if len(ids) == 1 else ids
            done.append((it["id"], it["t"], [V.item(i)["t"] for i in ids]))
        elif force and "kn" in it:
            del it["kn"]
    if verbose:
        for i, t, ds in done:
            print(f"  {t}  →  {' + '.join(ds)}")
    return done


def set_saat(V, verbose=True):
    """Kurul provası için ders saatleri: d/plan'daki geçen yılın planından (her satır 1 ders saati); planda olmayan derse
    o kuruldaki slayt destesi sayısı. Katalogda kurullar[].saat = {ders: saat}."""
    plan = V.get_json("d/plan")
    for k in V.cat["kurullar"]:
        g = k["id"]
        sa = {course_name(c): len(konular) for c, konular in plan["kurullar"].get(g, {}).items()}
        for it in V.cat["items"]:
            if it["g"] == g and it["c"] not in sa:
                n = sum(1 for d in V.cat["items"] if d["g"] == g and d["c"] == it["c"] and d["k"] == "slayt")
                if n:
                    sa[it["c"]] = n
        k["saat"] = sa
        if verbose:
            print(g, ", ".join(f"{c} {n}" for c, n in sa.items()))


def fix_rot(V, ident, dry=False, min_conf=2.0, pages=None, angle=None):
    """Taranmış PDF'te yan dönmüş sayfaları düzeltir. Yön Tesseract'ın tespitinden (yanılabilir: önce --dry, sayfaları gözle
    doğrula, --pages ile yalnız onları düzelt); tespit edemediği sayfaya --angle (saat yönünde 90/180/270) verilir.
    Dönen sayfanın metni yeniden okunur (arama ve soru–sayfa eşleşmesi için)."""
    import subprocess
    from PIL import Image
    it = V.item(ident) or sys.exit("yok: " + ident)
    texts = V.get_json(f"d/{it['x']}/t")
    hv = hashlib.sha256()
    changed = []
    tmp = tempfile.mkdtemp()
    for i in range(1, it["n"] + 1):
        b = V.get(f"d/{it['x']}/{i}")
        if not pages or i in pages:
            src = os.path.join(tmp, f"{i}.png")
            Image.open(io.BytesIO(b)).convert("RGB").save(src)
            cw, conf = angle or 0, 0.0
            if not angle:
                r = subprocess.run(["tesseract", src, "-", "--psm", "0"], capture_output=True, text=True)
                m1 = re.search(r"Rotate:\s*(\d+)", r.stdout or ""); m2 = re.search(r"Orientation confidence:\s*([\d.]+)", r.stdout or "")
                rot, conf = (int(m1.group(1)) if m1 else 0), (float(m2.group(1)) if m2 else 0.0)
                cw = (360 - rot) % 360 if rot and conf >= min_conf else 0     # Tesseract "Rotate" saat yönünün tersine
            if cw:
                changed.append((i, cw, conf))
                if not dry:
                    im = Image.open(io.BytesIO(b)).rotate(-cw, expand=True)    # PIL: pozitif açı saat yönünün tersi
                    out = io.BytesIO(); im.save(out, "WEBP", quality=62, method=6); b = out.getvalue()
                    V.put(f"d/{it['x']}/{i}", b)
                    im.convert("RGB").save(src)
                    o = subprocess.run(["tesseract", src, "-", "-l", "tur", "--psm", "3"], capture_output=True, text=True).stdout
                    if len(re.findall(r"\w{3,}", o)) >= len(re.findall(r"\w{3,}", texts[i - 1] or "")):
                        texts[i - 1] = " ".join(o.split())
        hv.update(hashlib.sha256(b).digest())
    shutil.rmtree(tmp)
    if changed and not dry:
        V.put_json(f"d/{it['x']}/t", texts)
        it["v"] = hv.hexdigest()[:8]
    return changed


def drive_check(V, listing, fix=False):
    """Drive'daki klasör yerleşimi ile katalogdaki kurul/ders karşılaştırması. listing: [{id, name, folder}] (folder ör. "K2/Biyokimya").
    Dosya Drive'da başka klasöre taşındıysa ya da yanlış kategorideyse öneri (fix ile uygular)."""
    out = []
    by_src = {it["src"][6:]: it for it in V.cat["items"] if it.get("src", "").startswith("drive:")}
    for f in listing:
        it = by_src.get(f["id"])
        if not it:
            continue
        m = guess_meta(V, f["folder"], f.get("name") or it["t"])
        want_g = m["kurul"] if re.search(r"(^|/)[Kk][1-4](/|$)", f["folder"]) else it["g"]
        want_c = m["course"] if m["course"] != "Diğer" else it["c"]
        if (want_g, want_c) != (it["g"], it["c"]):
            out.append((it["id"], it["t"], (it["g"], it["c"]), (want_g, want_c)))
            if fix:
                it["g"], it["c"] = want_g, want_c
    return out


def print_plan(V, only=None):
    """d/plan (geçen yılın ders planı) ile katalogdaki slayt/notları karşılaştırır. ✓ = kaynağı var."""
    plan = V.get_json("d/plan")
    print(plan["kaynak"])
    docs = [it for it in V.cat["items"] if it["k"] in ("slayt", "not", "ozet")]
    for g, dersler in plan["kurullar"].items():
        if only and g != only:
            continue
        h = plan["saat"].get(g, {})
        print(f"\n== {g} · {h.get('toplam', '?')} saat, {h.get('hafta', '?')} hafta")
        for c, konular in dersler.items():
            mine = [it for it in docs if it["c"] == course_name(c)]
            print(f"  {c} ({len(konular)} ders saati)")
            st = lambda t: {w[:5] for w in toks(t) if len(w) > 3}
            for k in konular:
                kt = st(k)
                ov = lambda it: len(kt & st(it["t"]))
                best = max(mine, key=lambda it: (ov(it), -len(st(it["t"]))), default=None)
                # tek ortak kelime yalnız aynı kurulda ve genel olmayan bir kelimeyse sayılır (ör. "Proteinler I" ↔ k1 proteinler)
                hit = best and (ov(best) >= 2 or (ov(best) == 1 and best["g"] == g and not (kt & st(best["t"])) <= {"hasta", "tibbi", "genel", "temel", "genet", "biyom"}))
                print(f"    {'✓' if hit else '·'} {k}" + (f"  ← {best['t']} ({best['g']})" if hit else ""))


def known_sources(V):
    c = V.cat
    return sorted({it["src"][6:] for it in c["items"] if it.get("src", "").startswith("drive:")}
                  | set(c.get("skip", [])) | {t["src"][6:] for t in c.get("todo", [])})


def main():
    ap = argparse.ArgumentParser()
    sp = ap.add_subparsers(dest="cmd", required=True)
    sp.add_parser("init")
    sp.add_parser("cat")
    sp.add_parser("refs")
    sp.add_parser("index")
    sp.add_parser("check")
    sp.add_parser("passwd")
    sp.add_parser("stamp")
    sp.add_parser("scan")
    td = sp.add_parser("test-dump", help="testi düzenlemek için JSON'a yaz (scratchpad'e; commit etme)")
    td.add_argument("id")
    td.add_argument("out")
    tl = sp.add_parser("test-load", help="düzenlenmiş JSON'u teste geri yaz (refs ve arama dizini yenilenir)")
    tl.add_argument("id")
    tl.add_argument("src")
    fn = sp.add_parser("final", help="final sınavı dönemi: başlangıç ve bitiş (YYYY-AA-GG)")
    fn.add_argument("start")
    fn.add_argument("end")
    fn.add_argument("--dn", default="d1")
    sn = sp.add_parser("sinav", help="yaklaşan sınav uyarısı: tarih ve ders (ana sayfada --gun kadar önceden çıkar, varsayılan 21)")
    sn.add_argument("date", help="YYYY-AA-GG")
    sn.add_argument("course")
    sn.add_argument("--t", default="Vize", help="Vize, Final, Kurul sınavı...")
    sn.add_argument("--gun", type=int, help="uyarı kaç gün önceden çıksın (seçmeliler 5; yoksa 21)")
    sn.add_argument("--rm", action="store_true", help="bu sınavı sil")
    vd = sp.add_parser("add-video", help="Drive'daki videoyu kataloğa bağla (video Drive'da kalır)")
    vd.add_argument("--folder", required=True)
    vd.add_argument("--fid", required=True)
    vd.add_argument("--name", required=True)
    vd.add_argument("--by", help="yükleyen (Drive'daki sahibi)")
    vd.add_argument("--mb")
    vd.add_argument("--dur", help="süre, ör. 48:12")
    for o in ("kurul", "course", "hoca", "title", "date"):
        vd.add_argument("--" + o)
    for name in ("add-doc", "add-test"):
        a = sp.add_parser(name)
        a.add_argument("file")
        a.add_argument("--kind", default="slayt")
        a.add_argument("--kurul", required=True)
        a.add_argument("--course", required=True)
        a.add_argument("--hoca", default="")
        a.add_argument("--title", required=True)
        a.add_argument("--sub")
        a.add_argument("--date")
        a.add_argument("--id")
        a.add_argument("--src")
        a.add_argument("--by", help="yükleyen")
    s = sp.add_parser("set")
    s.add_argument("id")
    s.add_argument("kv", nargs="+")
    r = sp.add_parser("rm")
    r.add_argument("id")
    sk = sp.add_parser("skip")
    sk.add_argument("src")
    sp.add_parser("known")
    kn = sp.add_parser("konu", help="not/özet/video → slayt destesi bağları (ders sayfasında konuya göre gruplama)")
    kn.add_argument("--force", action="store_true", help="elle verilenler dahil hepsini yeniden hesapla")
    sp.add_parser("saat", help="kurul provası için ders saatleri (d/plan'dan)")
    ka = sp.add_parser("konu-ad", help="aynı konunun farklı adlarını birleştir (testler, ilerleme, karma); argümansız: listele")
    ka.add_argument("course", nargs="?")
    ka.add_argument("old", nargs="?")
    ka.add_argument("new", nargs="?")
    ka.add_argument("--rm", action="store_true", help="eski adın eşlemesini sil")
    fr = sp.add_parser("fix-rot", help="taranmış PDF'te yan dönmüş sayfaları düzelt")
    fr.add_argument("id")
    fr.add_argument("--dry", action="store_true")
    fr.add_argument("--pages", help="yalnız bu sayfalar, ör. 7,8,10")
    fr.add_argument("--angle", type=int, help="tespit yerine saat yönünde bu kadar döndür (90/180/270)")
    dc = sp.add_parser("drive-check", help="Drive klasör listesiyle kategori karşılaştırması (JSON: [{id,name,folder}])")
    dc.add_argument("listing")
    dc.add_argument("--fix", action="store_true")
    pl = sp.add_parser("plan", help="müfredat: kurul › ders › konu, kaynağı olanlar işaretli")
    pl.add_argument("kurul", nargs="?")
    ad = sp.add_parser("add-drive")
    ad.add_argument("file")
    ad.add_argument("--folder", required=True, help="Drive klasörü, ör. K2/Biyokimya")
    ad.add_argument("--fid", required=True, help="Drive dosya id'si")
    ad.add_argument("--name", help="Drive'daki dosya adı (yerel ad farklıysa)")
    for o in ("kind", "kurul", "course", "hoca", "title", "date", "by"):
        ad.add_argument("--" + o)
    ad.add_argument("--dry", action="store_true", help="sadece tahmini göster")
    tdp = sp.add_parser("todo")
    tdp.add_argument("fid")
    tdp.add_argument("--folder", required=True)
    tdp.add_argument("--name", required=True)
    tdp.add_argument("--kb", type=int, default=0)
    a = ap.parse_args()

    if a.cmd == "scan":
        probs = scan_plain()
        print("\n".join(probs) if probs else "temiz")
        sys.exit(1 if probs else 0)
    V = Vault(create=a.cmd == "init")
    if a.cmd == "init":
        V.save()
    elif a.cmd == "cat":
        print(json.dumps(V.cat, ensure_ascii=False, indent=1))
        return
    elif a.cmd == "passwd":
        new = os.environ.get("MEDLOCK_NEWPASS")
        if not new:
            sys.exit("MEDLOCK_NEWPASS yok.")
        V.passwd(new)
        print("Şifre değişti. Cihazlarda yeniden giriş gerekmez; yeni cihazlar yeni şifreyle girer.")
        return
    elif a.cmd == "add-doc":
        it = add_doc(V, a.file, kind=a.kind, kurul=a.kurul, course=a.course, hoca=a.hoca, title=a.title,
                     date=a.date, id=a.id, src=a.src, sub=a.sub, by=a.by)
        print("eklendi", it["id"], it["n"], "sayfa")
        print(compute_refs(V)); build_index(V)
    elif a.cmd == "add-test":
        cfg, data = parse_test_html(a.file)
        it = add_test(V, cfg, data, kurul=a.kurul, course=a.course, hoca=a.hoca, title=a.title,
                      date=a.date, id=a.id, sub=a.sub)
        print("eklendi", it["id"], it["n"], "soru")
        print(compute_refs(V)); build_index(V)
    elif a.cmd == "set":
        it = V.item(a.id) or sys.exit("yok: " + a.id)
        for kv in a.kv:
            k, v = kv.split("=", 1)
            it[k] = json.loads(v) if v[:1] in "[{0123456789" and k not in ("t", "h", "c", "d") else v
    elif a.cmd == "rm":
        it = V.item(a.id) or sys.exit("yok: " + a.id)
        V.cat["items"].remove(it)
        if it.get("src", "").startswith("drive:"):
            V.cat.setdefault("skip", []).append(it["src"][6:])
        if it.get("x"):
            p = os.path.join(V.repo, "d", it["x"])
            shutil.rmtree(p) if os.path.isdir(p) else os.path.exists(p) and os.remove(p)
        build_index(V)
    elif a.cmd == "skip":
        V.cat.setdefault("skip", []).append(a.src.replace("drive:", ""))
    elif a.cmd == "known":
        print("\n".join(known_sources(V)))
        return
    elif a.cmd == "konu":
        n = assign_konu(V, force=a.force, verbose=True)
        print(len(n), "öğe desteye bağlandı")
    elif a.cmd == "saat":
        set_saat(V)
    elif a.cmd == "konu-ad":
        # katalogda ta = {ders: {eski ad: yeni ad}}; uygulama eski adla kaydedilmiş geçmişi de yeni adla gösterir
        TA = V.cat.setdefault("ta", {})
        if a.course and a.old:
            m = TA.setdefault(a.course, {})
            if a.rm:
                m.pop(a.old, None)
            elif a.new:
                known = {t for it in V.cat["items"] if it["k"] == "test" and it["c"] == a.course for t, _ in it.get("tp") or []}
                if a.new not in known:
                    print("uyarı: '" + a.new + "' bu dersin testlerinde konu adı olarak geçmiyor")
                m[a.old] = a.new
            else:
                sys.exit("yeni ad eksik")
            if not m:
                TA.pop(a.course)
        for c, m in TA.items():
            for o, n in m.items():
                print(f"{c}: {o} → {n}")
        if not (a.course and a.old):
            return
    elif a.cmd == "fix-rot":
        ch = fix_rot(V, a.id, dry=a.dry, pages=[int(x) for x in a.pages.split(",")] if a.pages else None, angle=a.angle)
        print(("düzeltilecek" if a.dry else "düzeltildi") + ":", ", ".join(f"s.{i} (saat yönünde {r}°" + (f", güven {c:.1f})" if c else ")") for i, r, c in ch) or "yok")
        if ch and not a.dry:
            build_index(V)
    elif a.cmd == "drive-check":
        res = drive_check(V, json.load(open(a.listing)), fix=a.fix)
        for i, t, old, new in res:
            print(f"  {i} · {t}: {old[0]}/{old[1]} → {new[0]}/{new[1]}")
        print(len(res), "uyuşmazlık" + (" düzeltildi" if a.fix else ""))
        if not a.fix:
            return
    elif a.cmd == "test-dump":
        it = V.item(a.id) or sys.exit("yok: " + a.id)
        b = V.get_json(f"d/{it['x']}")
        json.dump({"cfg": b["cfg"], "data": b["data"]}, open(a.out, "w"), ensure_ascii=False, indent=1)
        print(a.out, len(b["data"]), "soru")
        return
    elif a.cmd == "test-load":
        it = V.item(a.id) or sys.exit("yok: " + a.id)
        if it["k"] != "test":
            sys.exit("test değil: " + a.id)
        j = json.load(open(a.src))
        b = V.get_json(f"d/{it['x']}")
        b["cfg"], b["data"] = j["cfg"], j["data"]
        it["n"] = len(j["data"])
        it["tp"] = collections.Counter(q["t"] for q in j["data"]).most_common()
        write_test(V, it, b)
        print(compute_refs(V)); build_index(V)
    elif a.cmd == "add-video":
        it = add_video(V, a.fid, a.folder, a.name, by=a.by, mb=a.mb, dur=a.dur, kurul=a.kurul, course=a.course,
                       hoca=a.hoca, title=a.title, date=a.date)
        print("video eklendi", it["id"], it["g"], it["c"], "·", it["t"])
    elif a.cmd == "final":
        d = next((x for x in V.cat["donemler"] if x["id"] == a.dn), None) or sys.exit("dönem yok: " + a.dn)
        d["final"] = {"start": a.start, "end": a.end}
        print(d["name"], "final dönemi:", a.start, "–", a.end)
    elif a.cmd == "sinav":
        L = [x for x in V.cat.get("sinavlar", []) if not (x["d"] == a.date and x["c"] == a.course)]
        if not a.rm:
            L.append({"d": a.date, "c": a.course, "t": a.t, **({"w": a.gun} if a.gun else {})})
        V.cat["sinavlar"] = sorted(L, key=lambda x: x["d"])
        print("sınavlar:", ", ".join(f'{x["d"]} {x["c"]} {x["t"]}' for x in V.cat["sinavlar"]) or "yok")
    elif a.cmd == "add-drive":
        name = a.name or os.path.basename(a.file)
        if VIDEO_EXT.search(name):
            sys.exit("video dosyası: add-video kullan (video indirilmez, Drive'da kalır)")
        txt = subprocess.run(["pdftotext", "-l", "2", "-enc", "UTF-8", a.file, "-"], capture_output=True, text=True).stdout.split("\f")
        info = subprocess.run(["pdfinfo", a.file], capture_output=True, text=True).stdout
        sz = [l for l in info.splitlines() if l.startswith("Page size:")]
        portrait = None
        if sz:
            pw, ph = (float(x) for x in sz[0].split(":", 1)[1].split("pts")[0].split("x"))
            portrait = pw < ph
        m = guess_meta(V, a.folder, name, txt, portrait)
        for o in ("kind", "kurul", "course", "hoca", "title", "date", "by"):
            if getattr(a, o):
                m[o] = getattr(a, o)
        print("tahmin:", json.dumps(m, ensure_ascii=False))
        if m["kind"] == "ses":
            # Ses kaydı dökümleri yalnız Claude'un not hazırlarken kullandığı kaynaktır; MedLock'a eklenmez.
            print("ses kaydı dökümü: MedLock'a eklenmez" + ("" if a.dry else ", skip listesine yazıldı"))
            if not a.dry:
                V.cat.setdefault("skip", []).append(a.fid)
                V.save()
            return
        if a.dry:
            return
        approx = not m["date"]
        if approx:
            m["date"] = datetime.datetime.now().strftime("%Y-%m-%dT%H:%M")
        it = add_doc(V, a.file, src="drive:" + a.fid, approx=False, **m)
        V.cat["todo"] = [t for t in V.cat.get("todo", []) if t["src"] != "drive:" + a.fid]
        print("eklendi", it["id"], it["n"], "sayfa")
        print(compute_refs(V)); build_index(V)
    elif a.cmd == "todo":
        m = guess_meta(V, a.folder, a.name)
        if m["kind"] == "ses":
            V.cat.setdefault("skip", []).append(a.fid)
            print("ses kaydı dökümü: todo yerine skip")
            V.save()
            return
        V.cat.setdefault("todo", []).append({"src": "drive:" + a.fid, "file": a.name, "kind": m["kind"], "g": m["kurul"],
                                             "c": m["course"], "h": m["hoca"], "t": m["title"], "kb": a.kb})
    elif a.cmd == "plan":
        print_plan(V, a.kurul)
        return
    elif a.cmd == "refs":
        print(compute_refs(V))
    elif a.cmd == "index":
        print(build_index(V))
    elif a.cmd == "check":
        probs = scan_plain()
        if probs:
            sys.exit("ŞİFRESİZ/SIZINTI:\n  " + "\n  ".join(probs))
        print("ok", check(V), "blob")
        return
    V.save()


if __name__ == "__main__":
    main()
