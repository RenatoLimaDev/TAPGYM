import { useState, useEffect, useRef, useCallback } from 'react'
import { useConfirm } from '../hooks/useConfirm.js'
import { fmtDuration, dispKg, vibe } from '../utils/db.js'

export default function WorkoutScreen({ db, workoutId, onFinish, onEnd, onToast }) {
  const workout = db.workouts.find(w => w.id === workoutId)

  const [exs, setExs] = useState(() =>
    workout.exercises.map(e => ({
      ...e,
      doneKg: e.kg,
      doneReps: e.reps || 8,
      log: [],
      phase: 'idle',
      _setStart: null,
    }))
  )
  const [exIdx,       setExIdx]       = useState(0)
  const [startTime,   setStartTime]   = useState(null)
  const [globalTime,  setGlobalTime]  = useState('--:--')
  const [setTime,     setSetTime]     = useState('0:00')
  const [restRem,     setRestRem]     = useState(null)
  const [restActive,  setRestActive]  = useState(false)
  const [restNextTxt, setRestNextTxt] = useState('')
  const [, setTotalRest] = useState(0)
  const [done,        setDone]        = useState(false)
  const [doneStats,   setDoneStats]   = useState(null)
  const [pendingEntry, setPendingEntry] = useState(null)
  const [sessionNote, setSessionNote] = useState('')
  const [progNote,    setProgNote]    = useState('')
  const [endConfirm, armEndConfirm]   = useConfirm()
  const [exMetrics,   setExMetrics]   = useState(null)

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      ;[0, 0.15, 0.3].forEach(t => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.3, ctx.currentTime + t)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2)
        osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + 0.25)
      })
    } catch {}
  }

  const globalRef         = useRef()
  const progRef           = useRef()
  const touchY            = useRef(0)
  const totalRestRef      = useRef(0)
  const restStartRef      = useRef(null)
  const restDurationRef   = useRef(0)
  const totalRestAtStart  = useRef(0)
  const currentSetStartRef = useRef(null)
  const repsScrollRef     = useRef()
  const prExNamesRef      = useRef(new Set())

  // ── Center selected rep ───────────────────────────────────────────────────
  const currentDoneReps = exs[exIdx]?.doneReps
  useEffect(() => {
    if (!repsScrollRef.current) return
    const selected = repsScrollRef.current.children[(currentDoneReps ?? 1) - 1]
    if (selected) selected.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [currentDoneReps, exIdx])

  const ex = exs[exIdx]

  // ── Last session data for current exercise ────────────────────────────────
  const lastExData = (() => {
    const lastSession = [...db.history].reverse().find(
      h => h.wid === workoutId && h.exercises?.some(e => e.name === ex?.name)
    )
    return lastSession?.exercises?.find(e => e.name === ex?.name) ?? null
  })()

  // ── Unified tick — global + rest + set timers all in one interval ─────────
  useEffect(() => {
    if (!startTime) return
    globalRef.current = setInterval(() => {
      const now = Date.now()
      setGlobalTime(fmtDuration(Math.floor((now - startTime) / 1000)))

      if (currentSetStartRef.current !== null) {
        setSetTime(fmtDuration(Math.floor((now - currentSetStartRef.current) / 1000)))
      }

      if (restStartRef.current !== null) {
        const elapsed = Math.floor((now - restStartRef.current) / 1000)
        const rem = restDurationRef.current - elapsed
        const accum = totalRestAtStart.current + Math.min(elapsed, restDurationRef.current)
        totalRestRef.current = accum
        setTotalRest(accum)

        if (rem <= 0) {
          restStartRef.current = null
          setRestActive(false)
          vibe([50, 30, 50, 30, 50])
          playBeep()
        } else {
          setRestRem(fmtDuration(rem))
        }
      }
    }, 1000)
    return () => clearInterval(globalRef.current)
  }, [startTime])

  // ── Progression note ──────────────────────────────────────────────────────
  const showProgNote = msg => {
    setProgNote(msg)
    clearTimeout(progRef.current)
    progRef.current = setTimeout(() => setProgNote(''), 3000)
  }

  const checkProgression = useCallback((finishedEx) => {
    const all = db.history.flatMap(h => h.exercises || [])
    const last = all.filter(e => e.name === finishedEx.name).pop()
    if (!last?.sets?.length) return
    const lastAvg = last.sets.reduce((a, s) => a + s.kg, 0) / last.sets.length
    if (finishedEx.doneKg > lastAvg) {
      showProgNote(`↑ ${dispKg(finishedEx.doneKg - lastAvg, db.unit)}${db.unit} more than last time!`)
    }
  }, [db])

  // ── PR detection ──────────────────────────────────────────────────────────
  const checkPR = useCallback((exName, kg) => {
    const histMax = db.history
      .flatMap(h => h.exercises || [])
      .filter(e => e.name === exName)
      .flatMap(e => e.sets || [])
      .reduce((max, s) => Math.max(max, s.kg || 0), 0)
    if (kg > histMax && histMax > 0) {
      prExNamesRef.current.add(exName)
      onToast('🏆 New PR — ' + exName + '!')
      vibe([100, 50, 200])
    }
  }, [db, onToast])

  // ── Rest timer — driven by the unified tick in globalRef ─────────────────
  const showRest = useCallback((ex) => {
    totalRestAtStart.current = totalRestRef.current
    restStartRef.current = Date.now()
    restDurationRef.current = ex.rest
    setRestRem(fmtDuration(ex.rest))
    setRestNextTxt(`Next: Set ${ex.log.length + 1} of ${ex.sets} — ${ex.name}`)
    setRestActive(true)
  }, [])

  const skipRest = () => {
    if (restStartRef.current !== null) {
      const elapsed = Math.floor((Date.now() - restStartRef.current) / 1000)
      totalRestRef.current = totalRestAtStart.current + Math.min(elapsed, restDurationRef.current)
      restStartRef.current = null
    }
    setRestActive(false)
  }

  // ── Finish workout ────────────────────────────────────────────────────────
  const finishWorkout = useCallback((currentExs, start) => {
    clearInterval(globalRef.current)
    currentSetStartRef.current = null
    restStartRef.current = null
    const elapsed = start ? Math.floor((Date.now() - start) / 1000) : 0
    const sets = currentExs.reduce((a, e) => a + e.log.length, 0)
    const vol  = currentExs.reduce((a, e) => a + e.log.reduce((b, s) => b + s.kg * (s.reps || 1), 0), 0)
    const rest = totalRestRef.current
    const entry = {
      wid: workoutId,
      date: new Date().toISOString(),
      dur: elapsed, sets, vol, restSec: rest,
      exercises: currentExs.map(e => ({ name: e.name, muscle: e.muscle, sets: e.log })),
      prs: [...prExNamesRef.current],
    }
    setPendingEntry(entry)
    setDoneStats({ sets, elapsed, rest })
    setRestActive(false)
    setDone(true)
    vibe([100, 50, 100, 50, 200])
  }, [workoutId])

  // ── Advance to next exercise ──────────────────────────────────────────────
  const advanceEx = useCallback((currentExs, currentStart) => {
    restStartRef.current = null
    setRestActive(false)
    const next = currentExs.findIndex(e => e.phase !== 'done')
    if (next >= 0) {
      setExIdx(next)
      onToast(currentExs[next].name)
    } else {
      finishWorkout(currentExs, currentStart)
    }
  }, [finishWorkout, onToast])

  // ── Tap circle ────────────────────────────────────────────────────────────
  const handleTap = () => {
    if (!ex) return

    if (ex.phase === 'done') {
      setExMetrics(exIdx)
      return
    }

    if (ex.phase === 'idle') {
      if (ex.doneKg === 0 && ex.muscle !== 'Cardio') { onToast('Set a weight first'); vibe([20, 10, 20]); return }
      const now = Date.now()
      const newStart = startTime || now
      if (!startTime) setStartTime(newStart)
      currentSetStartRef.current = now
      setExs(prev => prev.map((e, i) => i === exIdx ? { ...e, phase: 'active', _setStart: now } : e))
      vibe(20)
      return
    }

    if (ex.phase === 'active') {
      const dur = Math.floor((Date.now() - ex._setStart) / 1000)
      currentSetStartRef.current = null
      setSetTime('0:00')
      const newLog = [...ex.log, { kg: ex.doneKg, reps: ex.doneReps, dur, setNum: ex.log.length + 1 }]
      vibe([30, 15, 50])
      if (ex.muscle !== 'Cardio') {
        checkProgression({ ...ex, log: newLog })
        checkPR(ex.name, ex.doneKg)
      }

      const finished = newLog.length >= ex.sets
      const newExs = exs.map((e, i) => i === exIdx
        ? { ...e, phase: finished ? 'done' : 'idle', log: newLog }
        : e
      )
      setExs(newExs)

      if (finished) {
        setTimeout(() => advanceEx(newExs, startTime || Date.now()), 1200)
      } else {
        showRest({ ...ex, log: newLog })
      }
    }
  }

  // ── Weight adjust ─────────────────────────────────────────────────────────
  const adjustWeight = dir => {
    setExs(prev => prev.map((e, i) => i !== exIdx ? e : {
      ...e,
      doneKg: dir < 0
        ? Math.max(0, Math.round((e.doneKg - 2.5) * 2) / 2)
        : Math.round((e.doneKg + 2.5) * 2) / 2,
    }))
    vibe(8)
  }

  // ── Jump to exercise ──────────────────────────────────────────────────────
  const jumpTo = i => {
    restStartRef.current = null
    currentSetStartRef.current = null
    setSetTime('0:00')
    setRestActive(false)
    setExIdx(i)
  }

  const editSet = (editIdx, setIdx, newKg, newReps) => {
    setExs(prev => prev.map((e, i) => i !== editIdx ? e : {
      ...e,
      log: e.log.map((s, j) => j !== setIdx ? s : { ...s, kg: newKg, reps: newReps }),
    }))
  }

  // ── End workout ───────────────────────────────────────────────────────────
  const handleEnd = () => {
    if (!endConfirm) { armEndConfirm(); return }
    clearInterval(globalRef.current)
    currentSetStartRef.current = null
    restStartRef.current = null
    onEnd()
  }

  // ── Swipe navigation ──────────────────────────────────────────────────────
  const onTouchStart = e => { touchY.current = e.touches[0].clientY }
  const onTouchEnd   = e => {
    const dy = e.changedTouches[0].clientY - touchY.current
    if (Math.abs(dy) < 70) return
    if (dy < 0) { const n = exs.findIndex((_, i) => i > exIdx); if (n >= 0) jumpTo(n) }
    else        { if (exIdx > 0) jumpTo(exIdx - 1) }
  }

  // ── Series SVG dots ───────────────────────────────────────────────────────
  const cx = 105, cy = 105, r = 118
  const dots = Array.from({ length: ex?.sets || 0 }, (_, i) => {
    const a = -Math.PI / 2 + (i / (ex.sets)) * Math.PI * 2
    const x = (cx + r * Math.cos(a)).toFixed(1)
    const y = (cy + r * Math.sin(a)).toFixed(1)
    let fill = '#2a2a2e'
    if (i < ex.log.length)                                   fill = '#3db882'
    else if (i === ex.log.length && ex.phase === 'active')   fill = '#e8ff47'
    return <circle key={i} cx={x} cy={y} r="5" fill={fill} />
  })

  // ── Circle state ──────────────────────────────────────────────────────────
  const circleBg     = ex?.phase === 'done' ? '#0d1a14' : ex?.phase === 'active' ? '#181a0e' : 'var(--s1)'
  const circleBorder = ex?.phase === 'done' ? 'var(--gr)' : ex?.phase === 'active' ? 'var(--ac)' : 'var(--b)'
  const circleGlow   = ex?.phase === 'active' ? '0 0 0 6px rgba(232,255,71,.07), 0 4px 40px rgba(0,0,0,.5)' : '0 4px 40px rgba(0,0,0,.5)'

  // ── Done screen ───────────────────────────────────────────────────────────
  if (done && doneStats) {
    const hasPRs = pendingEntry?.prs?.length > 0
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 36 }}>
        <div style={{ fontSize: 56 }}>{hasPRs ? '🏆' : '✅'}</div>
        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.03em', textAlign: 'center', lineHeight: 1.1 }}>Workout<br />Complete</div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[['Sets', doneStats.sets], ['Time', fmtDuration(doneStats.elapsed)], ['Rest', fmtDuration(doneStats.rest)]].map(([l, v]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--mo)', color: 'var(--ac)' }}>{v}</div>
              <div style={{ fontSize: 9, fontFamily: 'var(--mo)', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        {hasPRs && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {pendingEntry.prs.map(name => (
              <div key={name} style={{ fontFamily: 'var(--mo)', fontSize: 10, fontWeight: 700, color: '#0c0c0d', background: 'var(--ac)', borderRadius: 20, padding: '4px 12px' }}>
                🏅 {name}
              </div>
            ))}
          </div>
        )}

        <textarea
          placeholder="Session note... (optional)"
          value={sessionNote}
          onChange={e => setSessionNote(e.target.value)}
          style={{
            width: '100%', maxWidth: 320, minHeight: 72, resize: 'none',
            background: 'var(--s1)', border: '1px solid var(--b)', borderRadius: 12,
            color: 'var(--t1)', fontFamily: 'var(--fn)', fontSize: 13, padding: '12px 14px',
            outline: 'none',
          }}
        />

        <div
          onClick={() => { onFinish({ ...pendingEntry, note: sessionNote || undefined }); onEnd() }}
          style={{ background: 'var(--ac)', color: '#0c0c0d', borderRadius: 14, padding: '16px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%', maxWidth: 260, textAlign: 'center' }}
        >
          Save & Close
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{
        paddingTop: 'max(env(safe-area-inset-top), 12px)',
        padding: 'max(env(safe-area-inset-top), 12px) 20px 12px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.04em', color: 'var(--t2)' }}>{workout.name}</div>
          <div style={{ fontFamily: 'var(--mo)', fontSize: 12, color: 'var(--t3)' }}>{globalTime}</div>
        </div>
        <div onClick={handleEnd} style={{
          padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          background: endConfirm ? 'rgba(224,85,85,.1)' : 'transparent',
          border: `1px solid ${endConfirm ? 'var(--rd)' : 'var(--b)'}`,
          color: endConfirm ? 'var(--rd)' : 'var(--t2)',
        }}>
          {endConfirm ? 'Sure?' : 'End'}
        </div>
      </div>

      {/* ── Body ── */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 'max(env(safe-area-inset-bottom), 10px)', overflowY: 'auto', position: 'relative' }}
      >
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.03em', textAlign: 'center', lineHeight: 1.1, marginBottom: 5, marginTop: 20 }}>{ex?.name}</div>
        <div style={{ fontFamily: 'var(--mo)', fontSize: 11, color: 'var(--t2)', textAlign: 'center', marginBottom: lastExData ? 6 : 24 }}>
          {ex?.muscle} · {ex?.log?.length || 0}/{ex?.sets} sets
        </div>
        {lastExData && (() => {
          if (ex?.muscle === 'Cardio') {
            const avgDur = Math.round(lastExData.sets.reduce((a, s) => a + (s.dur || 0), 0) / lastExData.sets.length)
            return (
              <div style={{ fontFamily: 'var(--mo)', fontSize: 10, color: 'var(--t3)', textAlign: 'center', marginBottom: 24, letterSpacing: '.04em' }}>
                last · {fmtDuration(avgDur)} avg
              </div>
            )
          }
          const avgKg   = lastExData.sets.reduce((a, s) => a + s.kg, 0) / lastExData.sets.length
          const avgReps = Math.round(lastExData.sets.reduce((a, s) => a + (s.reps || 0), 0) / lastExData.sets.length)
          return (
            <div style={{ fontFamily: 'var(--mo)', fontSize: 10, color: 'var(--t3)', textAlign: 'center', marginBottom: 24, letterSpacing: '.04em' }}>
              last · {dispKg(avgKg, db.unit)}{db.unit} × {avgReps} reps
            </div>
          )
        })()}

        {/* Tap circle */}
        <div style={{ position: 'relative', width: 210, height: 210, flexShrink: 0, marginTop: 10, marginBottom: 25 }}>
          <svg
            style={{ position: 'absolute', top: -22, left: -22, width: 254, height: 254, pointerEvents: 'none' }}
            viewBox="-22 -22 254 254"
          >
            {dots}
          </svg>
          <div
            onClick={handleTap}
            style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: circleBg, border: `2px solid ${circleBorder}`,
              boxShadow: circleGlow,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', gap: 4,
              transition: 'border-color .2s, box-shadow .2s, background .2s, transform .08s',
              touchAction: 'none',
            }}
          >
            {ex?.phase === 'done' && <>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--gr)' }}>✓</div>
              <div style={{ fontFamily: 'var(--mo)', fontSize: 9, color: 'var(--gr)', letterSpacing: '.1em', textTransform: 'uppercase' }}>tap for stats</div>
            </>}
            {ex?.phase === 'active' && <>
              <div style={{ fontFamily: 'var(--mo)', fontSize: 34, fontWeight: 300, color: 'var(--ac)', lineHeight: 1, animation: 'pulse 1s ease-in-out infinite' }}>{setTime}</div>
              <div style={{ fontFamily: 'var(--mo)', fontSize: 9, color: 'var(--t2)', letterSpacing: '.1em', textTransform: 'uppercase' }}>tap to finish</div>
            </>}
            {(!ex?.phase || ex?.phase === 'idle') && <>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1, color: 'var(--t1)' }}>SET {(ex?.log?.length || 0) + 1}</div>
              <div style={{ fontFamily: 'var(--mo)', fontSize: 9, color: (ex?.doneKg === 0 && ex?.muscle !== 'Cardio') ? 'var(--rd)' : 'var(--t2)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                {(ex?.doneKg === 0 && ex?.muscle !== 'Cardio') ? 'set weight first' : 'tap to start'}
              </div>
            </>}
          </div>
        </div>

        {/* Reps selector — hidden for cardio */}
        {ex?.muscle !== 'Cardio' && (
          <div style={{ width: '100%', marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mo)', fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.1em', textAlign: 'center', marginBottom: 8 }}>Reps</div>
            <div ref={repsScrollRef} style={{ overflowX: 'auto', display: 'flex', gap: 6, padding: '2px calc(50% - 18px)', scrollSnapType: 'x mandatory', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)', maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)' }}>
              {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                <div
                  key={n}
                  onClick={() => setExs(prev => prev.map((e, i) => i === exIdx ? { ...e, doneReps: n } : e))}
                  style={{
                    flexShrink: 0, width: 36, height: 36, borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--mo)', fontSize: 13, cursor: 'pointer',
                    scrollSnapAlign: 'center',
                    background: ex?.doneReps === n ? 'var(--ac)' : 'var(--s2)',
                    border: `1px solid ${ex?.doneReps === n ? 'var(--ac)' : 'var(--b)'}`,
                    color: ex?.doneReps === n ? '#0c0c0d' : 'var(--t2)',
                    fontWeight: ex?.doneReps === n ? 700 : 400,
                  }}
                >
                  {n}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weight row — hidden for cardio */}
        {ex?.muscle !== 'Cardio' && (
          <div style={{ display: 'flex', alignItems: 'end', gap: 16, marginBottom: 20 }}>
            <div onClick={() => adjustWeight(-1)} onTouchStart={e => e.currentTarget.style.transform='scale(.88)'} onTouchEnd={e => e.currentTarget.style.transform=''} onMouseDown={e => e.currentTarget.style.transform='scale(.88)'} onMouseUp={e => e.currentTarget.style.transform=''} style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--s2)', border: '1px solid var(--b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'var(--t2)', cursor: 'pointer', flexShrink: 0, transition: 'transform .1s' }}>−</div>
            <div style={{ minWidth: 120, textAlign: 'center' }}>
              <div style={{ fontSize: 40, fontWeight: 700, fontFamily: 'var(--mo)', lineHeight: 1 }}>{ex?.doneKg === 0 ? 'BW' : dispKg(ex?.doneKg ?? 0, db.unit)}</div>
              <div style={{ fontSize: 11, fontFamily: 'var(--mo)', color: 'var(--t3)', marginTop: 2 }}>{ex?.doneKg === 0 ? '' : db.unit}</div>
            </div>
            <div onClick={() => adjustWeight(1)} onTouchStart={e => e.currentTarget.style.transform='scale(.88)'} onTouchEnd={e => e.currentTarget.style.transform=''} onMouseDown={e => e.currentTarget.style.transform='scale(.88)'} onMouseUp={e => e.currentTarget.style.transform=''} style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--s2)', border: '1px solid var(--b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'var(--t2)', cursor: 'pointer', flexShrink: 0, transition: 'transform .1s' }}>+</div>
          </div>
        )}

        {/* Exercise progress dots */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {exs.map((e, i) => (
            <div key={i} onClick={() => jumpTo(i)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', opacity: i === exIdx ? 1 : e.phase === 'done' ? 0.5 : 0.3, transition: 'opacity .2s' }}>
              <div style={{ fontSize: 9, fontFamily: 'var(--mo)', color: 'var(--t2)', letterSpacing: '.06em', maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
              <div style={{ display: 'flex', gap: 3 }}>
                {Array.from({ length: e.sets }, (_, s) => {
                  let bg = 'var(--s2)', border = 'var(--b)'
                  if (s < e.log.length)                                { bg = 'var(--gr)'; border = 'var(--gr)' }
                  else if (i === exIdx && s === e.log.length && e.phase === 'active') { bg = 'var(--ac)'; border = 'var(--ac)' }
                  return <div key={s} style={{ width: 7, height: 7, borderRadius: '50%', background: bg, border: `1px solid ${border}`, transition: 'all .2s' }} />
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Rest overlay */}
        {restActive && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 20,
            background: 'rgba(12,12,13,.96)', backdropFilter: 'blur(12px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
          }}>
            <div style={{ fontFamily: 'var(--mo)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--bl)' }}>Rest</div>
            <div style={{ fontSize: 76, fontWeight: 800, fontFamily: 'var(--mo)', letterSpacing: '-.04em', lineHeight: 1, color: 'var(--t1)' }}>{restRem}</div>
            <div style={{ fontSize: 13, color: 'var(--t2)', textAlign: 'center', lineHeight: 1.5 }}>
              {restNextTxt}
            </div>
            <div onClick={skipRest} style={{ padding: '15px 36px', background: 'var(--s2)', border: '1px solid var(--b)', borderRadius: 14, color: 'var(--t1)', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
              Skip Rest →
            </div>
          </div>
        )}
      </div>

      {/* Progression note */}
      {progNote && (
        <div style={{ position: 'fixed', bottom: 80, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 50, pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(61,184,130,.15)', border: '1px solid rgba(61,184,130,.4)',
            padding: '10px 18px', borderRadius: 12, fontFamily: 'var(--mo)', fontSize: 12,
            color: 'var(--gr)', whiteSpace: 'nowrap', animation: 'fadeUp .3s ease',
          }}>
            {progNote}
          </div>
        </div>
      )}

      {/* Exercise metrics overlay */}
      {exMetrics !== null && (
        <ExMetricsOverlay
          ex={exs[exMetrics]}
          unit={db.unit}
          onClose={() => setExMetrics(null)}
          onNext={() => { setExMetrics(null); advanceEx(exs, startTime) }}
          onEditSet={(setIdx, newKg, newReps) => editSet(exMetrics, setIdx, newKg, newReps)}
        />
      )}
    </div>
  )
}

// ── Inline exercise metrics overlay ─────────────────────────────────────────
function ExMetricsOverlay({ ex, unit, onClose, onNext, onEditSet }) {
  const [editIdx, setEditIdx] = useState(null)
  const [editKg,   setEditKg]   = useState(0)
  const [editReps, setEditReps] = useState(0)

  const openEdit = (i, s) => { setEditIdx(i); setEditKg(s.kg); setEditReps(s.reps || 0) }
  const saveEdit = () => { onEditSet(editIdx, editKg, editReps); setEditIdx(null) }
  const adjKg   = d => setEditKg(v => Math.max(0, Math.round((v + d * 2.5) * 2) / 2))
  const adjReps = d => setEditReps(v => Math.max(1, v + d))
  const btn = { width: 30, height: 30, borderRadius: 8, background: 'var(--s1)', border: '1px solid var(--b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--t2)', cursor: 'pointer' }

  if (!ex) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(12,12,13,.95)', backdropFilter: 'blur(12px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 28, overflowY: 'auto',
    }}>
      <div style={{ fontFamily: 'var(--mo)', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--gr)' }}>✓ {ex.name}</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--mo)', color: 'var(--ac)' }}>{ex.log.length}</div>
        <div style={{ fontSize: 9, fontFamily: 'var(--mo)', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 2 }}>sets done</div>
      </div>
      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '50vh', overflowY: 'auto' }}>
        {ex.log.map((s, i) => editIdx === i ? (
          <div key={i} style={{ background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--ac)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ex.muscle !== 'Cardio' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div onClick={() => adjKg(-1)} style={btn}>−</div>
                  <div style={{ fontFamily: 'var(--mo)', fontSize: 14, fontWeight: 700, color: 'var(--ac)', minWidth: 52, textAlign: 'center' }}>{editKg === 0 ? 'BW' : `${dispKg(editKg, unit)}${unit}`}</div>
                  <div onClick={() => adjKg(1)} style={btn}>+</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div onClick={() => adjReps(-1)} style={btn}>−</div>
                  <div style={{ fontFamily: 'var(--mo)', fontSize: 14, fontWeight: 700, color: 'var(--t1)', minWidth: 28, textAlign: 'center' }}>{editReps}</div>
                  <div onClick={() => adjReps(1)} style={btn}>+</div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <div onClick={() => setEditIdx(null)} style={{ flex: 1, padding: '8px 0', background: 'var(--s1)', border: '1px solid var(--b)', borderRadius: 8, textAlign: 'center', fontFamily: 'var(--mo)', fontSize: 11, color: 'var(--t3)', cursor: 'pointer' }}>Cancel</div>
              <div onClick={saveEdit} style={{ flex: 1, padding: '8px 0', background: 'var(--ac)', borderRadius: 8, textAlign: 'center', fontFamily: 'var(--mo)', fontSize: 11, fontWeight: 700, color: '#0c0c0d', cursor: 'pointer' }}>Save</div>
            </div>
          </div>
        ) : (
          <div key={i} onClick={() => ex.muscle !== 'Cardio' && openEdit(i, s)} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--b)', cursor: ex.muscle !== 'Cardio' ? 'pointer' : 'default' }}>
            <span style={{ flex: 1, fontFamily: 'var(--mo)', fontSize: 11, color: 'var(--t2)' }}>Set {i + 1}</span>
            {ex.muscle === 'Cardio' ? (
              <span style={{ flex: 1, fontFamily: 'var(--mo)', fontSize: 13, color: 'var(--ac)', textAlign: 'center' }}>{s.dur ? fmtDuration(s.dur) : '—'}</span>
            ) : (
              <span style={{ flex: 1, fontFamily: 'var(--mo)', fontSize: 13, color: 'var(--ac)', textAlign: 'center' }}>{s.kg === 0 ? 'BW' : `${dispKg(s.kg, unit)}${unit}`} × {s.reps || '?'}</span>
            )}
            <span style={{ flex: 1, fontFamily: 'var(--mo)', fontSize: 11, color: 'var(--t3)', textAlign: 'right' }}>{ex.muscle !== 'Cardio' ? (s.dur ? fmtDuration(s.dur) : 'no rest') : ''}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div onClick={onClose} style={{ padding: '14px 28px', background: 'var(--s2)', border: '1px solid var(--b)', borderRadius: 12, color: 'var(--t2)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Close</div>
        <div onClick={onNext}  style={{ padding: '14px 28px', background: 'var(--ac)', borderRadius: 12, color: '#0c0c0d', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Next →</div>
      </div>
    </div>
  )
}
