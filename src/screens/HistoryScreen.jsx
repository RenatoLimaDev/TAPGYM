import { useState } from 'react'
import { fmtDuration } from '../utils/db.js'

export default function HistoryScreen({ db, onBack, onShowMetrics, onClearHistory }) {
  const hist = [...db.history].reverse()
  const [confirming, setConfirming] = useState(false)

  function handleClear() {
    if (!confirming) { setConfirming(true); return }
    setConfirming(false)
    onClearHistory()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        paddingTop: 'max(env(safe-area-inset-top), 16px)',
        padding: 'max(env(safe-area-inset-top), 16px) 20px 16px',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      }}>
        <div onClick={onBack} style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--s2)', border: '1px solid var(--b)', color: 'var(--t1)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>←</div>
        <div style={{ fontSize: 18, fontWeight: 800, flex: 1 }}>History</div>
        {hist.length > 0 && (
          <div
            onClick={handleClear}
            onBlur={() => setConfirming(false)}
            tabIndex={0}
            style={{
              fontSize: 11, fontFamily: 'var(--mo)', fontWeight: 700,
              color: confirming ? '#0c0c0d' : 'var(--rd)',
              background: confirming ? 'var(--rd)' : 'transparent',
              border: `1px solid var(--rd)`,
              borderRadius: 20, padding: '5px 12px', cursor: 'pointer',
              transition: 'all .15s', whiteSpace: 'nowrap',
            }}
          >
            {confirming ? 'Confirm?' : 'Clear'}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', paddingBottom: 'max(env(safe-area-inset-bottom), 40px)' }}>
        {!hist.length ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t2)', marginBottom: 8 }}>No history yet</h3>
            <p style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.7 }}>Complete a workout to see it here</p>
          </div>
        ) : (
          hist.map((h, idx) => {
            const w = db.workouts.find(x => x.id === h.wid)
            const dateStr = new Date(h.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })
            return (
              <div
                key={idx}
                onClick={() => w && onShowMetrics(h.wid, h)}
                style={{
                  background: 'var(--s1)', border: '1px solid var(--b)',
                  borderRadius: 16, padding: 16, marginBottom: 8,
                  cursor: w ? 'pointer' : 'default',
                  transition: 'border-color .15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{w ? w.name : 'Deleted workout'}</div>
                  <div style={{ fontFamily: 'var(--mo)', fontSize: 10, color: 'var(--t3)' }}>{dateStr}</div>
                </div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  {[
                    ['Sets', h.sets || 0],
                    ['Time', fmtDuration(h.dur || 0)],
                    ['Rest', fmtDuration(h.restSec || 0)],
                  ].map(([label, value]) => (
                    <div key={label} style={{ fontFamily: 'var(--mo)', fontSize: 11, color: 'var(--t2)' }}>
                      {label} <span style={{ color: 'var(--ac)' }}>{value}</span>
                    </div>
                  ))}
                  {h.prs?.length > 0 && (
                    <div style={{ fontFamily: 'var(--mo)', fontSize: 10, fontWeight: 700, color: '#0c0c0d', background: 'var(--ac)', borderRadius: 20, padding: '2px 8px' }}>
                      🏅 {h.prs.length} PR{h.prs.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                {h.note && (
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontFamily: 'var(--mo)', fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t3)' }}>Note — </span>
                    <span style={{ fontFamily: 'var(--fn)', fontSize: 12, color: 'var(--t2)' }}>{h.note}</span>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
