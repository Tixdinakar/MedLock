# MedLock: bakım notları (Claude için)

Repo sahibinin (tıp, Dönem 1) kişisel ders arşivi. Sadece o ve bir arkadaşı kullanır.
Cihazlar: Android telefon ve tablet, PC (Chrome tabanlı). iOS/Safari yok; denetimler Chromium'da yeterli.
Site: https://tixdinakar.github.io/MedLock/ (GitHub Pages, `main` dalının kökü).

## Kesin kurallar
- Repo herkese açık. **Şifreyi ve şifresiz içeriği asla commit etme.** Slayt, not, test, katalog: hepsi `d/` altında şifreli durur.
- Şifre sadece `MEDLOCK_PASS` ortam değişkeniyle verilir; hiçbir dosyaya, commit mesajına ya da loga yazılmaz.
- Commit'ten önce `python3 tools/medlock.py check` çalıştır. `check` (ve şifre istemeyen `scan`) izin listesi dışındaki dosyayı, `d/` altında şifresiz görünen ya da bu anahtarla çözülmeyen dosyayı, GitHub anahtarı ve şifre sızıntısını reddeder. Bir şey bulursa: içerik ise `add-doc`/`add-test` ile şifreli ekle, şifresiz kopyayı ve geçici dosyaları sil, sonra yeniden `check`. Kurulumda `git config core.hooksPath tools/hooks` (pre-commit kancası `scan` çalıştırır).
- Arayüz dosyalarını (index.html, app.js, app.css, engine.html, sw.js, manifest) değiştirdikten sonra `python3 tools/medlock.py stamp` çalıştır. Kabuk cihazda önbellekten açılır; uygulama `v.json`'daki `app` ile app.js'teki `APPV`'yi karşılaştırıp kabuğu topluca yeniler. `stamp` ikisini birlikte yazar; `check` uyuşmazlığı yakalar.
- Kullanıcıya görünen sürüm `app.js`'te `VERSION` (1.0 ilk sürüm, 1.1 = 7 Kasım genel güncellemesi). Her arayüz değişikliğinde artır: büyük güncelleme +0.1 (1.1 → 1.2), küçük düzeltme +0.0.1 (1.1.2 → 1.1.3); `CHANGES`'in başına kısa Türkçe not ekle (Buğra'nın anlayacağı dille, kod terimi yok). Ana sayfada her cihazda bir kez "Yeni sürüm" notu çıkar; Ayarlar › Yenilikler'de hepsi durur. `check` VERSION ile ilk notun aynı olduğuna bakar.

## Yapı
- `k.json`: veri anahtarı (DEK), şifreden türetilen anahtarla sarılı (PBKDF2-SHA256 600k + AES-GCM). Şifre değişince sadece bu dosya değişir (`passwd`).
- `d/c`: katalog (gzip JSON, şifreli). Öğeler: id, k (slayt|not|ozet|cikmis|soru|test|kart|video), g (k1..k4|ortak), c (ders), h (hoca), t (başlık), d (tarih), n (sayfa/soru), x (blob klasörü; videoda yok), v (sürüm), src (drive:<fileId>), dq (tarih tahmini), u (yükleyen), dur (video süresi), cx (çıkmıştan test).
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
Kurul tarihleri: k1 07.09–23.10.2026, k2 26.10–25.12.2026, k3 28.12.2026–15.03.2027, k4 16.03–14.05.2027. Dosya adındaki `_YYMMDD_HHMMSS` tarih olarak alınır.
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
python3 tools/medlock.py final 2027-05-24 2027-06-18  # final sınavı tarihleri belli olunca (şimdilik tahmini 15.05–15.07.2027)
python3 tools/medlock.py check && git add -A && git commit && git push
```
`add-doc`/`add-test` soru→slayt bağlantılarını (`refs`) ve arama dizinini kendisi yeniler. Testteki `s` alanı "Ders adı, slayt 12, 14" biçimindeyse sayfa doğrudan alınır; numara yoksa metin benzerliğiyle tahmin edilir ("tahmini" diye gösterilir). Testteki ders adı slayt başlığından farklıysa slayt öğesine `al` (takma ad listesi) ekle: `set <id> al='["Testteki ad"]'`, sonra `refs`.

`--by`: dosyayı yükleyen (Drive'da sahibi). Buğra'nın ve arkadaşının kendi notları, özetleri ve videolarında her zaman; hoca slaytlarında yalnız Buğra dışında biri yüklediyse. Uygulamada "Yükleyen: …" olarak görünür.

Ders adları: "Tıbbi Biyoloji ve Genetik", "Biyokimya", "Biyofizik", "Tıp Tarihi", "Biyoistatistik", "Davranış Bilimleri", "ATA 151 · Türk Dili I". Drive'daki "Psikoloji" ve "DavranışBilimleri" klasörleri "Davranış Bilimleri"ne gider (`COURSE_RENAME`, `FOLDER_COURSE`). Yeni ders gelirse Drive klasör adını kullan.

## Drive denetimi
1. Drive'da "Ders Slaytları ve Notlar" klasörünü ve alt klasörlerini (K1/Biyokimya, K2/BiyokimyaSes...) dosya id'leri ve boyutlarıyla listele.
2. `python3 tools/medlock.py known` çıktısında olmayan id'ler yenidir. "Diğer" klasörü ve Claude'un ürettiği özet kopyaları `skip`.
   Ses kaydı dökümleri ("[Ders] Ses Kayıtları" / "...Ses" klasörleri) MedLock'a **eklenmez** (Buğra dersi kendisi dinliyor; dökümler sadece Claude'un not ve konu anlatımı hazırlarken Drive'dan okuduğu kaynaktır). `add-drive` ve `todo` bunları kendiliğinden `skip`'e yazar. Ses dosyalarının (mp3/m4a) kendisi de eklenmez.
   Videolar (mp4/mov/m4v/webm, Kurul › Ders klasörlerinde): indirme, `add-video` ile bağla (boyut sınırı yok).
3. 10 MB altındaysa Drive connector'ının `download_file_content` aracıyla indir (sonuç JSON: `content` base64), çöz, PDF'e yaz:
   `python3 tools/medlock.py add-drive dosya.pdf --folder K2/Biyokimya --fid <id> --name "<Drive'daki ad>"`
   Tür (yatay = slayt, dikey A4 = not; ad "çıkmış/soru/özet/el" içeriyorsa ona göre), kurul (klasör ya da tarih), ders (klasör), hoca (PDF'teki isim, yoksa dersin bilinen hocası) ve başlık tahmin edilir. Emin değilsen önce `--dry`, gerekirse `--kind/--hoca/--title` ile düzelt.
4. 10 MB üstündeyse `todo <id> --folder ... --name ... --kb ...` ile kaydet ve sahibinden ek olarak iste.
5. `check`, commit, push. Ne eklendiğini, tahmin edilen hocaları ve yükleyenleri kısaca bildir.

Taranmış (metinsiz) sayfalar Türkçe OCR'dan geçer (tesseract `tur`); arama ve soru–slayt eşleşmesi bunlarda da çalışır.

## Soru yazarken kaynak gösterme
Her açıklamanın sonunda tek satır kaynak: slayt (ve sayfası), gerekiyorsa ses kaydı ve çıkmış. Ses kaydı dökümünü kullandıysan dosya ve dakika:saniye yaz (dökümlerde "Konuşmacı 1 (mm:ss)" damgası var), hangi slaytla karşılaştırdığını ve varsa çıkmışı ekle. Uzatma:
`Kaynak: Redoks slayt 14 · Ses: Redoks 1, 37:21 · Çıkmış: Biyokimya K1, s. 4`
Hoca derste "sınavda çıktı / soru olarak gelir" dediyse açıklamaya "Hoca derste sınavda geldiğini söyledi" ekle. `s` alanı yine "Deste adı, slayt N" biçiminde kalır ("Slayta git" bununla çalışır).

## Hata bildirimleri
Sorularda "Hata bildir" düğmesi var; bildirimler profilde (`rep`) birikir, Buğra Ayarlar › Hata bildirimleri › Kopyala ile metni sohbete yapıştırır (test id, soru id ve sırası, neden, not, uygulama hataları). Düzeltme: normal testte `test-dump` → düzelt → `test-load`; çıkmış testinde `build_cx.py --dump/--src`. Cevap anahtarı değiştiyse açıklamada belirt.

## Final dönemi
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
`MEDLOCK_PASS=... bash tools/check_site.sh` bütün blobları çözer, siteyi yerelde sunar ve telefon/tablet boyutunda giriş, slayt, test ("Slayta git"), sonuç, tekrar ve arama akışını dener (Playwright gerekir). Çıktıdaki `fails` boş olmalı.

## Astronomican
Eski merkez sayfa (claude.ai artifact) bir prototipti ve artık güncellenmiyor. Yeni test ve notlar sadece MedLock'a eklenir.

## Arayüz notları
- Üst çubukta yol (Tıp › Dönem I › Kurul II › Ders) her parçası düğme gibi, büyük (Buğra küçük bulmuştu); dikey ekranda yol üst satırda ("Tıp" gizli, Dönem ile aynı yere gider), başlık altta üç satıra kadar.
- Alttaki sekme çubuğu (telefon/dikey tablet) slayt, test ve tekrarda da hep görünür; gizleme (Buğra istemiyor). Yatay tablette slayt/testte yalnız yan menü gizlenir.
- Çıkmışlar ayrı sayfa (#/cikmis): kurul › ders, her derste çözülebilir test (ilerleme, net) ve orijinal PDF yan yana. Ana sayfada ve Kütüphane'nin başında girişi var.
- Test motorunda (engine.html) MedLock içindeyken büyük başlık gizli, araç satırı ince; "Başla · N soru" altta sabit. Optik formda başka sorunun satırına dokunmak önce o soruya götürür, işaret yalnız açık sorunun satırında değişir; formun açılıp kapanmasına dokunma (Buğra'nın isteği). Motor değişiklikleri `tools/make_engine.py` içindeki `PATCHES`'te; `--apply` mevcut motora uygular.
- Slayt görünümünde "açık sayfa" ekranın üst kısmındaki sayfadır (sayaç, işaret, döndürme, adres); en alta inilince son sayfa.
- Geri düğmesi geçmiş derinliğini `history.state.d`'den okur; `replaceState` yaparken `keepState()` ver, yoksa derinlik kaybolur.
- Cihaz önbelleğinde (`ml-data-1`) güncel olmayan `?v=` blobları `pruneCache` siler; yeni blob yolu eklersen oraya da ekle.
- Arama: tırnak içi ("sodyum pompası") yalnız yan yana geçenleri bulur (ekler serbest); tırnaksız aramada kelimelerin yan yana geçtiği sayfalar öne çıkar.

## Profiller ve senkron
- Her kullanıcının ilerlemesi (tekrar listesi, test sonuçları ve yarım kalan test durumları, işaretler, döndürülmüş sayfalar, ilerleme istatistikleri, hata bildirimleri) cihazda `ml.p.<profil>` anahtarında durur. Uygulama hataları cihazda `ml.errs`.
- Senkron anahtarı (yalnız `gist` yetkili GitHub anahtarı) **repoya ve kataloğa asla konmaz**; her cihazda Ayarlar › Profil › Cihazlar arası senkron'dan girilir ve yalnız o cihazda durur. Profiller "MedLock senkron" adlı gizli gist'te `p-<profil>.txt` olarak, uygulama anahtarıyla AES-GCM şifreli tutulur ve cihazlar arasında birleştirilir (kayıt bazında en yeni kazanır; deneme geçmişi ve günlük sayılar birleşir). Profil kimliği adın kendisidir: her cihazda aynı adı kullanmak gerekir.
- Denetim betiği api.github.com isteklerini engeller; gerçek senkron verisine dokunmaz.

## Boyut
GitHub Pages sitesi 1 GB'ı geçmemeli. Yatay slaytlar 1100 px WebP q52 (~40 KB/sayfa); dikey A4 sayfalar (not, özet, çıkmış) küçük yazı yüzünden 1800 px q62 (~60–250 KB/sayfa). Ne kadar yer kaldığını izle (`du -sh d`).
Videolar Drive'da durur (`add-video`), yer tutmaz. Yer biterse (~800 MB): Buğra yeni boş bir depo açar (ör. `MedLock-2`) ve Pages'i açar. Bütün Pages siteleri aynı kökte (tixdinakar.github.io) olduğu için uygulama oradaki blobları doğrudan okuyabilir; aynı anahtarla şifrelenir, şifre tek kalır. O zaman katalog öğelerine depo alanı (`r`) eklenip uygulama ve `medlock.py` buna göre güncellenecek. Eski Astronomican depoları kullanılmaz. Video ve ses GitHub'a uygun değil (dosya başına 100 MB sınırı); gerekirse Drive'da durur, MedLock bağlantı verir. Yalnız görselleri yenilemek için `add_doc(..., keep_text=True)` eski OCR metnini korur.
