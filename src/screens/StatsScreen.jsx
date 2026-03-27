
export default function StatsScreen({ db, onBack }) {
  const hist = db.history
  const now = Date.now()

  // ── Totals ────────────────────────────────────────────────────────────────
  const totalSessions = hist.length
  const totalSets     = hist.reduce((a, h) => a + (h.sets || 0), 0)
  const totalSecs     = hist.reduce((a, h) => a + (h.dur || 0), 0)
  const totalTime     = totalSecs >= 3600
    ? `${Math.floor(totalSecs / 3600)}h ${Math.floor((totalSecs % 3600) / 60)}m`
    : `${Math.floor(totalSecs / 60)}m`

  // ── Weekly frequency — last 8 weeks ──────────────────────────────────────
  const weeks = Array.from({ length: 8 }, (_, wi) => {
    const end   = new Date(now);  end.setHours(23,59,59,999);  end.setDate(end.getDate() - wi * 7)
    const start = new Date(end);  start.setDate(start.getDate() - 6); start.setHours(0,0,0,0)
    const count = hist.filter(h => { const d = new Date(h.date); return d >= start && d <= end }).length
    const label = start.toLocaleDateString('en', { month: 'short', day: 'numeric' })
    return { label, count }
  }).reverse()
  const maxWeek = Math.max(...weeks.map(w => w.count), 1)

  // ── Muscle breakdown — last 30 days ───────────────────────────────────────
  const cutoff = new Date(now - 30 * 86400000)
  const muscleSets = {}
  hist
    .filter(h => new Date(h.date) >= cutoff)
    .forEach(h => (h.exercises || []).forEach(ex => {
      if (!ex.muscle || ex.muscle === 'Cardio') return
      muscleSets[ex.muscle] = (muscleSets[ex.muscle] || 0) + (ex.sets?.length || 0)
    }))
  const muscleEntries = Object.entries(muscleSets).sort((a, b) => b[1] - a[1])
  const maxMuscle = Math.max(...muscleEntries.map(([, v]) => v), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)', padding: 'max(env(safe-area-inset-top), 16px) 20px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div onClick={onBack} style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--s2)', border: '1px solid var(--b)', color: 'var(--t1)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>←</div>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Stats</div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', paddingBottom: 'max(env(safe-area-inset-bottom), 40px)', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Totals */}
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Sessions', value: totalSessions },
            { label: 'Sets',     value: totalSets },
            { label: 'Time',     value: totalTime },
          ].map(({ label, value }) => (
            <div key={label} style={{ flex: 1, background: 'var(--s1)', border: '1px solid var(--b)', borderRadius: 14, padding: '22px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--mo)', color: 'var(--ac)' }}>{value}</div>
              <div style={{ fontSize: 10, fontFamily: 'var(--mo)', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Weekly frequency */}
        <div>
          <div style={{ fontFamily: 'var(--mo)', fontSize: 9, color: 'var(--t3)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 12 }}>Weekly frequency</div>
          <div style={{ background: 'var(--s1)', border: '1px solid var(--b)', borderRadius: 14, padding: '16px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
              {weeks.map((w, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ width: '100%', background: w.count > 0 ? 'var(--ac)' : 'var(--b)', borderRadius: 4, height: `${Math.max(4, (w.count / maxWeek) * 60)}px`, opacity: i === weeks.length - 1 ? 1 : 0.6, transition: 'height .3s' }} />
                  <div style={{ fontFamily: 'var(--mo)', fontSize: 8, color: 'var(--t3)', whiteSpace: 'nowrap', overflow: 'hidden' }}>{w.count > 0 ? w.count : '·'}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {weeks.map((w, i) => (
                <div key={i} style={{ flex: 1, fontFamily: 'var(--mo)', fontSize: 7, color: 'var(--t3)', textAlign: 'center', overflow: 'hidden' }}>{w.label}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Muscle breakdown */}
        {muscleEntries.length > 0 && (
          <div>
            <div style={{ fontFamily: 'var(--mo)', fontSize: 9, color: 'var(--t3)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 12 }}>Muscle breakdown — last 30 days</div>
            <div style={{ background: 'var(--s1)', border: '1px solid var(--b)', borderRadius: 14, overflow: 'hidden' }}>
              {muscleEntries.map(([muscle, sets], i) => (
                <div key={muscle} style={{ padding: '10px 14px', borderBottom: i < muscleEntries.length - 1 ? '1px solid var(--b)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontFamily: 'var(--fn)', fontSize: 12, color: 'var(--t2)' }}>{muscle}</span>
                    <span style={{ fontFamily: 'var(--mo)', fontSize: 11, color: 'var(--t3)' }}>{sets} sets</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--b)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(sets / maxMuscle) * 100}%`, background: 'var(--ac)', borderRadius: 2, opacity: 0.8 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hist.length && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.7 }}>Complete workouts to see stats here</p>
          </div>
        )}
      </div>
    </div>
  )
}
