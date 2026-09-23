#!/usr/bin/env python3
"""Prüft public/data/modelle.json gegen schema.json und auf inhaltliche Stolpersteine.

Läuft bei jedem Push über GitHub Actions – so landet kein kaputter Datensatz auf der Seite.
"""
import json
import sys
from collections import Counter
from pathlib import Path

try:
    from jsonschema import Draft202012Validator
except ImportError:
    sys.exit("jsonschema fehlt:  pip install jsonschema")

WURZEL = Path(__file__).resolve().parent.parent
DATEN = WURZEL / "public" / "data" / "modelle.json"
FAVORITEN = WURZEL / "public" / "data" / "favoriten.json"
SCHEMA = WURZEL / "schema.json"

# Effizienzklassen-Schwellen nach EU 812/2013, Anhang II, Tabelle 1
SCHWELLEN = {
    "M":  [(163, "A+++"), (130, "A++"), (100, "A+"), (65, "A"), (39, "B")],
    "L":  [(188, "A+++"), (150, "A++"), (115, "A+"), (75, "A"), (50, "B")],
    "XL": [(200, "A+++"), (160, "A++"), (123, "A+"), (80, "A"), (55, "B")],
}


def erwartete_klasse(eta, volumen):
    if eta is None or volumen is None:
        return None
    profil = "M" if volumen < 150 else ("L" if volumen <= 250 else "XL")
    for grenze, klasse in SCHWELLEN[profil]:
        if eta >= grenze:
            return klasse, profil
    return "C", profil


def main():
    daten = json.loads(DATEN.read_text(encoding="utf-8"))
    schema = json.loads(SCHEMA.read_text(encoding="utf-8"))

    fehler = []
    for f in Draft202012Validator(schema).iter_errors(daten):
        pfad = "/".join(str(p) for p in f.absolute_path)
        fehler.append(f"Schema: {pfad or '(Wurzel)'} – {f.message}")

    modelle = daten.get("modelle", [])

    doppelt = [i for i, n in Counter(m["id"] for m in modelle).items() if n > 1]
    if doppelt:
        fehler.append(f"Doppelte IDs: {', '.join(doppelt)}")

    if FAVORITEN.exists():
        favs = json.loads(FAVORITEN.read_text(encoding="utf-8")).get("favoriten", [])
        bekannt = {m["id"] for m in modelle}
        unbekannt = [f for f in favs if f not in bekannt]
        if unbekannt:
            fehler.append(f"Favoriten verweisen auf unbekannte IDs: {', '.join(unbekannt)}")

    warnungen = []
    for m in modelle:
        if not any(m.get(f) is not None for f in
                   ("eta_wh", "cop_a7", "cop_a14", "cop_a15", "cop_a20", "cop_unspezifisch")):
            warnungen.append(f"{m['name']}: kein einziger Effizienzwert")
        erwartet = erwartete_klasse(m.get("eta_wh"), m.get("volumen_l"))
        if erwartet and m.get("eff_klasse") and erwartet[0] != m["eff_klasse"]:
            warnungen.append(
                f"{m['name']}: Klasse {m['eff_klasse']}, aus ηwh {m['eta_wh']} % "
                f"bei Lastprofil {erwartet[1]} erwartet: {erwartet[0]}"
            )

    print(f"{len(modelle)} Modelle geprüft.")
    for w in warnungen:
        print(f"  Hinweis: {w}")
    if fehler:
        print("\nFEHLER:")
        for f in fehler:
            print(f"  {f}")
        return 1
    print("Keine Fehler.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
