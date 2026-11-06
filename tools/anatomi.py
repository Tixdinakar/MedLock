"""Anatomi Latincesi: temel kelimeler, çekimler, örnek terimler ve kısa dilbilgisi.

Genel bilgi (Terminologia Anatomica'nın temel kalıpları), ders kaynağı değildir; Claude hazırladı ve uygulamada
bu şekilde belirtilir. Anatomi slaytları geldikçe slaytlarda geçen terimler build() ile ayrıca taranır.

İsim:  (yalın, -in hâli, cins, anlam, kategori, seçenekler)
Sıfat: (biçim, anlam, kategori, seçenekler)  biçim: "longus" | "medialis" | "anterior" | ("dexter","dextra","dextrum") | ("teres","teretis")
seçenekler: s = terim kurarken kullanılan kısa Türkçe, tg/tgp/tp/tpl = Türkçe -in hâli/çoğul -in hâli/iyelik/çoğul (düzensizse),
            np/gp = Latince çoğul/çoğul -in hâli (düzensizse), n = not
"""

CATS = [("yapi", "Yapılar"), ("cik", "Çıkıntı ve kabarıklıklar"), ("gir", "Çukur, oluk ve delikler"), ("bolge", "Vücut bölgeleri"),
        ("kemik", "Kemikler"), ("yon", "Yön ve düzlemler"), ("bicim", "Biçim ve büyüklük"), ("ait", "Bölge sıfatları (-e ait)"),
        ("islev", "Kasın işi"), ("hareket", "Hareketler")]

