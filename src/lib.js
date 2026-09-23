// Hilfsfunktionen: COP-Auswahl, Kostenrechnung, Formatierung, Export

export const BASEN = [
  { id: 'auto', label: 'Bester verfügbarer Wert', kurz: 'auto' },
  { id: 'eta_wh', label: 'ηwh (ErP-Deklaration)', kurz: 'ηwh' },
  { id: 'cop_a20', label: 'COP bei A20 (Raumluft)', kurz: 'A20' },
  { id: 'cop_a15', label: 'COP bei A15', kurz: 'A15' },
  { id: 'cop_a14', label: 'COP bei A14', kurz: 'A14' },
  { id: 'cop_a7', label: 'COP bei A7 (kalte Luft)', kurz: 'A7' },
]

// Reihenfolge für den Auto-Modus: ηwh zuerst, dann von warm nach kalt
const AUTO_REIHE = ['eta_wh', 'cop_a20', 'cop_a15', 'cop_a14', 'cop_a7', 'cop_unspezifisch']

/** Liefert { wert, basis } für ein Modell unter der gewählten Basis. */
export function leistungszahl(modell, basis, scopFaktor = 2.5) {
  const ausEta = (m) => (m.eta_wh ? +(m.eta_wh / 100 * scopFaktor).toFixed(3) : null)

  if (basis === 'auto') {
    for (const feld of AUTO_REIHE) {
      const wert = feld === 'eta_wh' ? ausEta(modell) : modell[feld]
      if (wert != null) return { wert, basis: feld }
    }
    return { wert: null, basis: null }
  }
  if (basis === 'eta_wh') {
    const wert = ausEta(modell)
    return { wert, basis: wert != null ? 'eta_wh' : null }
  }
  const wert = modell[basis]
  return { wert: wert ?? null, basis: wert != null ? basis : null }
}

export function basisKurz(feld) {
  if (feld === 'cop_unspezifisch') return 'k. A.'
  return BASEN.find((b) => b.id === feld)?.kurz ?? '–'
}

/** Wärmekosten je kWh und Jahreskosten aus Leistungszahl, Strompreis und Bedarf. */
export function kosten(wert, strompreis, bedarf) {
  if (!wert) return { proKwh: null, proJahr: null }
  return { proKwh: strompreis / wert, proJahr: (bedarf * strompreis) / wert }
}

export const VOLUMENKLASSEN = [
  { id: 'alle', label: 'alle Größen', test: () => true },
  { id: 'klein', label: 'bis 150 L', test: (v) => v != null && v <= 150 },
  { id: '200', label: '200er (180–229 L)', test: (v) => v >= 180 && v <= 229 },
  { id: '250', label: '250er (230–269 L)', test: (v) => v >= 230 && v <= 269 },
  { id: '300', label: '300er (270–330 L)', test: (v) => v >= 270 && v <= 330 },
  { id: 'gross', label: 'über 330 L', test: (v) => v > 330 },
]

export const fmt = {
  zahl: (v, n = 2) => (v == null ? '–' : v.toLocaleString('de-DE', { minimumFractionDigits: n, maximumFractionDigits: n })),
  euro: (v) => (v == null ? '–' : v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })),
  euroGenau: (v) => (v == null ? '–' : v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 3, maximumFractionDigits: 3 })),
  liter: (v) => (v == null ? '–' : `${v.toLocaleString('de-DE')} L`),
  watt: (v) => (v == null ? '–' : `${v.toLocaleString('de-DE')} W`),
  db: (v) => (v == null ? '–' : `${v.toLocaleString('de-DE')} dB(A)`),
  text: (v) => (v == null || v === '' ? '–' : v),
}

/** CSV mit Semikolon und deutschem Dezimalkomma – öffnet sauber in Excel. */
export function alsCsv(modelle, basis, strompreis, bedarf, scopFaktor) {
  const kopf = ['Modell', 'Marke', 'Bauart', 'Volumen (L)', 'Leistungszahl', 'Basis', 'ηwh (%)',
    'Effizienzklasse', 'Schallleistung dB(A)', 'Kältemittel', 'Preis (EUR)', 'Wärmetauscher',
    'Heizstab (W)', 'Kesselmaterial', 'Anode', 'Wärmekosten (EUR/kWh)', 'Jahreskosten (EUR/a)']
  const zelle = (v) => {
    if (v == null) return ''
    const s = String(v).replace(/"/g, '""')
    return /[;"\n]/.test(s) ? `"${s}"` : s
  }
  const komma = (v, n) => (v == null ? '' : v.toFixed(n).replace('.', ','))

  const zeilen = modelle.map((m) => {
    const { wert, basis: b } = leistungszahl(m, basis, scopFaktor)
    const k = kosten(wert, strompreis, bedarf)
    return [m.name, m.marke, m.bauart, m.volumen_l, komma(wert, 2), basisKurz(b),
      komma(m.eta_wh, 1), m.eff_klasse, komma(m.schallleistung_db, 1), m.kaeltemittel,
      komma(m.preis_eur, 2),
      m.waermetauscher?.vorhanden == null ? '' : m.waermetauscher.vorhanden
        ? `ja${m.waermetauscher.variante ? ` (${m.waermetauscher.variante})` : ''}` : 'nein',
      m.heizstab_w, m.kessel_material, m.anode, komma(k.proKwh, 4), komma(k.proJahr, 0),
    ].map(zelle).join(';')
  })
  return '﻿' + [kopf.join(';'), ...zeilen].join('\r\n')
}

export function herunterladen(inhalt, dateiname, typ = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([inhalt], { type: typ }))
  const a = document.createElement('a')
  a.href = url
  a.download = dateiname
  a.click()
  URL.revokeObjectURL(url)
}
