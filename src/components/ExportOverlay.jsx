import { useState } from 'react'
import { DAYS_LABELS, dispKg, fmtDuration } from '../utils/db.js'

function slimEx(e) {
  return [e.name, e.muscle, e.sets, e.rest, e.kg, e.reps, e.min, e.progressStep]
}
function expandEx([name, muscle, sets, rest, kg, reps, min, progressStep]) {
  return { id: Date.now() + Math.random(), name, muscle, sets, rest, kg: kg || 0, reps, min, progressStep }
}

function encode(workout) {
  const slim = { v: 1, n: workout.name, d: workout.day, p: workout.progressStep, e: workout.exercises.map(slimEx) }
  return btoa(unescape(encodeURIComponent(JSON.stringify(slim))))
}

function encodeAll(workouts) {
  const slim = { v: 1, ws: workouts.map(w => ({ n: w.name, d: w.day, p: w.progressStep, e: w.exercises.map(slimEx) })) }
  return btoa(unescape(encodeURIComponent(JSON.stringify(slim))))
}

// Returns array of workouts (1 or many)
export function decodeWorkouts(code) {
  const raw = JSON.parse(decodeURIComponent(escape(atob(code.trim()))))
  if (!raw.v) return null
  if (raw.ws) return raw.ws.map(w => ({ name: w.n, day: w.d, progressStep: w.p, exercises: w.e.map(expandEx) }))
  if (!raw.e) return null
  return [{ name: raw.n, day: raw.d, progressStep: raw.p, exercises: raw.e.map(expandEx) }]
}

export function decodeWorkout(code) {
  const list = decodeWorkouts(code)
  return list?.[0] ?? null
}