N = [
    # ---------- yapılar ----------
    ("musculus", "musculi", "m", "kas", "yapi", {}),
    ("nervus", "nervi", "m", "sinir", "yapi", {}),
    ("arteria", "arteriae", "f", "atardamar (arter)", "yapi", {"s": "arter"}),
    ("vena", "venae", "f", "toplardamar (ven)", "yapi", {"s": "ven"}),
    ("os", "ossis", "n", "kemik", "yapi", {"np": "ossa", "gp": "ossium", "n": "“os, oris” (ağız) ile karıştırma"}),
    ("articulatio", "articulationis", "f", "eklem", "yapi", {}),
    ("ligamentum", "ligamenti", "n", "bağ", "yapi", {}),
    ("tendo", "tendinis", "m", "kiriş (tendon)", "yapi", {}),
    ("fascia", "fasciae", "f", "fasya (kası saran bağ doku zarı)", "yapi", {"s": "fasya"}),
    ("bursa", "bursae", "f", "kese (bursa)", "yapi", {"s": "kese"}),
    ("capsula", "capsulae", "f", "kapsül", "yapi", {}),
    ("membrana", "membranae", "f", "zar", "yapi", {}),
    ("cartilago", "cartilaginis", "f", "kıkırdak", "yapi", {}),
    ("discus", "disci", "m", "disk", "yapi", {}),
    ("meniscus", "menisci", "m", "menisküs (hilal biçimli kıkırdak)", "yapi", {"s": "menisküs"}),
    ("septum", "septi", "n", "bölme (septum)", "yapi", {"s": "bölme"}),
    ("ramus", "rami", "m", "dal", "yapi", {"n": "kemikte de “dal” anlamında kullanılır (ramus mandibulae)"}),
    ("plexus", "plexus", "m", "ağ (pleksus)", "yapi", {"s": "ağ"}),
    ("ganglion", "ganglii", "n", "sinir düğümü (gangliyon)", "yapi", {"s": "gangliyon"}),
    ("vas", "vasis", "n", "damar", "yapi", {"np": "vasa", "gp": "vasorum"}),
    ("nodus", "nodi", "m", "düğüm", "yapi", {}),
    ("glandula", "glandulae", "f", "bez", "yapi", {}),
    ("lamina", "laminae", "f", "levha (yaprak)", "yapi", {"s": "levha"}),
    ("sutura", "suturae", "f", "dikiş (sütür)", "yapi", {"s": "sütür"}),
    ("labrum", "labri", "n", "kenar dudağı (labrum)", "yapi", {"s": "labrum"}),
    ("pars", "partis", "f", "kısım (bölüm)", "yapi", {"s": "kısım", "gp": "partium"}),
    ("radix", "radicis", "f", "kök", "yapi", {}),
    ("cortex", "corticis", "m", "kabuk (korteks)", "yapi", {"s": "kabuk"}),
    ("medulla", "medullae", "f", "öz, ilik", "yapi", {"s": "öz"}),
    ("planum", "plani", "n", "düzlem", "yon", {}),
    ("axis", "axis", "m", "eksen", "yon", {"gp": "axium", "n": "2. boyun omurunun adı da axis'tir"}),
    ("regio", "regionis", "f", "bölge", "bolge", {}),
    ("membrum", "membri", "n", "uzuv (ekstremite)", "bolge", {"s": "uzuv"}),
    # ---------- çıkıntı ve kabarıklıklar ----------
    ("processus", "processus", "m", "çıkıntı", "cik", {}),
    ("tuberculum", "tuberculi", "n", "küçük kabarıklık (tüberkül)", "cik", {"s": "tüberkül"}),
    ("tuberositas", "tuberositatis", "f", "pürüzlülük (tüberozite)", "cik", {"s": "pürüzlülük"}),
    ("tuber", "tuberis", "n", "kabarıklık (yumru)", "cik", {"s": "kabarıklık"}),
    ("trochanter", "trochanteris", "m", "trokanter (femurdaki büyük çıkıntı)", "cik", {"s": "trokanter"}),
    ("condylus", "condyli", "m", "kondil (eklem yapan yuvarlak uç)", "cik", {"s": "kondil"}),
    ("epicondylus", "epicondyli", "m", "epikondil (kondil üstündeki çıkıntı)", "cik", {"s": "epikondil"}),
    ("spina", "spinae", "f", "diken; omurga", "cik", {"s": "diken", "n": "erector spinae'de “omurga” anlamında"}),
    ("crista", "cristae", "f", "kabarık kenar (kresta)", "cik", {"s": "kenar"}),
    ("linea", "lineae", "f", "çizgi", "cik", {}),
    ("caput", "capitis", "n", "baş", "cik", {"np": "capita"}),
    ("collum", "colli", "n", "boyun", "cik", {}),
    ("corpus", "corporis", "n", "gövde", "cik", {}),
    ("basis", "basis", "f", "taban", "cik", {"gp": "basium"}),
    ("apex", "apicis", "m", "tepe (uç)", "cik", {"s": "tepe"}),
    ("margo", "marginis", "m", "kenar", "cik", {}),
    ("angulus", "anguli", "m", "açı (köşe)", "cik", {"s": "açı"}),
    ("facies", "faciei", "f", "yüzey; yüz", "cik", {"s": "yüz"}),
    ("eminentia", "eminentiae", "f", "kabartı", "cik", {}),
    ("protuberantia", "protuberantiae", "f", "çıkıntı (tümsek)", "cik", {"s": "tümsek"}),
    ("malleolus", "malleoli", "m", "topuk (malleol; kelime anlamı “küçük çekiç”)", "cik", {"s": "topuk"}),
    ("cornu", "cornus", "n", "boynuz", "cik", {}),
    ("arcus", "arcus", "m", "kemer (yay)", "cik", {"s": "kemer"}),
    ("trochlea", "trochleae", "f", "makara", "cik", {}),
    ("capitulum", "capituli", "n", "küçük baş (kapitulum)", "cik", {"s": "küçük baş"}),
    ("hamulus", "hamuli", "m", "küçük kanca", "cik", {}),
    ("ala", "alae", "f", "kanat", "cik", {}),
    ("olecranon", "olecrani", "n", "olekranon (dirseğin ucu)", "cik", {"s": "olekranon"}),
    # ---------- çukur, oluk ve delikler ----------
    ("fossa", "fossae", "f", "çukur", "gir", {}),
    ("fovea", "foveae", "f", "küçük çukur", "gir", {}),
    ("foramen", "foraminis", "n", "delik", "gir", {}),
    ("incisura", "incisurae", "f", "çentik", "gir", {}),
    ("sulcus", "sulci", "m", "oluk", "gir", {}),
    ("canalis", "canalis", "m", "kanal", "gir", {"gp": "canalium"}),
    ("meatus", "meatus", "m", "yol (kanal)", "gir", {"s": "yol"}),
    ("fissura", "fissurae", "f", "yarık", "gir", {}),
    ("hiatus", "hiatus", "m", "aralık (açıklık)", "gir", {"s": "aralık"}),
    ("sinus", "sinus", "m", "sinüs (boşluk, cep)", "gir", {"s": "sinüs"}),
    ("ductus", "ductus", "m", "kanal (yol)", "gir", {"s": "kanal"}),
    ("cavitas", "cavitatis", "f", "boşluk", "gir", {}),
    ("cavum", "cavi", "n", "boşluk", "gir", {}),
    ("recessus", "recessus", "m", "girinti (cep)", "gir", {"s": "girinti"}),
    ("impressio", "impressionis", "f", "bası izi", "gir", {}),
    ("porus", "pori", "m", "delik (ağız)", "gir", {"s": "delik"}),
    ("orbita", "orbitae", "f", "göz çukuru (orbita)", "gir", {"s": "orbita"}),
    ("acetabulum", "acetabuli", "n", "asetabulum (kalça eklem çukuru; kelime anlamı “sirke kabı”)", "gir", {"s": "asetabulum"}),
    ("sella", "sellae", "f", "eyer", "gir", {}),
    # ---------- vücut bölgeleri ----------
    ("cranium", "cranii", "n", "kafa (kafatası)", "bolge", {"s": "kafa"}),
    ("facies", "faciei", "f", "yüz", "bolge", {"skip_forms": 1}),
    ("frons", "frontis", "f", "alın", "bolge", {"tg": "alnın", "tp": "alnı"}),
    ("occiput", "occipitis", "n", "artkafa", "bolge", {}),
    ("tempus", "temporis", "n", "şakak", "bolge", {"np": "tempora"}),
    ("auris", "auris", "f", "kulak", "bolge", {"gp": "aurium"}),
    ("oculus", "oculi", "m", "göz", "bolge", {}),
    ("nasus", "nasi", "m", "burun", "bolge", {}),
    ("bucca", "buccae", "f", "yanak", "bolge", {}),
    ("mentum", "menti", "n", "çene ucu", "bolge", {}),
    ("lingua", "linguae", "f", "dil", "bolge", {}),
    ("cervix", "cervicis", "f", "boyun", "bolge", {}),
    ("thorax", "thoracis", "m", "göğüs kafesi", "bolge", {"s": "göğüs kafesi", "tp": "göğüs kafesi"}),
    ("pectus", "pectoris", "n", "göğüs", "bolge", {}),
    ("abdomen", "abdominis", "n", "karın", "bolge", {}),
    ("pelvis", "pelvis", "f", "pelvis (leğen)", "bolge", {"s": "pelvis", "gp": "pelvium"}),
    ("dorsum", "dorsi", "n", "sırt; bir yapının arka (üst) yüzü", "bolge", {"s": "sırt"}),
    ("lumbus", "lumbi", "m", "bel", "bolge", {}),
    ("axilla", "axillae", "f", "koltuk altı", "bolge", {"tg": "koltuk altının", "tp": "koltuk altı", "tpl": "koltuk altları"}),
    ("brachium", "brachii", "n", "kol (omuz ile dirsek arası)", "bolge", {"s": "kol"}),
    ("cubitus", "cubiti", "m", "dirsek", "bolge", {}),
    ("antebrachium", "antebrachii", "n", "önkol", "bolge", {}),
    ("carpus", "carpi", "m", "el bileği", "bolge", {"tg": "el bileğinin", "tgp": "el bileklerinin", "tp": "el bileği", "tpl": "el bilekleri"}),
    ("manus", "manus", "f", "el", "bolge", {}),
    ("palma", "palmae", "f", "avuç içi", "bolge", {"tg": "avuç içinin", "tp": "avuç içi", "tpl": "avuç içleri"}),
    ("digitus", "digiti", "m", "parmak", "bolge", {}),
    ("pollex", "pollicis", "m", "el başparmağı", "bolge", {"s": "başparmak", "tg": "başparmağın", "tp": "başparmağı", "tpl": "başparmaklar"}),
    ("index", "indicis", "m", "işaret parmağı", "bolge", {"tg": "işaret parmağının", "tp": "işaret parmağı", "tpl": "işaret parmakları"}),
    ("coxa", "coxae", "f", "kalça", "bolge", {}),
    ("femur", "femoris", "n", "uyluk; uyluk kemiği (femur)", "bolge", {"s": "uyluk", "np": "femora"}),
    ("genu", "genus", "n", "diz", "bolge", {}),
    ("crus", "cruris", "n", "bacak (diz ile ayak bileği arası)", "bolge", {"s": "bacak", "np": "crura"}),
    ("pes", "pedis", "m", "ayak", "bolge", {}),
    ("planta", "plantae", "f", "ayak tabanı", "bolge", {"tg": "ayak tabanının", "tp": "ayak tabanı", "tpl": "ayak tabanları"}),
    ("hallux", "hallucis", "m", "ayak başparmağı", "bolge", {"tg": "ayak başparmağının", "tp": "ayak başparmağı", "tpl": "ayak başparmakları"}),
    ("calx", "calcis", "f", "topuk", "bolge", {}),
    ("inguen", "inguinis", "n", "kasık", "bolge", {}),
    ("mamma", "mammae", "f", "meme", "bolge", {}),
    ("venter", "ventris", "m", "karın; kasın etli orta kısmı", "bolge", {"s": "karın"}),
    # ---------- kemikler ----------
    ("vertebra", "vertebrae", "f", "omur", "kemik", {}),
    ("columna", "columnae", "f", "sütun", "kemik", {"n": "columna vertebralis = omurga"}),
    ("costa", "costae", "f", "kaburga", "kemik", {}),
    ("sternum", "sterni", "n", "göğüs kemiği (sternum)", "kemik", {"s": "sternum"}),
    ("clavicula", "claviculae", "f", "köprücük kemiği (klavikula)", "kemik", {"s": "klavikula"}),
    ("scapula", "scapulae", "f", "kürek kemiği (skapula)", "kemik", {"s": "skapula"}),
    ("humerus", "humeri", "m", "kol kemiği (humerus)", "kemik", {"s": "humerus"}),
    ("radius", "radii", "m", "radius (önkolun başparmak tarafındaki kemiği)", "kemik", {"s": "radius"}),
    ("ulna", "ulnae", "f", "ulna (önkolun serçe parmak tarafındaki kemiği)", "kemik", {"s": "ulna"}),
    ("tibia", "tibiae", "f", "kaval kemiği (tibia)", "kemik", {"s": "tibia"}),
    ("fibula", "fibulae", "f", "kamış kemiği (fibula)", "kemik", {"s": "fibula"}),
    ("patella", "patellae", "f", "diz kapağı (patella)", "kemik", {"s": "patella"}),
    ("talus", "tali", "m", "aşık kemiği (talus)", "kemik", {"s": "talus"}),
    ("calcaneus", "calcanei", "m", "topuk kemiği (kalkaneus)", "kemik", {"s": "kalkaneus"}),
    ("mandibula", "mandibulae", "f", "alt çene kemiği (mandibula)", "kemik", {"s": "mandibula"}),
    ("maxilla", "maxillae", "f", "üst çene kemiği (maksilla)", "kemik", {"s": "maksilla"}),
    ("ilium", "ilii", "n", "ilium (kalça kemiğinin üst kanadı)", "kemik", {"s": "ilium"}),
    ("ischium", "ischii", "n", "oturga kemiği (iskium)", "kemik", {"s": "iskium"}),
    ("pubis", "pubis", "n", "çatı kemiği (pubis)", "kemik", {"s": "pubis", "np": "pubes", "gp": "pubium"}),
    ("sacrum", "sacri", "n", "sakrum", "kemik", {}),
    ("coccyx", "coccygis", "m", "kuyruk sokumu kemiği (koksiks)", "kemik", {"s": "koksiks"}),
    ("atlas", "atlantis", "m", "atlas (1. boyun omuru)", "kemik", {"s": "atlas"}),
    # ---------- kasın işi (-or: yapan) ----------
    ("flexor", "flexoris", "m", "bükücü (fleksör)", "islev", {"s": "bükücü"}),
    ("extensor", "extensoris", "m", "açıcı, germe (ekstansör)", "islev", {"s": "açıcı"}),
    ("abductor", "abductoris", "m", "uzaklaştırıcı (abdüktör)", "islev", {"s": "uzaklaştırıcı"}),
    ("adductor", "adductoris", "m", "yaklaştırıcı (addüktör)", "islev", {"s": "yaklaştırıcı"}),
    ("pronator", "pronatoris", "m", "pronatör (avucu aşağı/arkaya çeviren)", "islev", {"s": "pronatör"}),
    ("supinator", "supinatoris", "m", "supinatör (avucu yukarı/öne çeviren)", "islev", {"s": "supinatör"}),
    ("levator", "levatoris", "m", "kaldırıcı", "islev", {}),
    ("depressor", "depressoris", "m", "indirici", "islev", {}),
    ("rotator", "rotatoris", "m", "döndürücü", "islev", {}),
    ("tensor", "tensoris", "m", "gerici", "islev", {}),
    ("erector", "erectoris", "m", "dikleştirici", "islev", {}),
    ("sphincter", "sphincteris", "m", "büzücü (sfinkter)", "islev", {"s": "büzücü"}),
    ("constrictor", "constrictoris", "m", "daraltıcı", "islev", {}),
    ("dilatator", "dilatatoris", "m", "genişletici", "islev", {}),
    # ---------- hareketler ----------
    ("flexio", "flexionis", "f", "bükme (fleksiyon): iki parça arasındaki açı küçülür", "hareket", {"s": "bükme"}),
    ("extensio", "extensionis", "f", "açma, germe (ekstansiyon): açı büyür", "hareket", {"s": "açma"}),
    ("abductio", "abductionis", "f", "uzaklaştırma (abdüksiyon): orta hattan uzaklaşma", "hareket", {"s": "uzaklaştırma"}),
    ("adductio", "adductionis", "f", "yaklaştırma (addüksiyon): orta hatta yaklaşma", "hareket", {"s": "yaklaştırma"}),
    ("rotatio", "rotationis", "f", "döndürme (rotasyon): kendi ekseni etrafında", "hareket", {"s": "döndürme"}),
    ("circumductio", "circumductionis", "f", "çevirme (sirkümdüksiyon): uzvun koni çizmesi", "hareket", {"s": "çevirme"}),
    ("pronatio", "pronationis", "f", "pronasyon: avuç içinin aşağı/arkaya dönmesi", "hareket", {"s": "pronasyon"}),
    ("supinatio", "supinationis", "f", "supinasyon: avuç içinin yukarı/öne dönmesi", "hareket", {"s": "supinasyon"}),
    ("elevatio", "elevationis", "f", "kaldırma (elevasyon)", "hareket", {"s": "kaldırma"}),
    ("depressio", "depressionis", "f", "indirme (depresyon)", "hareket", {"s": "indirme"}),
    ("protractio", "protractionis", "f", "öne çekme (protraksiyon)", "hareket", {"s": "öne çekme"}),
    ("retractio", "retractionis", "f", "geri çekme (retraksiyon)", "hareket", {"s": "geri çekme"}),
    ("inversio", "inversionis", "f", "içe çevirme (inversiyon): ayak tabanı içe bakar", "hareket", {"s": "içe çevirme"}),
    ("eversio", "eversionis", "f", "dışa çevirme (eversiyon): ayak tabanı dışa bakar", "hareket", {"s": "dışa çevirme"}),
    ("oppositio", "oppositionis", "f", "karşılama (opozisyon): başparmağın diğer parmaklara karşı getirilmesi", "hareket", {"s": "karşılama"}),
]

