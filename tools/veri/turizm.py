# KTB "Turizm Belgeli Tesis İstatistikleri" yıllık bülteni → docs/veri/turizm/{il}.md
#
# Tablo CÜMLEYE çevrilir: kanıt taraması pasajı birebir keser ve başlıksız bir
# tablo satırı tek başına kanıt olamaz. Sayılar KTB'nin yayımladığı hâliyledir;
# hesaplanan tek değer il toplamının ilçe kırılımıdır (aynı sayfadan toplanır).
#
#   python tools/veri/turizm.py <yıl> <bülten.xlsx ya da adresi>
#   python tools/veri/turizm.py 2025 "https://yigm.ktb.gov.tr/Eklenti/145776,yillik-bulten-2025xlsx.xlsx?0"
import collections, io, json, pathlib, sys, urllib.request

import openpyxl

KOK = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from manifest import manifeste_yaz  # noqa: E402

yil, kaynak = sys.argv[1], sys.argv[2]
if kaynak.startswith("http"):
    ham = urllib.request.urlopen(urllib.request.Request(kaynak, headers={"User-Agent": "YKH-KDP/1.0 (+ktb-istatistik)"}), timeout=120).read()
    wb = openpyxl.load_workbook(io.BytesIO(ham), data_only=True)
else:
    wb = openpyxl.load_workbook(kaynak, data_only=True)

TR = str.maketrans("ıİğĞüÜşŞöÖçÇâÂ", "iIgGuUsSoOcCaA")
katla = lambda s: str(s or "").translate(TR).lower().strip()
iller = {katla(i["ad"]): (i["kod"], i["ad"], a["kod"]) for a in json.loads((KOK / "packages/database/data/ajans.json").read_text("utf-8")) for i in a["iller"]}
say = lambda n: f"{int(n):,}".replace(",", ".")  # 1.429 — Türkçe binlik
n0 = lambda v: int(v) if isinstance(v, (int, float)) else 0

# İl toplamları ("İl" sayfası): bölge satırları il değildir, atlanır.
toplam = {}
for r in wb["İl"].iter_rows(min_row=4, values_only=True):
    il = iller.get(katla(r[1]))
    if il and not r[0]:
        toplam[il[0]] = [n0(v) for v in r[2:8]]

# İlçe kırılımı ("İl İlçe" sayfası): il → ilçe → [(tür, sınıf, yatırım 3'lü, işletme 3'lü)]
ilce = collections.defaultdict(lambda: collections.defaultdict(list))
taninmayan = set()
for r in wb["İl İlçe"].iter_rows(min_row=4, values_only=True):
    if not r[0] or not r[2]:
        continue
    il = iller.get(katla(r[0]))
    if not il:
        taninmayan.add(str(r[0]))
        continue
    ilce[il[0]][str(r[1]).strip()].append((str(r[2]).strip(), str(r[3] or "").strip(), [n0(v) for v in r[4:7]], [n0(v) for v in r[7:10]]))

cikti = KOK / "docs" / "veri" / "turizm"
cikti.mkdir(parents=True, exist_ok=True)
girdiler = []
for kod, ad, ajans in sorted(iller.values()):
    if kod not in toplam and kod not in ilce:
        continue
    p = [f"# {ad} turizm belgeli tesisler {yil}", f"Kaynak: Kültür ve Turizm Bakanlığı Yatırım ve İşletmeler Genel Müdürlüğü, Turizm Belgeli Tesis İstatistikleri {yil}."]
    if kod in toplam:
        t = toplam[kod]
        p.append(f"{ad} ilinde {yil} yılında turizm işletme belgeli {say(t[3])} konaklama tesisi, {say(t[4])} oda ve {say(t[5])} yatak vardır. "
                 f"{ad} ilinde yatırım aşamasındaki (turizm yatırım belgeli) tesis sayısı {say(t[0])}, oda sayısı {say(t[1])}, yatak sayısı {say(t[2])}.")
    for ilce_ad, satirlar in sorted(ilce[kod].items()):
        isl = [sum(s[3][i] for s in satirlar) for i in range(3)]
        yat = [sum(s[2][i] for s in satirlar) for i in range(3)]
        c = [f"{ad} {ilce_ad} ilçesinde turizm işletme belgeli {say(isl[0])} tesis, {say(isl[1])} oda ve {say(isl[2])} yatak; turizm yatırım belgeli {say(yat[0])} tesis ve {say(yat[2])} yatak vardır."]
        for tur, sinif, y, i in satirlar:
            etiket = tur if sinif in ("", "(Sınıfı Yok)") else f"{sinif} {tur}"
            parca = []
            if i[0]:
                parca.append(f"işletme belgeli {say(i[0])} tesis ({say(i[1])} oda, {say(i[2])} yatak)")
            if y[0]:
                parca.append(f"yatırım belgeli {say(y[0])} tesis ({say(y[1])} oda, {say(y[2])} yatak)")
            if parca:
                c.append(f"{ilce_ad} ilçesinde {etiket}: {' ve '.join(parca)}.")
        p.append(" ".join(c))
    (cikti / f"{kod}.md").write_text("\n\n".join(p) + "\n", encoding="utf-8")
    girdiler.append({"dosya": f"docs/veri/turizm/{kod}.md", "ad": f"{ad} Turizm Belgeli Tesis İstatistikleri (KTB)", "tur": "il_raporu",
                     "yil": yil, "ajansKod": ajans, "ilKod": kod, "kategori": "turizm", "kaynak": kaynak if kaynak.startswith("http") else None})

manifeste_yaz("docs/veri/turizm/", girdiler)
print(f"BİTTİ {len(girdiler)} il" + (f" · tanınmayan: {sorted(taninmayan)}" if taninmayan else ""))
