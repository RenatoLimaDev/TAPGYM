import { useState } from 'react'

const STEPS = [
  {
    icon: '＋',
    title: 'Create workouts',
    body: 'Tap "+ New workout" to build your training days. Add exercises, set targets, rest times, and assign a day of the week.',
  },
  {
    icon: '▶',
    title: 'Start training',
    body: 'Tap a workout card to begin. Log each set, adjust weight on the fly, and track rest time between sets.',
  },
  {
    icon: '↑',
    title: 'Auto-progression',
    body: 'Complete all sets at target reps and your weight increases automatically next session. Configure the increment per exercise in the workout editor.',
  },
  {
    icon: '🏅',
    title: 'PRs & progress',
    body: 'Personal records are detected automatically. Tap any exercise in the post-workout screen to see your progress chart over time.',
  },
  {
    icon: '♡',
    title: 'Cardio support',
    body: 'Set any exercise muscle to "Cardio" for duration-based tracking — no weight or reps, just time.',
  },
]

export default function TourOverlay({ onClose }) {
  const [step, setStep] = useState(0)
  const last = step === STEPS.length - 1
  const s = STEPS[step]

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 80,
      background: 'rgba(12,12,13,.97)', backdropFilter: 'blur(16px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '32px 32px',
      animation: 'fadeUp .2s ease',
    }}>

      {/* Step dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 40 }}>
        {STEPS.map((_, i) => (
          <div key={i} onClick={() => setStep(i)} style={{
            width: i === step ? 20 : 6, height: 6, borderRadius: 3,
            background: i === step ? 'var(--ac)' : 'var(--b)',
            transition: 'all .25s', cursor: 'pointer',
          }} />
        ))}
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 320, textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20,
          background: 'var(--s2)', border: '1px solid var(--b)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, margin: '0 auto 24px',
        }}>
          {s.icon}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em', marginBottom: 14 }}>
          {s.title}
        </div>
        <div style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.7, fontFamily: 'var(--fn)' }}>
          {s.body}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 48, width: '100%', maxWidth: 320 }}>
        {!last && (
          <button
            onClick={onClose}
            onTouchStart={e => e.currentTarget.style.transform='scale(.94)'}
            onTouchEnd={e => e.currentTarget.style.transform=''}
            onMouseDown={e => e.currentTarget.style.transform='scale(.94)'}
            onMouseUp={e => e.currentTarget.style.transform=''}
            style={{ flex: 1, padding: '13px 0', background: 'var(--s2)', border: '1px solid var(--b)', borderRadius: 12, color: 'var(--t3)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'transform .1s' }}
          >
            Skip
          </button>
        )}
        <button
          onClick={() => last ? onClose() : setStep(s => s + 1)}
          onTouchStart={e => e.currentTarget.style.transform='scale(.94)'}
          onTouchEnd={e => e.currentTarget.style.transform=''}
          onMouseDown={e => e.currentTarget.style.transform='scale(.94)'}
          onMouseUp={e => e.currentTarget.style.transform=''}
          style={{ flex: 2, padding: '13px 0', background: last ? 'var(--ac)' : 'var(--s2)', border: `1px solid ${last ? 'var(--ac)' : 'var(--b)'}`, borderRadius: 12, color: last ? '#0c0c0d' : 'var(--t1)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'transform .1s' }}
        >
          {last ? "Let's go" : 'Next →'}
        </button>
      </div>
    </div>
  )
}