A = [
    # ---------- yön ve düzlemler ----------
    ("anterior", "ön", "yon", {"n": "zıttı: posterior"}),
    ("posterior", "arka", "yon", {"n": "zıttı: anterior"}),
    ("superior", "üst", "yon", {"n": "zıttı: inferior"}),
    ("inferior", "alt", "yon", {"n": "zıttı: superior"}),
    ("medialis", "medial (orta hatta yakın, iç)", "yon", {"s": "medial", "n": "zıttı: lateralis"}),
    ("lateralis", "lateral (orta hattan uzak, dış yan)", "yon", {"s": "lateral", "n": "zıttı: medialis"}),
    ("intermedius", "ara, ortadaki", "yon", {"s": "ara"}),
    ("medianus", "orta hatta olan", "yon", {"s": "orta"}),
    ("proximalis", "proksimal (gövdeye/başlangıca yakın)", "yon", {"s": "proksimal", "n": "zıttı: distalis; uzuvlarda kullanılır"}),
    ("distalis", "distal (gövdeden/başlangıçtan uzak)", "yon", {"s": "distal", "n": "zıttı: proximalis"}),
    ("superficialis", "yüzeyel", "yon", {"n": "zıttı: profundus"}),
    ("profundus", "derin", "yon", {"n": "zıttı: superficialis"}),
    ("internus", "iç", "yon", {"n": "zıttı: externus"}),
    ("externus", "dış", "yon", {"n": "zıttı: internus"}),
    (("dexter", "dextra", "dextrum"), "sağ", "yon", {}),
    (("sinister", "sinistra", "sinistrum"), "sol", "yon", {}),
    ("ventralis", "ventral (karın tarafı, ön)", "yon", {"s": "ventral"}),
    ("dorsalis", "dorsal (sırt tarafı, arka; elde ve ayakta üst yüz)", "yon", {"s": "dorsal"}),
    ("cranialis", "kranial (kafa tarafı, üst)", "yon", {"s": "kranial"}),
    ("caudalis", "kaudal (kuyruk tarafı, alt)", "yon", {"s": "kaudal"}),
    ("palmaris", "palmar (avuç içi tarafı)", "yon", {"s": "palmar"}),
    ("plantaris", "plantar (ayak tabanı tarafı)", "yon", {"s": "plantar"}),
    ("sagittalis", "sagittal (önden arkaya, ok yönünde)", "yon", {"s": "sagittal"}),
    ("frontalis", "frontal (alına paralel); alına ait", "yon", {"s": "frontal"}),
    ("coronalis", "koronal (frontal düzlemle aynı)", "yon", {"s": "koronal"}),
    ("transversus", "enine", "yon", {}),
    ("transversalis", "enine (transvers)", "yon", {"s": "enine"}),
    ("horizontalis", "yatay", "yon", {}),
    ("centralis", "merkezî", "yon", {}),
    # ---------- biçim ve büyüklük ----------
    ("major", "büyük", "bicim", {"n": "nötr: majus; zıttı: minor"}),
    ("minor", "küçük", "bicim", {"n": "nötr: minus; zıttı: major"}),
    ("magnus", "büyük", "bicim", {}),
    ("maximus", "en büyük", "bicim", {}),
    ("medius", "orta", "bicim", {}),
    ("minimus", "en küçük", "bicim", {}),
    ("longus", "uzun", "bicim", {"n": "zıttı: brevis"}),
    ("brevis", "kısa", "bicim", {"n": "zıttı: longus"}),
    ("longissimus", "en uzun", "bicim", {}),
    ("latissimus", "en geniş", "bicim", {}),
    ("latus", "geniş", "bicim", {"n": "fascia lata = geniş fasya"}),
    (("teres", "teretis"), "yuvarlak", "bicim", {}),
    ("rotundus", "yuvarlak", "bicim", {}),
    ("ovalis", "oval", "bicim", {}),
    ("gracilis", "ince", "bicim", {}),
    ("vastus", "geniş, iri", "bicim", {"s": "geniş"}),
    ("quadratus", "kare (dört köşeli)", "bicim", {"s": "kare"}),
    ("rectus", "düz", "bicim", {}),
    ("obliquus", "eğik", "bicim", {}),
    ("rhomboideus", "eşkenar dörtgen biçimli", "bicim", {}),
    ("deltoideus", "deltoid (Δ harfi biçimli)", "bicim", {"s": "deltoid"}),
    ("trapezius", "trapez (yamuk) biçimli", "bicim", {"s": "trapez"}),
    ("serratus", "testere dişli", "bicim", {}),
    ("orbicularis", "halka biçimli", "bicim", {}),
    (("biceps", "bicipitis"), "iki başlı", "bicim", {}),
    (("triceps", "tricipitis"), "üç başlı", "bicim", {}),
    (("quadriceps", "quadricipitis"), "dört başlı", "bicim", {}),
    ("lumbricalis", "solucan biçimli", "bicim", {}),
    ("communis", "ortak", "bicim", {}),
    ("proprius", "kendine ait, özel", "bicim", {"s": "özel"}),
    ("accessorius", "yardımcı", "bicim", {}),
    ("verus", "gerçek", "bicim", {}),
    ("spurius", "yalancı", "bicim", {}),
    (("fluctuans", "fluctuantis"), "serbest (yüzen)", "bicim", {"s": "serbest"}),
    (("opponens", "opponentis"), "karşılayıcı (başparmağı diğer parmaklara karşı getiren)", "bicim", {"s": "karşılayıcı"}),
    (("asper", "aspera", "asperum"), "pürüzlü", "bicim", {}),
    ("spinosus", "dikensi", "bicim", {}),
    ("cavus", "boş, oyuk", "bicim", {"s": "boş"}),
    ("cruciatus", "çapraz", "bicim", {}),
    ("collateralis", "yan (kollateral)", "bicim", {"s": "yan"}),
    ("anatomicus", "anatomik", "bicim", {}),
    ("chirurgicus", "cerrahi", "bicim", {}),
    ("obturatus", "kapalı (tıkalı)", "bicim", {"s": "kapalı"}),
    ("turcicus", "Türk'e ait", "bicim", {"s": "Türk"}),
    ("semitendinosus", "yarısı kirişli (semitendinöz)", "bicim", {"s": "yarı kirişli"}),
    ("semimembranosus", "yarısı zarsı (semimembranöz)", "bicim", {"s": "yarı zarsı"}),
    ("glenoidalis", "glenoid (sığ çukur biçimli)", "bicim", {"s": "glenoid"}),
    ("coracoideus", "korakoid (karga gagası biçimli)", "bicim", {"s": "korakoid"}),
    ("coronoideus", "koronoid (gaga biçimli)", "bicim", {"s": "koronoid"}),
    ("styloideus", "stiloid (kalem ucu biçimli)", "bicim", {"s": "stiloid"}),
    ("mastoideus", "mastoid (meme biçimli)", "bicim", {"s": "mastoid"}),
    ("pterygoideus", "pterigoid (kanat biçimli)", "bicim", {"s": "pterigoid"}),
    ("hyoideus", "hiyoid (U/Y harfi biçimli)", "bicim", {"s": "hiyoid"}),
    ("sphenoidalis", "sfenoid (kama biçimli)", "bicim", {"s": "sfenoid"}),
    ("ethmoidalis", "etmoid (kalbur biçimli)", "bicim", {"s": "etmoid"}),
    ("soleus", "soleus (pisi balığı biçimli)", "bicim", {"s": "soleus"}),
    ("gastrocnemius", "gastroknemius (bacağın “karnı”, baldır)", "bicim", {"s": "gastroknemius"}),
    ("sartorius", "terziye ait (terzi kası)", "bicim", {"s": "terzi"}),
    # ---------- bölge sıfatları (-e ait) ----------
    ("brachialis", "kola ait (brakiyal)", "ait", {"s": "brakiyal"}),
    ("radialis", "radiusa ait, başparmak tarafı (radial)", "ait", {"s": "radial"}),
    ("ulnaris", "ulnaya ait, serçe parmak tarafı (ulnar)", "ait", {"s": "ulnar"}),
    ("femoralis", "uyluğa/femura ait (femoral)", "ait", {"s": "femoral"}),
    ("tibialis", "tibiaya ait (tibial)", "ait", {"s": "tibial"}),
    ("fibularis", "fibulaya ait (fibular)", "ait", {"s": "fibular", "n": "eski adı peroneus"}),
    ("peroneus", "fibulaya ait (peroneal; fibularis'in eski adı)", "ait", {"s": "peroneal"}),
    ("pectoralis", "göğse ait (pektoral)", "ait", {"s": "göğüs"}),
    ("intercostalis", "kaburgalar arası (interkostal)", "ait", {"s": "interkostal"}),
    ("iliacus", "iliuma ait (iliak)", "ait", {"s": "iliak"}),
    ("ischiadicus", "siyatik (iskiuma ait)", "ait", {"s": "siyatik"}),
    ("popliteus", "diz arkasına ait (popliteal)", "ait", {"s": "popliteal"}),
    ("cubitalis", "dirseğe ait (kubital)", "ait", {"s": "kubital"}),
    ("axillaris", "koltuk altına ait (aksiller)", "ait", {"s": "aksiller"}),
    ("cervicalis", "boyna ait (servikal)", "ait", {"s": "servikal"}),
    ("thoracicus", "göğse ait (torasik)", "ait", {"s": "torasik"}),
    ("lumbalis", "bele ait (lomber)", "ait", {"s": "lomber"}),
    ("sacralis", "sakruma ait (sakral)", "ait", {"s": "sakral"}),
    ("temporalis", "şakağa ait (temporal)", "ait", {"s": "temporal"}),
    ("occipitalis", "artkafaya ait (oksipital)", "ait", {"s": "oksipital"}),
    ("parietalis", "duvara/yan kafaya ait (parietal)", "ait", {"s": "parietal"}),
    ("zygomaticus", "elmacığa ait (zigomatik)", "ait", {"s": "zigomatik"}),
    ("nasalis", "buruna ait (nazal)", "ait", {"s": "nazal"}),
    ("lacrimalis", "gözyaşına ait (lakrimal)", "ait", {"s": "lakrimal"}),
    ("palatinus", "damağa ait (palatin)", "ait", {"s": "palatin"}),
    ("opticus", "görmeye ait (optik)", "ait", {"s": "optik"}),
    ("acusticus", "işitmeye ait (akustik)", "ait", {"s": "akustik"}),
    ("orbitalis", "orbitaya ait (orbital)", "ait", {"s": "orbital"}),
    ("vertebralis", "omura ait (vertebral)", "ait", {"s": "vertebral"}),
    ("intervertebralis", "omurlar arası (intervertebral)", "ait", {"s": "intervertebral"}),
    ("intertubercularis", "tüberküller arası", "ait", {"s": "tüberküller arası"}),
    ("interosseus", "kemikler arası", "ait", {}),
    ("supraspinatus", "spina üstündeki (supraspinatus)", "ait", {"s": "spina üstü"}),
    ("infraspinatus", "spina altındaki (infraspinatus)", "ait", {"s": "spina altı"}),
    ("subscapularis", "skapulanın altındaki/ön yüzündeki", "ait", {"s": "skapula altı"}),
    ("infratemporalis", "şakak altındaki (infratemporal)", "ait", {"s": "infratemporal"}),
    ("pterygopalatinus", "pterigoid çıkıntı ile damak kemiği arasındaki", "ait", {"s": "pterigopalatin"}),
    ("articularis", "ekleme ait (eklem)", "ait", {"s": "eklem"}),
    ("musculocutaneus", "kasa ve deriye ait", "ait", {"s": "kas-deri"}),
    ("gluteus", "kalçaya (kaba ete) ait (gluteal)", "ait", {"s": "gluteal"}),
    ("sternocleidomastoideus", "sternum, klavikula ve mastoid çıkıntıya tutunan", "ait", {"s": "sternokleidomastoid"}),
    ("coracobrachialis", "korakoid çıkıntı ile kola ait", "ait", {"s": "korakobrakiyal"}),
    ("brachioradialis", "kol ile radiusa ait", "ait", {"s": "brakiyoradiyal"}),
    ("abdominalis", "karna ait (abdominal)", "ait", {"s": "abdominal"}),
]

