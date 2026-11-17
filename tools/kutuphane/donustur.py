# Kalkınma Kütüphanesi → docs/kutuphane/**.md + manifest.json
#
#   python tools/kutuphane/donustur.py [--pdf D:/ykh-kutuphane-pdf] [--enaz-yil 2019]
#
# Kapsam SİTENİN KENDİ VERİSİNDEN (etiket + başlık), sonra METİNLE sınanır:
#   tek il etiketi → o il; birden çok il aynı ajansta ya da il etiketi yok →
#   hazırlayan ajansın bölgesi; tek bölgeye bağlanamayan → ATLANIR.
#   Düzeltmeler (bağımsız incelemede ölçülen hatalar):
#   - başlığı bölge düzeyinde olan ("TR71 Düzey 2 Bölgesi…") belge tek il
#     etiketine rağmen BÖLGE: il kapsamı her pasajı o ile "yerel" sayar ve
#     belgeyi bölgenin diğer illerinden gizlerdi;
#   - metninde başka bir bölge ili en az yarısı kadar geçen belge BÖLGE;
#   - etiketsiz ama başlığı tek ili adlandıran belge ("Zonguldak İli …") o İL;
#   - tek illi ajansın bölge belgesi o İL.
# Elenenler: kalite ölçeri, taranmış PDF, bozuk kodlama, Türkçe olmayan, çoğu
# tablo olan, başka belgenin kopyası/eski sürümü. Hepsi rapor.json'da NEDENİYLE.
# Yeniden çalıştırılabilir: PDF ve dönüşüm önbelleği (--pdf altında) yeniden işlenmez.
import argparse, difflib, json, os, re, shutil, subprocess, sys, time, urllib.request, zlib
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from pdf2md import cevir

KOK = Path(__file__).resolve().parents[2]
CIKTI = KOK / "docs" / "kutuphane"
ap = argparse.ArgumentParser()
ap.add_argument("--pdf", default="D:/ykh-kutuphane-pdf")
ap.add_argument("--enaz-yil", type=int, default=2019)
A = ap.parse_args()
PDF = Path(A.pdf)
ONBELLEK = PDF / "md-v2"  # dönüştürücü değişince sürümü artır
ONBELLEK.mkdir(parents=True, exist_ok=True)


def norm(s):
    # Önce Türkçe eşleme, SONRA lower(): "İ".lower() birleşik noktalı "i̇" üretir
    # ve "ili" ile eşleşmez; "I".lower() "i" olur ("PLANI" → "plani").
    return re.sub(r"\s+", " ", s.replace("İ", "i").replace("I", "ı").lower()).strip()


def anahtar(s):
    """Ad eşlemesi için: şapkalı harf farkı (Elâzığ ↔ Elazığ) yok sayılır."""
    return norm(s).translate(str.maketrans("âîû", "aiu"))


ajanslar = json.load(open(KOK / "packages/database/data/ajans.json", encoding="utf-8"))
AJANS_KOD = {anahtar(a["ad"]): a["kod"] for a in ajanslar}
IL = {anahtar(i["ad"]): (i["kod"], a["kod"]) for a in ajanslar for i in a["iller"]}
AJANS_ILLERI = {a["kod"]: [(anahtar(i["ad"]), i["kod"]) for i in a["iller"]] for a in ajanslar}
env = json.load(open(Path(__file__).parent / "envanter.json", encoding="utf-8"))

# Sistemde zaten yüklü belgeler (başka adla): yeniden eklenmez.
ZATEN = ["on ikinci kalkınma planı", "bölgesel gelişme ulusal stratejisi", "tr33 bölge planı", "tr33 düzey 2 bölgesi bölge planı", "tr71 bölgesi bölge planı",
         "tr71 bölgesi beceri seti analizi", "aksaray organize sanayi bölgesi endüstriyel simbiyoz",
         "aksaray ili emniyet kemeri", "airbag üretimi"]
BOLGE_BASLIGI = re.compile(r"\btr[0-9a-c][0-9]\b|düzey 2|bölge planı")


def slug(s):
    tr = str.maketrans("çğıöşüÇĞİÖŞÜ", "cgiosuCGIOSU")
    return re.sub(r"[^a-z0-9]+", "-", s.translate(tr).lower()).strip("-")[:70]


