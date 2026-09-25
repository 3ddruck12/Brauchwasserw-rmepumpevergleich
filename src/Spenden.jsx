// Spenden-Hinweis unten rechts. Reiner Link zu PayPal – kein PayPal-Skript,
// damit beim Seitenaufruf nichts an PayPal übertragen wird.
import { useEffect, useState } from 'react'
import { SPENDEN_URL, SPENDEN_VERZOEGERUNG_S, SPENDEN_PAUSE_TAGE } from './einstellungen.js'

const SCHLUESSEL = 'bwwp-spende-zu'

function pausiert() {
  try {
    const zu = Number(localStorage.getItem(SCHLUESSEL) || 0)
    return Date.now() - zu < SPENDEN_PAUSE_TAGE * 864e5
  } catch { return false }
}

function Herz() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="spende-herz">
      <path d="M12 20.3 4.6 13.2a4.7 4.7 0 0 1 6.6-6.7l.8.8.8-.8a4.7 4.7 0 0 1 6.6 6.7Z" />
    </svg>
  )
}

export default function Spenden({ blockiert = false }) {
  const [offen, setOffen] = useState(false)

  useEffect(() => {
    if (!SPENDEN_URL || blockiert || pausiert()) return undefined
    const t = setTimeout(() => setOffen(true), SPENDEN_VERZOEGERUNG_S * 1000)
    return () => clearTimeout(t)
  }, [blockiert])

  if (!SPENDEN_URL) return null

  const schliessen = () => {
    setOffen(false)
    try { localStorage.setItem(SCHLUESSEL, String(Date.now())) } catch { /* egal */ }
  }

  if (!offen) {
    return (
      <button type="button" className="spende-knopf" onClick={() => setOffen(true)}
        title="Gefällt Ihnen diese Übersicht? Unterstützen per PayPal" aria-label="Spenden">
        <Herz />
      </button>
    )
  }

  return (
    <aside className="spende-karte" role="complementary" aria-labelledby="spende-titel">
      <button type="button" className="spende-zu" onClick={schliessen} aria-label="Schließen">×</button>
      <div className="spende-kopf"><Herz /><h2 id="spende-titel">Gefällt Ihnen diese Übersicht?</h2></div>
      <p>
        Die Seite ist kostenlos und werbefrei. Hinter jedem Wert steckt Recherche in Datenblättern,
        EPREL und Händlerseiten. Wenn sie Ihnen bei der Entscheidung geholfen hat, freue ich mich
        über einen Kaffee.
      </p>
      <a className="spende-paypal" href={SPENDEN_URL} target="_blank" rel="noopener noreferrer" onClick={schliessen}>
        Mit PayPal unterstützen
      </a>
      <p className="spende-klein">Sie werden zu PayPal weitergeleitet. Vorher werden keine Daten übertragen.</p>
    </aside>
  )
}