function printWorkouts(list, unit) {
  const sections = list.map(workout => {
    const rows = workout.exercises.map(ex => `
      <tr>
        <td>${ex.name}</td>
        <td>${ex.muscle || '—'}</td>
        <td>${ex.sets}</td>
        <td>${ex.muscle === 'Cardio' ? (ex.min || 20) + ' min' : (ex.reps || 8)}</td>
        <td>${ex.muscle === 'Cardio' ? '—' : (ex.kg === 0 ? 'BW' : dispKg(ex.kg, unit) + unit)}</td>
        <td>${fmtDuration(ex.rest)}</td>
        <td>${ex.muscle !== 'Cardio' && ex.progressStep > 0 ? '+' + ex.progressStep + unit : '—'}</td>
      </tr>`).join('')
    return `
      <h2>${workout.name}</h2>
      <div class="sub">${DAYS_LABELS[workout.day] || ''} · ${workout.exercises.length} exercises</div>
      <table>
        <thead><tr><th>Exercise</th><th>Muscle</th><th>Sets</th><th>Reps/Min</th><th>Weight</th><th>Rest</th><th>Progression</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`
  }).join('<div class="divider"></div>')

  const title = list.length === 1 ? `TAPGYM — ${list[0].name}` : 'TAPGYM — Weekly Plan'
  const win = window.open('', '_blank', 'width=800,height=600')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; padding: 32px; color: #111; }
    h1 { font-size: 22px; font-weight: 800; letter-spacing: -.02em; margin-bottom: 4px; }
    h2 { font-size: 16px; font-weight: 800; margin-bottom: 2px; }
    .sub { font-size: 12px; color: #666; margin-bottom: 12px; }
    .date { font-size: 11px; color: #999; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 0; }
    th { text-align: left; padding: 8px 10px; background: #f5f5f5; border: 1px solid #ddd; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #555; }
    td { padding: 8px 10px; border: 1px solid #ddd; }
    tr:nth-child(even) td { background: #fafafa; }
    .divider { height: 28px; }
    .footer { margin-top: 24px; font-size: 10px; color: #aaa; text-align: right; }
    @media print { @page { margin: 20mm; } }
  </style></head><body>
  <h1>${title}</h1>
  <div class="date">${new Date().toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
  ${sections}
  <div class="footer">tapgym</div>
  <script>window.onload = () => window.print()<\/script>
  </body></html>`)
  win.document.close()
}

export default function ExportOverlay({ workouts, unit, onClose, onImportCode }) {
  // selIdx === -1 means "All workouts"
  const [selIdx, setSelIdx] = useState(workouts.length > 1 ? -1 : 0)
  const [copied, setCopied] = useState(false)
  const [importMode, setImportMode] = useState(false)
  const [pasteVal, setPasteVal] = useState('')
  const [importErr, setImportErr] = useState(false)

  const isAll = selIdx === -1
  const workout = isAll ? null : workouts[selIdx]
  const code = isAll ? encodeAll(workouts) : encode(workout)

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleImport = () => {
    try {
      const list = decodeWorkouts(pasteVal)
      if (!list?.length) throw new Error()
      onImportCode(list)
      onClose()
    } catch {
      setImportErr(true)
      setTimeout(() => setImportErr(false), 2000)
    }
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 70,
      background: 'rgba(12,12,13,.97)', backdropFilter: 'blur(16px)',
      display: 'flex', flexDirection: 'column',
      animation: 'fadeUp .2s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'max(env(safe-area-inset-top),20px) 20px 16px', flexShrink: 0 }}>
        <div onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--s2)', border: '1px solid var(--b)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>←</div>
        <div style={{ fontSize: 17, fontWeight: 800 }}>Share workout</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', paddingBottom: 'max(env(safe-area-inset-bottom),32px)', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Workout selector */}
        {workouts.length > 1 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <div onClick={() => setSelIdx(-1)} style={{
              padding: '6px 14px', borderRadius: 20, fontFamily: 'var(--mo)', fontSize: 11, cursor: 'pointer',
              background: isAll ? 'var(--ac)' : 'var(--s2)',
              border: `1px solid ${isAll ? 'var(--ac)' : 'var(--b)'}`,
              color: isAll ? '#0c0c0d' : 'var(--t2)', fontWeight: isAll ? 700 : 400,
            }}>All</div>
            {workouts.map((w, i) => (
              <div key={w.id} onClick={() => setSelIdx(i)} style={{
                padding: '6px 14px', borderRadius: 20, fontFamily: 'var(--mo)', fontSize: 11, cursor: 'pointer',
                background: i === selIdx ? 'var(--ac)' : 'var(--s2)',
                border: `1px solid ${i === selIdx ? 'var(--ac)' : 'var(--b)'}`,
                color: i === selIdx ? '#0c0c0d' : 'var(--t2)', fontWeight: i === selIdx ? 700 : 400,
              }}>{w.name}</div>
            ))}
          </div>
        )}

        {/* Workout summary */}
        <div style={{ background: 'var(--s1)', border: '1px solid var(--b)', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(isAll ? workouts : [workout]).map((w, wi) => (
            <div key={w.id ?? wi}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{w.name}</div>
                <div style={{ fontFamily: 'var(--mo)', fontSize: 10, color: 'var(--t3)' }}>{DAYS_LABELS[w.day]} · {w.exercises.length} ex</div>
              </div>
              {w.exercises.map((ex, i) => (
                <div key={i} style={{ fontFamily: 'var(--mo)', fontSize: 11, color: 'var(--t2)' }}>
                  {ex.name} — {ex.muscle !== 'Cardio' ? `${ex.sets}×${ex.reps} ${ex.kg === 0 ? 'BW' : dispKg(ex.kg, unit) + unit}` : `${ex.sets}×${ex.min || 20}min`}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Share code */}
        <div style={{ background: 'var(--s1)', border: '1px solid var(--b)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontFamily: 'var(--mo)', fontSize: 9, color: 'var(--t3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12 }}>Share code</div>

          {/* Code preview — truncated, tap to copy */}
          <div
            onClick={copy}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--bg)', border: `1px solid ${copied ? 'var(--ac)' : 'var(--b)'}`,
              borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
              transition: 'border-color .2s',
            }}
          >
            <div style={{ flex: 1, fontFamily: 'var(--mo)', fontSize: 11, color: 'var(--ac)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {code.slice(0, 28)}…
            </div>
            <div style={{ fontFamily: 'var(--mo)', fontSize: 10, color: copied ? 'var(--ac)' : 'var(--t3)', flexShrink: 0, transition: 'color .2s' }}>
              {copied ? '✓ copied' : 'tap to copy'}
            </div>
          </div>

          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            {'share' in navigator ? (
              <div
                onClick={() => navigator.share({ title: isAll ? 'TAPGYM — Weekly Plan' : `TAPGYM — ${workout.name}`, text: code })}
                style={{ flex: 1, padding: '12px 0', background: 'var(--ac)', borderRadius: 10, color: '#0c0c0d', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}
              >
                Share →
              </div>
            ) : (
              <div
                onClick={copy}
                style={{ flex: 1, padding: '12px 0', background: copied ? 'rgba(232,255,71,.1)' : 'var(--s2)', border: `1px solid ${copied ? 'var(--ac)' : 'var(--b)'}`, borderRadius: 10, color: copied ? 'var(--ac)' : 'var(--t1)', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'center', transition: 'all .2s' }}
              >
                {copied ? '✓ Copied!' : 'Copy code'}
              </div>
            )}
            <div
              onClick={() => printWorkouts(isAll ? workouts : [workout], unit)}
              style={{ flex: 1, padding: '12px 0', background: 'var(--s2)', border: '1px solid var(--b)', borderRadius: 10, color: 'var(--t1)', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}
            >
              Print PDF
            </div>
          </div>
        </div>

        {/* Import by code */}
        <div style={{ borderTop: '1px solid var(--b)', paddingTop: 16 }}>
          {!importMode ? (
            <div onClick={() => setImportMode(true)} style={{ fontFamily: 'var(--mo)', fontSize: 10, color: 'var(--t3)', textAlign: 'center', cursor: 'pointer', letterSpacing: '.08em' }}>
              Import a friend's workout →
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                autoFocus
                placeholder="Paste code here…"
                value={pasteVal}
                onChange={e => setPasteVal(e.target.value)}
                style={{ width: '100%', minHeight: 80, resize: 'none', background: 'var(--s1)', border: `1px solid ${importErr ? 'var(--rd)' : 'var(--b)'}`, borderRadius: 10, color: 'var(--t1)', fontFamily: 'var(--mo)', fontSize: 11, padding: '10px 12px', outline: 'none', transition: 'border-color .2s' }}
              />
              {importErr && <div style={{ fontFamily: 'var(--mo)', fontSize: 10, color: 'var(--rd)', textAlign: 'center' }}>Invalid code</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <div onClick={() => { setImportMode(false); setPasteVal('') }} style={{ flex: 1, padding: '12px 0', background: 'var(--s2)', border: '1px solid var(--b)', borderRadius: 10, color: 'var(--t3)', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}>Cancel</div>
                <div onClick={handleImport} style={{ flex: 1, padding: '12px 0', background: 'var(--ac)', borderRadius: 10, color: '#0c0c0d', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}>Import</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
