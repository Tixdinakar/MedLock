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
1. Drive'da "Ders Slaytları ve Notlar" klasörünü ve alt klasörlerini (K1/Biyokimya, K2/BiyokimyaSes...) dosya id'leri ve boyutlarıyla listele.
2. `python3 tools/medlock.py known` çıktısında olmayan id'ler yenidir. "Diğer" klasörü ve Claude'un ürettiği özet kopyaları `skip`.
3. 10 MB altındaysa Drive connector'ının `download_file_content` aracıyla indir (sonuç JSON: `content` base64), çöz, PDF'e yaz:
   `python3 tools/medlock.py add-drive dosya.pdf --folder K2/Biyokimya --fid <id> --name "<Drive'daki ad>"`
   Tür (yatay = slayt, dikey A4 = not; ad "çıkmış/soru/özet/el" içeriyorsa ona göre), kurul (klasör ya da tarih), ders (klasör), hoca (PDF'teki isim, yoksa dersin bilinen hocası) ve başlık tahmin edilir. Emin değilsen önce `--dry`, gerekirse `--kind/--hoca/--title` ile düzelt.
4. 10 MB üstündeyse `todo <id> --folder ... --name ... --kb ...` ile kaydet ve sahibinden ek olarak iste.
5. `check`, commit, push. Ne eklendiğini ve tahmin edilen hocaları kısaca bildir.

Taranmış (metinsiz) sayfalar Türkçe OCR'dan geçer (tesseract `tur`); arama ve soru–slayt eşleşmesi bunlarda da çalışır.

## Denetim
`MEDLOCK_PASS=... bash tools/check_site.sh` bütün blobları çözer, siteyi yerelde sunar ve telefon/tablet boyutunda giriş, slayt, test ("Slayta git"), sonuç, tekrar ve arama akışını dener (Playwright gerekir). Çıktıdaki `fails` boş olmalı.

## Astronomican
Eski merkez sayfa (claude.ai artifact) bir prototipti ve artık güncellenmiyor. Yeni test ve notlar sadece MedLock'a eklenir.

## Profiller ve senkron
- Her kullanıcının ilerlemesi (tekrar listesi, test sonuçları ve yarım kalan test durumları, işaretler, döndürülmüş sayfalar, ilerleme istatistikleri) cihazda `ml.p.<profil>` anahtarında durur.
- Senkron anahtarı (yalnız `gist` yetkili GitHub anahtarı) **repoya ve kataloğa asla konmaz**; her cihazda Ayarlar › Profil › Cihazlar arası senkron'dan girilir ve yalnız o cihazda durur. Profiller "MedLock senkron" adlı gizli gist'te `p-<profil>.txt` olarak, uygulama anahtarıyla AES-GCM şifreli tutulur ve cihazlar arasında birleştirilir (kayıt bazında en yeni kazanır; deneme geçmişi ve günlük sayılar birleşir). Profil kimliği adın kendisidir: her cihazda aynı adı kullanmak gerekir.
- Denetim betiği api.github.com isteklerini engeller; gerçek senkron verisine dokunmaz.

## Boyut
GitHub Pages sitesi 1 GB'ı geçmemeli. Yatay slaytlar 1100 px WebP q52 (~40 KB/sayfa); dikey A4 sayfalar (not, özet, çıkmış) küçük yazı yüzünden 1800 px q62 (~60–250 KB/sayfa). Ne kadar yer kaldığını izle (`du -sh d`). Yalnız görselleri yenilemek için `add_doc(..., keep_text=True)` eski OCR metnini korur.
