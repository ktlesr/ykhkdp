# İl sütunu olan herhangi bir Excel tablosu → docs/veri/{klasör}/{il}.md + manifest
#
# Yatırım teşvik belgeleri, kapasite raporu dökümleri gibi "satır başına bir
# kayıt, bir sütunda il adı" biçimindeki tablolar için. Her satır, başlıklarını
# taşıyan TEK cümleye çevrilir ("Uşak — Sektör: Tekstil; Sabit yatırım: 12.500.000.")
# çünkü kanıt taraması pasajı birebir keser ve başlıksız satır kanıt olamaz.
# Aynı ilin 400'den fazla satırı varsa `--grupla` ile özetlenmelidir.
#
#   python tools/veri/tablo.py <dosya.xlsx> --klasor tesvik --kategori tesvik \
#       --ad "Yatırım Teşvik Belgeleri" --yil 2026 [--sayfa "Sayfa1"] [--il-sutunu "İl"] \
#       [--baslik-satiri 1] [--sutunlar "Sektör,Sabit Yatırım,İstihdam"] [--grupla "Sektör"]
import argparse, collections, json, pathlib, sys

import openpyxl

KOK = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from manifest import manifeste_yaz  # noqa: E402

KATEGORILER = ["genel", "sanayi", "dis_ticaret", "maden_enerji", "turizm", "tarim", "cografi_isaret", "tesvik", "istatistik"]
a = argparse.ArgumentParser()
a.add_argument("dosya")
a.add_argument("--klasor", required=True)
a.add_argument("--kategori", required=True, choices=KATEGORILER)
a.add_argument("--ad", required=True, help='belge adı; il adı başına eklenir: "Uşak <ad>"')
a.add_argument("--yil")
a.add_argument("--sayfa")
a.add_argument("--il-sutunu", default="İl")
a.add_argument("--baslik-satiri", type=int, default=1)
a.add_argument("--sutunlar", help="yalnızca bu sütunlar (virgülle); verilmezse hepsi")
a.add_argument("--grupla", help="bu sütuna göre satır say ve sayısal sütunları topla (çok satırlı tablolar için)")
a.add_argument("--kaynak", help="verinin kaynağı; belgenin başına yazılır")
o = a.parse_args()

TR = str.maketrans("ıİğĞüÜşŞöÖçÇâÂ", "iIgGuUsSoOcCaA")
katla = lambda s: str(s or "").translate(TR).lower().strip()
iller = {katla(i["ad"]): (i["kod"], i["ad"], aj["kod"]) for aj in json.loads((KOK / "packages/database/data/ajans.json").read_text("utf-8")) for i in aj["iller"]}


SAYI_DEGIL = ("yil", "no", "kod", "sira", "numara", "tarih", "gtip", "nace")


def yaz(v, baslik=""):
    if isinstance(v, bool) or v is None:
        return ""
    # Yıl, kod ve belge numarası miktar değildir: "2026" binlik ayraçla "2.026" olmasın.
    if isinstance(v, (int, float)) and any(k in katla(baslik).split() or katla(baslik).endswith(k) for k in SAYI_DEGIL):
        return str(int(v)) if float(v).is_integer() else str(v)
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    if isinstance(v, int):
        return f"{v:,}".replace(",", ".")
    if isinstance(v, float):
        return f"{v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    if hasattr(v, "strftime"):
        return v.strftime("%d.%m.%Y")
    return " ".join(str(v).split())


wb = openpyxl.load_workbook(o.dosya, data_only=True, read_only=True)
ws = wb[o.sayfa] if o.sayfa else wb.worksheets[0]
satirlar = ws.iter_rows(min_row=o.baslik_satiri, values_only=True)
basliklar = [yaz(h) for h in next(satirlar)]
try:
    il_i = [katla(h) for h in basliklar].index(katla(o.il_sutunu))
except ValueError:
    sys.exit(f"İl sütunu bulunamadı: {o.il_sutunu!r}. Başlıklar: {basliklar}")
secili = [katla(s) for s in o.sutunlar.split(",")] if o.sutunlar else None
alanlar = [i for i, h in enumerate(basliklar) if h and i != il_i and (secili is None or katla(h) in secili)]

kayit = collections.defaultdict(list)
taninmayan = collections.Counter()
for r in satirlar:
    if r is None or il_i >= len(r) or not r[il_i]:
        continue
    il = iller.get(katla(r[il_i]))
    if not il:
        taninmayan[str(r[il_i])] += 1
        continue
    kayit[il].append(r)

cikti = KOK / "docs" / "veri" / o.klasor
cikti.mkdir(parents=True, exist_ok=True)
girdiler = []
for (kod, ad, ajans), rs in sorted(kayit.items()):
    p = [f"# {ad} {o.ad}" + (f" {o.yil}" if o.yil else "")]
    if o.kaynak:
        p.append(f"Kaynak: {o.kaynak}.")
    p.append(f"{ad} ili için {len(rs)} kayıt vardır.")
    if o.grupla:
        g_i = [katla(h) for h in basliklar].index(katla(o.grupla))
        gruplar = collections.defaultdict(list)
        for r in rs:
            gruplar[yaz(r[g_i]) or "(belirtilmemiş)"].append(r)
        for g, grs in sorted(gruplar.items(), key=lambda x: -len(x[1])):
            toplamlar = []
            for i in alanlar:
                sayilar = [r[i] for r in grs if i < len(r) and isinstance(r[i], (int, float)) and not isinstance(r[i], bool)]
                if i != g_i and sayilar:
                    toplamlar.append(f"{basliklar[i]} toplamı: {yaz(sum(sayilar))}")
            p.append(f"{ad} — {basliklar[g_i]}: {g}; kayıt sayısı: {len(grs)}" + ("; " + "; ".join(toplamlar) if toplamlar else "") + ".")
    else:
        if len(rs) > 400:
            print(f"UYARI {ad}: {len(rs)} satır — --grupla ile özetlemeyi düşünün", file=sys.stderr)
        for r in rs:
            hucreler = [f"{basliklar[i]}: {yaz(r[i], basliklar[i])}" for i in alanlar if i < len(r) and yaz(r[i])]
            if hucreler:
                p.append(f"{ad} — " + "; ".join(hucreler) + ".")
    (cikti / f"{kod}.md").write_text("\n\n".join(p) + "\n", encoding="utf-8")
    girdiler.append({"dosya": f"docs/veri/{o.klasor}/{kod}.md", "ad": f"{ad} {o.ad}", "tur": "il_raporu", "yil": o.yil,
                     "ajansKod": ajans, "ilKod": kod, "kategori": o.kategori, "kaynak": o.kaynak})

manifeste_yaz(f"docs/veri/{o.klasor}/", girdiler)
print(f"BİTTİ {len(girdiler)} il · {sum(len(v) for v in kayit.values())} satır" + (f" · il eşleşmeyen: {dict(taninmayan)}" if taninmayan else ""))
