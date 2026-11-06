# MedLock: bakım notları (Claude için)

Repo sahibinin (tıp, Dönem 1) kişisel ders arşivi. Sadece o ve bir arkadaşı kullanır.
Site: https://tixdinakar.github.io/MedLock/ (GitHub Pages, `main` dalının kökü).

## Kesin kurallar
- Repo herkese açık. **Şifreyi ve şifresiz içeriği asla commit etme.** Slayt, not, test, katalog: hepsi `d/` altında şifreli durur.
- Şifre sadece `MEDLOCK_PASS` ortam değişkeniyle verilir; hiçbir dosyaya, commit mesajına ya da loga yazılmaz.
- Commit'ten önce `python3 tools/medlock.py check` çalıştır.
- Arayüz dosyalarını (index.html, app.js, app.css, engine.html, sw.js, manifest) değiştirdikten sonra `python3 tools/medlock.py stamp` çalıştır; yoksa cihazlar yeni sürümü fark etmez.

## Yapı
- `k.json`: veri anahtarı (DEK), şifreden türetilen anahtarla sarılı (PBKDF2-SHA256 600k + AES-GCM). Şifre değişince sadece bu dosya değişir (`passwd`).
- `d/c`: katalog (gzip JSON, şifreli). Öğeler: id, k (slayt|not|ozet|cikmis|soru|ses|test|kart), g (k1..k4|ortak), c (ders), h (hoca), t (başlık), d (tarih), n (sayfa/soru), x (blob klasörü), v (sürüm), src (drive:<fileId>), dq (tarih tahmini).
  `skip`: bilerek eklenmeyen Drive dosyaları. `todo`: eklenmesi bekleyen Drive dosyaları (çoğu 10 MB'tan büyük olduğu için connector indiremedi; sahibinden ek olarak istenir).
- `d/<x>/<n>`: sayfa görselleri (WebP), `d/<x>/t`: sayfa metinleri; `d/<x>` (dosya): test ya da kart verisi; `d/s`: arama dizini.
- Şifreleme deterministik (IV = HMAC(içerik)); aynı içerik aynı baytı üretir, git'te gereksiz fark oluşmaz.
- `v.json`: {c: katalog sürümü, app: arayüz sürümü}. Uygulama bunu izleyip kendini günceller.
- `engine.html`: bütün testlerin ortak motoru (Astronomican test HTML'lerinden). Yeni testler aynı motor biçiminde (`const CFG = {...}; const DATA = [...]`) olmalı. Motor değişirse: `python3 tools/make_engine.py yeni-test.html`, sonra `stamp`.

## Kurulum (yeni oturumda)
```
pip install --break-system-packages cryptography pillow   # poppler-utils de gerekli (pdftoppm, pdftotext, pdfinfo)
export MEDLOCK_PASS='...'                                  # sahibinden ya da onun izin verdiği kayıttan
python3 tools/medlock.py cat | head                        # şifre doğru mu
```

## İçerik ekleme
Kurul tarihleri: k1 07.09–23.10.2026, k2 26.10–25.12.2026, k3 28.12.2026–15.03.2027, k4 16.03–14.05.2027. Dosya adındaki `_YYMMDD_HHMMSS` tarih olarak alınır.
Drive klasörü "Ders Slaytları ve Notlar": Kurul › Ders düzeninde. Hoca sırası: 1) PDF'teki isim 2) bilinen ders–hoca eşleşmesi 3) Drive'daki slayttaki isim.

```
# PDF (slayt, not, çıkmış, ses kaydı dökümü...)
python3 tools/medlock.py add-doc dosya.pdf --kind slayt --kurul k2 --course Biyokimya --hoca "Hoca Adı" \
    --title "Lipitler" --src drive:<fileId>
# Test (Astronomican motoru biçimindeki HTML)
python3 tools/medlock.py add-test test.html --kurul k2 --course Biyokimya --hoca "Hoca Adı" --title "Lipitler Denemesi"
python3 tools/medlock.py set <id> t="Yeni başlık"      # düzeltme
python3 tools/medlock.py rm <id>
python3 tools/medlock.py check && git add -A && git commit && git push
```
`add-doc`/`add-test` soru→slayt bağlantılarını (`refs`) ve arama dizinini kendisi yeniler. Testteki `s` alanı "Ders adı, slayt 12, 14" biçimindeyse sayfa doğrudan alınır; numara yoksa metin benzerliğiyle tahmin edilir ("tahmini" diye gösterilir). Testteki ders adı slayt başlığından farklıysa slayt öğesine `al` (takma ad listesi) ekle: `set <id> al='["Testteki ad"]'`, sonra `refs`.

Ders adları: "Tıbbi Biyoloji ve Genetik", "Biyokimya", "Biyofizik", "Tıp Tarihi", "Biyoistatistik", "Psikoloji", "ATA 151 · Türk Dili I". Yeni ders gelirse Drive klasör adını kullan.

## Drive denetimi
Drive klasöründeki dosya id'lerini katalogdaki `src` + `skip` + `todo` ile karşılaştır; yeni olanları ekle. Connector 10 MB üstünü indiremez: onları `todo`'ya yaz ve sahibinden iste.

## Boyut
GitHub Pages sitesi 1 GB'ı geçmemeli. Sayfalar ~40 KB (WebP q52). Ne kadar yer kaldığını izle (`du -sh d`).
