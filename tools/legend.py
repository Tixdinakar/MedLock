#!/usr/bin/env python3
"""Notların sonuna "Semboller ve kısaltmalar" sayfası (lejant).

  MEDLOCK_PASS=... python3 tools/legend.py <id> [<id> ...]   # seçili notlar
  MEDLOCK_PASS=... python3 tools/legend.py --all            # bütün not/özetler (makaleler hariç)
  --dry: yalnız ne bulunduğunu yaz;  --html klasör: HTML'leri oraya bırak (gözle bakmak için)

Notun metninde geçen işaretleri ve kısaltmaları aşağıdaki sözlüklerden seçer, A4 sayfa kurar (Playwright),
`medlock.py lejant` ile notun sonuna ekler. Sözlükte olmayan yeni kısaltmayı ABB/CABB'ye, formül harflerini
VARS'a, elle eklenecekleri EXTRA_ABB'ye yaz. Anlamlar notun/dersin kullanımına göre; kaynak dışı ayrıntı yok.
"""
import html, json, os, re, subprocess, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import medlock as M

# Anlamlar notlardaki kullanıma göre; derse göre değişen semboller COURSE_SYM'de.

SYM = {
 "→": "sonuç olarak, yol açar; tepkimede ürüne doğru (A → B: A, B'ye dönüşür)",
 "←": "ters yön; tepkimenin geri yönü",
 "↔": "iki yönlü dönüşüm ya da karşılık (iki şey birbirine denk/karşılaştırılıyor)",
 "⇌": "tersinir tepkime, iki yönde de ilerler (denge)",
 "⇔": "biri doğruysa öbürü de doğru (eşdeğer ifadeler)",
 "⇒": "gerektirir, buradan şu çıkar",
 "↑": "artar, artış",
 "↓": "azalır, azalış",
 "≈": "yaklaşık olarak eşit",
 "~": "yaklaşık (~40 kg: aşağı yukarı 40 kg)",
 "≠": "eşit değil, aynı şey değil",
 "<": "küçüktür", ">": "büyüktür", "≤": "küçük ya da eşit", "≥": "büyük ya da eşit",
 "±": "artı-eksi; bir aralık (ortalama ± SS, pH = pKa ± 1)",
 "×": "çarpı",
 "÷": "bölü",
 "√": "karekök",
 "∞": "sonsuz, süresiz",
 "%": "yüzde", "‰": "binde",
 "°": "derece (sıcaklıkta °C, açıda derece)",
 "²": "kare (üs 2)", "³": "küp (üs 3)",
 "⁺": "artı yük (H⁺) ya da üsde artı işareti",
 "⁻": "eksi yük (OH⁻) ya da üsde eksi (10⁻⁷ = 0,0000001)",
 "₂": "alt simge: moleküldeki atom sayısı (H₂O) ya da sıra/ad (F₁, F₂)",
 "★": "önemli yer, çıkma ihtimali yüksek (hoca vurgusu ya da yıldızlı yer)",
 "✓": "var / evet / doğru", "✗": "yok / hayır / yanlış",
 "·": "çarpma (m·g) ya da aynı satırdaki ayrı bilgileri ayıran işaret",
 "•": "madde imi",
 "Δ": "değişim, fark (son − ilk); ΔG: serbest enerji değişimi",
 "Σ": "toplam",
 "√": "karekök",
}
SUB = set("₀₁₂₃₄₅₆₇₈₉")

# Derse göre Yunan harfleri
COURSE_SYM = {
 "Biyokimya": {
  "α": "1. karbon konumu ya da yapı adı (α-amino asit, α-heliks)",
  "β": "2. karbon konumu ya da yapı adı (β-tabaka, β-alanin, β zinciri)",
  "γ": "3. karbon konumu (γ-glutamil, γ-karboksilasyon)",
  "δ": "4. karbon konumu", "ε": "5. karbon konumu (lizinin ε-amino grubu)",
  "Δ": "değişim (ΔG: serbest enerji değişimi, ΔE: potansiyel farkı, ΔH: entalpi değişimi)",
 },
 "Biyoistatistik": {
  "μ": "evren (kitle) ortalaması", "σ": "evren standart sapması (σ²: varyans)",
  "Σ": "toplam (Σxᵢ: bütün değerlerin toplamı)", "λ": "Poisson dağılımında beklenen ortalama olay sayısı",
  "π": "evren (kitle) oranı", "x̄": "örneklem ortalaması",
 },
 "Biyofizik": {
  "Δ": "değişim (son − ilk)", "ρ": "yoğunluk (kütle / hacim)", "η": "viskozite (akışkanın iç sürtünmesi)",
  "π": "pi sayısı (≈ 3,14)", "θ": "açı", "λ": "dalga boyu", "α": "açı",
  "Γ": "tork (dönme etkisi)",
 },
 "Tıbbi Biyoloji ve Genetik": {
  "α": "alt birim ya da yapı adı (eIF2α, α1-antitripsin)", "β": "alt birim ya da zincir adı (β-globin, β-galaktozidaz)",
  "γ": "γ-karboksilasyon (glutamatın 3. karbonuna)", "ω": "RNA polimeraz alt birimi", "σ": "RNA polimerazın sigma faktörü (promotörü tanır)",
 },
 "Davranış Bilimleri": {"μ": "opioid reseptör tipi (mü)", "δ": "opioid reseptör tipi (delta)", "κ": "opioid reseptör tipi (kappa)"},
 "Kanser ve Kök Hücre": {"α": "integrin alt birimi (α2β1)", "β": "integrin alt birimi (α2β1)"},
}

