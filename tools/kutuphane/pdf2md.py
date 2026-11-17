# PDF → Markdown. Hedef: alıntı doğrulamasına uygun metin — paragraf TEK SATIRDA
# bütün, kolonlar karışmamış, sayfa işareti korunmuş ("12 / 240": parcala() bunu
# sayfa çıpasına çevirir). OCR YOK: metin katmanı olmayan sayfa boş bırakılır ve
# raporlanır; OCR hatası belgede olmayan alıntı üretirdi.
import collections, re, statistics, sys
import fitz


def kolonlara_ayir(bloklar, genislik):
    """Blokları okuma sırasına dizer: tam genişlik bloklar akışı böler, aradakiler sol→sağ kolon."""
    orta = genislik / 2
    sirali, tampon = [], []

    def bosalt():
        sol = sorted([b for b in tampon if (b[0] + b[2]) / 2 < orta], key=lambda b: (b[1], b[0]))
        sag = sorted([b for b in tampon if (b[0] + b[2]) / 2 >= orta], key=lambda b: (b[1], b[0]))
        # İki kolon ancak iki tarafta da yeterli blok varsa; yoksa düz y sırası.
        if len(sol) >= 2 and len(sag) >= 2:
            sirali.extend(sol + sag)
        else:
            sirali.extend(sorted(tampon, key=lambda b: (b[1], b[0])))
        tampon.clear()

    for b in sorted(bloklar, key=lambda b: (b[1], b[0])):
        tam = (b[2] - b[0]) > genislik * 0.6 or (b[0] < orta - 20 and b[2] > orta + 20)
        if tam:
            bosalt()
            sirali.append(b)
        else:
            tampon.append(b)
    bosalt()
    return sirali


MADDE_BASI = re.compile(r"^(?:[•\-–▪■●○*]|\(?\d{1,3}[.)]|[a-zçğıöşü][.)])\s")
NOKTALI = re.compile(r"\.{4,}\s*\d*\s*$")


def birlestir(bloklar, genislik):
    """Aynı paragrafın ayrı bloklara düşmüş satırlarını birleştirir.

    Bazı PDF'lerde her görsel satır kendi bloğudur; blok içi birleştirme
    yetmez ve cümleler satır ortasında kalır (ölçüldü: cümlelerin %7–14'ü
    düzgün bitiyordu). Bir sonraki blok AYNI kolonda, bir satır aralığı kadar
    yakınsa ve önceki cümle bitmemişse aynı paragraftır. Madde işaretiyle
    başlayan satır, tablo ve içindekiler satırı (noktalı dolgu) birleşmez.
    """
    out = []
    for b in bloklar:
        if out:
            o = out[-1]
            duz = lambda x: not x[4].startswith("|") and not NOKTALI.search(x[4])
            ayni_kolon = abs(b[0] - o[0]) < genislik * 0.06 or (o[0] - 2 <= b[0] <= o[2])
            yakin = -2 <= b[1] - o[3] < max(o[5], b[5], 8) * 0.9
            # Küçük harfle başlayan satır yeni cümle olamaz ("…sisteminde 2." / "bölgeden 3. bölgeye").
            bitmedi = not re.search(r"[.!?:;]\s*$", o[4]) or o[4].endswith("-") or b[4][:1].islower()
            ayni_boy = abs(o[5] - b[5]) < 0.6
            if duz(o) and duz(b) and ayni_kolon and yakin and bitmedi and ayni_boy and not MADDE_BASI.match(b[4]):
                out[-1] = (min(o[0], b[0]), o[1], max(o[2], b[2]), b[3], paragraf([o[4], b[4]]), o[5], o[6] and b[6])
                continue
        out.append(b)
    return out


def paragraf(satirlar):
    """Satırları tek paragrafa birleştirir; satır sonu tirelemesini kaldırır."""
    out = ""
    for s in satirlar:
        s = s.strip()
        if not s:
            continue
        if out.endswith("-") and s[:1].islower():
            out = out[:-1] + s
        else:
            out = (out + " " + s) if out else s
    return re.sub(r"\s+", " ", out).strip()


