// Startdialog: zeigt beim ersten Besuch die Gerätetypen als 3D-Zeichnung.
import { useEffect, useRef, useState } from 'react'

function Defs({ id }) {
  return (
    <defs>
      <linearGradient id={`${id}-tank`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#b8c0c8" />
        <stop offset="22%" stopColor="#eef2f5" />
        <stop offset="42%" stopColor="#ffffff" />
        <stop offset="70%" stopColor="#d5dbe1" />
        <stop offset="100%" stopColor="#9aa3ad" />
      </linearGradient>
      <linearGradient id={`${id}-deckel`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#c5ccd3" />
      </linearGradient>
      <linearGradient id={`${id}-boden`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#c4cbd2" />
        <stop offset="100%" stopColor="#8b949e" />
      </linearGradient>
      <linearGradient id={`${id}-haube`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#2a3138" />
        <stop offset="35%" stopColor="#5a6570" />
        <stop offset="62%" stopColor="#3d464f" />
        <stop offset="100%" stopColor="#1a1f24" />
      </linearGradient>
      <linearGradient id={`${id}-haube-oben`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6b7580" />
        <stop offset="100%" stopColor="#2e353c" />
      </linearGradient>
      <radialGradient id={`${id}-luefter`} cx="38%" cy="32%" r="70%">
        <stop offset="0%" stopColor="#8b949e" />
        <stop offset="55%" stopColor="#3a424a" />
        <stop offset="100%" stopColor="#15191d" />
      </radialGradient>
      <radialGradient id={`${id}-schatten`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#000" stopOpacity="0.28" />
        <stop offset="100%" stopColor="#000" stopOpacity="0" />
      </radialGradient>
    </defs>
  )
}

function Luefter({ cx, cy, r, id }) {
  const blaetter = [0, 72, 144, 216, 288].map((w) => {
    const a = (w * Math.PI) / 180
    const x = cx + Math.cos(a) * r * 0.42
    const y = cy + Math.sin(a) * r * 0.28
    return <ellipse key={w} cx={x} cy={y} rx={r * 0.34} ry={r * 0.13}
      transform={`rotate(${w + 18} ${x} ${y})`} fill="#1b2025" opacity="0.85" />
  })
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.62} fill={`url(#${id}-luefter)`} />
      <ellipse cx={cx} cy={cy} rx={r * 0.92} ry={r * 0.56} fill="none" stroke="#0d1013" strokeWidth="1.2" />
      {blaetter}
      <ellipse cx={cx} cy={cy} rx={r * 0.2} ry={r * 0.13} fill="#d8dee4" />
      <ellipse cx={cx} cy={cy} rx={r * 0.08} ry={r * 0.05} fill="#2a3138" />
    </g>
  )
}

function Haube({ cx, y, rx, h, id }) {
  const ry = rx * 0.22
  return (
    <g>
      <ellipse cx={cx} cy={y + h} rx={rx} ry={ry} fill="#1a1f24" />
      <rect x={cx - rx} y={y} width={rx * 2} height={h} fill={`url(#${id}-haube)`} />
      <ellipse cx={cx} cy={y} rx={rx} ry={ry} fill={`url(#${id}-haube-oben)`} />
      <Luefter cx={cx} cy={y + h * 0.48} r={rx * 0.42} id={id} />
      <rect x={cx - rx * 0.72} y={y + h - 5} width={rx * 0.28} height="3" rx="1" fill="#7ad0a8" opacity="0.85" />
    </g>
  )
}

function Speicher({ cx, oben, hoehe, rx, id }) {
  const ry = rx * 0.22
  const unten = oben + hoehe
  return (
    <g>
      <ellipse cx={cx} cy={unten} rx={rx} ry={ry} fill={`url(#${id}-boden)`} />
      <rect x={cx - rx} y={oben} width={rx * 2} height={hoehe} fill={`url(#${id}-tank)`} />
      <ellipse cx={cx} cy={oben + hoehe * 0.52} rx={rx} ry={ry * 0.35}
        fill="none" stroke="#8f98a2" strokeWidth="0.6" opacity="0.45" />
      <ellipse cx={cx} cy={oben} rx={rx} ry={ry} fill={`url(#${id}-deckel)`} />
      <ellipse cx={cx - rx * 0.38} cy={oben + hoehe * 0.28} rx={rx * 0.12} ry={hoehe * 0.22}
        fill="#fff" opacity="0.35" />
    </g>
  )
}

function Fuesse({ cx, y, rx }) {
  return (
    <g fill="#4a535c">
      <rect x={cx - rx + 4} y={y} width="7" height="6" rx="1.2" />
      <rect x={cx + rx - 11} y={y} width="7" height="6" rx="1.2" />
    </g>
  )
}

function Stehend({ hoehe }) {
  const id = `st-${hoehe}`
  const cx = 60
  const rx = 27
  const haubeH = 24
  const tankOben = 148 - hoehe
  const haubeY = tankOben - haubeH + 5
  return (
    <>
      <Defs id={id} />
      <ellipse cx={cx} cy={154} rx={rx + 8} ry={5} fill={`url(#${id}-schatten)`} />
      <Fuesse cx={cx} y={148} rx={rx} />
      <Speicher cx={cx} oben={tankOben} hoehe={hoehe} rx={rx} id={id} />
      <Haube cx={cx} y={haubeY} rx={rx + 1} h={haubeH} id={id} />
    </>
  )
}

function Wandgeraet() {
  const id = 'wand'
  const cx = 68
  const rx = 22
  return (
    <>
      <Defs id={id} />
      <rect x="8" y="10" width="18" height="140" rx="2" fill="#d7dde3" />
      <rect x="22" y="10" width="5" height="140" fill="#c2c9d0" />
      <path d="M27 48 h12 M27 118 h12" stroke="#6b7580" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx={cx} cy={150} rx={rx + 6} ry={4.5} fill={`url(#${id}-schatten)`} />
      <Speicher cx={cx} oben={62} hoehe={78} rx={rx} id={id} />
      <Haube cx={cx} y={38} rx={rx + 1} h={28} id={id} />
    </>
  )
}

function OhneKessel() {
  const id = 'ok'
  return (
    <>
      <Defs id={id} />
      <Defs id={`${id}-x`} />
      <ellipse cx="48" cy="150" rx="40" ry="5" fill={`url(#${id}-schatten)`} />
      <g opacity="0.55">
        <Speicher cx="98" oben="48" hoehe="94" rx="13" id={`${id}-x`} />
      </g>
      <path d="M70 82 h14 M70 104 h14" stroke="#5a6570" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="12" y="58" width="60" height="56" rx="16" fill={`url(#${id}-haube)`} />
      <ellipse cx="42" cy="58" rx="30" ry="9" fill={`url(#${id}-haube-oben)`} />
      <Luefter cx="42" cy="86" r="17" id={id} />
      <rect x="20" y="106" width="9" height="3" rx="1" fill="#7ad0a8" opacity="0.9" />
      <rect x="22" y="114" width="9" height="6" rx="1.2" fill="#4a535c" />
      <rect x="53" y="114" width="9" height="6" rx="1.2" fill="#4a535c" />
    </>
  )
}

function Split() {
  const id = 'sp'
  const tankCx = 90
  const tankRx = 22
  const aussenX = 10
  const aussenW = 28
  const aussenY = 68
  const aussenH = 50
  const lamellen = [76, 80, 84, 88, 92, 96, 100, 104, 108]
  return (
    <>
      <Defs id={id} />
      <ellipse cx="24" cy="150" rx="20" ry="4" fill={`url(#${id}-schatten)`} />
      <ellipse cx={tankCx} cy="150" rx={tankRx + 6} ry="4.5" fill={`url(#${id}-schatten)`} />

      <rect x="40" y="10" width="18" height="140" rx="2" fill="#d7dde3" />
      <rect x="56" y="10" width="5" height="140" fill="#c2c9d0" />

      <path d="M38 82 h20 M38 104 h20" stroke="#6b7580" strokeWidth="3" strokeLinecap="round" />
      <rect x={aussenX} y={aussenY} width={aussenW} height={aussenH} rx="4" fill={`url(#${id}-tank)`} />
      <rect x={aussenX} y={aussenY} width={aussenW} height="8" rx="4" fill={`url(#${id}-deckel)`} />
      <rect x={aussenX + 3} y={aussenY + aussenH - 5} width="7" height="7" rx="1.2" fill="#4a535c" />
      <rect x={aussenX + aussenW - 10} y={aussenY + aussenH - 5} width="7" height="7" rx="1.2" fill="#4a535c" />
      {lamellen.map((y) => (
        <rect key={y} x={aussenX + 4} y={y} width={aussenW - 8} height="2" rx="1" fill="#8f98a2" opacity="0.7" />
      ))}

      <path d="M61 82 H68 M61 104 H68" stroke="#5a6570" strokeWidth="2.6" strokeLinecap="round" />

      <Fuesse cx={tankCx} y="148" rx={tankRx} />
      <Speicher cx={tankCx} oben="52" hoehe="96" rx={tankRx} id={id} />
    </>
  )
}

function Zeichnung({ art }) {
  return (
    <svg viewBox="0 0 120 160" className="typ-bild" role="presentation" aria-hidden="true">
      {art === 'wand' ? <Wandgeraet />
        : art === 'ohne_kessel' ? <OhneKessel />
        : art === 'split' ? <Split />
        : <Stehend hoehe={art} />}
    </svg>
  )
}

const TYPEN = [
  { ansicht: 'wand', art: 'wand', titel: 'Wandgerät',
    text: 'Kompakt, hängt an der Wand – für Bad, Hauswirtschaftsraum oder kleine Haushalte.',
    ohneWt: true },
  { ansicht: '200', art: 58, titel: '200er-Klasse',
    text: '160–229 L. Die übliche Größe für zwei bis drei Personen.' },
  { ansicht: '250', art: 76, titel: '250er-Klasse',
    text: '230–269 L. Etwas Reserve, oft mit Wärmetauscher erhältlich.' },
  { ansicht: '300', art: 94, titel: '300er-Klasse',
    text: '270–330 L. Für vier Personen oder Einbindung von Solarthermie.' },
  { ansicht: 'gross', art: 116, titel: 'Große Speicher',
    text: 'Über 330 L. Mehrfamilienhaus oder hoher Zapfbedarf.' },
  { ansicht: 'ohne_kessel', art: 'ohne_kessel', titel: 'Ohne Speicher',
    text: 'Nur das Wärmepumpenmodul – an einen vorhandenen Speicher angeschlossen.',
    ohneWt: true },
  { ansicht: 'split', art: 'split', titel: 'Splitgerät',
    text: 'Speicher innen, Verdichter draußen. Leiser im Aufstellraum, braucht eine Außeneinheit.',
    ohneWt: true },
]

function anzahlVon(zaehler, id, mitWt) {
  const z = zaehler[id]
  if (z == null) return 0
  if (typeof z === 'number') return z
  return mitWt ? z.wt : z.alle
}

export default function Starthilfe({ zaehler = {}, onWaehlen, onSchliessen }) {
  const dialog = useRef(null)
  const [wtWahl, setWtWahl] = useState({})

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

  const wtUmschalten = (id) =>
    setWtWahl((w) => ({ ...w, [id]: !w[id] }))

  return (
    <div className="hilfe-hintergrund" onClick={onSchliessen}>
      <div className="hilfe" ref={dialog} role="dialog" aria-modal="true"
        aria-labelledby="hilfe-titel" onClick={(e) => e.stopPropagation()}>
        <button className="hilfe-zu" onClick={onSchliessen} aria-label="Schließen">×</button>

        <h2 id="hilfe-titel">Welche Bauart suchen Sie?</h2>
        <p className="hilfe-unterzeile">
          Wählen Sie einen Typ – die Liste öffnet sich gleich gefiltert.
          Pro Kategorie können Sie „mit Wärmetauscher“ ankreuzen.
        </p>

        <div className="typen">
          {TYPEN.map((t) => {
            const mitWt = !t.ohneWt && !!wtWahl[t.ansicht]
            return (
              <div key={t.ansicht} className="typ">
                <button type="button" className="typ-wahl" onClick={() => onWaehlen(t.ansicht, mitWt)}>
                  <Zeichnung art={t.art} />
                  <span className="typ-titel">{t.titel}</span>
                  <span className="typ-anzahl">{anzahlVon(zaehler, t.ansicht, mitWt)} Geräte</span>
                  <span className="typ-text">{t.text}</span>
                </button>
                {!t.ohneWt && (
                  <label className="typ-wt">
                    <input
                      type="checkbox"
                      checked={mitWt}
                      onChange={() => wtUmschalten(t.ansicht)}
                    />
                    mit Wärmetauscher
                    <span className="typ-wt-zahl">{anzahlVon(zaehler, t.ansicht, true)}</span>
                  </label>
                )}
              </div>
            )
          })}
        </div>

        <div className="hilfe-fuss">
          <label className="typ-wt">
            <input
              type="checkbox"
              checked={!!wtWahl.alle}
              onChange={() => wtUmschalten('alle')}
            />
            mit Wärmetauscher
          </label>
          <button className="hilfe-alle" onClick={() => onWaehlen('alle', !!wtWahl.alle)}>
            Lieber alle {anzahlVon(zaehler, 'alle', !!wtWahl.alle)} Geräte auf einmal ansehen
          </button>
        </div>
      </div>
    </div>
  )
}