# Genel kısaltmalar (ders bağımsız)
ABB = {
 "s.": "sayfa ya da slayt numarası", "sl.": "slayt", "SL": "slayt", "ör.": "örneğin", "örn.": "örneğin", "vb.": "ve benzeri",
 "yy.": "yüzyıl", "YY": "yüzyıl", "ark.": "arkadaşları (yazar adından sonra)", "vit.": "vitamin", "inh.": "inhibitör (baskılayıcı)",
  "nom.": "nominativus (yalın hâl)",
 "lig.": "ligamentum (bağ)", "ligg.": "ligamenta (bağlar)", "proc.": "processus (çıkıntı)", 
    
 "PDF": "kaynak dosya (slayt destesi)", "SES": "ses kaydı dökümü (dk:sn ile)",
 "DNA": "deoksiribonükleik asit", "RNA": "ribonükleik asit", "mRNA": "mesajcı RNA", "tRNA": "taşıyıcı RNA", "rRNA": "ribozomal RNA",
 "ATP": "adenozin trifosfat", "ADP": "adenozin difosfat", "AMP": "adenozin monofosfat", "GTP": "guanozin trifosfat",
 "UTP": "üridin trifosfat", "CTP": "sitidin trifosfat", "NTP": "nükleozid trifosfat", "PPi": "pirofosfat (iki fosfat)",
 "NAD": "nikotinamid adenin dinükleotit (NAD⁺ yükseltgen, NADH indirgen)", "NADH": "NAD'ın indirgenmiş hâli",
 "NADP": "nikotinamid adenin dinükleotit fosfat", "NADPH": "NADP'nin indirgenmiş hâli",
 "FAD": "flavin adenin dinükleotit", "FADH2": "FAD'ın indirgenmiş hâli", "FMN": "flavin mononükleotit",
 "CoA": "koenzim A", "ER": "endoplazmik retikulum", "GER": "granüllü endoplazmik retikulum", "UV": "ultraviyole",
 "DSÖ": "Dünya Sağlık Örgütü", "WHO": "Dünya Sağlık Örgütü", "BM": "Birleşmiş Milletler", "TÜİK": "Türkiye İstatistik Kurumu",
 "MS": "milattan sonra", "MÖ": "milattan önce", "SS": "standart sapma", "IQ": "zekâ bölümü",
 "CO2": "karbondioksit", "O2": "oksijen", "H2O": "su", "N2": "azot gazı", "NH3": "amonyak", "NH4": "amonyum iyonu",
 "HCO3": "bikarbonat", "H2CO3": "karbonik asit", "OH": "hidroksil (OH⁻ hidroksit iyonu)", "H3O": "hidronyum iyonu",
 "HCl": "hidroklorik asit", "NaOH": "sodyum hidroksit", "NaCl": "sodyum klorür (tuz)", "H2O2": "hidrojen peroksit",
}

