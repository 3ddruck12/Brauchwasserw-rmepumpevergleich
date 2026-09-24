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

/** Nur ηwh/Lastprofil zählt in der ErP-Rangliste – A20, A15 und k. A. nicht. */
export function erpVergleichbar(modell) {
  return modell?.eta_wh != null
}

/** Wärmekosten je kWh und Jahreskosten aus Leistungszahl, Strompreis und Bedarf. */
export function kosten(wert, strompreis, bedarf) {
  if (!wert) return { proKwh: null, proJahr: null }
  return { proKwh: strompreis / wert, proJahr: (bedarf * strompreis) / wert }
}

export const BAUARTEN = [
  { id: 'bodenstehend', label: 'bodenstehend' },
  { id: 'wandhaengend', label: 'wandhängend' },
  { id: 'ohne_kessel', label: 'ohne Kessel' },
  { id: 'split', label: 'Split' },
]

export function bauartLabel(id) {
  return BAUARTEN.find((b) => b.id === id)?.label ?? id
}

/** Kältemittel, die unter der EU-F-Gase-Verordnung auslaufen bzw. stark eingeschränkt werden. */
const KAELTE_AUSLAUF = new Set(['r-134a', 'r134a'])

export function kaeltemittelLaeuftAus(wert) {
  const k = (wert || '').toString().trim().toLowerCase().replace(/[\s-]+/g, '')
  return KAELTE_AUSLAUF.has(k)
}

export function luftbereich(m) {
  if (m.luft_min_c == null && m.luft_max_c == null) return null
  const t = (v) => `${v > 0 ? '+' : ''}${v}`
  if (m.luft_min_c == null) return `bis ${t(m.luft_max_c)} °C`
  if (m.luft_max_c == null) return `ab ${t(m.luft_min_c)} °C`
  return `${t(m.luft_min_c)} bis ${t(m.luft_max_c)} °C`
}

export const VOLUMENKLASSEN = [
  { id: 'alle', label: 'alle Größen', test: () => true },
  { id: 'klein', label: 'bis 150 L', test: (v) => v != null && v <= 150 },
  { id: '200', label: '200er (160–229 L)', test: (v) => v >= 160 && v <= 229 },
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
  kw: (v) => (v == null ? '–' : `${v.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kW`),
  grad: (v) => (v == null ? '–' : `${v.toLocaleString('de-DE')} °C`),
  kg: (v) => (v == null ? '–' : `${v.toLocaleString('de-DE')} kg`),
  text: (v) => (v == null || v === '' ? '–' : v),
}

const EXPORT_KOPF = [
  'Modell', 'Marke', 'Bauart', 'Volumen (L)', 'Leistungszahl', 'Basis', 'ηwh (%)',
  'Effizienzklasse', 'Schallleistung dB(A)', 'Kältemittel', 'Preis (EUR)', 'Wärmetauscher',
  'Heizstab (W)', 'Kesselmaterial', 'Anode', 'SG Ready', 'Smart Home',
  'Wärmekosten (EUR/kWh)', 'Jahreskosten (EUR/a)',
]

export function wtText(m) {
  const wt = m.waermetauscher
  if (!wt || wt.vorhanden == null) return null
  if (!wt.vorhanden) return 'nein'
  const teile = [
    wt.variante,
    wt.flaeche_m2 != null ? `${String(wt.flaeche_m2.toFixed(2)).replace('.', ',')} m²` : null,
  ].filter(Boolean)
  return teile.length ? `ja (${teile.join(', ')})` : 'ja'
}

export function sgReadyText(m) {
  if (m.sg_ready == null) return null
  return m.sg_ready ? 'ja' : 'nein'
}

function anschlussTeil(wert, ja, optional) {
  if (wert === true) return ja
  if (wert === 'optional') return optional
  return null
}

export function smartHomeText(m) {
  const s = m.smart_home
  if (!s) return null
  if (typeof s === 'string') return s
  const teile = [
    anschlussTeil(s.wifi, 'WLAN', 'WLAN (optional)'),
    s.app ? `App (${s.app})` : null,
    anschlussTeil(s.modbus, 'Modbus', 'Modbus (optional)'),
    s.anschluesse,
  ].filter(Boolean)
  return teile.length ? teile.join(', ') : null
}

function exportZeilen(modelle, basis, strompreis, bedarf, scopFaktor) {
  return modelle.map((m) => {
    const { wert, basis: b } = leistungszahl(m, basis, scopFaktor)
    const k = kosten(wert, strompreis, bedarf)
    return [
      m.name, m.marke, m.bauart, m.volumen_l, wert, basisKurz(b), m.eta_wh,
      m.eff_klasse, m.schallleistung_db, m.kaeltemittel, m.preis_eur, wtText(m),
      m.heizstab_w, m.kessel_material, m.anode, sgReadyText(m), smartHomeText(m),
      k.proKwh, k.proJahr,
    ]
  })
}

const ZAHL_STELLEN = [null, null, null, 0, 2, null, 1, null, 1, null, 2, null, 0, null, null, null, null, 4, 0]

