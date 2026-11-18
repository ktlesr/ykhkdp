# docs/veri/manifest.json — her kaynak yalnızca KENDİ önekindeki girdileri değiştirir.
import json, pathlib

YOL = pathlib.Path(__file__).resolve().parents[2] / "docs" / "veri" / "manifest.json"


def manifeste_yaz(onek, girdiler):
    eski = json.loads(YOL.read_text("utf-8")) if YOL.exists() else []
    yeni = [g for g in eski if not g["dosya"].startswith(onek)] + girdiler
    yeni.sort(key=lambda g: g["dosya"])
    YOL.write_text(json.dumps(yeni, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