# Derse özel kısaltmalar
CABB = {
 "Biyokimya": {
  "HA": "zayıf asit (Henderson–Hasselbalch'ta)", "AA": "amino asit", "TRH": "tirotropin salgılatıcı hormon (tripeptit)",
  "GSH": "glutatyon (indirgenmiş)", "SDS": "sodyum dodesil sülfat (denatüre eden deterjan)", "SH": "sülfhidril (tiyol) grubu",
  "B5": "B5 vitamini (pantotenik asit)", "B2": "B2 vitamini (riboflavin)", "B6": "B6 vitamini (piridoksin)", "NH": "amin/amid grubu",
  "CO": "karbonil (C=O) grubu", "PO": "fosfat grubu", "HPO": "hidrojen fosfat", "SO": "sülfat grubu", "HCO": "bikarbonat",
  "ADH": "antidiüretik hormon", "ICF": "hücre içi sıvı", "ECF": "hücre dışı sıvı", "CH4": "metan", "H2S": "hidrojen sülfür",
  "CH3COOH": "asetik asit", "CH3COO": "asetat", "H3PO4": "fosforik asit", "H2PO4": "dihidrojen fosfat", "HPO4": "hidrojen fosfat",
  "PO4": "fosfat", "HHb": "deoksihemoglobin", "M1": "ilk molarite", "V1": "ilk hacim", "M2": "son molarite", "V2": "son hacim",
  "M1V1": "seyreltme: ilk molarite × ilk hacim", "M2V2": "son molarite × son hacim", "MA": "molekül ağırlığı",
  "H2SO4": "sülfürik asit", "DF": "seyreltme faktörü", "COO": "karboksilat grubu", "CH3": "metil grubu", "NH2": "amino grubu",
  "VaLİ": "hafıza: Val, Lös, İle (esansiyel amino asitler)", "FeTTi": "hafıza: Phe, Trp, Thr", "MeLiHA": "hafıza: Met, Lys, His, Arg",
  "T4": "tiroksin", "H3N": "amino grubu (protonlu, ⁺H₃N)", "SAM": "S-adenozil metiyonin (metil vericisi)",
  "ES": "enzim–substrat kompleksi", "TPP": "tiamin pirofosfat", "PLP": "piridoksal fosfat", "EC": "enzim sınıf numarası (Enzyme Commission)",
  "COX": "siklooksijenaz", "IC50": "enzimi %50 baskılayan inhibitör derişimi", "LDH": "laktat dehidrojenaz", "LDH1": "LDH'nin kalp izoenzimi",
  "LDH5": "LDH'nin karaciğer/kas izoenzimi", "ALT": "alanin aminotransferaz", "AST": "aspartat aminotransferaz", "CK": "kreatin kinaz",
  "ALP": "alkalen fosfataz", "GGT": "gama-glutamil transferaz", "IM": "kas içi (intramüsküler)", "G6PD": "glukoz-6-fosfat dehidrojenaz",
  "HMG": "HMG-KoA (3-hidroksi-3-metilglutaril-KoA)", "ACE": "anjiyotensin dönüştürücü enzim", "RT": "R × T (gaz sabiti × mutlak sıcaklık)",
  "AEY": "adenilat enerji yükü",  "CN": "siyanür", "G6P": "glukoz-6-fosfat", 
  "AH": "indirgen molekül (H vericisi, AH₂)", "BH": "yükseltgen molekülün H almış hâli (BH₂)", "P450": "sitokrom P450 (oksijenaz)",
   "UAC": "antikodon dizisi", "EF": "uzama faktörü", "NMD": "anlamsız kodon aracılı mRNA yıkımı",
  "SRP": "sinyal tanıma partikülü", "Sec61": "ER zarındaki protein kanalı (translokon)", "UPR": "katlanmamış protein yanıtı",
  "PTM": "posttranslasyonel (translasyon sonrası) modifikasyon", "E1": "ubikitin aktive eden enzim", "E2": "ubikitin taşıyan enzim",
  "E3": "ubikitin ligaz", "HbA1c": "glikasyona uğramış hemoglobin", "UTR": "mRNA'nın çevrilmeyen bölgesi", "CCA": "tRNA'nın 3′ ucundaki dizi",
  "AUG": "başlangıç kodonu (metiyonin)", "GCU": "alanin kodonu", "UUU": "fenilalanin kodonu", "UGA": "durdurma kodonu",
  "UAA": "durdurma kodonu", "UAG": "durdurma kodonu", "pH": "asitlik ölçüsü: −log[H⁺]", "pKa": "asidin yarısının ayrıştığı pH (−log Ka)",
  "pI": "izoelektrik nokta: net yükün sıfır olduğu pH", "pKR": "R grubunun pKa'sı", "Ka": "asit ayrışma sabiti", "Kw": "suyun iyonlaşma sabiti (10⁻¹⁴)",
  "Keq": "denge sabiti", "pOH": "−log[OH⁻]", "Km": "Michaelis sabiti: hızın Vmax'ın yarısı olduğu substrat derişimi", "Vmax": "en büyük tepkime hızı",
  "Ki": "inhibitörün ayrışma sabiti", "kcat": "dönüşüm sayısı (enzimin saniyede çevirdiği substrat)",
 },
 "Biyoistatistik": {
  "Q1": "1. çeyreklik (verinin %25'i altında)", "Q2": "2. çeyreklik = medyan", "Q3": "3. çeyreklik (verinin %75'i altında)",
  "IQR": "çeyrekler arası genişlik (Q3 − Q1)", "VKİ": "vücut kitle indeksi", "BKİ": "beden kitle indeksi", "SKB": "sistolik kan basıncı",
  "CRP": "C-reaktif protein (iltihap göstergesi)", "TB": "tüberküloz", "BG": "Biyoistatistiğe Giriş destesi", "VT": "Veri Türleri ve Kaynakları destesi",
  "TDK": "Türk Dil Kurumu", "DİE": "Devlet İstatistik Enstitüsü (TÜİK'in eski adı)", "YÖK": "Yükseköğretim Kurulu", "ist.": "istatistik",
  "AB": "AB kan grubu", "MG": "mg (miligram)", "DL": "dL (desilitre)", "mg/dL": "desilitrede miligram",
 },
 "Biyofizik": {
  "FR": "bileşke kuvvet", "FQ": "kuadriseps kuvveti", "FP": "patellar tendon kuvveti", "FA": "Aşil tendonu kuvveti", "CG": "ağırlık merkezi",
  "MPa": "megapaskal (10⁶ Pa)", "GPa": "gigapaskal (10⁹ Pa)", "Pa": "paskal (N/m²)", "ACL": "ön çapraz bağ", "PV": "basınç × hacim",
  "TS": "sıcaklık × entropi", "BMR": "bazal metabolizma hızı", "VA": "A noktasındaki potansiyel", "VB": "B noktasındaki potansiyel",
  "NA": "numerik açıklık (merceğin ışık toplama gücü)", "CCD": "dijital kamera görüntü algılayıcısı", "EKG": "elektrokardiyografi",
  "EEG": "elektroensefalografi", "QRS": "EKG'de karıncık depolarizasyon dalgası", "Re": "Reynolds sayısı",
 },
 "Tıbbi Biyoloji ve Genetik": {
  "CpG": "sitozinden hemen sonra guanin gelen dizi (metilasyon yeri)", "MBD": "metil-CpG bağlayan protein", "H1": "bağlayıcı histon",
  "H2A": "çekirdek histon", "H2B": "çekirdek histon", "H3": "çekirdek histon", "H4": "çekirdek histon", "HAT": "histon asetiltransferaz",
  "HDAC": "histon deasetilaz", "DNMT": "DNA metiltransferaz", "MeCP2": "metil-CpG bağlayan protein 2", "TET": "5-metilsitozini oksitleyen enzim",
  "MDS": "miyelodisplastik sendrom", "AML": "akut miyeloid lösemi", "H3K4me3": "histon H3'ün 4. lizininde üç metil (aktif gen işareti)",
  "H3K27me3": "H3'ün 27. lizininde üç metil (baskılayıcı işaret)", "H3K9me3": "H3'ün 9. lizininde üç metil (heterokromatin işareti)",
  "PRC1": "Polycomb baskılayıcı kompleks 1", "PRC2": "Polycomb baskılayıcı kompleks 2", "EZH2": "PRC2'nin metiltransferazı",
  "SWI": "SWI/SNF: ATP bağımlı kromatin yeniden modelleme kompleksi", "SNF": "SWI/SNF: ATP bağımlı kromatin yeniden modelleme kompleksi",
  "TAD": "topolojik ilişkili alan (kromatin döngüsü)", "TF": "transkripsiyon faktörü", "Ago2": "Argonaute 2 (RISC'in kesici proteini)",
  "TNRC6": "RISC'e bağlı yardımcı protein", "UTR": "mRNA'nın çevrilmeyen bölgesi", "MRE": "miRNA yanıt elemanı", "ORF": "açık okuma çerçevesi",
  "uORF": "5′ UTR'deki kısa açık okuma çerçevesi", "ATF4": "streste seçici çevrilen transkripsiyon faktörü", "CPE": "sitoplazmik poliadenilasyon elemanı",
  "TC": "üçlü kompleks (eIF2–GTP–Met-tRNAi)", "IRES": "iç ribozom giriş bölgesi", "RISC": "RNA ile indüklenen susturma kompleksi",
  "BCL11A": "fetal hemoglobini baskılayan gen", "PCSK9": "LDL reseptörünü yıkan protein (siRNA hedefi)", "CRISPR": "gen düzenleme sistemi",
  "XİST": "X kromozomunu susturan lncRNA", "SPEN": "Xist ile çalışan susturucu protein",
  "LacI": "lac represörü", "CAP": "katabolit aktivatör protein", "CRP": "cAMP reseptör proteini (CAP)", "TrpR": "trp represörü",
  "T7": "T7 faj promotörü (ekspresyon vektörü)", "CRISPRi": "CRISPR ile gen susturma (kesmeden)", "QS": "çoğunluk algılama (quorum sensing)",
  "IPTG": "lac operonunu açan yapay indüktör",
  "UTP": "üridin trifosfat", "TBP": "TATA bağlayan protein", "UP": "promotör yukarısındaki AT'den zengin eleman", "AT": "adenin–timin",
  "GC": "guanin–sitozin", "U1": "snRNP (splicing)", "U2": "snRNP (splicing)", "U4": "snRNP (splicing)", "U5": "snRNP (splicing)", "U6": "snRNP (splicing)",
  "SRP": "sinyal tanıma partikülü", "PTM": "posttranslasyonel (translasyon sonrası) modifikasyon", "GPI": "glikozilfosfatidilinozitol (zar çapası)",
  "PiZZ": "α1-antitripsin eksikliğinin ağır genotipi", "PAS": "periyodik asit-Schiff boyası", "KML": "kronik miyeloid lösemi",
  "BCR": "BCR-ABL füzyon geni (KML)", "ABL": "BCR-ABL füzyon geni (KML)", "HER2": "büyüme faktörü reseptörü (meme kanseri)",
  "EGFR": "epidermal büyüme faktörü reseptörü", "DM": "diabetes mellitus", "IRS": "insülin reseptör substratı", "LRRK2": "Parkinson'da kinaz",
  "GSD": "glikojen depo hastalığı", "AGE": "ileri glikasyon son ürünleri", "K48": "ubikitinin 48. lizini (yıkım sinyali)",
  "PDH": "piruvat dehidrojenaz", "FDA": "ABD İlaç Dairesi", "UUU": "fenilalanin kodonu", "AGA": "arginin kodonu", "AGG": "arginin kodonu",
  "UAA": "durdurma kodonu", "UAG": "durdurma kodonu", "UGA": "durdurma kodonu", "GUG": "nadir başlangıç kodonu (valin)",
  "UGG": "triptofan kodonu", "UCU": "serin kodonu", "UCC": "serin kodonu", "UCA": "serin kodonu", "UCG": "serin kodonu",
  "AGU": "serin kodonu", "AGC": "serin kodonu", "TAA": "durdurma kodonu (DNA'da)", "AUU": "izolösin kodonu", "GCU": "alanin kodonu",
  "AUG": "başlangıç kodonu (metiyonin)", "HbA1c": "glikasyona uğramış hemoglobin", "SAM": "S-adenozil metiyonin (metil vericisi)",
  "ROS": "reaktif oksijen türleri", "TT": "timin–timin dimeri", "O6": "O6-metilguanin", "PARP1": "tek zincir kırığını tanıyan enzim",
  "BER": "baz kesip çıkarma onarımı", "APE1": "AP endonükleaz 1", "AP": "bazsız (apürinik/apirimidinik) bölge", "XRCC1": "BER/SSBR yardımcı proteini",
  "NER": "nükleotit kesip çıkarma onarımı", "MMR": "yanlış eşleşme onarımı", "TLS": "hasarın üzerinden sentez (translesion)",
  "HR": "homolog rekombinasyon", "NHEJ": "homolog olmayan uç birleştirme", "MMEJ": "mikrohomoloji aracılı uç birleştirme",
  "SSBR": "tek zincir kırığı onarımı", "MGMT": "O6-metilguanin-DNA metiltransferaz", "TTAGGG": "telomer tekrar dizisi",
 
 },
 "Davranış Bilimleri": {
  "LSD": "lizerjik asit dietilamid (halüsinojen)", "PCP": "fensiklidin", "THC": "tetrahidrokannabinol (esrarın etken maddesi)",
  "K2": "sentetik kannabinoid ('Spice/K2')", "GHB": "gama-hidroksibütirat", "VTA": "ventral tegmental alan (ödül yolu)",
  "CB": "kannabinoid reseptörü", "HT": "5-HT: serotonin", "5-HT": "serotonin", "NMDA": "glutamat reseptör tipi", "GABAA": "GABA-A reseptörü",
  "MDMA": "ekstazi", "AMATEM": "Alkol ve Madde Bağımlılığı Tedavi Merkezi", "TBC": "tüberküloz", "MSS": "merkezi sinir sistemi",
  "MAD": "madde (yönetmelik maddesi)", "CRF": "kortikotropin salgılatıcı faktör", "SDG": "Sürdürülebilir Kalkınma Hedefi (BM)",
  "TSSB": "travma sonrası stres bozukluğu",
  "HPA": "hipotalamus–hipofiz–adrenal (ekseni)", "ACh": "asetilkolin", "GABA": "gama-aminobütirik asit",
 },
 "Kanser ve Kök Hücre": {
  "FBS": "fetal sığır serumu (besiyeri katkısı)", "LN2": "sıvı azot", "KKH": "kanser kök hücresi", "KH": "kök hücre",
  "CD44": "yüzey işaretleyici", "CD24": "yüzey işaretleyici", "CD34": "yüzey işaretleyici (kan kök hücresi)", "CD38": "yüzey işaretleyici",
  "CD133": "yüzey işaretleyici", "CD90": "yüzey işaretleyici", "CD138": "yüzey işaretleyici", "CD2": "yüzey işaretleyici",
  "HepG2": "karaciğer kanseri hücre dizisi", "HT1080": "fibrosarkom hücre dizisi", "BSA": "sığır serum albümini", "OsO4": "osmiyum tetroksit (fiksatif)",
  "MOR": "mor (boyanma rengi)", "G0": "hücre döngüsünün dinlenme evresi", "ABCG2": "ilaç pompası (BCRP)", "BCRP": "meme kanseri direnç proteini (ilaç pompası)",
  "KML": "kronik miyeloid lösemi", "BCR": "BCR-ABL füzyon geni", "ESC": "embriyonik kök hücre", "SSC": "somatik kök hücre",
  "MHC": "doku uygunluk antijenleri", "MSC": "mezenkimal kök hücre", "TIP253": "dersin kodu", "MS": "multipl skleroz",
  "NEAA": "esansiyel olmayan amino asitler", "AACR": "Amerikan Kanser Araştırmaları Derneği", "NANOG": "pluripotensi transkripsiyon faktörü",
  "ER": "endoplazmik retikulum",
 },
 "Ekoloji": {
  "GED": "ders kodu (GED 110)", "E1": "Ekoloji 1. ders PDF'i", "E2": "Ekoloji 2. ders PDF'i", "E3": "Ekoloji 3. ders PDF'i",
  "E4": "Ekoloji 4. ders PDF'i", "E5": "Ekoloji 5. ders PDF'i", "E6": "Ekoloji 6. ders PDF'i", "E7": "Ekoloji 7. ders PDF'i",
  "DDT": "bir böcek ilacı (besin zincirinde birikir)", "JEO": "jeo- (yer, dünya)", "CaCO3": "kalsiyum karbonat", "CO32": "karbonat iyonu (CO₃²⁻)",
  "PO43": "fosfat iyonu (PO₄³⁻)", "NO": "nitrat/nitrit (azot oksitleri)", "NH": "amonyum/amonyak", "IPCC": "BM İklim Değişikliği Paneli",
 },
 "Tıp Tarihi": {
  "IPV": "enjeksiyonla verilen (inaktif) çocuk felci aşısı", "OPV": "ağızdan verilen çocuk felci aşısı", "SSK": "Sosyal Sigortalar Kurumu",
  "BCG": "verem aşısı", "GSS": "Genel Sağlık Sigortası", "İÜ": "İstanbul Üniversitesi", "b.": "bin: Arapça adlarda 'oğlu' (Ali b. İsa)",
 },
 "Anatomi": {
  "LG": "Latinceye Giriş destesi", "Lİ": "Latince İsimler destesi", "LS": "Latince Sıfatlar destesi", "G": "Anatomiye Giriş destesi",
  "T": "Terimler ve Önekler destesi", "BNA": "Basel Nomina Anatomica (1895)", "PNA": "Paris Nomina Anatomica (1955)",
  "IANC": "Uluslararası Anatomik Adlandırma Komitesi", "FCAT": "Uluslararası Anatomik Terminoloji Federatif Komitesi",
  "AVM": "arteriyovenöz malformasyon (akronim örneği)", "LAD": "sol ön inen koroner arter (akronim örneği)",
  "ASD": "atriyal septal defekt (akronim örneği)", "LP": "lomber ponksiyon (akronim örneği)",
  "m.": "musculus (kas)", "M.": "musculus (kas)", "Mm.": "musculi (kaslar)", "A.": "arteria", "Aa.": "arteriae", "N.": "nervus", "Nn.": "nervi",
  "R.": "ramus (dal)", "Rr.": "rami (dallar)", "Art.": "articulatio (eklem)",
 },
}