# Ön ve son ekler (birleşik kelimeleri çözmek için)
AFFIX = [
    ("supra-", "üstünde", ["supra"]), ("infra-", "altında", ["infra"]), ("sub-", "altında", ["sub"]), ("super-", "üstünde", ["super"]),
    ("inter-", "arasında", ["inter"]), ("intra-", "içinde", ["intra"]), ("extra-", "dışında", ["extra"]), ("peri-", "çevresinde", ["peri"]),
    ("epi-", "üstünde", ["epi"]), ("hypo-", "altında", ["hypo"]), ("retro-", "arkasında", ["retro"]), ("prae-, pre-", "önünde", ["prae", "pre"]),
    ("post-", "arkasında, sonra", ["post"]), ("trans-", "içinden geçen, öte", ["trans"]), ("circum-", "çevresinde", ["circum"]),
    ("ante-", "önünde", ["ante"]), ("semi-", "yarı", ["semi"]), ("bi-", "iki", ["bi"]), ("tri-", "üç", ["tri"]), ("quadri-", "dört", ["quadri"]),
    ("-oideus, -oidalis", "benzeri, biçimli (Yun. -eidēs)", []), ("-alis, -aris", "-e ait", []), ("-osus", "-li, -ce zengin", []),
    ("-culus, -ulum, -olus, -ellus", "küçük (küçültme eki: tuberculum, capitulum, malleolus)", []),
]

ABBR = {"m": "musculus", "mm": "musculi", "n": "nervus", "nn": "nervi", "a": "arteria", "aa": "arteriae", "v": "vena", "vv": "venae",
        "lig": "ligamentum", "ligg": "ligamenta", "art": "articulatio", "artt": "articulationes", "proc": "processus", "r": "ramus",
        "rr": "rami", "for": "foramen", "tub": "tuberculum", "gl": "glandula", "gll": "glandulae"}