function zahlAlsText(v, stellen) {
  if (v == null || v === '') return ''
  if (typeof v === 'number' && stellen != null) return v.toFixed(stellen).replace('.', ',')
  return String(v)
}

/** CSV mit Semikolon und deutschem Dezimalkomma – öffnet sauber in Excel. */
export function alsCsv(modelle, basis, strompreis, bedarf, scopFaktor) {
  const zelle = (v) => {
    if (v == null || v === '') return ''
    const s = String(v).replace(/"/g, '""')
    return /[;"\n]/.test(s) ? `"${s}"` : s
  }
  const zeilen = exportZeilen(modelle, basis, strompreis, bedarf, scopFaktor).map((z) =>
    z.map((v, i) => zelle(zahlAlsText(v, ZAHL_STELLEN[i]))).join(';'))
  return `\uFEFF${[EXPORT_KOPF.join(';'), ...zeilen].join('\r\n')}`
}

export function alsXlsx(modelle, basis, strompreis, bedarf, scopFaktor) {
  const zeilen = exportZeilen(modelle, basis, strompreis, bedarf, scopFaktor)
  const xmlZelle = (wert, spalte, zeile) => {
    const ref = `${spaltenName(spalte)}${zeile}`
    if (wert == null || wert === '') return `<c r="${ref}"/>`
    if (typeof wert === 'number' && Number.isFinite(wert)) {
      return `<c r="${ref}"><v>${wert}</v></c>`
    }
    return `<c r="${ref}" t="inlineStr"><is><t>${xmlText(wert)}</t></is></c>`
  }
  const xmlZeile = (werte, nr) =>
    `<row r="${nr}">${werte.map((v, i) => xmlZelle(v, i, nr)).join('')}</row>`
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>
${xmlZeile(EXPORT_KOPF, 1)}
${zeilen.map((z, i) => xmlZeile(z, i + 2)).join('\n')}
</sheetData>
</worksheet>`
  const bytes = zipStore([
    ['[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`],
    ['_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`],
    ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Vergleich" sheetId="1" r:id="rId1"/></sheets>
</workbook>`],
    ['xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`],
    ['xl/worksheets/sheet1.xml', sheet],
  ])
  return new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export async function alsPdf(modelle, basis, strompreis, bedarf, scopFaktor) {
  const [{ jsPDF }, autoTableMod] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const zeilen = exportZeilen(modelle, basis, strompreis, bedarf, scopFaktor).map((z) =>
    z.map((v, i) => zahlAlsText(v, ZAHL_STELLEN[i]) || '–'))
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4', unit: 'mm' })
  doc.setFontSize(12)
  doc.text('Brauchwasserwärmepumpen im Vergleich', 10, 10)
  autoTableMod.default(doc, {
    head: [EXPORT_KOPF],
    body: zeilen,
    startY: 14,
    styles: { fontSize: 6.5, cellPadding: 0.8 },
    headStyles: { fillColor: [26, 95, 138], textColor: 255, fontStyle: 'bold' },
    margin: { left: 8, right: 8, bottom: 8 },
  })
  return doc.output('blob')
}

export function herunterladen(inhalt, dateiname, typ = 'text/csv;charset=utf-8') {
  const blob = inhalt instanceof Blob ? inhalt : new Blob([inhalt], { type: typ })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = dateiname
  a.click()
  URL.revokeObjectURL(url)
}

function xmlText(wert) {
  return String(wert)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function spaltenName(index) {
  let n = index + 1
  let name = ''
  while (n > 0) {
    const rest = (n - 1) % 26
    name = String.fromCharCode(65 + rest) + name
    n = Math.floor((n - 1) / 26)
  }
  return name
}

const CRC_TABELLE = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  CRC_TABELLE[n] = c >>> 0
}

function crc32(bytes) {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABELLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function u16(n) {
  const b = new Uint8Array(2)
  new DataView(b.buffer).setUint16(0, n, true)
  return b
}

function u32(n) {
  const b = new Uint8Array(4)
  new DataView(b.buffer).setUint32(0, n, true)
  return b
}

function zusammen(...teile) {
  const out = new Uint8Array(teile.reduce((n, t) => n + t.length, 0))
  let o = 0
  for (const t of teile) { out.set(t, o); o += t.length }
  return out
}

function zipStore(dateien) {
  const enc = new TextEncoder()
  const lokale = []
  const zentral = []
  let offset = 0
  for (const [name, inhalt] of dateien) {
    const nameB = enc.encode(name)
    const data = typeof inhalt === 'string' ? enc.encode(inhalt) : inhalt
    const crc = crc32(data)
    const local = zusammen(
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length),
      u16(nameB.length), u16(0), nameB, data,
    )
    lokale.push(local)
    zentral.push(zusammen(
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length),
      u16(nameB.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset),
      nameB,
    ))
    offset += local.length
  }
  const verzeichnis = zusammen(...zentral)
  return zusammen(...lokale, verzeichnis,
    u32(0x06054b50), u16(0), u16(0),
    u16(dateien.length), u16(dateien.length),
    u32(verzeichnis.length), u32(offset), u16(0))
}
