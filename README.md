# Brauchwasserwärmepumpen im Vergleich

Vergleichsseite für Brauchwasser-/Trinkwasserwärmepumpen: Effizienz, Preis, Ausstattung,
Kesselmaterial und Anodenart — mit einem Kostenrechner und einer Vergleichsansicht.

**Seite:** https://BENUTZERNAME.github.io/brauchwasser-wp-vergleich/

## Warum es diese Seite gibt

Hersteller geben ihre Leistungszahlen bei unterschiedlichen Lufttemperaturen an: die einen
bei A20 (warme Raumluft), die anderen bei A7 oder A14. Wer diese Zahlen in eine Spalte
schreibt, vergleicht Äpfel mit Birnen — ein A20-Gerät sieht dann zwangsläufig besser aus.

Deshalb speichert dieser Datensatz die Werte **getrennt nach Messbasis** (`cop_a7`,
`cop_a14`, `cop_a15`, `cop_a20`, `eta_wh`). Auf der Seite lässt sich die Basis umschalten;
Geräte ohne den jeweiligen Wert rutschen ans Ende statt sich nach vorne zu mogeln.

## Datenquelle

Alle Daten liegen in **einer** Datei: [`public/data/modelle.json`](public/data/modelle.json).
Die Webseite ist nur eine Ansicht darauf.

| Feld | Bedeutung |
|---|---|
| `id` | eindeutiger Schlüssel (Kleinbuchstaben, Bindestriche) |
| `name`, `marke`, `bauart` | `bodenstehend`, `wandhaengend` oder `split` |
| `volumen_l` | Speicherinhalt in Litern |
| `eta_wh` | Warmwasserbereitungs-Energieeffizienz in % (ErP-Deklaration) |
| `cop_a7` … `cop_a20` | COP bei der jeweiligen Lufteintrittstemperatur |
| `cop_unspezifisch` | COP ohne angegebene Prüfbedingung |
| `scop_basis` | worauf sich der ursprüngliche Tabellenwert bezog |
| `eff_klasse` | ErP-Klasse `A+++` … `G` |
| `preis_eur` | Händlerpreis inkl. MwSt. zum Stand der Erhebung |
| `waermetauscher` | `{ vorhanden, variante, flaeche_m2 }` |
| `kessel_material`, `anode` | Korrosionsschutz |
| `quelle` | woher die Werte stammen, inkl. Messbedingung |

`null` heißt immer: **Hersteller veröffentlicht den Wert nicht** — nicht „null".

## Neues Modell eintragen

### Variante 1 — direkt auf GitHub (empfohlen)

1. [`public/data/modelle.json`](public/data/modelle.json) öffnen, Stift-Symbol klicken
2. Neues Objekt im Array `modelle` ergänzen:

```json
{
  "id": "marke-modellbezeichnung",
  "name": "Marke Modellbezeichnung",
  "marke": "Marke",
  "bauart": "bodenstehend",
  "volumen_l": 250,
  "eta_wh": 135,
  "cop_a7": 3.1,
  "cop_a14": 3.5,
  "eff_klasse": "A+",
  "schallleistung_db": 52,
  "kaeltemittel": "R-290",
  "preis_eur": 1899,
  "heizstab_w": 1500,
  "kessel_material": "Stahl emailliert",
  "anode": "Magnesium-Opferanode",
  "waermetauscher": { "vorhanden": true, "variante": "C", "flaeche_m2": 1.0 },
  "quelle": "herstellerseite.de (COP A14/W55)"
}
```

3. Commit — GitHub Actions prüft das Schema und veröffentlicht die Seite neu (~1 Minute).

Nicht bekannte Werte einfach weglassen oder auf `null` setzen. Pflicht sind nur
`id`, `name`, `marke`, `bauart` und `volumen_l`.

### Variante 2 — aus Excel

```bash
python3 scripts/xlsx_to_json.py meine_tabelle.xlsx public/data/modelle.json
```

## Favoriten

Sterne auf der Seite werden zunächst im Browser gespeichert. Über den Button
**favoriten.json** wird die Liste exportiert; die Datei ersetzt
`public/data/favoriten.json` im Repo — damit sind die Favoriten auf allen Geräten gleich.

## Lokal entwickeln

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # Produktionsbuild nach dist/
python3 scripts/validate.py      # Daten prüfen (braucht: pip install jsonschema)
python3 scripts/json_to_xlsx.py  # Excel-Export erzeugen
```

## Einrichtung von GitHub Pages

Einmalig nach dem ersten Push: **Settings → Pages → Source: GitHub Actions**.
Der Workflow [`deploy.yml`](.github/workflows/deploy.yml) baut und veröffentlicht
danach bei jedem Push auf `main`.

## Hinweise zu den Daten

- **Preise** sind Momentaufnahmen einzelner Händler und veralten schnell.
- **Effizienzklassen** hängen vom Lastprofil ab: Dieselbe ηwh ergibt bei einem 300-L-Gerät
  (Profil XL) eine schlechtere Klasse als bei einem 120-L-Gerät (Profil M). Die Klasse
  taugt deshalb nicht zum Vergleich über Größenklassen hinweg — die Leistungszahl schon.
- `scripts/validate.py` meldet Abweichungen zwischen eingetragener Klasse und dem Wert,
  der sich aus ηwh und geschätztem Lastprofil ergibt.

## Lizenz

Code: MIT. Die Gerätedaten stammen aus öffentlichen Hersteller- und Händlerangaben sowie
der österreichischen GET-Produktdatenbank und sind ohne Gewähr.