# ---------- notlara özel: formüllerdeki harfler, LaTeX yazımı, elle eklenen kısaltmalar ----------
LATEX = {
 r"\frac{a}{b}": "kesir: a / b", r"\cdot": "çarpı (·)", r"\times": "çarpı (×)", "x^2, r^4": "üs: x², r⁴",
 "P_0, f_o": "alt simge: P₀, f₀", r"\text{…}": "düz yazı (birim ya da ad); formülün parçası değil",
 r"\rho": "ρ (ro)", r"\eta": "η (eta)", r"\Delta": "Δ (delta)", r"\pi": "π (pi ≈ 3,14)", r"\lambda": "λ (lambda)",
 r"\mu": "μ (mü; μm = mikrometre)", r"\theta": "θ (teta, açı)", r"\alpha": "α (alfa, açı)", r"\sin": "sinüs",
 r"\approx": "≈ yaklaşık", r"\ge": "≥ büyük ya da eşit", r"\circ": "° derece", r"\quad": "boşluk (anlamı yok)", r"\min": "en küçük",
}
LATEX_IN = {
 "akiskanlar-formul-ozeti": [r"\frac{a}{b}", r"\cdot", r"\times", "x^2, r^4", "P_0, f_o", r"\text{…}", r"\rho", r"\eta", r"\Delta", r"\pi"],
 "optik-yapay-zeka-notu": [r"\frac{a}{b}", r"\cdot", r"\times", "x^2, r^4", "P_0, f_o", r"\text{…}", r"\lambda", r"\mu", r"\theta", r"\alpha", r"\sin", r"\approx", r"\ge", r"\circ", r"\quad", r"\min"],
 "ekg-ve-eeg": [r"\mu"],
}