def kapsam(b):
    """Sitenin etiketlerinden → (ajansKod, ilKod|None) ya da (None, neden)."""
    ajans = AJANS_KOD.get(anahtar(b["hazirlayan"])) or (AJANS_KOD.get(anahtar(b["ajanslar"][0])) if b["ajanslar"] else None)
    iller = [IL[anahtar(i)] for i in b["iller"] if anahtar(i) in IL]
    if len(iller) == 1:
        return iller[0][1], iller[0][0]
    il_ajanslari = {a for _, a in iller}
    if ajans and (not iller or il_ajanslari <= {ajans}):
        return ajans, None
    if len(il_ajanslari) == 1:
        return il_ajanslari.pop(), None
    return None, "birden çok bölgeye yayılıyor ya da hazırlayan bir ajans değil"


def kapsam_duzelt(b, ajans, il, md):
    """Etiket kapsamını başlık ve metinle sınar → ilKod|None."""
    t = anahtar(b["baslik"])
    iller = AJANS_ILLERI[ajans]
    if len(iller) == 1:
        return iller[0][1]
    adi_gecen = [kod for ad, kod in iller if re.search(r"\b" + re.escape(ad), t)]
    if len(adi_gecen) == 1 and not BOLGE_BASLIGI.search(t):
        return adi_gecen[0]  # başlık tek ili adlandırıyor
    if il is None:
        return None
    if BOLGE_BASLIGI.search(t) or len(adi_gecen) > 1:
        return None
    metin = anahtar(md)
    say = {kod: len(re.findall(r"\b" + re.escape(ad), metin)) for ad, kod in iller}
    diger = max(v for k, v in say.items() if k != il)
    return None if diger >= 5 and diger >= 0.5 * say[il] else il


def indir(url, hedef):
    if hedef.exists() and hedef.stat().st_size > 1000:
        return True
    for d in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=600) as r, open(str(hedef) + ".tmp", "wb") as f:
                while True:
                    p = r.read(1 << 20)
                    if not p:
                        break
                    f.write(p)
            os.replace(str(hedef) + ".tmp", hedef)
            time.sleep(1)
            return True
        except Exception:
            time.sleep(10 * (d + 1))
    return False


COP_IM = set("$%|×·<>*=&^}{]" + chr(92))


def temizle(md):
    """Glif kayması olan satırları atar (PDF yazı tipi harfleri yanlış eşlemiş başlıklar:
    "%$7,$.'(1ø=.$/.,10$$" gibi). Ölçüt: C1 denetim karakteri ya da simge dolu uzun sözcük."""
    def cop(p):
        if p.startswith("|"):
            return False
        if re.search(r"[\x7f-\x9f]", p):
            return True
        return any(len(w) >= 12 and not w.startswith(("http", "www")) and sum(c in COP_IM for c in w) >= 2 for w in p.split())
    return "\n\n".join(p for p in md.split("\n\n") if not cop(p))


def icerik_kusuru(md):
    """Kalite ölçerinin görmediği kusurlar → neden | None."""
    bozuk = len(re.findall(r"[ĢģĠġȘșȚțÝýÞþÐð\x80-\x9f]", md))
    if bozuk > 50:
        return f"bozuk kodlama ({bozuk} hatalı harf: PDF yazı tipi Türkçe harfleri yanlış eşliyor)"
    harf = sum(c.isalpha() for c in md)
    if harf and sum(c in "çğışöüÇĞİŞÖÜ" for c in md) / harf < 0.02:
        return "Türkçe değil (ya da Türkçe harfler metin katmanında yok)"
    tablo = sum(len(s) for s in md.split("\n") if s.startswith("|"))
    if tablo / max(len(md), 1) > 0.6:
        return f"çoğu tablo (%{round(100 * tablo / len(md))}): düz yazı çok az"
    return None


def parmak_izi(md):
    """6 sözcüklük dizilerin örneklenmiş kümesi — kopya ve eski sürüm tespiti."""
    w = re.findall(r"\w+", md.lower())
    return {h for h in (zlib.crc32(" ".join(w[i:i + 6]).encode()) for i in range(len(w) - 5)) if h % 8 == 0}


