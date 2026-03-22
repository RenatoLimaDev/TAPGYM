import { useState } from 'react'
import { fmtDuration, dispKg } from '../utils/db.js'
import ProgressChart from './ProgressChart.jsx'

export default function WorkoutMetricsOverlay({ workout, entry, unit, history, onClose, onRedo }) {
  const { dur = 0, restSec = 0, sets = 0, exercises: exLogs = [] } = entry
  const [selectedEx, setSelectedEx] = useState(null)

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: 'rgba(12,12,13,.95)', backdropFilter: 'blur(12px)',
      display: 'flex', flexDirection: 'column',
      animation: 'fadeUp .25s ease',
    }}>
      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '28px 28px 0' }}>
        <div style={{ marginTop: 20, fontFamily: 'var(--mo)', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--gr)' }}>
          ✓ Done today
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em' }}>{workout.name}</div>

        {/* PRs */}
        {entry.prs?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {entry.prs.map(name => (
              <div key={name} style={{ fontFamily: 'var(--mo)', fontSize: 10, fontWeight: 700, color: '#0c0c0d', background: 'var(--ac)', borderRadius: 20, padding: '4px 12px' }}>
                🏅 {name}
              </div>
            ))}
          </div>
        )}

        {/* Progressions */}
        {entry.progressed?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {entry.progressed.map(p => (
              <div key={p.name} style={{ fontFamily: 'var(--mo)', fontSize: 10, fontWeight: 700, color: 'var(--ac)', background: 'rgba(232,255,71,.08)', border: '1px solid rgba(232,255,71,.25)', borderRadius: 20, padding: '4px 12px' }}>
                ↑ {p.name} → {p.to}{unit}
              </div>
            ))}
          </div>
        )}

        {/* Note */}
        {entry.note && (
          <div style={{ width: '100%', maxWidth: 340, background: 'var(--s1)', border: '1px solid var(--b)', borderRadius: 12, padding: '10px 14px' }}>
            <span style={{ fontFamily: 'var(--mo)', fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t3)' }}>Note — </span>
            <span style={{ fontFamily: 'var(--fn)', fontSize: 13, color: 'var(--t2)' }}>{entry.note}</span>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 4 }}>
          {[
            { label: 'sets', value: sets,                 color: 'var(--ac)' },
            { label: 'time', value: fmtDuration(dur),     color: 'var(--ac)' },
            { label: 'rest', value: fmtDuration(restSec), color: 'var(--bl)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mo)', color }}>{value}</div>
              <div style={{ fontSize: 9, fontFamily: 'var(--mo)', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Exercise breakdown */}
        <div style={{ width: '100%', maxWidth: 340, paddingBottom: 8 }}>
          {exLogs.map((ex, i) => {
            const open = selectedEx === ex.name
            return (
              <div key={i} style={{ background: 'var(--s1)', border: '1px solid var(--b)', borderRadius: 14, marginBottom: 8, overflow: 'hidden' }}>
                {/* Exercise header — tappable to toggle chart */}
                <div
                  onClick={() => setSelectedEx(open ? null : ex.name)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px 10px', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{ex.name}</div>
                  <div style={{ fontFamily: 'var(--mo)', fontSize: 9, color: 'var(--t3)', letterSpacing: '.08em' }}>
                    {open ? 'SETS ▲' : 'PROGRESS ▸'}
                  </div>
                </div>

                <div style={{ padding: '0 14px 12px' }}>
                  {open ? (
                    <ProgressChart exName={ex.name} history={history} unit={unit} />
                  ) : (
                    (ex.sets || []).map((s, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: 'var(--bg)', borderRadius: 8, marginBottom: 4 }}>
                        <span style={{ flex: 1, fontFamily: 'var(--mo)', fontSize: 10, color: 'var(--t2)' }}>Set {j + 1}</span>
                        {ex.muscle === 'Cardio' ? (
                          <span style={{ flex: 1, fontFamily: 'var(--mo)', fontSize: 12, color: 'var(--ac)', textAlign: 'center' }}>{s.dur ? fmtDuration(s.dur) : '—'}</span>
                        ) : (
                          <span style={{ flex: 1, fontFamily: 'var(--mo)', fontSize: 12, color: 'var(--ac)', textAlign: 'center' }}>{s.kg === 0 ? 'BW' : `${dispKg(s.kg, unit)}${unit}`} × {s.reps || '?'}</span>
                        )}
                        <span style={{ flex: 1, fontFamily: 'var(--mo)', fontSize: 10, color: 'var(--t3)', textAlign: 'right' }}>{ex.muscle !== 'Cardio' ? (s.dur ? fmtDuration(s.dur) : 'no rest') : ''}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Buttons — always visible at bottom */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 10, padding: 'max(env(safe-area-inset-bottom), 20px) 28px 28px', justifyContent: 'center' }}>
        <button onClick={onClose} style={{ flex: 1, maxWidth: 160, padding: '14px 0', background: 'var(--s2)', border: '1px solid var(--b)', borderRadius: 12, color: 'var(--t2)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Close
        </button>
        <button onClick={onRedo} style={{ flex: 1, maxWidth: 160, padding: '14px 0', background: 'var(--ac)', border: 'none', borderRadius: 12, color: '#0c0c0d', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Do again
        </button>
      </div>
    </div>
  )
}