VARS = {
 "akiskanlar-formul-ozeti": [("ρ", "yoğunluk (kg/m³)"), ("m · V", "kütle · hacim"), ("W", "ağırlık"), ("g", "yerçekimi ivmesi"),
  ("P", "basınç (Pa = N/m²); Laplace'ta küresel yapının iç basıncı"), ("P₀", "dış hava (atmosfer) basıncı"), ("h", "derinlik / yükseklik"),
  ("F · A", "kuvvet · alan"), ("Q", "debi (birim zamanda geçen hacim)"), ("v", "akış hızı"), ("r", "yarıçap"), ("ΔP", "iki uç arasındaki basınç farkı"),
  ("η", "viskozite"), ("L", "damar (boru) uzunluğu"), ("Re", "Reynolds sayısı (<2000 laminer, >3000 türbülanslı)"), ("d", "damar çapı"),
  ("T", "yüzey gerilimi")],
 "optik-yapay-zeka-notu": [("E", "foton enerjisi"), ("h", "Planck sabiti"), ("f", "frekans; mercek bölümlerinde odak uzaklığı"), ("c", "ışık hızı (≈ 3×10⁸ m/s)"),
  ("λ", "dalga boyu"), ("n", "kırılma indisi (c / v)"), ("v", "ışığın ortamdaki hızı"), ("p · q", "nesne · görüntü uzaklığı"),
  ("P", "merceğin gücü (diyoptri = 1/f, f metre)"), ("m₀ · mₑ", "objektif · oküler büyütmesi"), ("M", "toplam büyütme (m₀ × mₑ)"),
  ("L", "mercekler arası mesafe"), ("D", "okülerde 25 cm (yakın nokta); F-sayısında açıklık çapı"), ("NA", "numerik açıklık (n · sin α)"),
  ("α", "kabul açısının yarısı"), ("θ", "açı"), ("F", "F-sayısı (f / D)")],
 "elektrik-potansiyel-ve-dipol-notu": [("q", "yük"), ("V", "elektrik potansiyeli (volt)"), ("ΔV", "potansiyel farkı (V_B − V_A)"),
  ("U · ΔU", "potansiyel enerji · değişimi"), ("kₑ", "Coulomb sabiti"), ("r · r₁₂", "uzaklık · iki yük arası uzaklık"), ("E", "elektrik alan"),
  ("d", "A ile B arası mesafe"), ("p", "dipol momenti (yük × mesafe; negatiften pozitife)"), ("θ", "dipol ekseni ile nokta arasındaki açı"),
  ("Γ", "dipole etki eden tork (p × E)")],
 "ozet-isi-termodinamik": [("Q · ΔQ", "ısı · sisteme verilen ısı"), ("U · ΔU", "iç enerji · değişimi"), ("W · ΔW", "iş · sistemin yaptığı iş"),
  ("P", "basınç"), ("V", "hacim"), ("T", "mutlak sıcaklık (K)"), ("H", "entalpi (sabit basınçta Q = ΔH)"), ("S", "entropi"),
  ("Qᵣ", "tersinir süreçte aktarılan ısı"), ("G", "Gibbs serbest enerjisi (G = U + PV − TS)"), ("F", "Helmholtz serbest enerjisi"),
  ("n", "mol sayısı"), ("μ · cᵢ · φ", "kimyasal potansiyel · derişim · elektrik potansiyeli (yoğun değişkenler)"), ("ρ", "yoğunluk")],
 "ozet-termodinamik": [("E · ΔE", "enerji · değişimi (ürün − reaktan)"), ("H · ΔH", "entalpi · değişimi"), ("S · ΔS", "entropi · değişimi"),
  ("G · ΔG", "serbest enerji · değişimi (<0 kendiliğinden)"), ("ΔG°'", "standart serbest enerji değişimi (pH 7, 1 M)"), ("T", "mutlak sıcaklık (K)"),
  ("K'eq", "denge sabiti"), ("[A] [B] [C] [D]", "derişimler"), ("R", "gaz sabiti"), ("n", "taşınan elektron sayısı"), ("F", "Faraday sabiti"),
  ("cal · J", "kalori · joule (1 cal = 4,184 J)")],
 "ozet-redoks-tepkimeleri": [("E", "redoks potansiyeli"), ("E°", "standart redoks potansiyeli (yüksekse kuvvetli yükseltgen)"),
  ("ΔE", "iki çift arasındaki potansiyel farkı"), ("ΔG", "serbest enerji değişimi (−nFΔE)"), ("n", "taşınan elektron sayısı"),
  ("F", "Faraday sabiti (96 480)"), ("R", "gaz sabiti (8,315 J/(mol·K))"), ("T", "mutlak sıcaklık (K)"), ("[ ]", "derişim"),
  ("AH₂ · B", "H vericisi (indirgen) · H alıcısı (yükseltgen)")],
 "redoks-el-notu": [("E · E°", "redoks potansiyeli · standart değeri"), ("n", "taşınan elektron sayısı"), ("ΔG = −nFΔE", "serbest enerji değişimi; F Faraday sabiti"),
  ("R", "molekülün geri kalanı (şekillerde)")],
 "ozet-enzimler": [("E · S · P", "enzim · substrat · ürün"), ("I", "inhibitör"), ("v₀", "başlangıç hızı"), ("Vmax", "en büyük hız"),
  ("Km", "hızın Vmax/2 olduğu [S]"), ("kcat", "dönüşüm sayısı"), ("k₁ · k₋₁", "bağlanma · ayrılma hız sabitleri"), ("Ki", "inhibitör sabiti"),
  ("Km,app", "inhibitör varken görünen Km"), ("ΔG‡", "aktivasyon enerjisi"), ("U · katal", "enzim ünitesi (1 µmol/dk) · SI birimi (1 mol/s)")],
 "ozet-biyomekanik": [("F", "kuvvet"), ("m", "kütle"), ("a", "ivme"), ("W", "ağırlık (m·g)"), ("g", "yerçekimi ivmesi"), ("N", "yüzeyin tepki (normal) kuvveti"),
  ("μs · μk", "statik · kinetik sürtünme katsayısı"), ("fs · fmax · fk", "statik · en büyük statik · kinetik sürtünme kuvveti"),
  ("A · B", "vektörler"), ("Ax · Ay", "vektörün yatay · dikey bileşeni"), ("θ", "açı"), ("ΣF · Στ", "kuvvetlerin · torkların toplamı (dengede 0)"),
  ("τ", "tork (r · F)"), ("r · d", "kuvvet kolu (dönme noktasına uzaklık)")],
 "ozet-doku-mekanik": [("σ", "gerilme (F / A)"), ("ε, ϵ", "gerinim (Δl / l)"), ("E", "Young (esneklik) modülü"), ("τ", "kesme gerilmesi"),
  ("γ", "kayma gerinimi"), ("G", "kayma modülü"), ("F", "kuvvet"), ("A", "kesit alanı"), ("l · l₀ · Δl", "boy · ilk boy · uzama"),
  ("k", "yay sabiti (E·A/l)"), ("σB · ϵB", "kopma (kırılma) noktasındaki gerilme · gerinim"), ("ϵ'", "gerinim hızı (yükleme hızı)")],
 "ozet-tanimlayici": [("x̄ · μ", "örneklem · evren ortalaması"), ("xᵢ", "tek tek gözlemler"), ("n", "gözlem sayısı"), ("Σ", "toplam"),
  ("s² · s", "varyans · standart sapma"), ("R", "dağılım genişliği (Xmax − Xmin)"), ("Q1 · Q2 · Q3", "çeyreklikler (Q2 = medyan)")],
 "ozet-frekans": [("f", "frekans (sayı)"), ("n", "toplam gözlem"), ("p", "oran (f / n)"), ("k", "sınıf sayısı (1 + 3,322·log n)")],
 "ozet-olasilik": [("P(A)", "A olayının olasılığı"), ("p · q", "başarı · başarısızlık olasılığı (q = 1 − p)"), ("n", "deneme sayısı"),
  ("x", "başarı (olay) sayısı"), ("C(n, x)", "n içinden x seçme sayısı (kombinasyon)"), ("E(X) · Var(X)", "beklenen değer · varyans"),
  ("λ", "Poisson: beklenen ortalama olay sayısı"), ("e", "doğal logaritma tabanı (≈ 2,718)"), ("x!", "faktöriyel (x·(x−1)···1)"),
  ("μ · σ · σ²", "ortalama · standart sapma · varyans"), ("Z", "standart skor ((X − μ) / σ)")],
 "ozet-nufus": [("Σ YÖDH", "yaşa özel doğurganlık hızlarının toplamı")],
 "biyokimya-sinav-notlari": [("M", "molarite (mol / L)"), ("m", "molalite (mol / kg çözücü)"), ("N", "normalite (n × M)"), ("n", "verilen H⁺ ya da OH⁻ sayısı"),
  ("z", "tesir değerliği"), ("d", "yoğunluk"), ("R", "amino asidin yan zinciri"), ("[ ]", "derişim"), ("[A⁻] · [HA]", "konjuge baz (tuz) · zayıf asit")],
 "biyokimya-konu-anlatimi": [("M · m · N", "molarite · molalite · normalite"), ("n", "verilen H⁺ ya da OH⁻ sayısı"), ("M₁V₁ = M₂V₂", "seyreltme: ilk ve son derişim × hacim"),
  ("R", "amino asidin yan zinciri"), ("[A⁻] · [HA]", "konjuge baz · zayıf asit")],
}

