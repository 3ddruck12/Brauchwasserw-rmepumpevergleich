// Startdialog: zeigt beim ersten Besuch die Gerätetypen als Zeichnung.
// Ein Klick setzt den passenden Filter und schließt den Dialog.
import { useEffect, useRef } from 'react'

const STRICH = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.4,
                 strokeLinecap: 'round', strokeLinejoin: 'round' }

// Haube mit Lüftergitter – sitzt bei bodenstehenden Geräten oben auf dem Speicher
function Haube({ y }) {
  return (
    <g {...STRICH}>
      <rect x="24" y={y} width="72" height="28" rx="9" />
      <circle cx="60" cy={y + 14} r="8.5" />
      <circle cx="60" cy={y + 14} r="2.6" />
      <path d={`M31 ${y + 22} h10 M79 ${y + 22} h10`} />
    </g>
  )
}

// Stehender Speicher, Höhe je nach Literklasse
function Stehend({ hoehe }) {
  const oben = 148 - hoehe
  return (
    <>
      <Haube y={oben - 28} />
      <g {...STRICH}>
        <rect x="30" y={oben} width="60" height={hoehe} rx="7" />
        <path d={`M30 ${oben + hoehe * 0.55} h60`} strokeDasharray="4 5" opacity="0.55" />
        <path d="M34 148 v6 M86 148 v6" />
      </g>
    </>
  )
}

function Wandgeraet() {
  return (
    <>
      <g {...STRICH}>
        <path d="M18 22 h84" strokeDasharray="6 6" opacity="0.6" />
        <path d="M44 22 v8 M76 22 v8" />
        <rect x="32" y="30" width="56" height="94" rx="9" />
        <circle cx="60" cy="56" r="13" />
        <circle cx="60" cy="56" r="3.4" />
        <path d="M40 92 h40 M40 104 h26" opacity="0.65" />
        <path d="M48 124 v10 M72 124 v10" />
      </g>
    </>
  )
}

function OhneKessel() {
  return (
    <g {...STRICH}>
      <rect x="14" y="58" width="62" height="44" rx="12" />
      <circle cx="45" cy="80" r="13" />
      <circle cx="45" cy="80" r="3.4" />
      <path d="M76 70 h14 M76 90 h14" />
      <rect x="90" y="46" width="22" height="68" rx="7" strokeDasharray="5 5" opacity="0.5" />
      <path d="M24 102 v8 M66 102 v8" />
    </g>
  )
}

function Zeichnung({ art }) {
  return (
    <svg viewBox="0 0 120 160" className="typ-bild" role="presentation" aria-hidden="true">
      {art === 'wand' ? <Wandgeraet />
        : art === 'ohne_kessel' ? <OhneKessel />
        : <Stehend hoehe={art} />}
    </svg>
  )
}

// hoehe = Pixelhöhe der Zeichnung, nicht der Liter-Wert
const TYPEN = [
  { ansicht: 'wand', art: 'wand', titel: 'Wandgerät',
    text: 'Kompakt, hängt an der Wand – für Bad, Hauswirtschaftsraum oder kleine Haushalte.' },
  { ansicht: '200', art: 72, titel: '200er-Klasse',
    text: '180–229 L. Die übliche Größe für zwei bis drei Personen.' },
  { ansicht: '250', art: 86, titel: '250er-Klasse',
    text: '230–269 L. Etwas Reserve, oft mit Wärmetauscher erhältlich.' },
  { ansicht: '300', art: 98, titel: '300er-Klasse',
    text: '270–330 L. Für vier Personen oder Einbindung von Solarthermie.' },
  { ansicht: 'gross', art: 112, titel: 'Große Speicher',
    text: 'Über 330 L. Mehrfamilienhaus oder hoher Zapfbedarf.' },
  { ansicht: 'ohne_kessel', art: 'ohne_kessel', titel: 'Ohne Speicher',
    text: 'Nur das Wärmepumpenmodul – an einen vorhandenen Speicher angeschlossen.' },
]

export default function Starthilfe({ zaehler = {}, onWaehlen, onSchliessen }) {
  const dialog = useRef(null)

  useEffect(() => {
    const beiTaste = (e) => { if (e.key === 'Escape') onSchliessen() }
    document.addEventListener('keydown', beiTaste)
    dialog.current?.querySelector('button')?.focus()
    const vorher = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', beiTaste)
      document.body.style.overflow = vorher
    }
  }, [onSchliessen])

  return (
    <div className="hilfe-hintergrund" onClick={onSchliessen}>
      <div className="hilfe" ref={dialog} role="dialog" aria-modal="true"
        aria-labelledby="hilfe-titel" onClick={(e) => e.stopPropagation()}>
        <button className="hilfe-zu" onClick={onSchliessen} aria-label="Schließen">×</button>

        <h2 id="hilfe-titel">Welche Bauart suchen Sie?</h2>
        <p className="hilfe-unterzeile">
          Wählen Sie einen Typ – die Liste öffnet sich gleich gefiltert.
          Alle Filter lassen sich danach frei ändern.
        </p>

        <div className="typen">
          {TYPEN.map((t) => (
            <button key={t.ansicht} className="typ" onClick={() => onWaehlen(t.ansicht)}>
              <Zeichnung art={t.art} />
              <span className="typ-titel">{t.titel}</span>
              <span className="typ-anzahl">{zaehler[t.ansicht] ?? 0} Geräte</span>
              <span className="typ-text">{t.text}</span>
            </button>
          ))}
        </div>

        <button className="hilfe-alle" onClick={() => onWaehlen('alle')}>
          Lieber alle {zaehler.alle ?? ''} Geräte auf einmal ansehen
        </button>
      </div>
    </div>
  )
}
