import { timeSince } from '../utils/db.js'

export default function WorkoutCard({ workout, lastEntry, progressed, onTap, onEdit }) {
  const doneToday = lastEntry && new Date(lastEntry.date).toDateString() === new Date().toDateString()

  return (
    <div
      onClick={onTap}
      style={{
        background: 'var(--s1)',
        border: `1px solid ${doneToday ? 'rgba(61,184,130,.3)' : 'var(--b)'}`,
        borderRadius: 18, padding: 18, marginBottom: 10, cursor: 'pointer',
        transition: 'transform .12s',
        WebkitTapHighlightColor: 'transparent',
      }}
      onTouchStart={e => e.currentTarget.style.transform = 'scale(.98)'}
      onTouchEnd={e => e.currentTarget.style.transform = ''}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.02em' }}>{workout.name}</div>
          <div style={{ fontFamily: 'var(--mo)', fontSize: 10, color: doneToday ? 'var(--gr)' : 'var(--t3)', marginTop: 3 }}>
            {doneToday ? '✓ done today' : 'Last: ' + (lastEntry ? timeSince(lastEntry.date) : 'never')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {progressed && (
            <div style={{
              fontSize: 10, fontFamily: 'var(--mo)', color: '#0c0c0d',
              background: 'var(--ac)', borderRadius: 20, padding: '4px 10px',
              whiteSpace: 'nowrap', fontWeight: 700,
            }}>
              ↑ load up
            </div>
          )}
          <div
            onClick={e => { e.stopPropagation(); onEdit() }}
            style={{
              fontSize: 11, fontFamily: 'var(--mo)', color: 'var(--t2)',
              background: 'var(--s2)', border: '1px solid var(--b)',
              borderRadius: 20, padding: '4px 12px', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Edit
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {workout.exercises.map((ex, i) => (
          <span key={ex.id} style={{ fontSize: 11, fontFamily: 'var(--mo)', color: 'var(--t2)' }}>
            {i > 0 && <span style={{ color: 'var(--t3)' }}>· </span>}
            {ex.name}
          </span>
        ))}
      </div>
    </div>
  )
}