# Örnek terimler: (Latince, Türkçe, grup)
EX = [
    # üst ekstremite kasları
    ("musculus deltoideus", "deltoid kas", "Üst ekstremite kasları"),
    ("musculus trapezius", "trapez kas", "Üst ekstremite kasları"),
    ("musculus latissimus dorsi", "sırtın en geniş kası", "Üst ekstremite kasları"),
    ("musculus levator scapulae", "skapulanın kaldırıcı kası", "Üst ekstremite kasları"),
    ("musculus rhomboideus major", "büyük eşkenar dörtgen kas", "Üst ekstremite kasları"),
    ("musculus rhomboideus minor", "küçük eşkenar dörtgen kas", "Üst ekstremite kasları"),
    ("musculus serratus anterior", "ön testere kas", "Üst ekstremite kasları"),
    ("musculus pectoralis major", "büyük göğüs kası", "Üst ekstremite kasları"),
    ("musculus pectoralis minor", "küçük göğüs kası", "Üst ekstremite kasları"),
    ("musculus supraspinatus", "spina üstü kas", "Üst ekstremite kasları"),
    ("musculus infraspinatus", "spina altı kas", "Üst ekstremite kasları"),
    ("musculus subscapularis", "skapula altı kas", "Üst ekstremite kasları"),
    ("musculus teres major", "büyük yuvarlak kas", "Üst ekstremite kasları"),
    ("musculus teres minor", "küçük yuvarlak kas", "Üst ekstremite kasları"),
    ("musculus biceps brachii", "kolun iki başlı kası", "Üst ekstremite kasları"),
    ("musculus triceps brachii", "kolun üç başlı kası", "Üst ekstremite kasları"),
    ("musculus brachialis", "brakiyal kas (kol kası)", "Üst ekstremite kasları"),
    ("musculus coracobrachialis", "korakobrakiyal kas", "Üst ekstremite kasları"),
    ("musculus brachioradialis", "brakiyoradiyal kas", "Üst ekstremite kasları"),
    ("musculus pronator teres", "yuvarlak pronatör kas", "Üst ekstremite kasları"),
    ("musculus pronator quadratus", "kare pronatör kas", "Üst ekstremite kasları"),
    ("musculus supinator", "supinatör kas", "Üst ekstremite kasları"),
    ("musculus flexor carpi radialis", "el bileğinin radial bükücü kası", "Üst ekstremite kasları"),
    ("musculus flexor carpi ulnaris", "el bileğinin ulnar bükücü kası", "Üst ekstremite kasları"),
    ("musculus palmaris longus", "uzun palmar kas", "Üst ekstremite kasları"),
    ("musculus flexor digitorum superficialis", "parmakların yüzeyel bükücü kası", "Üst ekstremite kasları"),
    ("musculus flexor digitorum profundus", "parmakların derin bükücü kası", "Üst ekstremite kasları"),
    ("musculus flexor pollicis longus", "başparmağın uzun bükücü kası", "Üst ekstremite kasları"),
    ("musculus extensor carpi radialis longus", "el bileğinin uzun radial açıcı kası", "Üst ekstremite kasları"),
    ("musculus extensor carpi radialis brevis", "el bileğinin kısa radial açıcı kası", "Üst ekstremite kasları"),
    ("musculus extensor carpi ulnaris", "el bileğinin ulnar açıcı kası", "Üst ekstremite kasları"),
    ("musculus extensor digitorum", "parmakların açıcı kası", "Üst ekstremite kasları"),
    ("musculus abductor pollicis longus", "başparmağın uzun uzaklaştırıcı kası", "Üst ekstremite kasları"),
    ("musculus extensor pollicis brevis", "başparmağın kısa açıcı kası", "Üst ekstremite kasları"),
    ("musculus extensor pollicis longus", "başparmağın uzun açıcı kası", "Üst ekstremite kasları"),
    ("musculus opponens pollicis", "başparmağın karşılayıcı kası", "Üst ekstremite kasları"),
    ("musculus adductor pollicis", "başparmağın yaklaştırıcı kası", "Üst ekstremite kasları"),
    ("musculi lumbricales", "solucan biçimli kaslar (lumbrikal kaslar)", "Üst ekstremite kasları"),
    ("musculi interossei dorsales", "dorsal kemikler arası kaslar", "Üst ekstremite kasları"),
    # alt ekstremite kasları
    ("musculus gluteus maximus", "en büyük gluteal kas", "Alt ekstremite kasları"),
    ("musculus gluteus medius", "orta gluteal kas", "Alt ekstremite kasları"),
    ("musculus gluteus minimus", "en küçük gluteal kas", "Alt ekstremite kasları"),
    ("musculus tensor fasciae latae", "geniş fasyanın gerici kası", "Alt ekstremite kasları"),
    ("musculus sartorius", "terzi kası", "Alt ekstremite kasları"),
    ("musculus quadriceps femoris", "uyluğun dört başlı kası", "Alt ekstremite kasları"),
    ("musculus rectus femoris", "uyluğun düz kası", "Alt ekstremite kasları"),
    ("musculus vastus lateralis", "lateral geniş kas", "Alt ekstremite kasları"),
    ("musculus vastus medialis", "medial geniş kas", "Alt ekstremite kasları"),
    ("musculus vastus intermedius", "ara geniş kas", "Alt ekstremite kasları"),
    ("musculus gracilis", "ince kas", "Alt ekstremite kasları"),
    ("musculus adductor longus", "uzun yaklaştırıcı kas", "Alt ekstremite kasları"),
    ("musculus adductor brevis", "kısa yaklaştırıcı kas", "Alt ekstremite kasları"),
    ("musculus adductor magnus", "büyük yaklaştırıcı kas", "Alt ekstremite kasları"),
    ("musculus biceps femoris", "uyluğun iki başlı kası", "Alt ekstremite kasları"),
    ("musculus semitendinosus", "semitendinöz kas (yarı kirişli kas)", "Alt ekstremite kasları"),
    ("musculus semimembranosus", "semimembranöz kas (yarı zarsı kas)", "Alt ekstremite kasları"),
    ("musculus tibialis anterior", "ön tibial kas", "Alt ekstremite kasları"),
    ("musculus tibialis posterior", "arka tibial kas", "Alt ekstremite kasları"),
    ("musculus extensor digitorum longus", "parmakların uzun açıcı kası", "Alt ekstremite kasları"),
    ("musculus extensor hallucis longus", "ayak başparmağının uzun açıcı kası", "Alt ekstremite kasları"),
    ("musculus flexor hallucis longus", "ayak başparmağının uzun bükücü kası", "Alt ekstremite kasları"),
    ("musculus fibularis longus", "uzun fibular kas", "Alt ekstremite kasları"),
    ("musculus fibularis brevis", "kısa fibular kas", "Alt ekstremite kasları"),
    ("musculus gastrocnemius", "gastroknemius kası (baldır kası)", "Alt ekstremite kasları"),
    ("musculus soleus", "soleus kası", "Alt ekstremite kasları"),
    # gövde ve boyun
    ("musculus sternocleidomastoideus", "sternokleidomastoid kas", "Gövde ve boyun kasları"),
    ("musculus erector spinae", "omurganın dikleştirici kası", "Gövde ve boyun kasları"),
    ("musculi intercostales externi", "dış interkostal kaslar", "Gövde ve boyun kasları"),
    ("musculi intercostales interni", "iç interkostal kaslar", "Gövde ve boyun kasları"),
    ("musculus obliquus externus abdominis", "karnın dış eğik kası", "Gövde ve boyun kasları"),
    ("musculus obliquus internus abdominis", "karnın iç eğik kası", "Gövde ve boyun kasları"),
    ("musculus transversus abdominis", "karnın enine kası", "Gövde ve boyun kasları"),
    ("musculus rectus abdominis", "karnın düz kası", "Gövde ve boyun kasları"),
    # üst ekstremite kemikleri
    ("caput humeri", "humerus başı", "Üst ekstremite kemikleri"),
    ("collum anatomicum humeri", "humerusun anatomik boynu", "Üst ekstremite kemikleri"),
    ("collum chirurgicum humeri", "humerusun cerrahi boynu", "Üst ekstremite kemikleri"),
    ("tuberculum majus humeri", "humerusun büyük tüberkülü", "Üst ekstremite kemikleri"),
    ("tuberculum minus humeri", "humerusun küçük tüberkülü", "Üst ekstremite kemikleri"),
    ("sulcus intertubercularis", "tüberküller arası oluk", "Üst ekstremite kemikleri"),
    ("epicondylus medialis humeri", "humerusun medial epikondili", "Üst ekstremite kemikleri"),
    ("epicondylus lateralis humeri", "humerusun lateral epikondili", "Üst ekstremite kemikleri"),
    ("fossa olecrani", "olekranon çukuru", "Üst ekstremite kemikleri"),
    ("processus coracoideus", "korakoid çıkıntı", "Üst ekstremite kemikleri"),
    ("spina scapulae", "skapulanın dikeni", "Üst ekstremite kemikleri"),
    ("cavitas glenoidalis", "glenoid boşluk", "Üst ekstremite kemikleri"),
    ("processus coronoideus ulnae", "ulnanın koronoid çıkıntısı", "Üst ekstremite kemikleri"),
    ("processus styloideus radii", "radiusun stiloid çıkıntısı", "Üst ekstremite kemikleri"),
    ("processus styloideus ulnae", "ulnanın stiloid çıkıntısı", "Üst ekstremite kemikleri"),
    ("tuberositas radii", "radiusun pürüzlülüğü", "Üst ekstremite kemikleri"),
    # alt ekstremite kemikleri
    ("caput femoris", "femur başı", "Alt ekstremite kemikleri"),
    ("collum femoris", "femur boynu", "Alt ekstremite kemikleri"),
    ("trochanter major", "büyük trokanter", "Alt ekstremite kemikleri"),
    ("trochanter minor", "küçük trokanter", "Alt ekstremite kemikleri"),
    ("linea aspera", "pürüzlü çizgi", "Alt ekstremite kemikleri"),
    ("condylus medialis femoris", "femurun medial kondili", "Alt ekstremite kemikleri"),
    ("condylus lateralis femoris", "femurun lateral kondili", "Alt ekstremite kemikleri"),
    ("tuberositas tibiae", "tibianın pürüzlülüğü", "Alt ekstremite kemikleri"),
    ("malleolus medialis", "medial topuk (iç topuk)", "Alt ekstremite kemikleri"),
    ("malleolus lateralis", "lateral topuk (dış topuk)", "Alt ekstremite kemikleri"),
    ("crista iliaca", "iliak kenar (kresta)", "Alt ekstremite kemikleri"),
    ("spina iliaca anterior superior", "ön üst iliak diken", "Alt ekstremite kemikleri"),
    ("spina iliaca posterior inferior", "arka alt iliak diken", "Alt ekstremite kemikleri"),
    ("incisura ischiadica major", "büyük siyatik çentik", "Alt ekstremite kemikleri"),
    ("foramen obturatum", "kapalı delik (obturator delik)", "Alt ekstremite kemikleri"),
    # gövde ve kafa kemikleri
    ("corpus vertebrae", "omur gövdesi", "Gövde ve kafa kemikleri"),
    ("arcus vertebrae", "omur kemeri", "Gövde ve kafa kemikleri"),
    ("foramen vertebrale", "omur deliği", "Gövde ve kafa kemikleri"),
    ("foramina intervertebralia", "omurlar arası delikler", "Gövde ve kafa kemikleri"),
    ("processus spinosus", "dikensi çıkıntı", "Gövde ve kafa kemikleri"),
    ("processus transversus", "enine çıkıntı", "Gövde ve kafa kemikleri"),
    ("columna vertebralis", "omurga (omur sütunu)", "Gövde ve kafa kemikleri"),
    ("costae verae", "gerçek kaburgalar", "Gövde ve kafa kemikleri"),
    ("costae spuriae", "yalancı kaburgalar", "Gövde ve kafa kemikleri"),
    ("costae fluctuantes", "serbest (yüzen) kaburgalar", "Gövde ve kafa kemikleri"),
    ("foramen magnum", "büyük delik", "Gövde ve kafa kemikleri"),
    ("processus mastoideus", "mastoid çıkıntı", "Gövde ve kafa kemikleri"),
    ("meatus acusticus externus", "dış kulak yolu", "Gövde ve kafa kemikleri"),
    ("fossa cranii anterior", "ön kafa çukuru", "Gövde ve kafa kemikleri"),
    ("fossa cranii media", "orta kafa çukuru", "Gövde ve kafa kemikleri"),
    ("fossa cranii posterior", "arka kafa çukuru", "Gövde ve kafa kemikleri"),
    ("fossa pterygopalatina", "pterigopalatin çukur", "Gövde ve kafa kemikleri"),
    ("fossa infratemporalis", "infratemporal çukur", "Gövde ve kafa kemikleri"),
    ("sella turcica", "Türk eyeri", "Gövde ve kafa kemikleri"),
    ("canalis opticus", "optik kanal", "Gövde ve kafa kemikleri"),
    ("fissura orbitalis superior", "üst orbita yarığı", "Gövde ve kafa kemikleri"),
    ("foramen ovale", "oval delik", "Gövde ve kafa kemikleri"),
    ("foramen rotundum", "yuvarlak delik", "Gövde ve kafa kemikleri"),
    ("foramen spinosum", "dikensi delik", "Gövde ve kafa kemikleri"),
    ("os temporale", "şakak kemiği", "Gövde ve kafa kemikleri"),
    ("os occipitale", "artkafa kemiği", "Gövde ve kafa kemikleri"),
    ("os frontale", "alın kemiği", "Gövde ve kafa kemikleri"),
    ("os parietale", "yan kafa kemiği", "Gövde ve kafa kemikleri"),
    ("os sphenoidale", "kama kemiği (sfenoid)", "Gövde ve kafa kemikleri"),
    ("os ethmoidale", "kalbur kemiği (etmoid)", "Gövde ve kafa kemikleri"),
    ("os zygomaticum", "elmacık kemiği", "Gövde ve kafa kemikleri"),
    ("os nasale", "burun kemiği", "Gövde ve kafa kemikleri"),
    ("os lacrimale", "gözyaşı kemiği", "Gövde ve kafa kemikleri"),
    ("os palatinum", "damak kemiği", "Gövde ve kafa kemikleri"),
    ("os hyoideum", "dil kemiği (hiyoid)", "Gövde ve kafa kemikleri"),
    # eklem, bağ, sinir, damar, bölge
    ("articulatio humeri", "omuz eklemi", "Eklem, bağ, sinir ve damar"),
    ("articulatio cubiti", "dirsek eklemi", "Eklem, bağ, sinir ve damar"),
    ("articulatio coxae", "kalça eklemi", "Eklem, bağ, sinir ve damar"),
    ("articulatio genus", "diz eklemi", "Eklem, bağ, sinir ve damar"),
    ("ligamentum cruciatum anterius", "ön çapraz bağ", "Eklem, bağ, sinir ve damar"),
    ("ligamentum cruciatum posterius", "arka çapraz bağ", "Eklem, bağ, sinir ve damar"),
    ("ligamentum collaterale tibiale", "tibial yan bağ", "Eklem, bağ, sinir ve damar"),
    ("plexus brachialis", "brakiyal pleksus (kol ağı)", "Eklem, bağ, sinir ve damar"),
    ("nervus medianus", "median sinir", "Eklem, bağ, sinir ve damar"),
    ("nervus ulnaris", "ulnar sinir", "Eklem, bağ, sinir ve damar"),
    ("nervus radialis", "radial sinir", "Eklem, bağ, sinir ve damar"),
    ("nervus musculocutaneus", "kas-deri siniri", "Eklem, bağ, sinir ve damar"),
    ("nervus axillaris", "aksiller sinir", "Eklem, bağ, sinir ve damar"),
    ("nervus ischiadicus", "siyatik sinir", "Eklem, bağ, sinir ve damar"),
    ("nervus femoralis", "femoral sinir", "Eklem, bağ, sinir ve damar"),
    ("arteria brachialis", "brakiyal arter", "Eklem, bağ, sinir ve damar"),
    ("arteria radialis", "radial arter", "Eklem, bağ, sinir ve damar"),
    ("arteria femoralis", "femoral arter", "Eklem, bağ, sinir ve damar"),
    ("vena cava superior", "üst ana toplardamar", "Eklem, bağ, sinir ve damar"),
    ("fossa poplitea", "diz arkası çukuru (popliteal çukur)", "Eklem, bağ, sinir ve damar"),
    ("fossa cubitalis", "dirsek çukuru", "Eklem, bağ, sinir ve damar"),
    ("fossa axillaris", "koltuk altı çukuru", "Eklem, bağ, sinir ve damar"),
    ("membrum superius", "üst ekstremite", "Eklem, bağ, sinir ve damar"),
    ("membrum inferius", "alt ekstremite", "Eklem, bağ, sinir ve damar"),
    ("planum medianum", "orta düzlem", "Eklem, bağ, sinir ve damar"),
]