def cevir(yol):
    doc = fitz.open(yol)
    n = doc.page_count
    boyutlar = []
    for sayfa in doc:
        for b in sayfa.get_text("dict")["blocks"]:
            for l in b.get("lines", []):
                for sp in l["spans"]:
                    if sp["text"].strip():
                        boyutlar.append(round(sp["size"], 1))
    if not boyutlar:
        return "", {"sayfa": n, "metinsiz": n, "karakter": 0}
    govde = statistics.mode(boyutlar)
    cikti, metinsiz = [], 0
    gorulme = collections.Counter()  # kısa metin kaç sayfada geçiyor: üst/alt bilgi tespiti

    for no, sayfa in enumerate(doc, 1):
        d = sayfa.get_text("dict")
        tablolar = []
        try:
            tablolar = [t for t in sayfa.find_tables().tables if t.row_count >= 2 and t.col_count >= 2]
        except Exception:
            pass
        tkutu = [fitz.Rect(t.bbox) for t in tablolar]
        bloklar = []
        for b in d["blocks"]:
            if b.get("type") != 0:
                continue
            r = fitz.Rect(b["bbox"])
            if any(r.intersects(k) and (r & k).get_area() > 0.5 * r.get_area() for k in tkutu):
                continue
            satirlar, enbuyuk, kalin = [], 0, True
            for l in b["lines"]:
                t = "".join(sp["text"] for sp in l["spans"])
                if t.strip():
                    satirlar.append(t)
                    for sp in l["spans"]:
                        if sp["text"].strip():
                            enbuyuk = max(enbuyuk, sp["size"])
                            kalin = kalin and bool(sp["flags"] & 16)
            metin = paragraf(satirlar)
            if metin:
                bloklar.append((r.x0, r.y0, r.x1, r.y1, metin, enbuyuk, kalin))
        for t in tablolar:
            satir = [[re.sub(r"\s+", " ", re.sub(r"(\w)-\n(?=[a-zçğıöşü])", r"\1", h or "")).strip().replace("|", "/") for h in s] for s in t.extract()]
            satir = [s for s in satir if any(s)]
            if len(satir) >= 2:
                md = ["| " + " | ".join(satir[0]) + " |", "|" + " --- |" * len(satir[0])] + ["| " + " | ".join(s) + " |" for s in satir[1:]]
                k = fitz.Rect(t.bbox)
                bloklar.append((k.x0, k.y0, k.x1, k.y1, "\n".join(md), 0, False))
        if not bloklar:
            metinsiz += 1
            continue
        cikti.append(f"{no} / {n}")
        gorulme.update({b[4] for b in bloklar if len(b[4]) < 100 and not b[4].startswith("|")})
        for b in birlestir(kolonlara_ayir(bloklar, sayfa.rect.width), sayfa.rect.width):
            metin, boy, kalin = b[4], b[5], b[6]
            if re.fullmatch(r"\d{1,4}", metin):  # tek başına sayfa numarası
                continue
            baslik = len(metin) <= 120 and not metin.endswith(".") and (boy >= govde * 1.15 or (kalin and len(metin) <= 90 and boy >= govde))
            cikti.append(("## " + metin) if baslik and not metin.startswith("|") else metin)
    # Üst/alt bilgi: aynı kısa metin sayfaların onda birinde (en az 5) yineleniyorsa gövde değildir.
    tekrar = {t for t, c in gorulme.items() if c >= max(5, n * 0.1)}
    cikti = [c for c in cikti if c.removeprefix("## ") not in tekrar]
    md = "\n\n".join(cikti) + "\n"
    md = re.sub(r"[-]", "•", md)  # özel kullanım alanındaki madde imi glifleri
    # Denetim karakterleri (NUL dahil) PDF'ten sızabiliyor; PostgreSQL metinde NUL kabul etmez.
    md = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", md)
    return md, {"sayfa": n, "metinsiz": metinsiz, "karakter": len(md)}


if __name__ == "__main__":
    md, bilgi = cevir(sys.argv[1])
    open(sys.argv[2], "w", encoding="utf-8").write(md)
    print(bilgi)
