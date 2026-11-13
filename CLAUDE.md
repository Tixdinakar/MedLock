# MedLock: bakım notları (Claude için)

Repo sahibinin (tıp, Dönem 1) kişisel ders arşivi. Sadece o ve bir arkadaşı kullanır.
Cihazlar: Android telefon ve tablet, PC (Chrome tabanlı). iOS/Safari yok; denetimler Chromium'da yeterli.
Site: https://tixdinakar.github.io/MedLock/ (GitHub Pages, `main` dalının kökü).

## Kesin kurallar
- Repo herkese açık. **Şifreyi ve şifresiz içeriği asla commit etme.** Slayt, not, test, katalog: hepsi `d/` altında şifreli durur.
- Şifre sadece `MEDLOCK_PASS` ortam değişkeniyle verilir; hiçbir dosyaya, commit mesajına ya da loga yazılmaz.
- Commit'ten önce `python3 tools/medlock.py check` çalıştır. `check` (ve şifre istemeyen `scan`) izin listesi dışındaki dosyayı, `d/` altında şifresiz görünen ya da bu anahtarla çözülmeyen dosyayı, GitHub anahtarı ve şifre sızıntısını reddeder. Bir şey bulursa: içerik ise `add-doc`/`add-test` ile şifreli ekle, şifresiz kopyayı ve geçici dosyaları sil, sonra yeniden `check`. Kurulumda `git config core.hooksPath tools/hooks` (pre-commit kancası `scan` çalıştırır).
- Arayüz dosyalarını (index.html, app.js, app.css, engine.html, sw.js, manifest) değiştirdikten sonra `python3 tools/medlock.py stamp` çalıştır. Kabuk cihazda önbellekten açılır; uygulama `v.json`'daki `app` ile app.js'teki `APPV`'yi karşılaştırıp kabuğu topluca yeniler. `stamp` ikisini birlikte yazar; `check` uyuşmazlığı yakalar.
- Kullanıcıya görünen sürüm `app.js`'te `VERSION` (1.0 ilk sürüm, 1.1 = 7 Kasım genel güncellemesi, 1.2 = 8 Kasım: Bugün kartı, Saat, Düello, konuya göre ders sayfası; 1.3 = 8 Kasım: emin değilim işareti, boş/emin değilim filtreleri, optik kenarda ve yana sabitlenebilir, test yorumu, tam ekran; 1.3.3 = 13 Kasım: ana sayfada kurul kartı üstte, cihaza indir, Düello donması; 1.4 = 13 Kasım: çalışma süresi kendiliğinden, açık unutulan Saat sorusu, süre düzeltme). Her arayüz değişikliğinde artır: büyük güncelleme +0.1 (1.1 → 1.2), küçük düzeltme +0.0.1 (1.1.2 → 1.1.3); `CHANGES`'in başına kısa Türkçe not ekle (Buğra'nın anlayacağı dille, kod terimi yok). Ana sayfada her cihazda bir kez "Yeni sürüm" notu çıkar; Ayarlar › Yenilikler'de hepsi durur. `check` VERSION ile ilk notun aynı olduğuna bakar.

## Yapı
- `k.json`: veri anahtarı (DEK), şifreden türetilen anahtarla sarılı (PBKDF2-SHA256 600k + AES-GCM). Şifre değişince sadece bu dosya değişir (`passwd`).
- `d/c`: katalog (gzip JSON, şifreli). Öğeler: id, k (slayt|not|ozet|cikmis|soru|test|kart|video), g (k1..k4|ortak), c (ders), h (hoca), t (başlık), d (tarih), n (sayfa/soru), x (blob klasörü; videoda yok), v (sürüm), src (drive:<fileId>), dq (tarih tahmini), u (yükleyen), dur (video süresi), cx (çıkmıştan test), kn (not/özet/video → bağlı slayt destesi id'si ya da listesi; ders sayfası konuya göre gruplar), tp (testin konu sayıları), dk (testin destelere göre soru sayıları; `refs` yazar).
  `kurullar[].saat`: {ders: ders saati} (`saat` komutu, d/plan'dan; kurul provasında dersler arası dağılım). `ta`: {ders: {eski konu adı: yeni}} (`konu-ad`). `sinavlar`: [{d, c, t, w}] (w = uyarının kaç gün önceden çıkacağı; ortak dersler ve seçmeliler 5). `hv` (öğede): hocanın derste vurguladığı yerler [{p, t: "dk:sn", s: ses dökümü adı, n: not, q: 1 = "soru olarak geldi/gelir"}] (`vurgu`).
  `donemler`: [{id: d1, no, name, yil, final: {start, end, est}}]; kurullar ve `ortak` `dn` ile döneme bağlı. Kurul id'leri bütün yıllarda tekil: Dönem I `k1..k4`, Dönem II gelince `d2-k1..` ve `d2-ortak` (yeni dönemi `DONEMLER`/`KURULLAR`'a ekle).
  `skip`: bilerek eklenmeyen Drive dosyaları. `todo`: eklenmesi bekleyen Drive dosyaları (çoğu 10 MB'tan büyük olduğu için connector indiremedi; sahibinden ek olarak istenir).
- `d/<x>/<n>`: sayfa görselleri (WebP), `d/<x>/t`: sayfa metinleri; `d/<x>` (dosya): test ya da kart verisi; `d/s`: arama dizini.
- Şifreleme deterministik (IV = HMAC(içerik)); aynı içerik aynı baytı üretir, git'te gereksiz fark oluşmaz.
- `v.json`: {c: katalog sürümü, app: arayüz sürümü}. Uygulama bunu izleyip kendini günceller.
- `engine.html`: bütün testlerin ortak motoru (Astronomican test HTML'lerinden). Yeni testler aynı motor biçiminde (`const CFG = {...}; const DATA = [...]`) olmalı. Motor değişirse: `python3 tools/make_engine.py yeni-test.html`, sonra `stamp`.

## Kurulum (yeni oturumda)
```
git clone --depth 1 https://github.com/Tixdinakar/MedLock.git   # geçmiş gerekmez; hızlı
pip install --break-system-packages cryptography pillow   # poppler-utils de gerekli (pdftoppm, pdftotext, pdfinfo)
git config core.hooksPath tools/hooks                      # commit öncesi şifresiz içerik denetimi
export MEDLOCK_PASS='...'                                  # sahibinden ya da onun izin verdiği kayıttan
python3 tools/medlock.py cat | head                        # şifre doğru mu
```

## İçerik ekleme
Kurul tarihleri: k1 07.09–23.10.2026, k2 26.10–25.12.2026, k3 28.12.2026–15.03.2027, k4 16.03–14.05.2027. Sınav biçimi: her kurul sınavı ve final 100 soru, 100 dakika; yanlış doğruyu götürmez. Kurul sınavı kurulun son günü (K1 23.10, K2 25.12.2026; K3/K4 için aynı varsayım). Akademik takvim 2026–27: final (yıl sonu sınavı) 24.05.2027, bütünleme 31.05.2027; yarıyıl tatili 04–08.01.2027. Final dönemi uygulamada 15–31.05.2027. Dosya adındaki `_YYMMDD_HHMMSS` tarih olarak alınır.
Drive klasörü "Ders Slaytları ve Notlar": Kurul › Ders düzeninde. Hoca sırası: 1) PDF'teki isim 2) bilinen ders–hoca eşleşmesi 3) Drive'daki slayttaki isim.

```
# PDF (slayt, not, çıkmış...)
python3 tools/medlock.py add-doc dosya.pdf --kind slayt --kurul k2 --course Biyokimya --hoca "Hoca Adı" \
    --title "Lipitler" --src drive:<fileId>
# Test (Astronomican motoru biçimindeki HTML)
python3 tools/medlock.py add-test test.html --kurul k2 --course Biyokimya --hoca "Hoca Adı" --title "Lipitler Denemesi"
# Video: indirilmez, Drive'da kalır; katalogda yalnız bağlantısı olur, Drive oynatıcısıyla açılır
python3 tools/medlock.py add-video --folder K2/Biyokimya --fid <id> --name "<Drive'daki ad>" --by "<yükleyen>" --mb 55 [--dur 48:12]
python3 tools/medlock.py set <id> t="Yeni başlık"      # düzeltme
python3 tools/medlock.py rm <id>
python3 tools/medlock.py test-dump <id> x.json        # testi düzelt (x.json scratchpad'de; commit etme) …
python3 tools/medlock.py test-load <id> x.json        # … ve geri yaz (refs + arama dizini yenilenir)
python3 tools/medlock.py final 2027-05-15 2027-05-31  # final dönemi (K4 bitişi → bütünleme); final sınavı 24.05.2027
python3 tools/medlock.py sinav 2026-11-13 "Kanser ve Kök Hücre" --t Vize --gun 5   # ana sayfada sınav uyarısı; --gun kaç gün önceden (ortak dersler ve seçmeliler 5; kurul sınavı 14, dönem finali 21), --rm siler
#   Sınav eklenince ya da tarihi değişince Buğra'nın Google Takvim'ine de yaz (Calendar connector; açıklamada "MedLock'tan eklendi", önce aynı sınav var mı bak). Tahmini K3/K4 tarihleri takvimde "(tahmini)"; kesinleşince güncelle.
python3 tools/medlock.py vurgu redoks-tepkimeleri-slayt 9 41:02 "Redoks 1" "Hoca ne dedi (slayta göre düzeltilmiş)" [--soru] [--rm]   # ses kaydındaki hoca vurgusu
python3 tools/medlock.py konu [--force]               # not/özet → slayt destesi bağı (kn); add-doc kendisi de tahmin eder
python3 tools/medlock.py saat                         # kurul provası için ders saatleri (kurullar[].saat, d/plan'dan)
python3 tools/medlock.py konu-ad Biyokimya "Tepkime tipleri" "Tepkime Kategorileri"   # aynı konunun iki adı (argümansız: liste)
python3 tools/medlock.py fix-rot <id> --dry           # taranmış PDF'te yan sayfalar; sayfaları gözle doğrula, sonra --pages 1,7 [--angle 90|180|270]
python3 tools/medlock.py check && git add -A && git commit && git push
```
`add-doc`/`add-test` soru→slayt bağlantılarını (`refs`) ve arama dizinini kendisi yeniler. Testteki `s` alanı "Ders adı, slayt 12, 14" biçimindeyse sayfa doğrudan alınır; numara yoksa metin benzerliğiyle tahmin edilir ("tahmini" diye gösterilir). Testteki ders adı slayt başlığından farklıysa slayt öğesine `al` (takma ad listesi) ekle: `set <id> al='["Testteki ad"]'`, sonra `refs`.
Yeni testte konu adlarını (`t`) aynı dersin mevcut testlerindeki adlarla aynı yaz (İlerleme, Karma ve tekrar konuya göre toplar); farklı kalmışsa `konu-ad` ile eşle. Not/özet eklenince `kn` yanlış tahmin edildiyse: `set <id> kn='["deste-id"]'`.

`--by`: dosyayı yükleyen (Drive'da sahibi). Buğra'nın ve arkadaşının kendi notları, özetleri ve videolarında her zaman; hoca slaytlarında yalnız Buğra dışında biri yüklediyse. Uygulamada "Yükleyen: …" olarak görünür.

Seçmeli dersler (ör. TIP253 "Kanser ve Kök Hücre") ortak derstir: `--kurul ortak` (Buğra için "seçmeli" = "ortak ders"; ayrı grup açma).

Ders adları: "Tıbbi Biyoloji ve Genetik", "Biyokimya", "Biyofizik", "Tıp Tarihi", "Biyoistatistik", "Davranış Bilimleri", "ATA 151 · Türk Dili I". Drive'daki "Psikoloji" ve "DavranışBilimleri" klasörleri "Davranış Bilimleri"ne gider (`COURSE_RENAME`, `FOLDER_COURSE`). Yeni ders gelirse Drive klasör adını kullan.

## Drive denetimi
1. Drive'da "Ders Slaytları ve Notlar" klasörünü ve alt klasörlerini (K1/Biyokimya, K2/BiyokimyaSes...) dosya id'leri ve boyutlarıyla listele.
2. `python3 tools/medlock.py known` çıktısında olmayan id'ler yenidir. "Diğer" klasörü ve Claude'un ürettiği özet kopyaları `skip`.
   Ses kaydı dökümleri ("[Ders] Ses Kayıtları" / "...Ses" klasörleri) MedLock'a **eklenmez** (Buğra dersi kendisi dinliyor; dökümler sadece Claude'un not ve konu anlatımı hazırlarken Drive'dan okuduğu kaynaktır). `add-drive` ve `todo` bunları kendiliğinden `skip`'e yazar; yeni döküm gelince önce vurguları çıkar (adım 6). Ses dosyalarının (mp3/m4a) kendisi de eklenmez.
   Videolar (mp4/mov/m4v/webm, Kurul › Ders klasörlerinde): indirme, `add-video` ile bağla (boyut sınırı yok).
3. 10 MB altındaysa Drive connector'ının `download_file_content` aracıyla indir (sonuç JSON: `content` base64), çöz, PDF'e yaz:
   `python3 tools/medlock.py add-drive dosya.pdf --folder K2/Biyokimya --fid <id> --name "<Drive'daki ad>"`
   Tür (yatay = slayt, dikey A4 = not; ad "çıkmış/soru/özet/el" içeriyorsa ona göre), kurul (klasör ya da tarih), ders (klasör), hoca (PDF'teki isim, yoksa dersin bilinen hocası) ve başlık tahmin edilir. Emin değilsen önce `--dry`, gerekirse `--kind/--hoca/--title` ile düzelt.
4. 10 MB üstündeyse `todo <id> --folder ... --name ... --kb ...` ile kaydet ve sahibinden ek olarak iste.
   Taranmış PDF'te yan duran sayfa varsa `fix-rot <id> --dry`, sayfaları gözle doğrula, `--pages` ile düzelt.
5. Kategori denetimi: Drive listesini `[{"id", "name", "folder": "K2/Biyokimya"}]` olarak scratchpad'e yaz, `python3 tools/medlock.py drive-check liste.json`; Drive'da başka kurul/ders klasörüne taşınmış dosyaları gösterir, doğruysa `--fix`.
6. Yeni ses kaydı dökümü (`known`'da olmayan; PDF ya da `mimeType contains 'text/'` ile bulunan `.txt`, klasörü fark etmez): indir, baştan sona oku ve "Ses kaydı vurguları" bölümüne göre hocanın vurguladığı yerleri `vurgu` ile ilgili desteye yaz. Dökümün slayt destesi henüz MedLock'ta yoksa vurgu ekleme, dökümü `skip`'e de yazma (deste gelince sonraki denetimde işlenir). İşleyince (vurgu bulunmasa da) `skip drive:<id>` ve o bölümdeki İşlenenler/Vurgu bulunamayan listesine ekle. Döküm MedLock'a içerik olarak eklenmez.
7. `check`, commit, push. Ne eklendiğini, tahmin edilen hocaları, yükleyenleri ve eklenen vurguları (ders · deste · sayfa) kısaca bildir.

Taranmış (metinsiz) sayfalar Türkçe OCR'dan geçer (tesseract `tur`); arama ve soru–slayt eşleşmesi bunlarda da çalışır.

## Soru yazarken kaynak gösterme
Motor `s` alanını açıklamanın altında "Kaynak: …" olarak zaten gösterir; `e` içine aynı slaytı tekrar yazma. `e`nin sonuna yalnız `s`de olmayan ek kaynağı ekle: slayt (ve sayfası), gerekiyorsa ses kaydı ve çıkmış. Ses kaydı dökümünü kullandıysan dosya ve dakika:saniye yaz (dökümlerde "Konuşmacı 1 (mm:ss)" damgası var), hangi slaytla karşılaştırdığını ve varsa çıkmışı ekle. Uzatma:
`Kaynak: Redoks slayt 14 · Ses: Redoks 1, 37:21 · Çıkmış: Biyokimya K1, s. 4`
Hoca derste "sınavda çıktı / soru olarak gelir" dediyse açıklamaya "Hoca derste sınavda geldiğini söyledi" ekle.

## Ses kaydı vurguları
Drive'da ses kaydı dökümü (Ders › "[Ders] Ses Kayıtları", içinde "Konuşmacı 1 (dk:sn)") olan her derste, dökümü okurken (not, test ya da Drive denetimi) hocanın "önemli, dikkat, mutlaka, sınavda/soru olarak gelir/geldi" dediği yerleri bul, slaytla karşılaştır ve `vurgu` ile o slayt sayfasına yaz (dökümler yapay zekâ çıktısı, bozuk: notu slayttaki doğru ifadeyle yaz, emin olmadığını ekleme). Başka destenin konusuysa (ör. Redoks dersinde tampon sorusu) o destenin sayfasına bağla. Uygulamada slaytın altında "Hoca vurguladı / soru olarak geldi" rozeti, slayt sonunda liste, ders sayfasında sayısı görünür. Dökümler PDF (Biyokimya Ses Kayıtları) ya da UTF-16 `.txt` (`<Konu>_original.txt`, satır başında `dk:sn`; Drive tam metin aramasında çıkmaz, `mimeType contains 'text/'` ile bul). İşlenenler: Redoks 1–2 (redoks, tamponlar), Transkripsiyon, Genetik Kod 1–2, Kültür ve Hastalık. Vurgu bulunamayan ya da okunamayan: Temel Kavramlar, Tanımlayıcı İstatistikler, Cinsellik (yalnız slayt 75 listesinde geçen konu), Davranışın Psikolojik ve Biyolojik Temelleri (slaytı yok), Stigma ve Şiddet (döküm bozuk). `s` alanı yine "Deste adı, slayt N" biçiminde kalır ("Slayta git" bununla çalışır).

## Hata bildirimleri
Sorularda "Hata bildir" düğmesi var; bildirimler profilde (`rep`) birikir, Buğra Ayarlar › Hata bildirimleri › Kopyala ile metni sohbete yapıştırır (test id, soru id ve sırası, neden, not, uygulama hataları). Düzeltme: normal testte `test-dump` → düzelt → `test-load`; çıkmış testinde `build_cx.py --dump/--src`. Cevap anahtarı değiştiyse açıklamada belirt.
Test sonunda "Test yorumu" paneli (zorluk Kolay/Uygun/Zor, hazır seçenekler, not) da `rep`e `k:"fb"`, `qid:"fb:<run>"` olarak yazılır; kopyalanan metinde "Test yorumu" diye çıkar. Yorumlara göre testi düzelt ya da sonraki testlerde dikkate al.
Gelen yorumlar: Kanser ve Kök Hücre vize denemesi ve ön testi "Fazla ayrıntıcı" (13 Kas; vize aynı gün olduğu için test yeniden yazılmadı). Seçmeli ve ortak derslerin testlerinde ana kavramı, ilkeyi ve karşılaştırmayı sor; tek slaytta geçen sayı, ad, oran gibi ayrıntı sorularını az tut.

## Tekrar, sınav öncesi ve final dönemi
Aralıklar 1, 3, 7, 14, 30 gün; yanlışta kutu bir basamak geri iner (sıfırlanmaz), soru ertesi gün gelir. "Tahmin ettim" (testte ve tekrarda doğru cevaptan sonra): yarın yeniden sorulur, aralık uzamaz. Yaklaşan sınavın (7 gün içinde; kurul sonu ya da `sinavlar`) soruları önce gelir; sınavdan önceki 3 gün (`EXW`) o sınavın öğrenilmiş soruları bir kez daha sorulur (son tur, `xr`). Şıklar her seferinde karışır ("hepsi", "I ve II" gibi şıkka dayanan sorular hariç, `NOSHUF`).
`donemler[].final` aralığında Tekrar listesine öğrenilmiş (m=1) sorular bir kez daha gelir (doğruysa yine öğrenilmiş kalır, yanlışsa normal aralıklara döner), ana sayfada "Final dönemi" kartı ve bütün kurullardan "Final denemesi" (#/karma?final=1) çıkar. Uzun SRS aralığı yok. Tarihler belli olunca `final` komutuyla güncelle.

## Müfredat
`d/plan`: geçen yılın (2025–2026) Dönem I ders planı, kurul › ders › konu (her satır bir ders saati) ve kurul saatleri. `python3 tools/medlock.py plan [k2]` her konuyu katalogla karşılaştırır (✓ kaynağı var, · yok; eşleştirme kaba, adlar farklıysa elle bak, ör. Redoks = "Biyolojik Oksidasyon").
- Karma deneme ve kurul denemesinde dersler arası soru dağılımı için ders saatleri yol gösterir; konu içindeki dağılım yine konunun soru çıkarma potansiyeline göredir.
- Bu yıl sıra kayabiliyor (Biyoistatistik ve bazı Psikoloji konuları bu yıl Kurul 2'de). Kurul ataması için dosya tarihi esastır, plan değil.
- Drive denetiminde biten bir kurulda `·` kalan konu varsa (ör. K1 Biyokimya "Vitaminler ve Koenzimler", "Mineraller ve Eser Elementler") Buğra'ya slaytı olup olmadığını sor.

## Çıkmışlar (çözülebilir)
`python3 tools/build_cx.py <bk|tb|bf> [--dry]`: çıkmış sorularını test öğesine (`cx=1`) çevirir; kurul sayfasında "Çıkmışlar" altında listelenir. Sorular şifreli `d/cx/<kod>` içinde; düzenlemek için `--dump x.json` (scratchpad'e, commit etme), düzeltip `--src x.json`.
- İçeriği bu yılın kaynaklarında olmayan sorular `drop:1` ile teste girmez (Buğra'nın kuralı). Biyokimya çıkmışındaki enzim, lipit, karbonhidrat, membran ve protein yönlendirme soruları planda Kurul 2–3 konusu: o slaytlar gelince `drop`u kaldır, `sd`/`sp`/`quote` ekle; başka kurulun sorularıysa ayrı test olarak kur (ör. `bk-k2-cikmis`, SPEC'e ekle).
- Her açıklama: doğru cevap, slayttan alıntı ("Slayta git" çalışsın diye `s` = "Deste adı, slayt N"), çıkmışın asıl sayfası. Cevap anahtarı yanlışsa doğrusunu yaz ve açıklamada belirt.

## Anatomi Latincesi (#/sozluk)
`tools/anatomi.py`: genel anatomi Latincesi (ders kaynağı değil, uygulamada böyle yazıyor; Buğra bunu açıkça istedi): kelimeler (isim/sıfat, kategori, Türkçe anlam ve -in/iyelik biçimleri), örnek terimler (`EX`, Latince + doğru Türkçe adı), dilbilgisi dersleri. `python3 tools/anatomi.py` örneklerin hepsi çözülüyor mu diye bakar.
- Blob `d/<hid("anatomi")>`, katalogda `lat`. `index`/`add-doc` her seferinde yeniden kurar ve slaytlardaki Latince terimleri tarar (`sl`, sayfa dizini `pg`; slayt görünümünde sözlük düğmesi çıkar).
- Anatomi/Histoloji slaytları gelince: slaytta geçen ama çözülemeyen kelimeleri (`anatomi.py` içinde N/A listelerine) ekle; testlerde yine yalnız slayt kaynak olur.
- Eski kök sözlüğü (`kokler.py`, `lex`) "Kökler" sekmesinde durur. Tekrar anahtarları: `lex|<kök>`, `lat|w:<kelime>`, `lat|t:<terim>`.

## Denetim
`MEDLOCK_PASS=... bash tools/check_site.sh` bütün blobları çözer, siteyi yerelde sunar ve telefon/tablet boyutunda giriş, slayt, test ("Slayta git"), sonuç, tekrar ve arama akışını (`tools/e2e.js`) ve geri tuşunu (`tools/back.js`) dener (Playwright gerekir). Çıktılardaki `fails` boş olmalı.

## Astronomican
Eski merkez sayfa (claude.ai artifact) bir prototipti ve artık güncellenmiyor. Yeni test ve notlar sadece MedLock'a eklenir.

## Arayüz notları
- Üst çubukta yol (Tıp › Dönem I › Kurul II › Ders) her parçası düğme gibi, büyük (Buğra küçük bulmuştu); dikey ekranda yol üst satırda ("Tıp" gizli, Dönem ile aynı yere gider), başlık altta üç satıra kadar.
- Alttaki sekme çubuğu (telefon/dikey tablet) slayt, test ve tekrarda da hep görünür; gizleme (Buğra istemiyor). Yatay tablette slayt/testte yalnız yan menü gizlenir. Tek istisna tam ekran (1.3): testte üst çubuktaki düğme, slaytta üst çubukta yakınlaştırmanın solunda (1.3.3, Buğra'nın isteği; eski yüzen düğme kalktı); üst çubuk, alt çubuk, yan menü ve saat şeridi gizlenir, sağ üstte çıkış düğmesi (`.fsx`), geri tuşu da çıkarır (`ovOpen`). Motor iframe'inde `html.mlfs`.
- Çıkmışlar ayrı sayfa (#/cikmis): kurul › ders, her derste çözülebilir test (ilerleme, doğru sayısı) ve orijinal PDF yan yana. Net hiçbir yerde yok: Buğra'nın sınavlarında yanlış doğruyu götürmez. Ana sayfada ve Kütüphane'nin başında girişi var.
- Test motorunda (engine.html) MedLock içindeyken büyük başlık gizli, araç satırı ince; "Başla · N soru" altta sabit. Optik formda başka sorunun satırına dokunmak önce o soruya götürür, işaret yalnız açık sorunun satırında değişir; formun açılıp kapanmasına dokunma (Buğra'nın isteği). 1.3: kapalı optik sol kenarda dikey ortalı sekme (Sonraki düğmesini örtmesin diye); formdaki "Yana sabitle" onu sütun yapar (Solda/Sağda, cihazda `ml.optdock`), sorular kalan alana sığar. Sorunun yanındaki "?" emin değilim işareti (`r.uns`), optikte sarı; soru üstünde Hepsi/Boş/Emin değilim süzgeci (`r.filter`); bitir onayında "Boşlara dön" ve "Emin olmadıklarıma dön"; emin olunmayıp doğru cevaplanan soru ertesi gün tekrara girer. 1.3.2: soru altında işlem alanı (`scrHTML`/`scrMount`): kalem ve fare yazar, parmak kaydırır ("Parmakla da yaz" seçilirse parmak da yazar), silgi (kalemin silgi tuşu da), geri al, temizle; hesaplı sorularda (`isCalc`) kendiliğinden açık; çizimler sessionStorage'da soru başına. `make_engine.py --apply` artık sonraki yamalarla değişmiş eski yamaları atlayıp listeler. Motor değişiklikleri `tools/make_engine.py` içindeki `PATCHES`'te; `--apply` mevcut motora uygular.
- Sonuçtaki "Bakman gereken slaytlar": bir numara desteyi o sayfada açar, destenin bütün işaretli sayfaları vurgulu (`h=4,~7,9`, `~` tahmini); birden çok işaretli sayfada üstte ‹ İşaretli i / n › şeridi (`.hlnav`).
- Slayt görünümünde "açık sayfa" ekranın üst kısmındaki sayfadır (sayaç, işaret, döndürme, adres); en alta inilince son sayfa.
- Geri tuşu (Buğra'nın en çok şikâyet ettiği yer): geçmiş bir yığın (`history.state.d` + sessionStorage `ml.navstack`). Uygulama içi bağlantılar `navTo`'dan geçer: yığında zaten olan ekrana (alt sekmeler, yol) yeni kayıt açmadan geri dönülür; sol üstteki ok geldiğin yer üstteyse geri gider, değilse üst ekrana çıkar (slayta geri inmez). Alt pencereler (`sheet`, `latSheet`) ve testteki slayt paneli `ovOpen`/`ovDone` ile geçmişe kayıt ekler; telefonun geri tuşu önce onları kapatır. Adres değiştirirken `replaceHash` kullan (`history.replaceState`'i doğrudan çağırma). `tools/back.js` bunları dener.
- Cihaz önbelleğinde (`ml-data-1`) güncel olmayan `?v=` blobları `pruneCache` siler; yeni blob yolu eklersen oraya da ekle.
- Arama: tırnak içi ("sodyum pompası") yalnız yan yana geçenleri bulur (ekler serbest); tırnaksız aramada kelimelerin yan yana geçtiği sayfalar öne çıkar. 3'ten az sonuçta kelimelerin ilk 5 harfiyle yeniden arar (kültürünün → kültür). Sonuçlar belgeye göre toplu.
- Alt çubuk (1.2): Ana sayfa · Kütüphane · Tekrar · Ara · Diğer. Diğer yukarı açılan menü (İlerleme, Saat, Düello, Karma, Çıkmışlar, Latince, İşaretler, Ayarlar), `ovOpen` ile; geri tuşu kapatır. Yatay tablette hepsi yan menüde.
- Ana sayfa sırası (1.3.3): kurul kartı (ya da final dönemi kartı) ve Karma/Çıkmışlar/Latince kutuları hep en üstte (Buğra'nın isteği) → hoş geldin (yeni kullanıcı) ya da yeni sürüm notu → sınav puanı kartı (sınav geçince 30 gün, bir kez; `real`) → Bugün kartı (seri, bugünkü soru/süre, yaklaşan sınavlar, tekrar, Kaldığın yer: yarım testler/karma/okumalar en çok 4, Sıradaki okunmamış deste) → senkron önerisi. Kurul kartında sınava kalan gün, okunan deste/çözülen soru, Kurul provası.
- Ders sayfası varsayılan konuya göre: slayt destesi = konu; not/özet `kn` ile, test sorularının ≥%60'ı hangi destedense orada; kalanlar "Birden çok konudan testler", "Diğer notlar", "Çıkmışlar". Ders içi arama başlıkları süzer, slayt/not içinde geçen sayfaları da gösterir.
- Çevrimdışı: kurul sayfasında, Ayarlar › Çevrimdışı'da ve sınava 7 gün kala sınav satırında "İndir" (`data-off`, `bindOff`); önbellekte tamamı varsa "İndirildi", eksik varsa "Güncelle".
- Slayt/not üst çubuğunda "Cihaza indir" (`#dlb`, `docPDF`): sayfa görsellerinden cihazda PDF kurar (döndürülmüş sayfalar döner), İndirilenler'e iner.
- Slayt sonunda "Okudum" (`rd`) ve "Bu desteden 10 soru" (deste testi); sorusu ≥5 olan deste ilk açılınca üstte "Okumadan önce 5 soru?" (ön test). Deste testi karma motoruyla açılır, geri ok desteye döner.
- Karma: kurul seçici; mod karma ekranında seçilir ve motor kapaksız başlar (`CFG.autostart`); zamana karşıda soru başına 1 dk (`perQuestion: 1`). Kurul provası (`#/karma?g=k2&prova=1`): en çok 100 soru, soru sayısı kadar dakika, dersler arası dağılım `kurullar[].saat`'e göre, önce hiç çözülmemişler; prova bağlantısıyla gelinince adres testle değiştirilir (geri tuşu provayı yeniden başlatmaz).
- Saat (#/saat): kronometre, Pomodoro 25/5 (4 turda 15 dk), 50/10, Serbest (mola = çalışmanın beşte biri). Süre zaman damgasından (cihazda `ml.clk`); çalışma süresi profilde `tm[gün][cihaz][ders]` (saniye). Ekran kararmaz (Wake Lock), aşama değişince titreşim, ses yok. Saat çalışırken başka ekranlarda alt çubuğun üstünde sayaç şeridi (`.cc-m`; yatayda yan menüde `.cc-s`); hiçbir düğmeyi örtmez.
  1.4: son dokunuş `LA` (cihazda `ml.la`; uygulama ve test iframe'inde dokunma/kaydırma/tuş, `actListen`). Saat çalışırken son dokunuştan 45 dk (`IDLE_C`) sonrası yazılmaz; dönünce `clkIdle` sayılmayanı `c.pend`'e ayırır ve sorar ("Evet, say" / "Hayır, Saat'i durdur"). Buğra bir gece Saat'i açık unutmuştu (15 sa).
  Kendiliğinden süre (`TRK`, `trkSet`): slayt/not/özet (dersi), test (dersi, karma "Karma"), tekrar ("Tekrar") açıkken iki dokunuş arası en çok 5 dk (`GAP_T`) sayılır; Saat çalışıyorsa sayılmaz (çift sayım olmasın). Dakikada bir `tm`'ye yazılır.
  Düzeltme: profilde `tx[gün] = {at, m: {ders: düşülecek sn}}` (en yeni kazanır; ham `tm` cihazlar arasında max ile birleştiği için doğrudan azaltılamaz). Gösterilen süre `tmC`/`tmTot` (ham − düzeltme); `tm`'yi okuyan her yer bunları kullanmalı. Saat ekranında Bugün › Düzelt ya da haftalık sütuna dokun.
- Düello (#/duello): aynı senkron gist'indeki diğer profiller (`SY.others`): bugün süre ve soru, hafta, seri, ortak seri, haftalık ortak hedef (`dz`, en son değiştirenin değeri). Senkron yoksa açıklama gösterir.
- Test sonucunda zayıf konu (en az 3 cevaplı soru ve %60 altı; sorularının %80'inden azı cevaplanmışsa boşlar sayılmaz) yanında "özetten oku": desteye `kn` ile bağlı özet, yoksa not, yoksa deste; konu adının en çok geçtiği sayfa. Çıkmış açıklamasındaki "Çıkmışın aslı: <PDF adı>, sayfa N" düğme olur.

## Profiller ve senkron
- Her kullanıcının ilerlemesi (tekrar listesi, test sonuçları ve yarım kalan test durumları, işaretler, döndürülmüş sayfalar, ilerleme istatistikleri, hata bildirimleri) cihazda `ml.p.<profil>` anahtarında durur. Uygulama hataları cihazda `ml.errs`.
- Senkron anahtarı (yalnız `gist` yetkili GitHub anahtarı) **repoya ve kataloğa asla konmaz**; her cihazda Ayarlar › Profil › Cihazlar arası senkron'dan girilir ve yalnız o cihazda durur. Profiller "MedLock senkron" adlı gizli gist'te `p-<profil>.txt` olarak, uygulama anahtarıyla AES-GCM şifreli tutulur ve cihazlar arasında birleştirilir (kayıt bazında en yeni kazanır; deneme geçmişi ve günlük sayılar birleşir). Profil kimliği adın kendisidir: her cihazda aynı adı kullanmak gerekir.
- Profil alanları (1.2): `rd` okuma {id: {p, m, ok, at}}, `tm` çalışma süresi (1.4: `tx` düzeltmesi), `dz` ortak hedef, `real` sınav puanları, `qh` soru geçmişi ({n, k, l, d, hh: [[gün, 0/1]]}).
- Sayım: her cevap bir kez (`days`): motorda sayılan soru id'leri `run.mlc`'de; tekrarda aynı oturumda yeniden sorulan sayılmaz. Konu hakimiyeti ve "ilk denemede doğru" yalnız o günün ilk cevabından (`qhRecord`). Seri: en az 1 soru ya da 15 dk çalışma (Saat ya da kendiliğinden sayılan); Pazartesi–Pazar haftasında 1 gün ara serbest (`STREAK_TXT`).
- Senkron: `syncNow` sürerken yeniden çağrılırsa aynı sözü (`SY.p`) döndürür; GitHub istekleri `fetchT` ile 20 sn'de keser. (Eskiden meşgulken hemen dönüyordu ve Düello'nun "senkron bekleniyor" yeniden çizimi sonsuz döngüye girip uygulamayı donduruyordu.) Düello ilk açılışta yalnız bir kez kendiliğinden eşitler (`SY.dt`).
- Denetim betiği api.github.com isteklerini engeller; gerçek senkron verisine dokunmaz.

## Boyut
GitHub Pages sitesi 1 GB'ı geçmemeli. Yatay slaytlar 1100 px WebP q52 (~40 KB/sayfa); dikey A4 sayfalar (not, özet, çıkmış) küçük yazı yüzünden 1800 px q62 (~60–250 KB/sayfa). Ne kadar yer kaldığını izle (`du -sh d`).
Videolar Drive'da durur (`add-video`), yer tutmaz. Yer biterse (~800 MB): Buğra yeni boş bir depo açar (ör. `MedLock-2`) ve Pages'i açar. Bütün Pages siteleri aynı kökte (tixdinakar.github.io) olduğu için uygulama oradaki blobları doğrudan okuyabilir; aynı anahtarla şifrelenir, şifre tek kalır. O zaman katalog öğelerine depo alanı (`r`) eklenip uygulama ve `medlock.py` buna göre güncellenecek. Eski Astronomican depoları kullanılmaz. Video ve ses GitHub'a uygun değil (dosya başına 100 MB sınırı); gerekirse Drive'da durur, MedLock bağlantı verir. Yalnız görselleri yenilemek için `add_doc(..., keep_text=True)` eski OCR metnini korur.