LESSONS = [
    ("Okuma sırası",
     "<p>Latincede önce <b>asıl isim</b> gelir, onu niteleyenler arkasından sıralanır. Türkçeye çevirirken <b>sondan başa</b> okunur; "
     "“-in” hâlindeki kelime (neyin?) öne alınır.</p>"
     "<p class='lxex'><b>musculus</b> flexor <i>digitorum</i> superficialis<br>kas · bükücü · <i>parmakların</i> · yüzeyel<br>→ <i>parmakların</i> yüzeyel bükücü <b>kası</b></p>"
     "<p class='lxex'><b>tuberculum</b> majus <i>humeri</i><br>tüberkül · büyük · <i>humerusun</i><br>→ <i>humerusun</i> büyük <b>tüberkülü</b></p>"),
    ("Tekil ve çoğul",
     "<p>İsmin sonu, çoğulunu söyler. En sık kalıplar:</p>"
     "<table class='lxt'><tr><th>Tekil</th><th>Çoğul</th><th>Örnek</th></tr>"
     "<tr><td>-a</td><td>-ae</td><td>fossa → fossae, costa → costae</td></tr>"
     "<tr><td>-us</td><td>-i</td><td>musculus → musculi, nervus → nervi</td></tr>"
     "<tr><td>-um</td><td>-a</td><td>ligamentum → ligamenta, tuberculum → tubercula</td></tr>"
     "<tr><td>-en</td><td>-ina</td><td>foramen → foramina</td></tr>"
     "<tr><td>-is</td><td>-es</td><td>canalis → canales</td></tr>"
     "<tr><td>-ex, -ix</td><td>-ices</td><td>apex → apices, cortex → cortices, radix → radices</td></tr>"
     "<tr><td>-us (4. çekim)</td><td>-us</td><td>processus → processus, plexus → plexus</td></tr>"
     "<tr><td>-on</td><td>-a</td><td>ganglion → ganglia</td></tr></table>"
     "<p>Düzensizler: os → ossa (kemikler), caput → capita, corpus → corpora, femur → femora.</p>"),
    ("“-in” hâli (genitif)",
     "<p>“Neyin?” sorusunun cevabı genitif olur. Terimdeki ikinci isim çoğunlukla bu hâldedir.</p>"
     "<table class='lxt'><tr><th>Yalın</th><th>-in hâli</th><th>Örnek</th></tr>"
     "<tr><td>-a</td><td>-ae</td><td>scapula → scapulae (skapulanın): levator scapulae</td></tr>"
     "<tr><td>-us, -um</td><td>-i</td><td>humerus → humeri, brachium → brachii: biceps brachii</td></tr>"
     "<tr><td>3. çekim</td><td>-is</td><td>femur → femoris, pollex → pollicis, abdomen → abdominis</td></tr>"
     "<tr><td>-us (4.), -u</td><td>-us</td><td>genu → genus (dizin): articulatio genus</td></tr>"
     "<tr><td colspan='2'>çoğul: -arum, -orum, -(i)um</td><td>digitus → digitorum (parmakların)</td></tr></table>"
     "<p>flexor carpi radialis: <i>carpi</i> = el bileğinin; flexor digit<b>orum</b>: parmak<b>ların</b> (çoğul).</p>"),
    ("Sıfat uyumu",
     "<p>Sıfat, nitelediği ismin cinsine (eril, dişil, nötr) ve sayısına uyar. Sonu buna göre değişir:</p>"
     "<table class='lxt'><tr><th>Eril</th><th>Dişil</th><th>Nötr</th></tr>"
     "<tr><td>rectus</td><td>recta</td><td>rectum</td></tr>"
     "<tr><td>medialis</td><td>medialis</td><td>mediale</td></tr>"
     "<tr><td>anterior</td><td>anterior</td><td>anterius</td></tr>"
     "<tr><td>major</td><td>major</td><td>majus</td></tr>"
     "<tr><td>minor</td><td>minor</td><td>minus</td></tr></table>"
     "<p>trochanter <b>major</b> (eril) · tuberculum <b>majus</b> (nötr) · fossa cranii <b>anterior</b> (dişil; <i>cranii</i>'ye değil <i>fossa</i>'ya uyar) · "
     "ligamentum cruciatum <b>anterius</b> (nötr). Çoğulda: costae ver<b>ae</b>, musculi interosse<b>i</b> dorsal<b>es</b>, foramina intervertebral<b>ia</b>.</p>"),
    ("Kas adları nasıl kurulur",
     "<p>Kas adı çoğunlukla şu bilgilerden birkaçını taşır:</p><ul>"
     "<li><b>İşi:</b> flexor, extensor, abductor, adductor, pronator, supinator, levator, tensor</li>"
     "<li><b>Biçimi:</b> deltoideus, trapezius, rhomboideus, teres (yuvarlak), quadratus (kare), serratus</li>"
     "<li><b>Baş sayısı:</b> biceps, triceps, quadriceps</li>"
     "<li><b>Büyüklüğü:</b> major/minor, maximus/medius/minimus, longus/brevis, latissimus</li>"
     "<li><b>Lif yönü:</b> rectus (düz), obliquus (eğik), transversus (enine)</li>"
     "<li><b>Yeri:</b> pectoralis, brachialis, tibialis, supraspinatus, intercostalis</li>"
     "<li><b>Tutunduğu yerler:</b> sternocleidomastoideus, coracobrachialis, brachioradialis</li></ul>"
     "<p class='lxex'>musculus extensor carpi radialis longus = el bileğinin (carpi) radius tarafındaki (radialis) uzun (longus) açıcı (extensor) kası</p>"),
    ("Ekler",
     "<ul><li><b>-oideus</b> “benzeri, biçimli”: deltoideus (Δ biçimli), mastoideus (meme biçimli), coracoideus (karga gagası biçimli)</li>"
     "<li><b>-alis, -aris</b> “-e ait”: brachialis (kola ait), ulnaris (ulnaya ait), palmaris (avuç içine ait)</li>"
     "<li><b>-culum, -ulus, -olus</b> küçültme: tuberculum (küçük kabarıklık), capitulum (küçük baş), malleolus (küçük çekiç)</li>"
     "<li><b>supra- / infra-</b> üstünde / altında: supraspinatus, infraspinatus, infratemporalis</li>"
     "<li><b>inter-</b> arasında: intercostalis, intervertebralis, intertubercularis</li>"
     "<li><b>sub-</b> altında: subscapularis · <b>semi-</b> yarı: semitendinosus</li></ul>"),
    ("Kısaltmalar",
     "<table class='lxt'><tr><th>Tekil</th><th>Çoğul</th><th></th></tr>"
     "<tr><td>m.</td><td>mm.</td><td>musculus, musculi</td></tr><tr><td>n.</td><td>nn.</td><td>nervus, nervi</td></tr>"
     "<tr><td>a.</td><td>aa.</td><td>arteria, arteriae</td></tr><tr><td>v.</td><td>vv.</td><td>vena, venae</td></tr>"
     "<tr><td>lig.</td><td>ligg.</td><td>ligamentum, ligamenta</td></tr><tr><td>r.</td><td>rr.</td><td>ramus, rami</td></tr>"
     "<tr><td>art.</td><td>artt.</td><td>articulatio, articulationes</td></tr><tr><td>proc.</td><td></td><td>processus</td></tr></table>"
     "<p>Çözücüye kısaltmayla da yazabilirsin: “m. flexor digitorum profundus”.</p>"),
]