EXTRA_ABB = {
 "kromozom-yapisi-ve-topoizomerazlar-notu": [("TTAGGG", "telomer tekrar dizisi"), ("+ yüklü", "pozitif yüklü (histonlar)"), ("DNA", "deoksiribonükleik asit")],
 "ekg-ve-eeg": [("mV", "milivolt (EKG sinyali)"), ("μV", "mikrovolt (EEG sinyali)"), ("P · T", "EKG'de kulakçık depolarizasyonu · karıncık repolarizasyonu dalgası")],
 "stres-el-notu": [("Faz 1–3", "Genel Adaptasyon Sendromu evreleri: alarm, direnç, tükenme")],
}
DROP_ABB = {"MOR", "HT", "AB", "YY", "MG", "DL", "SES", "PDF"}

def scan(i, c, flat):
    cs = COURSE_SYM.get(c, {})
    sym = {}
    for ch, m in cs.items():
        if ch in flat: sym[ch] = m
    for ch, m in SYM.items():
        if ch in sym: continue
        if ch == "₂":
            if any(x in flat for x in "₀₁₂₃₄₅₆₇₈₉"): sym["H₂O, F₁"] = m
            continue
        if ch in ("<", ">", "%", "°", "•", "·", "×"):
            continue  # herkesin bildiği; yalnız gerekirse
        if ch in flat: sym[ch] = m
    D = dict(ABB); D.update(CABB.get(c, {}))
    abb = {}
    for k, m in D.items():
        if k.endswith("."):
            if re.search(r"(?<![\wçğıöşüÇĞİÖŞÜ])" + re.escape(k), flat): abb[k] = m
            continue
        if len(k) == 1:
            continue
        if re.search(r"(?<![\wçğıöşüÇĞİÖŞÜ])" + re.escape(k) + r"(?![\wçğıöşüÇĞİÖŞÜ])", flat): abb[k] = m
    return sym, abb



