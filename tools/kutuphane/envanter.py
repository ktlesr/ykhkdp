# Kalkınma Kütüphanesi envanteri: belge listesi + sitenin kendi il/ajans etiketleri.
# Yalnızca liste sayfaları okunur; belge İNDİRİLMEZ. İstekler arası 1 sn.
import html, json, re, sys, time, urllib.parse, urllib.request

KOK = "https://www.kalkinmakutuphanesi.gov.tr/detayliArama"
KAT = [1, 6, 5, 13, 4, 2, 8, 9]
UA = {"User-Agent": "Mozilla/5.0"}


def getir(ek):
    q = [("kategoriArr[]", str(k)) for k in KAT] + ek
    url = KOK + "?" + urllib.parse.urlencode(q)
    for deneme in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                time.sleep(1)
                return r.read().decode("utf-8", "replace")
        except Exception as e:  # geçici hata: bekle, yeniden dene
            time.sleep(5 * (deneme + 1))
    return ""


def kartlar(s):
    out = []
    for m in re.finditer(r'<a href="(https://[^"]+/dokuman/[^"]+/(\d+))"><h2>(.*?)</h2></a>([\s\S]*?)class="indirBtn"', s):
        govde = m.group(4)
        al = lambda p: (re.search(p, govde) or [None, ""])[1].strip()
        dosya = re.findall(r'<li><a href="([^"]+)" target="_blank"\s*$', govde[-400:], re.M) or re.findall(r'href="(https://[^"]+/assets/upload/dosyalar/[^"]+)"', govde)
        out.append({
            "id": int(m.group(2)), "sayfa": m.group(1), "baslik": html.unescape(m.group(3)).strip(),
            "boyut": al(r'boxFileSize">([^<]*)<'), "yil": al(r"Yay[ıi]n Y[ıi]l[ıi] : (\d{4})"),
            "kategori": html.unescape(al(r'sBoxCat">([^<]*)<')),
            "hazirlayan": html.unescape(al(r"Koordinat[^<]*</span><h3>([^<]*)</h3>")),
            "dosya": dosya[-1] if dosya else "",
        })
    return out


def tumu(ek):
    sonuc, sayfa = {}, 1
    while True:
        ks = kartlar(getir(ek + [("limit", "100"), ("page", str(sayfa))]))
        yeni = [k for k in ks if k["id"] not in sonuc]
        for k in yeni:
            sonuc[k["id"]] = k
        # Yalnızca YENİ kart kalmayınca dur. `len(ks) < 100` ile durmak, tek bir kartı
        # ayrıştıramayan sayfada taramayı kesiyordu (ölçüldü: 499 belgede, 31 kurumun 9'unda durdu).
        if not yeni:
            return sonuc
        sayfa += 1


ilk = getir([])
def secenekler(ad):
    return [(v, html.unescape(re.sub(r"<[^>]+>", "", t)).strip()) for v, t in
            re.findall(r'name="%s\[\]"[^>]*value="(\d+)"[^>]*>([\s\S]{0,200}?)</(?:label|li|div)' % ad, ilk)]

iller, ajanslar = secenekler("illerArr"), secenekler("ajanslarArr")
print("il seçeneği", len(iller), "ajans seçeneği", len(ajanslar), file=sys.stderr)
belgeler = tumu([])
print("belge", len(belgeler), file=sys.stderr)
for b in belgeler.values():
    b["iller"], b["ajanslar"] = [], []
for alan, liste, param in (("iller", iller, "illerArr[]"), ("ajanslar", ajanslar, "ajanslarArr[]")):
    for v, ad in dict(liste).items():
        for i in tumu([(param, v)]):
            if i in belgeler:
                belgeler[i][alan].append(ad)
        print(alan, ad, file=sys.stderr)
json.dump({"iller": iller, "ajanslar": ajanslar, "belgeler": list(belgeler.values())}, open(sys.argv[1], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
