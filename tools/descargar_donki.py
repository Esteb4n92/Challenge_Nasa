"""Descarga eventos solares reales de DONKI (NASA) y los guarda en data/donki.json.

Uso:   python tools/descargar_donki.py 2024-05-01 2024-05-31
Clave: variable de entorno NASA_API_KEY (gratis en https://api.nasa.gov) o DEMO_KEY.
Guarda las 3 CME mas rapidas y hasta 2 SEP del periodo, para no saturar los 30 soles del juego.
"""
import json
import os
import sys
import urllib.request
from pathlib import Path

inicio, fin = sys.argv[1:3] if len(sys.argv) > 2 else ("2024-05-01", "2024-05-31")
clave = os.environ.get("NASA_API_KEY", "DEMO_KEY")


def pedir(tipo):
    url = f"https://api.nasa.gov/DONKI/{tipo}?startDate={inicio}&endDate={fin}&api_key={clave}"
    with urllib.request.urlopen(url, timeout=60) as r:
        return json.load(r) or []


def velocidad(cme):
    analisis = cme.get("cmeAnalyses") or []
    mejor = next((a for a in analisis if a.get("isMostAccurate")), analisis[0] if analisis else {})
    return mejor.get("speed") or 0


cmes = sorted(pedir("CME"), key=velocidad, reverse=True)[:3]
seps = pedir("SEP")[:2]
eventos = [{"tipo": "CME", "fecha": c["startTime"], "id": c["activityID"], "velocidad": velocidad(c)} for c in cmes]
eventos += [{"tipo": "SEP", "fecha": s["eventTime"], "id": s["sepID"]} for s in seps]
eventos.sort(key=lambda e: e["fecha"])

salida = Path(__file__).resolve().parent.parent / "data" / "donki.json"
salida.write_text(json.dumps({
    "inicio": inicio, "fin": fin,
    "fuente": "https://kauai.ccmc.gsfc.nasa.gov/DONKI/",
    "eventos": eventos,
}, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"{len(eventos)} eventos guardados en {salida}")