# ---------------- Türkçe çekim (kısa ad üzerinden) ----------------
BACK, FRONT = set("aıou"), set("eiöü")
DROP = {"omuz": "omz", "boyun": "boyn", "burun": "burn", "ağız": "ağz", "göğüs": "göğs", "karın": "karn", "alın": "aln", "beyin": "beyn", "uzuv": "uzv"}


def _lastv(w):
    for c in reversed(w):
        if c in "aıoueiöü":
            return c
    return "e"


def _h4(w):
    return {"a": "ı", "ı": "ı", "o": "u", "u": "u", "e": "i", "i": "i", "ö": "ü", "ü": "ü"}[_lastv(w)]


def _soft(w):
    vowels = sum(c in "aıoueiöü" for c in w)
    if vowels >= 2 and w[-1] in "kçp":
        return w[:-1] + {"k": "ğ", "ç": "c", "p": "b"}[w[-1]]
    return w


def _split(phrase):
    head, _, last = phrase.rpartition(" ")
    return (head + " " if head else ""), last


def tr_gen(phrase):
    pre, w = _split(phrase)
    if w[-1] in "aıoueiöü":
        return pre + w + "n" + _h4(w) + "n"
    st = DROP.get(w) or _soft(w)
    return pre + st + _h4(st) + "n"


def tr_pl(phrase):
    pre, w = _split(phrase)
    return pre + w + ("lar" if _lastv(w) in BACK else "ler")


def tr_pos(phrase):
    pre, w = _split(phrase)
    if w[-1] in "aıoueiöü":
        return pre + w + "s" + _h4(w)
    st = DROP.get(w) or _soft(w)
    return pre + st + _h4(st)