TR = "AÂBCÇDEFGĞHIİJKLMNOÖPQRSŞTUÜVWXYZ"
E = html.escape


def _key(s):
    return [TR.find(ch) if ch in TR else 100 + ord(ch) for ch in s.lstrip("0123456789-").upper()]


def _rows(pairs, cls=""):
    return '<div class="lg %s">' % cls + "".join(f'<div class="r"><b>{E(a)}</b><span>{E(b)}</span></div>' for a, b in pairs) + "</div>"


def build(V, it):
    """Öğe için lejant HTML'i ve bulunanlar."""
    i = it["id"]
    t = V.get_json(f"d/{it['x']}/t")
    t = t[:len(t) - it.get("lg", 0)]
    flat = " ".join(t)
    sym, abb = scan(i, it["c"], flat)
    S = [("₁ ₂" if k == "H₂O, F₁" else k, v) for k, v in sym.items()]
    A = [(k, v) for k, v in abb.items() if k not in DROP_ABB]
    if "MG/DL" in flat or "mg/dL" in flat:
        A.append(("mg/dL", "desilitrede miligram"))
    A += EXTRA_ABB.get(i, [])
    seen = set(x.strip() for k, _ in VARS.get(i, []) for x in k.replace(",", "·").split("·"))
    A2 = []
    for k, v in sorted(A, key=lambda x: _key(x[0])):
        if k not in seen:
            seen.add(k)
            A2.append((k, v))
    out = f'<div class="eb">Semboller ve kısaltmalar</div><h1>{E(it["t"])}</h1>'
    out += ('<div class="src">Bu sayfa yalnız bu notta geçen işaretleri ve kısaltmaları açıklar; notun kendisi değişmedi. '
            'Anlamlar notun ve dersin kullanımına göredir.</div>')
    if S:
        out += "<h2>İşaretler</h2>" + _rows(S)
    if i in VARS:
        out += "<h2>Formüllerdeki harfler</h2>" + _rows(VARS[i])
    if i in LATEX_IN:
        out += ("<h2>Formül yazımı</h2><p class='nt'>Notta formüller kod gibi yazılmış; okurken şöyle çevir:</p>"
                + _rows([(k, LATEX[k]) for k in LATEX_IN[i]]))
    if A2:
        out += "<h2>Kısaltmalar</h2>" + _rows(A2, "ab")
    return out, S, A2


