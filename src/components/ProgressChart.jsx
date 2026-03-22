import { dispKg } from '../utils/db.js'

export default function ProgressChart({ exName, history, unit }) {
  const sessions = history
    .filter(h => h.exercises?.some(e => e.name === exName))
    .slice(-12)
    .map(h => {
      const ex = h.exercises.find(e => e.name === exName)
      const maxKg = Math.max(...(ex.sets || []).map(s => s.kg || 0))
      return { date: h.date, kg: dispKg(maxKg, unit) }
    })

  if (sessions.length < 2) {
    return (
      <div style={{ padding: '10px 0 4px', textAlign: 'center', fontFamily: 'var(--mo)', fontSize: 10, color: 'var(--t3)' }}>
        Complete more sessions to see progress
      </div>
    )
  }

  const vals = sessions.map(s => s.kg)
  const minV = Math.min(...vals)
  const maxV = Math.max(...vals)
  const range = maxV - minV || 1

  const gradId = `cg-${exName.replace(/[^a-z0-9]/gi, '-')}`
  const W = 300, H = 72, PX = 14, PY = 16
  const xi = i => PX + (i / (sessions.length - 1)) * (W - PX * 2)
  const yi = v => H - PY - ((v - minV) / range) * (H - PY * 2)
  const points = sessions.map((s, i) => `${xi(i)},${yi(s.kg)}`).join(' ')
  const diff = vals[vals.length - 1] - vals[0]

  return (
    <div style={{ width: '100%', paddingTop: 8 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 72, overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8ff47" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#e8ff47" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`${xi(0)},${H} ${points} ${xi(sessions.length - 1)},${H}`}
          fill={`url(#${gradId})`}
        />
        <polyline points={points} fill="none" stroke="#e8ff47" strokeWidth="1.5" strokeLinejoin="round" />
        {sessions.map((s, i) => (
          <circle
            key={i}
            cx={xi(i)} cy={yi(s.kg)}
            r={i === sessions.length - 1 ? 4 : 2.5}
            fill={i === sessions.length - 1 ? '#e8ff47' : '#0c0c0d'}
            stroke="#e8ff47" strokeWidth="1.5"
          />
        ))}
        <text x={xi(0)} y={yi(vals[0]) - 7} fontSize="9" fill="#3a3a3e" textAnchor="middle" fontFamily="JetBrains Mono, monospace">
          {vals[0]}{unit}
        </text>
        <text x={xi(sessions.length - 1)} y={yi(vals[vals.length - 1]) - 9} fontSize="9" fill="#e8ff47" textAnchor="middle" fontFamily="JetBrains Mono, monospace">
          {vals[vals.length - 1]}{unit}
        </text>
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mo)', fontSize: 8, color: 'var(--t3)', marginTop: 2 }}>
        <span>{new Date(sessions[0].date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
        <span style={{ color: diff > 0 ? '#3db882' : diff < 0 ? '#e05555' : 'var(--t3)' }}>
          {diff > 0 ? '+' : ''}{diff.toFixed(1)}{unit}
        </span>
        <span>{new Date(sessions[sessions.length - 1].date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
      </div>
    </div>
  )
}
