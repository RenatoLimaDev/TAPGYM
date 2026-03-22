import { useEffect, useRef, useState } from 'react'
import WorkoutCard from '../components/WorkoutCard.jsx'
import TourOverlay from '../components/TourOverlay.jsx'
import ExportOverlay from '../components/ExportOverlay.jsx'
import { DAYS_LABELS, DAYS_SHORT } from '../utils/db.js'

export default function HomeScreen({ db, onSave, onOpenBuild, onStartWorkout, onShowMetrics, onOpenHistory, onOpenStats }) {
  const todayDow = new Date().getDay()
  const todayIdx = todayDow === 0 ? 7 : todayDow
  const today    = new Date().toDateString()

  const daysScrollRef = useRef()

  const [spinning, setSpinning] = useState(false)
  const [showTour, setShowTour] = useState(() => !db.toured)
  const [showExport, setShowExport] = useState(false)

  const setDay = d => onSave({ ...db, day: d })
  const toggleUnit = () => {
    setSpinning(true)
    onSave({ ...db, unit: db.unit === 'lbs' ? 'kg' : 'lbs' })
    setTimeout(() => setSpinning(false), 700)
  }

  const importCode = list => {
    const newWorkouts = list.map((workout, wi) => ({
      ...workout, id: Date.now() + wi,
      exercises: workout.exercises.map((e, i) => ({ ...e, id: Date.now() + wi * 1000 + i })),
    }))
    onSave({ ...db, workouts: [...db.workouts, ...newWorkouts] })
  }

  // On mount: jump to today
  useEffect(() => { setDay(todayIdx) }, [])

  useEffect(() => {
    const container = daysScrollRef.current
    if (!container) return
    const el = container.children[db.day]
    if (!el) return
    const target = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2
    container.scrollTo({ left: target, behavior: 'smooth' })
  }, [db.day])

  // Days completed this week (Mon=1..Sun=7)
  const weekStart = (() => {
    const d = new Date(); d.setHours(0,0,0,0)
    d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1))
    return d
  })()
  const streakDays = new Set(
    db.history
      .filter(h => new Date(h.date) >= weekStart)
      .map(h => db.workouts.find(w => w.id === h.wid)?.day)
      .filter(Boolean)
  )

  const filtered = db.day === 0
    ? db.workouts
    : db.workouts.filter(w => w.day === db.day)

  const closeTour = () => { setShowTour(false); onSave({ ...db, toured: true }) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)', overflow: 'hidden', position: 'relative' }}>

      {/* Floating unit toggle */}
      <div style={{
        position: 'absolute', bottom: 24, right: 16,
        zIndex: 10, width: 90, height: 90,
      }}>
        {/* Orbiting text — textLength forces exact circle close */}
        <svg width="90" height="90" style={{ position: 'absolute', inset: 0, animation: 'orbit 9s linear infinite' }}>
          <defs>
            {/* r=36, center=45,45 — circumference≈226 */}
            <path id="orbitPath" d="M 81,45 A 36,36 0 0 1 9,45 A 36,36 0 0 1 81,45" />
          </defs>
          <text>
            <textPath href="#orbitPath" textLength="220" style={{ fontSize: 8.5, fill: '#e8ff47', fontFamily: 'var(--mo)', fontWeight: 700 }}>
                TAP TO SWITCH · TAP TO SWITCH · TAP TO SWITCH ·
            </textPath>
          </text>
        </svg>

        {/* Button centered — offset=(90-52)/2=19 */}
        <div
          onClick={toggleUnit}
          style={{
            position: 'absolute', top: 19, left: 19, width: 52, height: 52,
            borderRadius: '50%', background: 'var(--s2)', border: '1px solid var(--b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--mo)', fontSize: 15, fontWeight: 700, color: 'var(--t2)',
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,.4)',
            animation: spinning ? 'spiral .7s ease forwards' : 'none',
          }}
        >
          {db.unit}
        </div>
      </div>

      {/* ── Header + Day chips ── */}
      <div style={{ position: 'relative', flexShrink: 0, zIndex: 1 }}>
        <div style={{
          padding: 'max(env(safe-area-inset-top), 36px) 20px 12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '.06em', color: 'var(--ac)' }}>TAPGYM</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontFamily: 'var(--mo)', fontSize: 11, color: 'var(--t3)' }}>
              {new Date().toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div
              onClick={() => setShowTour(true)}
              style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--s2)', border: '1px solid var(--b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mo)', fontSize: 12, color: 'var(--t3)', cursor: 'pointer' }}
            >?</div>
          </div>
        </div>

        {/* ── Day chips ── */}
        <div style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)', maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)' }}>
          <div ref={daysScrollRef} style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 20px 14px' }}>
            {DAYS_LABELS.map((label, i) => {
              const burning = i > 0 && streakDays.has(i) && db.day !== i
              return (
                <div
                  key={i} onClick={() => setDay(i)}
                  style={{ position: 'relative', flexShrink: 0 }}
                >
                  <div style={{
                    padding: '6px 14px', borderRadius: 20,
                    fontFamily: 'var(--mo)', fontSize: 11, cursor: 'pointer',
                    background: db.day === i ? 'var(--ac)' : 'var(--s2)',
                    border: `1px solid ${db.day === i ? 'var(--ac)' : burning ? 'var(--ac)' : (i === todayIdx ? 'rgba(232,255,71,.25)' : 'var(--b)')}`,
                    color: db.day === i ? '#0c0c0d' : burning ? 'var(--ac)' : 'var(--t2)',
                    fontWeight: db.day === i ? 700 : burning ? 600 : 400,
                    transition: 'all .15s',
                  }}>
                    {label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Bottom fade ── */}
        <div style={{
          position: 'absolute', bottom: -20, left: 0, right: 0, height: 20,
          background: 'linear-gradient(to bottom, var(--bg), transparent)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--t3)', margin: '8px 0 8px' }}>
          My Workouts
        </div>

        {/* Empty states */}
        {!db.workouts.length && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t2)', marginBottom: 8 }}>No workouts yet</h3>
            <p style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.7 }}>Create your first workout below</p>
          </div>
        )}

        {db.workouts.length > 0 && !filtered.length && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t2)', marginBottom: 8 }}>Nothing here yet</h3>
            <p style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.7 }}>
              No workouts for {DAYS_SHORT[db.day] || 'this day'}
            </p>
          </div>
        )}

        {/* Workout cards */}
        {filtered.map(w => {
          const lastEntry = db.history.filter(h => h.wid === w.id).pop()
          const doneToday = lastEntry && new Date(lastEntry.date).toDateString() === today
          const progressed = lastEntry && w.exercises.some(wEx => {
            const done = lastEntry.exercises?.find(e => e.name === wEx.name)
            if (!done) return false
            return done.sets.length >= wEx.sets && done.sets.every(s => (s.reps || 0) >= (wEx.reps || 8))
          })
          return (
            <WorkoutCard
              key={w.id}
              workout={w}
              lastEntry={lastEntry}
              progressed={progressed}
              onTap={() => doneToday ? onShowMetrics(w.id, lastEntry) : onStartWorkout(w.id)}
              onEdit={() => onOpenBuild(w.id)}
            />
          )
        })}

        {/* New workout button */}
        <div
          onClick={() => onOpenBuild(null)}
          style={{
            width: '100%', padding: 14, background: 'transparent',
            border: '1.5px dashed var(--b)', borderRadius: 14,
            color: 'var(--t3)', fontSize: 14, cursor: 'pointer',
            marginTop: 4, textAlign: 'center', transition: 'all .15s',
          }}
        >
          + New workout
        </div>

        {/* Bottom links */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 4px' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div onClick={() => db.workouts.length && setShowExport(true)} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: db.workouts.length ? 'var(--t3)' : 'var(--b)', cursor: db.workouts.length ? 'pointer' : 'default' }}>Share</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div onClick={onOpenStats} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--t3)', cursor: 'pointer' }}>Stats →</div>
            <div onClick={onOpenHistory} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--t3)', cursor: 'pointer' }}>History →</div>
          </div>
        </div>
      </div>

      {showTour && <TourOverlay onClose={closeTour} />}
      {showExport && <ExportOverlay workouts={db.workouts} unit={db.unit} onClose={() => setShowExport(false)} onImportCode={importCode} />}
    </div>
  )
}
