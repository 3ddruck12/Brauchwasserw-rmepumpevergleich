import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BASEN, BAUARTEN, VOLUMENKLASSEN, leistungszahl, basisKurz, kosten, fmt,
  bauartLabel, luftbereich, kaeltemittelLaeuftAus, alsCsv, alsXlsx, alsPdf, herunterladen,
} from './lib.js'

const SPEICHER_SCHLUESSEL = 'bwwp-favoriten'
const THEME_SCHLUESSEL = 'bwwp-theme'

function systemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function themeLesen() {
  const gespeichert = localStorage.getItem(THEME_SCHLUESSEL)
  return gespeichert === 'light' || gespeichert === 'dark' ? gespeichert : systemTheme()
}

function themeAnwenden(theme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

// Schnellzugriffe wie die Reiter in der Excel-Tabelle
const ANSICHTEN = [
  { id: 'alle', label: 'Alle Geräte', filter: { bauart: 'alle', volumenklasse: 'alle', nurFavoriten: false } },
  { id: '200', label: '200er-Klasse', filter: { bauart: 'bodenstehend', volumenklasse: '200', nurFavoriten: false } },
  { id: '250', label: '250er-Klasse', filter: { bauart: 'bodenstehend', volumenklasse: '250', nurFavoriten: false } },
  { id: '300', label: '300er-Klasse', filter: { bauart: 'bodenstehend', volumenklasse: '300', nurFavoriten: false } },
  { id: 'gross', label: 'große Speicher', filter: { bauart: 'bodenstehend', volumenklasse: 'gross', nurFavoriten: false } },
  { id: 'wand', label: 'Wandgeräte', filter: { bauart: 'wandhaengend', volumenklasse: 'alle', nurFavoriten: false } },
  { id: 'ohne_kessel', label: 'ohne Kessel', filter: { bauart: 'ohne_kessel', volumenklasse: 'alle', nurFavoriten: false } },
  { id: 'favoriten', label: 'Favoriten', filter: { bauart: 'alle', volumenklasse: 'alle', nurFavoriten: true } },
]

const SPALTEN = [
  { id: 'name', label: 'Modell', breit: true },
  { id: 'volumen_l', label: 'Liter', num: true },
  { id: 'leistung', label: 'Leistungszahl', num: true },
  { id: 'eff_klasse', label: 'Klasse' },
  { id: 'preis_eur', label: 'Preis', num: true },
  { id: 'jahreskosten', label: '€/Jahr', num: true },
  { id: 'schallleistung_db', label: 'Schall', num: true },
  { id: 'kaeltemittel', label: 'Kältemittel' },
  { id: 'waermetauscher', label: 'WT' },
  { id: 'heizstab_w', label: 'Heizstab', num: true },
  { id: 'kessel_material', label: 'Kessel' },
  { id: 'anode', label: 'Anode' },
]

const SPALTEN_OHNE_KESSEL = [
  { id: 'name', label: 'Modell', breit: true },
  { id: 'leistung', label: 'COP', num: true },
  { id: 'waermeleistung_kw', label: 'Wärmeleistung', num: true },
  { id: 'el_leistung_kw', label: 'el. Leistung', num: true },
  { id: 'ww_max_c', label: 'WW max.', num: true },
  { id: 'luftbereich', label: 'Luftbereich' },
  { id: 'luftvolumen_m3h', label: 'Luftvolumen', num: true },
  { id: 'schallleistung_db', label: 'Schall', num: true },
  { id: 'kaeltemittel', label: 'Kältemittel' },
  { id: 'abmessung_mm', label: 'Abmessung' },
  { id: 'gewicht_kg', label: 'Gewicht', num: true },
]

export default function App() {
  const [daten, setDaten] = useState(null)
  const [fehler, setFehler] = useState(null)
  const [favoriten, setFavoriten] = useState([])
  const [theme, setTheme] = useState(() => (typeof document === 'undefined' ? 'light' : themeLesen()))

  const [basis, setBasis] = useState('auto')
  const [strompreis, setStrompreis] = useState(0.30)
  const [bedarf, setBedarf] = useState(2000)

  const [suche, setSuche] = useState('')
  const [bauart, setBauart] = useState('alle')
  const [volumenklasse, setVolumenklasse] = useState('alle')
  const [kaeltemittel, setKaeltemittel] = useState('alle')
  const [wtFilter, setWtFilter] = useState('alle')
  const [nurMitPreis, setNurMitPreis] = useState(false)
  const [nurFavoriten, setNurFavoriten] = useState(false)

  const [sortierung, setSortierung] = useState({ spalte: 'leistung', ab: true })
  const [vergleich, setVergleich] = useState([])
  const [hinweiseOffen, setHinweiseOffen] = useState(false)
  const [exportOffen, setExportOffen] = useState(false)
  const [kaelteWarnungOffen, setKaelteWarnungOffen] = useState(false)

  useEffect(() => {
    const basePath = import.meta.env.BASE_URL
    Promise.all([
      fetch(`${basePath}data/modelle.json`, { cache: 'no-store' }).then((r) => r.json()),
      fetch(`${basePath}data/favoriten.json`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { favoriten: [] })).catch(() => ({ favoriten: [] })),
    ])
      .then(([m, f]) => {
        setDaten(m)
        const lokal = JSON.parse(localStorage.getItem(SPEICHER_SCHLUESSEL) || 'null')
        setFavoriten(lokal ?? f.favoriten ?? [])
      })
      .catch((e) => setFehler(String(e)))
  }, [])

  useEffect(() => {
    if (daten) localStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(favoriten))
  }, [favoriten, daten])

  useEffect(() => {
    themeAnwenden(theme)
    localStorage.setItem(THEME_SCHLUESSEL, theme)
  }, [theme])

  const scopFaktor = daten?.scop_faktor ?? 2.5

  const kaeltemittelListe = useMemo(() => {
    if (!daten) return []
    return [...new Set(daten.modelle.map((m) => m.kaeltemittel).filter(Boolean))].sort()
  }, [daten])

  const gefiltert = useMemo(() => {
    if (!daten) return []
    const klasse = VOLUMENKLASSEN.find((v) => v.id === volumenklasse)
    const suchbegriff = suche.trim().toLowerCase()
    return daten.modelle.filter((m) => {
      if (suchbegriff && !`${m.name} ${m.marke}`.toLowerCase().includes(suchbegriff)) return false
      if (bauart !== 'alle' && m.bauart !== bauart) return false
      if (volumenklasse !== 'alle' && !klasse.test(m.volumen_l)) return false
      if (kaeltemittel !== 'alle' && m.kaeltemittel !== kaeltemittel) return false
      if (wtFilter === 'ja' && m.waermetauscher?.vorhanden !== true) return false
      if (wtFilter === 'nein' && m.waermetauscher?.vorhanden !== false) return false
      if (nurMitPreis && m.preis_eur == null) return false
      if (nurFavoriten && !favoriten.includes(m.id)) return false
      return true
    })
  }, [daten, suche, bauart, volumenklasse, kaeltemittel, wtFilter, nurMitPreis, nurFavoriten, favoriten])

  const sortiert = useMemo(() => {
    const wertVon = (m) => {
      const { wert } = leistungszahl(m, basis, scopFaktor)
      switch (sortierung.spalte) {
        case 'leistung': return wert
        case 'jahreskosten': return kosten(wert, strompreis, bedarf).proJahr
        case 'name': return m.name.toLowerCase()
        case 'eff_klasse': return m.eff_klasse ? -m.eff_klasse.length : null
        case 'waermetauscher': return m.waermetauscher?.vorhanden ? 1 : 0
        case 'kessel_material':
        case 'anode':
        case 'kaeltemittel':
        case 'abmessung_mm': return (m[sortierung.spalte] || '').toLowerCase()
        case 'luftbereich': return m.luft_min_c
        default: return m[sortierung.spalte]
      }
    }
    return [...gefiltert].sort((a, b) => {
      const x = wertVon(a), y = wertVon(b)
      if (x == null && y == null) return 0
      if (x == null) return 1            // Modelle ohne Wert immer ans Ende
      if (y == null) return -1
      if (typeof x === 'string') return sortierung.ab ? y.localeCompare(x) : x.localeCompare(y)
      return sortierung.ab ? y - x : x - y
    })
  }, [gefiltert, sortierung, basis, strompreis, bedarf, scopFaktor])

  // Zählt, wie viele Geräte hinter jeder Schnellansicht stecken – unabhängig von Suche und Detailfiltern
  const ansichtZaehler = useMemo(() => {
    if (!daten) return {}
    const zaehle = ({ bauart: ba, volumenklasse: vk, nurFavoriten: nf }) => {
      const klasse = VOLUMENKLASSEN.find((v) => v.id === vk)
      return daten.modelle.filter((m) =>
        (ba === 'alle' || m.bauart === ba) &&
        (vk === 'alle' || klasse.test(m.volumen_l)) &&
        (!nf || favoriten.includes(m.id))).length
    }
    return Object.fromEntries(ANSICHTEN.map((a) => [a.id, zaehle(a.filter)]))
  }, [daten, favoriten])

  const ansichtAktiv = (a) =>
    a.filter.bauart === bauart && a.filter.volumenklasse === volumenklasse &&
    a.filter.nurFavoriten === nurFavoriten

  const ansichtWaehlen = (a) => {
    setBauart(a.filter.bauart)
    setVolumenklasse(a.filter.volumenklasse)
    setNurFavoriten(a.filter.nurFavoriten)
  }

  const sortieren = (spalte) =>
    setSortierung((s) => (s.spalte === spalte ? { spalte, ab: !s.ab } : { spalte, ab: true }))

  const favUmschalten = (id) =>
    setFavoriten((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))

  const vergleichUmschalten = (id) =>
    setVergleich((v) => (v.includes(id) ? v.filter((x) => x !== id) : v.length < 4 ? [...v, id] : v))

  if (fehler) return <div className="meldung">Daten konnten nicht geladen werden: {fehler}</div>
  if (!daten) return <div className="meldung">Lade Daten …</div>

  const vergleichsModelle = vergleich.map((id) => daten.modelle.find((m) => m.id === id)).filter(Boolean)
  const spalten = bauart === 'ohne_kessel' ? SPALTEN_OHNE_KESSEL : SPALTEN

  return (
    <div className="seite">
      <header>
        <div>
          <h1>Brauchwasserwärmepumpen im Vergleich</h1>
          <p className="unterzeile">
            {daten.modelle.length} Modelle · Stand {daten.stand} ·{' '}
            <a href="https://github.com/" className="quelle-link">Daten ergänzen</a>
          </p>
        </div>
        <ThemeSchieber theme={theme} onChange={setTheme} />
      </header>

      <section className="steuerung">
        <div className="feld">
          <label htmlFor="basis">Vergleichsbasis</label>
          <select id="basis" value={basis} onChange={(e) => setBasis(e.target.value)}>
            {BASEN.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
          <small>
            Hersteller messen bei verschiedenen Lufttemperaturen. Eine feste Basis macht
            die Geräte erst vergleichbar – Modelle ohne diesen Wert rutschen ans Ende.
          </small>
        </div>
        <div className="feld">
          <label htmlFor="strompreis">Strompreis (€/kWh)</label>
          <input id="strompreis" type="number" step="0.01" min="0" value={strompreis}
            onChange={(e) => setStrompreis(parseFloat(e.target.value) || 0)} />
        </div>
        <div className="feld">
          <label htmlFor="bedarf">Warmwasser-Bedarf (kWh/a)</label>
          <input id="bedarf" type="number" step="100" min="0" value={bedarf}
            onChange={(e) => setBedarf(parseFloat(e.target.value) || 0)} />
        </div>
      </section>

      <nav className="ansichten">
        {ANSICHTEN.map((a) => (
          <button key={a.id} onClick={() => ansichtWaehlen(a)}
            className={`reiter ${ansichtAktiv(a) ? 'aktiv' : ''}`}>
            {a.label} <span className="anzahl">{ansichtZaehler[a.id] ?? 0}</span>
          </button>
        ))}
      </nav>

      <section className="filter">
        <input className="suche" type="search" placeholder="Modell oder Marke suchen …"
          value={suche} onChange={(e) => setSuche(e.target.value)} />
        <select value={bauart} onChange={(e) => setBauart(e.target.value)}>
          <option value="alle">Bauart: alle</option>
          {BAUARTEN.filter((b) => b.id !== 'split').map((b) => (
            <option key={b.id} value={b.id}>{b.label}</option>
          ))}
        </select>
        <select value={volumenklasse} onChange={(e) => setVolumenklasse(e.target.value)}>
          {VOLUMENKLASSEN.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
        <span className="kaelte-filter">
          <select
            value={kaeltemittel}
            onChange={(e) => {
              const wert = e.target.value
              setKaeltemittel(wert)
              if (kaeltemittelLaeuftAus(wert)) setKaelteWarnungOffen(true)
            }}
          >
            <option value="alle">Kältemittel: alle</option>
            {kaeltemittelListe.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <button
            type="button"
            className="kaelte-hinweis"
            title="Hinweis zu Kältemitteln und F-Gasen"
            onClick={() => setKaelteWarnungOffen(true)}
          >
            <Warnzeichen />
            <span>F-Gas</span>
          </button>
        </span>
        <select value={wtFilter} onChange={(e) => setWtFilter(e.target.value)}>
          <option value="alle">Wärmetauscher: egal</option>
          <option value="ja">mit Wärmetauscher</option>
          <option value="nein">ohne Wärmetauscher</option>
        </select>
        <label className="haken">
          <input type="checkbox" checked={nurMitPreis} onChange={(e) => setNurMitPreis(e.target.checked)} />
          nur mit Preis
        </label>
        <label className="haken">
          <input type="checkbox" checked={nurFavoriten} onChange={(e) => setNurFavoriten(e.target.checked)} />
          nur Favoriten ({favoriten.length})
        </label>
        <span className="treffer">{sortiert.length} Treffer</span>
        <button type="button" onClick={() => setExportOffen(true)}>Export</button>
        <button onClick={() => herunterladen(
          JSON.stringify({ favoriten }, null, 2), 'favoriten.json', 'application/json')}>
          favoriten.json
        </button>
      </section>

      {vergleichsModelle.length > 0 && (
        <Vergleich modelle={vergleichsModelle} basis={basis} scopFaktor={scopFaktor}
          strompreis={strompreis} bedarf={bedarf} schliessen={() => setVergleich([])}
          onKaelteHinweis={() => setKaelteWarnungOffen(true)} />
      )}

      <div className="tabellenrahmen">
        <table>
          <thead>
            <tr>
              <th className="schmal" title="Favorit">★</th>
              <th className="schmal" title="Zum Vergleich">⇄</th>
              {spalten.map((s) => (
                <th key={s.id} onClick={() => sortieren(s.id)}
                  className={`${s.num ? 'num' : ''} ${s.breit ? 'breit' : ''} sortierbar`}>
                  {s.label}
                  {sortierung.spalte === s.id && <span className="pfeil">{sortierung.ab ? '▼' : '▲'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortiert.map((m) => {
              const { wert, basis: b } = leistungszahl(m, basis, scopFaktor)
              const k = kosten(wert, strompreis, bedarf)
              return (
                <tr key={m.id} className={wert == null ? 'ohne-wert' : ''}>
                  <td className="schmal">
                    <button className={`stern ${favoriten.includes(m.id) ? 'aktiv' : ''}`}
                      onClick={() => favUmschalten(m.id)} title="Als Favorit merken">★</button>
                  </td>
                  <td className="schmal">
                    <input type="checkbox" checked={vergleich.includes(m.id)}
                      onChange={() => vergleichUmschalten(m.id)} title="Vergleichen (max. 4)" />
                  </td>
                  {spalten.map((s) => (
                    <td key={s.id} className={s.breit ? 'breit' : s.num ? 'num' : ''}>
                      {spaltenZelle(m, s.id, {
                        wert, basis: b, jahreskosten: k.proJahr,
                        onKaelteHinweis: () => setKaelteWarnungOffen(true),
                      })}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <footer>
        <button type="button" className="fuss-link" onClick={() => setHinweiseOffen(true)}>Infos</button>
        <span>Stand {daten.stand}</span>
      </footer>

      <Dialog offen={hinweiseOffen} titel="Hinweise" onClose={() => setHinweiseOffen(false)}>
        <p>{daten.quellen_hinweis}</p>
        <p>
          Preise sind Händlerpreise inkl. MwSt. zum genannten Stand und ändern sich laufend.
          Leere Felder heißen: Hersteller veröffentlicht den Wert nicht.
        </p>
        <p>
          Hersteller messen bei verschiedenen Lufttemperaturen. Eine feste Vergleichsbasis
          macht die Geräte erst vergleichbar – Modelle ohne diesen Wert rutschen ans Ende.
        </p>
      </Dialog>

      <Dialog
        offen={kaelteWarnungOffen}
        titel="Kältemittel und F-Gase"
        variant="warnung"
        onClose={() => setKaelteWarnungOffen(false)}
      >
        <p>
          Geräte mit <strong>R-134a</strong> und anderen hoch-GWP-HFKW fallen unter die
          EU-F-Gase-Verordnung (EU) 2024/573. Inverkehrbringen, Nachfüllen und Service
          werden schrittweise eingeschränkt – Ersatz wird teurer, die Geräte verlieren
          an Zukunftssicherheit.
        </p>
        <p>
          Langfristig tragfähig sind vor allem <strong>R-290</strong> (Propan, GWP 3)
          und <strong>R-513A</strong> als Nachfolger von R-134a.
        </p>
        <p className="klein">
          Das Warnzeichen steht hinter jedem auslaufenden Kältemittel. Keine Rechtsberatung –
          maßgeblich sind die jeweils geltenden F-Gase-Regeln.
        </p>
      </Dialog>

      <ExportDialog
        offen={exportOffen}
        anzahl={sortiert.length}
        onClose={() => setExportOffen(false)}
        onExport={async (format) => {
          const name = 'brauchwasserwaermepumpen'
          if (format === 'csv') {
            herunterladen(alsCsv(sortiert, basis, strompreis, bedarf, scopFaktor), `${name}.csv`)
          } else if (format === 'xlsx') {
            herunterladen(alsXlsx(sortiert, basis, strompreis, bedarf, scopFaktor), `${name}.xlsx`)
          } else if (format === 'pdf') {
            herunterladen(await alsPdf(sortiert, basis, strompreis, bedarf, scopFaktor), `${name}.pdf`)
          }
          setExportOffen(false)
        }}
      />
    </div>
  )
}

function Warnzeichen() {
  return (
    <svg className="warnzeichen" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.6 22.4 21H1.6L12 2.6Z" />
      <path className="warnzeichen-strich" d="M12 9v6.2" />
      <circle className="warnzeichen-punkt" cx="12" cy="18.1" r="1.05" />
    </svg>
  )
}

function KaelteZelle({ mittel, onHinweis }) {
  if (!mittel) return '–'
  if (!kaeltemittelLaeuftAus(mittel)) return fmt.text(mittel)
  return (
    <span className="kaelte-zelle">
      {fmt.text(mittel)}
      <button
        type="button"
        className="kaelte-warn"
        title="Bald eingeschränktes Kältemittel – Hinweis öffnen"
        onClick={onHinweis}
      >
        <Warnzeichen />
      </button>
    </span>
  )
}

function Dialog({ offen, titel, onClose, variant, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (offen && !el.open) el.showModal()
    if (!offen && el.open) el.close()
  }, [offen])
  return (
    <dialog
      ref={ref}
      className={`dialog ${variant === 'warnung' ? 'dialog-warnung' : ''}`}
      onClose={onClose}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="dialog-kasten">
        <div className="dialog-kopf">
          {variant === 'warnung' && <Warnzeichen />}
          <h2>{titel}</h2>
          <button type="button" onClick={onClose}>schließen</button>
        </div>
        {children}
      </div>
    </dialog>
  )
}

function ExportDialog({ offen, anzahl, onClose, onExport }) {
  const [laeuft, setLaeuft] = useState(null)
  const waehlen = async (format) => {
    setLaeuft(format)
    try { await onExport(format) }
    finally { setLaeuft(null) }
  }
  return (
    <Dialog offen={offen} titel="Export" onClose={onClose}>
      <p className="klein">Die aktuelle Ansicht ({anzahl} Treffer) als Datei speichern.</p>
      <div className="export-wahl">
        {[
          { id: 'csv', label: 'CSV', text: 'Semikolon-Tabelle, öffnet in Excel und Calc' },
          { id: 'xlsx', label: 'XLSX', text: 'Excel-Arbeitsmappe' },
          { id: 'pdf', label: 'PDF', text: 'Querformat zum Drucken und Weitergeben' },
        ].map((f) => (
          <button key={f.id} type="button" disabled={laeuft != null} onClick={() => waehlen(f.id)}>
            <strong>{laeuft === f.id ? 'Wird erstellt …' : f.label}</strong>
            <small>{f.text}</small>
          </button>
        ))}
      </div>
    </Dialog>
  )
}

function ThemeSchieber({ theme, onChange }) {
  const dunkel = theme === 'dark'
  return (
    <div className="theme-schieber">
      <span data-aktiv={String(!dunkel)}>Hell</span>
      <button
        type="button"
        className="theme-bahn"
        role="switch"
        aria-checked={dunkel}
        aria-label={dunkel ? 'Dunkelmodus, zu Hell wechseln' : 'Hellmodus, zu Dunkel wechseln'}
        onClick={() => onChange(dunkel ? 'light' : 'dark')}
      >
        <span className="theme-knopf" aria-hidden="true" />
      </button>
      <span data-aktiv={String(dunkel)}>Dunkel</span>
    </div>
  )
}

function spaltenZelle(m, id, extra) {
  switch (id) {
    case 'name':
      return (
        <>
          <span className="modellname">{m.name}</span>
          <span className="marke">{m.marke} · {bauartLabel(m.bauart)}</span>
        </>
      )
    case 'volumen_l': return fmt.liter(m.volumen_l)
    case 'leistung':
      return <>{fmt.zahl(extra.wert)} <span className="basis-tag">{basisKurz(extra.basis)}</span></>
    case 'eff_klasse': return fmt.text(m.eff_klasse)
    case 'preis_eur': return fmt.euro(m.preis_eur)
    case 'jahreskosten': return extra.jahreskosten == null ? '–' : fmt.euro(extra.jahreskosten)
    case 'schallleistung_db': return fmt.db(m.schallleistung_db)
    case 'kaeltemittel': return <KaelteZelle mittel={m.kaeltemittel} onHinweis={extra.onKaelteHinweis} />
    case 'waermetauscher': return wtZelle(m)
    case 'heizstab_w': return fmt.watt(m.heizstab_w)
    case 'kessel_material':
    case 'anode': return <span className="klein">{fmt.text(m[id])}</span>
    case 'waermeleistung_kw': return m.waermeleistung || fmt.kw(m.waermeleistung_kw)
    case 'el_leistung_kw': return m.el_leistung || fmt.kw(m.el_leistung_kw)
    case 'ww_max_c': return fmt.grad(m.ww_max_c)
    case 'luftbereich': return fmt.text(luftbereich(m))
    case 'luftvolumen_m3h':
      return m.luftvolumen || (m.luftvolumen_m3h == null ? '–' : `${m.luftvolumen_m3h.toLocaleString('de-DE')} m³/h`)
    case 'abmessung_mm': return fmt.text(m.abmessung_mm)
    case 'gewicht_kg': return fmt.kg(m.gewicht_kg)
    default: return fmt.text(m[id])
  }
}

function wtZelle(m) {
  const wt = m.waermetauscher
  if (!wt || wt.vorhanden == null) return '–'
  if (!wt.vorhanden) return 'nein'
  const teile = [wt.variante, wt.flaeche_m2 ? `${fmt.zahl(wt.flaeche_m2, 2)} m²` : null].filter(Boolean)
  return `ja${teile.length ? ` (${teile.join(', ')})` : ''}`
}

function Vergleich({ modelle, basis, scopFaktor, strompreis, bedarf, schliessen, onKaelteHinweis }) {
  const mini = modelle.some((m) => m.bauart === 'ohne_kessel')
  const zeilen = [
    ['Marke', (m) => m.marke],
    ['Bauart', (m) => bauartLabel(m.bauart)],
    ...(mini ? [
      ['Wärmeleistung', (m) => m.waermeleistung || fmt.kw(m.waermeleistung_kw)],
      ['el. Leistung', (m) => m.el_leistung || fmt.kw(m.el_leistung_kw)],
      ['WW max.', (m) => fmt.grad(m.ww_max_c)],
      ['Luftbereich', (m) => fmt.text(luftbereich(m))],
      ['Luftvolumen', (m) => m.luftvolumen || (m.luftvolumen_m3h == null ? '–' : `${m.luftvolumen_m3h.toLocaleString('de-DE')} m³/h`)],
      ['Abmessung', (m) => fmt.text(m.abmessung_mm)],
      ['Gewicht', (m) => fmt.kg(m.gewicht_kg)],
    ] : []),
    ['Speichervolumen', (m) => fmt.liter(m.volumen_l)],
    ['Leistungszahl', (m) => {
      const { wert, basis: b } = leistungszahl(m, basis, scopFaktor)
      return wert == null ? '–' : `${fmt.zahl(wert)} (${basisKurz(b)})`
    }],
    ['ηwh', (m) => (m.eta_wh == null ? '–' : `${fmt.zahl(m.eta_wh, 1)} %`)],
    ['Effizienzklasse', (m) => fmt.text(m.eff_klasse)],
    ['Preis', (m) => fmt.euro(m.preis_eur)],
    ['Wärmekosten', (m) => {
      const { wert } = leistungszahl(m, basis, scopFaktor)
      return fmt.euroGenau(kosten(wert, strompreis, bedarf).proKwh)
    }],
    ['Jahreskosten', (m) => {
      const { wert } = leistungszahl(m, basis, scopFaktor)
      return fmt.euro(kosten(wert, strompreis, bedarf).proJahr)
    }],
    ['Schallleistung', (m) => fmt.db(m.schallleistung_db)],
    ['Kältemittel', (m) => fmt.text(m.kaeltemittel)],
    ['Wärmetauscher', (m) => wtZelle(m)],
    ['Heizstab', (m) => fmt.watt(m.heizstab_w)],
    ['Kesselmaterial', (m) => fmt.text(m.kessel_material)],
    ['Anode', (m) => fmt.text(m.anode)],
    ['Quelle', (m) => fmt.text(m.quelle)],
  ]
  return (
    <section className="vergleich">
      <div className="vergleich-kopf">
        <h2>Direktvergleich</h2>
        <button onClick={schliessen}>schließen</button>
      </div>
      <div className="tabellenrahmen">
        <table className="vergleichstabelle">
          <thead>
            <tr>
              <th></th>
              {modelle.map((m) => <th key={m.id}>{m.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {zeilen.map(([label, f]) => {
              const werte = modelle.map(f)
              const unterschiedlich = new Set(werte.map(String)).size > 1
              return (
                <tr key={label} className={unterschiedlich ? 'abweichend' : ''}>
                  <th scope="row">{label}</th>
                  {werte.map((v, i) => (
                    <td key={i}>
                      {label === 'Kältemittel'
                        ? <KaelteZelle mittel={modelle[i].kaeltemittel} onHinweis={onKaelteHinweis} />
                        : v}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="klein">Hervorgehobene Zeilen sind die Punkte, in denen sich die Geräte unterscheiden.</p>
    </section>
  )
}
