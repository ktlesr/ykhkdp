# MTA "İl Maden Potansiyelleri" → docs/veri/mta/{il}.md + docs/veri/manifest.json
#
# Adresler tahmin edilmez: MTA'nın liste sayfasındaki bağlantılar okunur
# (dosya adları düzensiz: "bartin-madenler_1.pdf", "mersin-maden-potansiyeli.pdf").
# PDF → Markdown kütüphane aktarımıyla aynı dönüştürücüden geçer (OCR yok).
# Yeniden çalıştırılabilir: değişmeyen il dosyası aynı kalır, `db:kur` yalnızca
# içerik özeti değişen belgeyi yeniden yükler.
#
#   python tools/veri/mta.py            yalnızca eksik iller
#   python tools/veri/mta.py --yenile   hepsini yeniden indir (MTA güncellediyse)
import json, pathlib, re, sys, tempfile, time, urllib.request

KOK = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(KOK / "tools" / "kutuphane"))
from pdf2md import cevir  # noqa: E402
from manifest import manifeste_yaz  # noqa: E402

LISTE = "https://www.mta.gov.tr/bilgi-merkezi/turkiyede-madencilik2/il-maden-potansiyeli"
TABAN = "https://www.mta.gov.tr/api/files/view/cms-files/"
# MTA'nın dosya adı → il kodu; yalnızca il kodundan FARKLI yazılanlar.
OZEL = {"afyon": "afyonkarahisar", "antakya": "hatay", "kmaras": "kahramanmaras"}
UA = {"User-Agent": "YKH-KDP/1.0 (+il-maden-potansiyeli)"}


def al(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read()


iller = {i["kod"]: (i["ad"], a["kod"]) for a in json.loads((KOK / "packages/database/data/ajans.json").read_text("utf-8")) for i in a["iller"]}
yollar = sorted(set(re.findall(r"folders/1155/[A-Za-z0-9_.-]+\.pdf", al(LISTE).decode("utf-8", "replace"))))
# Liste sayfasında bağlantısı okunamayan il için MTA'nın olağan dosya adı denenir.
bulunan = {OZEL.get(m.group(1), m.group(1)) for m in (re.match(r"folders/1155/([a-z]+)-", y) for y in yollar) if m}
yollar += [f"folders/1155/{k}-madenler.pdf" for k in sorted(set(iller) - bulunan)]
YENILE = "--yenile" in sys.argv
cikti = KOK / "docs" / "veri" / "mta"
cikti.mkdir(parents=True, exist_ok=True)
girdiler, sorun = [], []
gecici = pathlib.Path(tempfile.mkdtemp())
for yol in yollar:
    ek = re.match(r"folders/1155/([a-z]+)-", yol).group(1)
    kod = OZEL.get(ek, ek)
    if kod not in iller:
        sorun.append(f"{yol}: il eşleşmedi")
        continue
    ad, ajans = iller[kod]
    girdi = {"dosya": f"docs/veri/mta/{kod}.md", "ad": f"{ad} İli Maden ve Enerji Kaynakları (MTA)", "tur": "il_raporu",
             "yil": None, "ajansKod": ajans, "ilKod": kod, "kategori": "maden_enerji", "kaynak": TABAN + yol}
    if not YENILE and (cikti / f"{kod}.md").exists():
        girdiler.append(girdi)
        continue
    try:
        pdf = gecici / f"{kod}.pdf"
        pdf.write_bytes(al(TABAN + yol))
        md, bilgi = cevir(str(pdf))
    except Exception as e:  # tek ilin hatası kalanları durdurmaz
        sorun.append(f"{kod}: {e}")
        continue
    if bilgi["karakter"] < 1500:
        sorun.append(f"{kod}: metin çok kısa ({bilgi['karakter']} karakter; taranmış olabilir)")
        continue
    (cikti / f"{kod}.md").write_text(md, encoding="utf-8")
    girdiler.append(girdi)
    print(kod, bilgi, flush=True)
    time.sleep(1)

manifeste_yaz("docs/veri/mta/", girdiler)
eksik = sorted(set(iller) - {g["ilKod"] for g in girdiler})
print(f"BİTTİ {len(girdiler)} il · MTA listesinde olmayan ya da alınamayan: {', '.join(eksik) or 'yok'}")
for s in sorun:
    print("SORUN", s)