def render(jobs):
    js = os.path.join(os.path.dirname(os.path.abspath(__file__)), "legend_render.js")
    env = dict(os.environ, NODE_PATH=subprocess.run(["npm", "root", "-g"], capture_output=True, text=True).stdout.strip())
    f = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False)
    json.dump(jobs, f, ensure_ascii=False)
    f.close()
    subprocess.run(["node", js, f.name], check=True, env=env)
    os.remove(f.name)


def main():
    a = sys.argv[1:]
    dry = "--dry" in a
    hdir = a[a.index("--html") + 1] if "--html" in a else None
    ids = [x for x in a if not x.startswith("--") and x != hdir]
    V = M.Vault()
    its = [it for it in V.cat["items"] if it["k"] in ("not", "ozet") and "makale" not in it["id"]] if "--all" in a \
        else [V.item(x) or sys.exit("yok: " + x) for x in ids]
    tmp = hdir or tempfile.mkdtemp()
    jobs = []
    for it in its:
        out, S, A2 = build(V, it)
        print(it["id"], "·", " ".join(k for k, _ in S), "·", " ".join(k for k, _ in A2))
        p = os.path.join(tmp, it["id"])
        open(p + ".html", "w").write(out)
        jobs.append(dict(src=p + ".html", out=p + ".pdf", title=it["t"] + " · Semboller ve kısaltmalar"))
    if dry:
        return
    render(jobs)
    for j, it in zip(jobs, its):
        M.set_legend(V, it["id"], j["out"])
    M.build_index(V)
    V.save()
    print("lejant:", len(jobs), "not")


if __name__ == "__main__":
    main()