def ayni_belge(a, b, ortusme):
    """Fizibilite raporları ORTAK ŞABLON taşır: farklı konu/il %60+ örtüşebiliyor
    (ölçüldü: Zonguldak ↔ Bartın deniz salyangozu, sensör ↔ mikroişlemci).
    Bu yüzden örtüşme tek başına yetmez: ya neredeyse tamamı aynı, ya da başlık da aynı (yıl hariç)."""
    # Başlıkları FARKLI İLİ adlandıran iki belge aynı belge değildir, metin ne kadar örtüşürse
    # örtüşsün ("Erzincan … İl Gelişim Stratejisi" ↔ "Bayburt …"): yerellik ile bağlıdır.
    ta, tb = anahtar(a["baslik"]), anahtar(b["baslik"])
    iller = lambda t: {il for il in IL if re.search(r"\b" + re.escape(il), t)}
    if iller(ta) != iller(tb):
        return False
    if ortusme >= 0.8:  # ölçüldü: şablon ortaklığı 0.63–0.66, aynı planın iki yüklemesi 0.86
        return True
    # Yalnızca YIL farkı sürüm farkıdır; başka sayı ("3 Yıldızlı" ↔ "5 Yıldızlı") ayrı belgedir.
    ad = lambda t: re.sub(r"[^a-zçğıöşü0-9]+", "", re.sub(r"(?:19|20)\d\d", "", t))
    return ortusme >= 0.6 and difflib.SequenceMatcher(None, ad(ta), ad(tb)).ratio() >= 0.85


def dogrula(yollar):
    """Projenin kalite ölçeri — tek node süreci, JSON satırları."""
    kod = ("import('./src/belge-dogrula.ts').then(async m=>{for(const y of JSON.parse(process.argv[1])){"
           "try{const d=await m.belgeDenetle(y);console.log(JSON.stringify({y,gecti:d.gecti,parca:d.parca,uyari:d.uyarilar}))}"
           "catch(e){console.log(JSON.stringify({y,gecti:false,parca:0,uyari:[String(e)]}))}}})")
    out = {}
    for i in range(0, len(yollar), 40):
        r = subprocess.run(["node", "-e", kod, json.dumps(yollar[i:i + 40])], cwd=KOK / "packages/database", capture_output=True, text=True, encoding="utf-8")
        for l in r.stdout.splitlines():
            if l.startswith("{"):
                j = json.loads(l)
                out[j["y"]] = j
    return out


rapor = {"yuklenen": [], "atlanan": []}
def atla(b, neden):
    rapor["atlanan"].append({"id": b["id"], "baslik": b["baslik"], "yil": b["yil"], "neden": neden})

adaylar = []
for b in env["belgeler"]:
    yil = int(b["yil"]) if b["yil"].isdigit() else 0
    if yil < A.enaz_yil:
        atla(b, f"{A.enaz_yil} öncesi (ikinci dalga)"); continue
    # Sitedeki yıl YÜKLEME yılı olabiliyor ("2010-2013 Bölge Planı", yıl 2020): başlıktaki yıl da sınanır.
    baslik_yili = [int(y) for y in re.findall(r"(?<!\d)(?:19|20)\d\d(?!\d)", b["baslik"])]
    if baslik_yili and max(baslik_yili) < A.enaz_yil:
        atla(b, f"başlığına göre {max(baslik_yili)} dönemi: {A.enaz_yil} öncesi (ikinci dalga)"); continue
    if not b["dosya"].lower().endswith(".pdf"):
        atla(b, "PDF değil"); continue
    if any(z in norm(b["baslik"]) for z in ZATEN):
        atla(b, "sistemde zaten yüklü"); continue
    ajans, il = kapsam(b)
    if not ajans:
        atla(b, il); continue
    adaylar.append((b, ajans, il))

