import { useState, useRef } from 'react'
import { useDb }    from './hooks/useDb.js'
import { useToast } from './hooks/useToast.js'

import HomeScreen            from './screens/HomeScreen.jsx'
import BuildScreen           from './screens/BuildScreen.jsx'
import WorkoutScreen         from './screens/WorkoutScreen.jsx'
import HistoryScreen         from './screens/HistoryScreen.jsx'
import StatsScreen           from './screens/StatsScreen.jsx'
import WorkoutMetricsOverlay from './components/WorkoutMetricsOverlay.jsx'
import UnitToggle            from './components/UnitToggle.jsx'
import Toast                 from './components/Toast.jsx'

export default function App() {
  const { db, save }   = useDb()
  const { msg, show }  = useToast()

  const [screen,    setScreen]    = useState('home')
  const [editId,    setEditId]    = useState(null)
  const [workoutId, setWorkoutId] = useState(null)
  const [metrics,   setMetrics]   = useState(null)

  const [unitVisible,  setUnitVisible]  = useState(true)
  const [unitSpinning, setUnitSpinning] = useState(false)
  const hideTimerRef = useRef()

  const flashUnit = () => {
    setUnitVisible(true)
    clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setUnitVisible(false), 4000)
  }

  const saveUnit = newDb => {
    setUnitSpinning(true)
    flashUnit()
    save(newDb)
    setTimeout(() => setUnitSpinning(false), 700)
  }

  const goHome    = () => { setScreen('home');    flashUnit() }
  const goBuild   = id  => { setEditId(id ?? null); setScreen('build') }
  const goWorkout = id  => { setWorkoutId(id); setScreen('workout'); flashUnit() }
  const goHistory = ()  => setScreen('history')
  const goStats   = ()  => setScreen('stats')

  const handleFinish = entry => {
    const workout = db.workouts.find(w => w.id === entry.wid)
    let workouts = db.workouts
    const progressedNames = []
    if (workout) {
      const progressed = workout.exercises.map(wEx => {
        const done = entry.exercises.find(e => e.name === wEx.name)
        if (!done) return wEx
        const allSets = done.sets.length >= wEx.sets
        const allReps = done.sets.every(s => (s.reps || 0) >= (wEx.reps || 8))
        const step = wEx.progressStep ?? 2
        if (allSets && allReps && step > 0) {
          progressedNames.push({ name: wEx.name, from: wEx.kg, to: Math.round((wEx.kg + step) * 2) / 2 })
          return { ...wEx, kg: Math.round((wEx.kg + step) * 2) / 2 }
        }
        return wEx
      })
      if (progressedNames.length) {
        workouts = db.workouts.map(w => w.id === workout.id ? { ...w, exercises: progressed } : w)
      }
    }
    const finalEntry = progressedNames.length ? { ...entry, progressed: progressedNames } : entry
    save({ ...db, workouts, history: [...db.history, finalEntry] })
  }

  return (
    <div style={{ height: '100dvh', width: '100%', position: 'relative', overflow: 'hidden', background: 'var(--bg)' }}>

      {screen === 'home' && (
        <HomeScreen
          db={db}
          onSave={save}
          onOpenBuild={goBuild}
          onStartWorkout={goWorkout}
          onShowMetrics={(wid, entry) => setMetrics({ workoutId: wid, entry })}
          onOpenHistory={goHistory}
          onOpenStats={goStats}
          onFlashUnit={flashUnit}
        />
      )}

      {screen === 'build' && (
        <BuildScreen
          db={db}
          editId={editId}
          onSave={save}
          onBack={goHome}
          onToast={show}
        />
      )}

      {screen === 'workout' && (
        <WorkoutScreen
          db={db}
          workoutId={workoutId}
          onFinish={handleFinish}
          onEnd={goHome}
          onToast={show}
          onSave={save}
          onFlashUnit={flashUnit}
        />
      )}

      {screen === 'history' && (
        <HistoryScreen
          db={db}
          onBack={goHome}
          onShowMetrics={(wid, entry) => setMetrics({ workoutId: wid, entry })}
          onClearHistory={() => save({ ...db, history: [] })}
        />
      )}

      {screen === 'stats' && (
        <StatsScreen
          db={db}
          onBack={goHome}
        />
      )}

      {metrics && (() => {
        const w = db.workouts.find(x => x.id === metrics.workoutId)
        if (!w) return null
        return (
          <WorkoutMetricsOverlay
            workout={w}
            entry={metrics.entry}
            unit={db.unit}
            history={db.history}
            onClose={() => setMetrics(null)}
            onRedo={() => { setMetrics(null); goWorkout(metrics.workoutId) }}
          />
        )
      })()}

      <UnitToggle db={db} onSave={saveUnit} visible={unitVisible} spinning={unitSpinning} />

      <Toast msg={msg} />
    </div>
  )
}