# ---------------- Latince çekim ----------------
def noun_forms(nom, gen, g, o):
    if gen.endswith("ae") and nom.endswith("a"):
        st = nom[:-1]
        f = {"ns": nom, "gs": gen, "np": st + "ae", "gp": st + "arum"}
    elif gen.endswith("ei"):                                  # facies, faciei
        f = {"ns": nom, "gs": gen, "np": nom, "gp": nom[:-2] + "erum"}
    elif gen.endswith("i") and not gen.endswith("is"):
        st = gen[:-1]
        f = {"ns": nom, "gs": gen, "np": st + ("a" if g == "n" else "i"), "gp": st + "orum"}
    elif gen == nom + "s" and nom.endswith("u"):           # genu, genus
        f = {"ns": nom, "gs": gen, "np": nom + "a", "gp": nom + "um"}
    elif gen == nom and nom.endswith("us"):                # processus
        f = {"ns": nom, "gs": gen, "np": nom, "gp": nom[:-2] + "uum"}
    elif gen.endswith("is"):
        st = gen[:-2]
        f = {"ns": nom, "gs": gen, "np": st + ("a" if g == "n" else "es"), "gp": st + "um"}
    else:
        raise ValueError(nom)
    for k in ("np", "gp"):
        if k in o:
            f[k] = o[k]
    return f


def adj_forms(spec):
    """{cins: {hal: biçim}} ve gösterim."""
    if isinstance(spec, tuple) and len(spec) == 3:            # dexter, dextra, dextrum
        m, fe, n = spec
        st = fe[:-1]
        F = {"m": {"ns": m, "gs": st + "i", "np": st + "i", "gp": st + "orum"},
             "f": {"ns": fe, "gs": st + "ae", "np": st + "ae", "gp": st + "arum"},
             "n": {"ns": n, "gs": st + "i", "np": st + "a", "gp": st + "orum"}}
        return m, f"{m}, {fe}, {n}", F
    if isinstance(spec, tuple):                               # teres, teretis
        nom, gen = spec
        st = gen[:-2]
        part = nom.endswith(("ans", "ens"))
        gp = st + ("ium" if part else "um")
        mf = {"ns": nom, "gs": gen, "np": st + "es", "gp": gp}
        return nom, f"{nom}, {gen}", {"m": mf, "f": mf, "n": {"ns": nom, "gs": gen, "np": st + ("ia" if part else "a"), "gp": gp}}
    w = spec
    if w.endswith("us"):
        st = w[:-2]
        F = {"m": {"ns": w, "gs": st + "i", "np": st + "i", "gp": st + "orum"},
             "f": {"ns": st + "a", "gs": st + "ae", "np": st + "ae", "gp": st + "arum"},
             "n": {"ns": st + "um", "gs": st + "i", "np": st + "a", "gp": st + "orum"}}
        return w, f"{w}, {st}a, {st}um", F
    if w.endswith("is"):
        st = w[:-2]
        mf = {"ns": w, "gs": w, "np": st + "es", "gp": st + "ium"}
        return w, f"{w}, {st}e", {"m": mf, "f": mf, "n": {"ns": st + "e", "gs": w, "np": st + "ia", "gp": st + "ium"}}
    if w.endswith(("ior", "jor", "nor")):                     # anterior, major, minor
        n = {"major": "majus", "minor": "minus"}.get(w, w[:-2] + "us")
        mf = {"ns": w, "gs": w + "is", "np": w + "es", "gp": w + "um"}
        return w, f"{w}, {n}", {"m": mf, "f": mf, "n": {"ns": n, "gs": w + "is", "np": w + "a", "gp": w + "um"}}
    raise ValueError(w)


def short(tr, o):
    if o.get("s"):
        return o["s"]
    import re
    return re.split(r"\s*[(;,]", tr)[0].strip()


def build_data():
    """Uygulamanın kullandığı sözlük: W (kelimeler), F (biçim → [[kelime, hal]]), örnekler, dersler."""
    W, F = [], {}

    def add(form, wi, gram):
        F.setdefault(form, [])
        if [wi, gram] not in F[form]:
            F[form].append([wi, gram])
    for nom, gen, g, tr, cat, o in N:
        if o.get("skip_forms"):
            continue
        s = short(tr, o)
        fs = noun_forms(nom, gen, g, o)
        e = {"l": nom, "k": "n", "g": g, "d": f"{nom}, {gen}", "tr": tr, "c": cat, "s": s, "f": fs,
             "tg": o.get("tg") or tr_gen(s), "tpl": o.get("tpl") or tr_pl(s), "tp": o.get("tp") or tr_pos(s)}
        e["tgp"] = o.get("tgp") or tr_gen(e["tpl"])
        if o.get("n"):
            e["n"] = o["n"]
        e["d"] += f" · çoğul {fs['np']}"
        wi = len(W)
        W.append(e)
        for k, v in fs.items():
            add(v, wi, k)
    for spec, tr, cat, o in A:
        lemma, disp, fs = adj_forms(spec)
        e = {"l": lemma, "k": "s", "d": disp, "tr": tr, "c": cat, "s": short(tr, o), "f": fs}
        if o.get("n"):
            e["n"] = o["n"]
        wi = len(W)
        W.append(e)
        for gnd, d in fs.items():
            for k, v in d.items():
                add(v, wi, gnd + k)
    return {"w": W, "f": F, "ab": ABBR, "af": AFFIX, "ex": EX, "ls": LESSONS, "cats": CATS}


def decode_tokens(D, term):
    """Python tarafında doğrulama için: her kelime çözülebiliyor mu?"""
    out = []
    for t in term.lower().replace(".", " ").split():
        t = D["ab"].get(t, t)
        out.append((t, D["f"].get(t)))
    return out


if __name__ == "__main__":
    D = build_data()
    bad = [(lat, t) for lat, tr, g in EX for t, r in decode_tokens(D, lat) if not r]
    print(len(D["w"]), "kelime,", len(D["f"]), "biçim,", len(EX), "örnek")
    print("çözülemeyen:", bad or "yok")
    for lat, tr, g in EX[:3]:
        print(lat, decode_tokens(D, lat))


# ---------------- MedLock blobu ----------------
import re as _re


def scan_slides(V, D):
    """Slayt ve notlarda geçen Latince terimler. Terim = isimle (yalın) başlayan, ardından yalnız sıfat, -in hâlinde isim
    ya da işlev adı (flexor...) gelen, en az iki farklı kelimelik dizi. Kısaltma (m., n., a.) yalnız başta olabilir."""
    F, ab, W = D["f"], D["ab"], D["w"]
    HOMO = {"veri", "ala", "pes", "index"}            # Türkçe/İngilizce metinde sık geçen eş yazımlar
    head_ok = lambda w: any(W[i]["k"] == "n" and g in ("ns", "np") for i, g in F[w])
    # -in hâlindeki isim; "ductus" gibi yalın hâliyle aynı yazılanlar belirsiz olduğu için sayılmaz
    tail_ok = lambda w: any(W[i]["k"] == "s" or W[i]["c"] == "islev" or (g in ("gs", "gp") and w != W[i]["l"]) for i, g in F[w])
    terms, pages = {}, {}
    for it in V.cat["items"]:
        if it["k"] not in ("slayt", "not", "ozet", "cikmis", "soru"):
            continue
        for pi, text in enumerate(V.get_json(f"d/{it['x']}/t"), 1):
            toks, prev = [], 0
            for m in _re.finditer(r"([A-Za-z]+)(\.?)(?=\s|$|[,;:)])", text):
                toks.append((m.group(1).lower(), m.group(2), bool(text[prev:m.start()].strip())))   # araya noktalama girdi mi
                prev = m.end()
            run = []

            def flush():
                if len(run) >= 2 and len(set(run)) == len(run) and max(map(len, run)) >= 5:
                    t = " ".join(run)
                    e = terms.setdefault(t, [0, []])
                    e[0] += 1
                    ref = [it["id"], pi]
                    if ref not in e[1] and len(e[1]) < 8:
                        e[1].append(ref)
                    pages.setdefault(it["id"], {}).setdefault(str(pi), set()).add(t)
                run.clear()
            for w, dot, gap in toks:
                if gap:
                    flush()
                abbr = bool(dot) and w in ab
                w2 = ab[w] if abbr else w
                known = w2 in F and w2 not in HOMO and (len(w2) > 2 or w2 in ("os", "vas"))
                if known and run and not abbr and tail_ok(w2):
                    run.append(w2)
                else:
                    flush()
                    if known and head_ok(w2):
                        run.append(w2)
                if dot and not abbr:
                    flush()
            flush()
    T = sorted(terms, key=lambda t: -terms[t][0])
    idx = {t: i for i, t in enumerate(T)}
    return [[t, terms[t][0], terms[t][1]] for t in T], {k: {p: sorted(idx[t] for t in v) for p, v in d.items()} for k, d in pages.items()}


def build(V):
    import hashlib, json
    D = build_data()
    D["sl"], D["pg"] = scan_slides(V, D)
    x = V.hid("anatomi")
    V.put_json(f"d/{x}", D)
    v = hashlib.sha256(json.dumps(D, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:8]
    V.cat["lat"] = {"x": x, "v": v, "n": len(D["w"]), "e": len(D["ex"]), "sl": len(D["sl"]), "ids": sorted(D["pg"])}
    return len(D["w"]), len(D["sl"])