print(f"aday {len(adaylar)} / {len(env['belgeler'])}", flush=True)
gecici = []
for n, (b, ajans, il) in enumerate(adaylar, 1):
    onb, kusur = ONBELLEK / f"{b['id']}.md", ONBELLEK / f"{b['id']}.atla"
    if kusur.exists():
        atla(b, kusur.read_text(encoding="utf-8")); continue
    if not onb.exists():
        pdf = PDF / f"{b['id']}.pdf"
        if not indir(b["dosya"], pdf):
            atla(b, "indirilemedi"); print(f"[{n}/{len(adaylar)}] İNDİRİLEMEDİ {b['id']}", flush=True); continue
        try:
            md, bilgi = cevir(str(pdf))
        except Exception as e:
            atla(b, f"PDF okunamadı: {e}"); print(f"[{n}/{len(adaylar)}] OKUNAMADI {b['id']}", flush=True); continue
        if bilgi["sayfa"] and bilgi["metinsiz"] / bilgi["sayfa"] > 0.5 or bilgi["karakter"] < 3000:
            neden = f"metin katmanı yok / taranmış PDF ({bilgi['metinsiz']}/{bilgi['sayfa']} sayfa metinsiz)"
            kusur.write_text(neden, encoding="utf-8"); atla(b, neden)
            print(f"[{n}/{len(adaylar)}] TARANMIŞ {b['id']}", flush=True); continue
        onb.write_text(md, encoding="utf-8")
        print(f"[{n}/{len(adaylar)}] {b['id']} {bilgi['sayfa']} sayfa, {bilgi['metinsiz']} metinsiz", flush=True)
    md = temizle(onb.read_text(encoding="utf-8"))
    neden = icerik_kusuru(md)
    if neden:
        atla(b, neden); continue
    gecici.append((b, ajans, kapsam_duzelt(b, ajans, il, md), onb, md))

for _, _, _, o, md in gecici:  # ölçer TEMİZLENMİŞ metni ölçsün
    o.with_suffix(".temiz.md").write_text(md, encoding="utf-8")
sonuc = dogrula([str(o.with_suffix(".temiz.md")) for _, _, _, o, _ in gecici])
gecen = []
for g in gecici:
    d = sonuc.get(str(g[3].with_suffix(".temiz.md")), {"gecti": False, "uyari": ["ölçülemedi"]})
    if not d["gecti"]:
        atla(g[0], "kalite ölçeri: " + " | ".join(d["uyari"])[:300]); continue
    gecen.append((*g, d["parca"]))

# Kopya / eski sürüm: yeni ve uzun olan kalır; metninin %60'ı kalan bir belgede geçen atlanır.
gecen.sort(key=lambda g: (g[0]["yil"], len(g[4]), g[0]["id"]), reverse=True)
kalan = []
for g in gecen:
    iz = parmak_izi(g[4])
    es = next((k for k, kiz in kalan if iz and ayni_belge(g[0], k[0], len(iz & kiz) / len(iz))), None)
    if es:
        atla(g[0], f"kopya ya da eski sürüm: metninin çoğu #{es[0]['id']} ({es[0]['yil']}) içinde"); continue
    kalan.append((g, iz))

for d in CIKTI.iterdir():  # önceki üretim: yalnızca ajans klasörleri silinir
    if d.is_dir():
        shutil.rmtree(d)
manifest, adlar = [], set()
for (b, ajans, il, onb, md, parca), _ in sorted(kalan, key=lambda k: k[0][0]["id"]):
    hedef = CIKTI / ajans / (il or "bolge") / f"{b['id']}-{slug(b['baslik'])}.md"
    hedef.parent.mkdir(parents=True, exist_ok=True)
    hedef.write_text(md, encoding="utf-8")
    ad = b["baslik"].strip()[:180]
    if ad in adlar:
        ad = f"{ad} ({b['yil']}, #{b['id']})"
    adlar.add(ad)
    tur = "bolge_plani" if "bölge planı" in norm(ad) and not il else ("il_raporu" if il else "diger")
    manifest.append({"dosya": hedef.relative_to(KOK).as_posix(), "ad": ad, "tur": tur, "yil": b["yil"], "ajansKod": ajans,
                     **({"ilKod": il} if il else {}), "kaynak": b["sayfa"]})
    rapor["yuklenen"].append({"id": b["id"], "ad": ad, "ajans": ajans, "il": il, "parca": parca})

(CIKTI / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
(CIKTI / "rapor.json").write_text(json.dumps(rapor, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"BİTTİ yüklenecek {len(manifest)} atlanan {len(rapor['atlanan'])}", flush=True)
