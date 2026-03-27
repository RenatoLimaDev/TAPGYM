import { useState, useRef, useCallback } from 'react'
import ExerciseCard from '../components/ExerciseCard.jsx'
import { useConfirm } from '../hooks/useConfirm.js'
import { DAYS_SHORT, vibe, dispKg } from '../utils/db.js'

export default function BuildScreen({ db, editId, onSave, onBack, onToast }) {
  const existing = editId ? db.workouts.find(w => w.id === editId) : null
  const knownExercises = [...new Set(db.history.flatMap(h => (h.exercises || []).map(e => e.name)))]

  const [name, setName]       = useState(existing?.name ?? '')
  const [day,  setDay]        = useState(existing?.day  ?? (db.day > 0 ? db.day : 1))
  const [exercises, setExs]   = useState(() => existing ? existing.exercises.map(e => ({ ...e })) : [])
  const [delConfirm, armDel]  = useConfirm()
  const [nameErr, setNameErr] = useState(false)
  const [draggingIdx, setDraggingIdx] = useState(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)
  const bodyRef   = useRef()
  const cardRefs  = useRef([])
  const dragRef   = useRef(null) // { from, over, startY, rects }

  const reorder = useCallback((from, to) => {
    setExs(prev => {
      const arr = [...prev]
      const [item] = arr.splice(from, 1)
      arr.splice(to, 0, item)
      return arr
    })
    vibe(15)
  }, [])

  const onDragPointerDown = useCallback((i, e) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    const rects = cardRefs.current.map(el => el?.getBoundingClientRect() ?? null)
    dragRef.current = { from: i, over: i, startY: e.clientY, rects }
    cardRefs.current.forEach((el, idx) => {
      if (!el) return
      if (idx === i) { el.style.zIndex = '10'; el.style.transition = 'box-shadow .15s' }
      else el.style.transition = 'transform .15s ease'
    })
    setDraggingIdx(i)
    setDragOverIdx(i)
    vibe(20)
  }, [])

  const onDragPointerMove = useCallback((e) => {
    if (!dragRef.current) return
    const { from, rects } = dragRef.current
    const dragEl = cardRefs.current[from]
    if (dragEl) dragEl.style.transform = `translateY(${e.clientY - dragRef.current.startY}px)`

    const y = e.clientY
    let closest = dragRef.current.over
    let minDist = Infinity
    rects.forEach((rect, idx) => {
      if (!rect || idx === from) return
      const dist = Math.abs(y - (rect.top + rect.height / 2))
      if (dist < minDist) { minDist = dist; closest = idx }
    })
    if (closest !== dragRef.current.over) {
      dragRef.current.over = closest
      setDragOverIdx(closest)
    }

    // shift other cards to show live reorder
    const slotH = rects[from] ? rects[from].height + 10 : 0
    cardRefs.current.forEach((el, idx) => {
      if (idx === from || !el) return
      let shift = 0
      if (closest > from && idx > from && idx <= closest) shift = -slotH
      if (closest < from && idx < from && idx >= closest) shift = slotH
      el.style.transform = `translateY(${shift}px)`
    })
  }, [])

  const onDragPointerUp = useCallback(() => {
    if (!dragRef.current) return
    cardRefs.current.forEach(el => {
      if (el) { el.style.transform = ''; el.style.zIndex = ''; el.style.transition = '' }
    })
    const { from, over } = dragRef.current
    if (from !== over) reorder(from, over)
    dragRef.current = null
    setDraggingIdx(null)
    setDragOverIdx(null)
  }, [reorder])

  const cycleDay = () => { setDay(d => (d % 7) + 1); vibe(8) }

  const addExercise = () => {
    setExs(prev => [...prev, { id: Date.now(), name: '', sets: 3, rest: 90, kg: 0, reps: 8, muscle: 'Chest', progressStep: 2 }])
    setTimeout(() => bodyRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 50)
  }

  const updateEx = (i, patch) =>
    setExs(prev => prev.map((e, idx) => idx === i ? { ...e, ...patch } : e))

  const deleteEx = i =>
    setExs(prev => prev.filter((_, idx) => idx !== i))

  const save = () => {
    if (!name.trim()) {
      setNameErr(true)
      setTimeout(() => setNameErr(false), 500)
      return
    }
    const valid = exercises.filter(e => e.name.trim())
    if (!valid.length) { onToast('Add at least one exercise'); return }

    const workout = { id: editId || Date.now(), name: name.trim(), day, exercises: valid }
    const idx = db.workouts.findIndex(w => w.id === workout.id)
    const workouts = idx >= 0
      ? db.workouts.map((w, i) => i === idx ? workout : w)
      : [...db.workouts, workout]
    onSave({ ...db, workouts })
    onToast('Saved!')
    onBack()
  }

  const deleteWorkout = () => {
    if (!delConfirm) { armDel(); return }
    onSave({ ...db, workouts: db.workouts.filter(w => w.id !== editId) })
    onBack()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{
        paddingTop: 'max(env(safe-area-inset-top), 16px)',
        padding: 'max(env(safe-area-inset-top), 14px) 16px 14px',
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        {/* Back */}
        <div onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--s2)', border: '1px solid var(--b)', color: 'var(--t1)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          ←
        </div>

        {/* Name input */}
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Workout name…"
          maxLength={28}
          style={{
            flex: 1, background: 'transparent', border: 'none',
            color: nameErr ? 'var(--rd)' : 'var(--t1)',
            fontFamily: 'var(--fn)', fontSize: 16, fontWeight: 700,
            outline: 'none', letterSpacing: '-.02em', minWidth: 0,
            transition: 'color .3s',
          }}
        />

        {/* Day picker */}
        <div onClick={cycleDay} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5px 10px', background: 'var(--s2)', border: '1px solid var(--b)', borderRadius: 10, cursor: 'pointer', flexShrink: 0, gap: 1 }}>
          <div style={{ fontSize: 8, fontFamily: 'var(--mo)', color: 'var(--t3)', letterSpacing: '.1em', textTransform: 'uppercase' }}>day</div>
          <div style={{ fontSize: 13, fontFamily: 'var(--mo)', color: 'var(--ac)', fontWeight: 700 }}>{DAYS_SHORT[day]}</div>
        </div>

        {/* Delete */}
        {editId && (
          <div onClick={deleteWorkout} style={{
            padding: '8px 10px',
            background: delConfirm ? 'rgba(224,85,85,.15)' : 'transparent',
            border: `1px solid ${delConfirm ? 'var(--rd)' : 'var(--b)'}`,
            borderRadius: 10, color: delConfirm ? 'var(--rd)' : 'var(--t3)',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
          }}>
            {delConfirm ? 'Sure?' : 'Del'}
          </div>
        )}

        {/* Save */}
        <div onClick={save} style={{ padding: '8px 14px', background: 'var(--ac)', color: '#0c0c0d', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
          Save
        </div>
      </div>

      {/* ── Exercise list ── */}
      <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 16px', paddingBottom: 'max(env(safe-area-inset-bottom), 48px)' }}>
        {exercises.map((ex, i) => (
          <div key={ex.id} ref={el => { cardRefs.current[i] = el }} style={{ position: 'relative' }}>
            <ExerciseCard
              exercise={ex}
              index={i}
              unit={db.unit}
              onChange={patch => updateEx(i, patch)}
              onDelete={() => deleteEx(i)}
              isDragging={draggingIdx === i}
              isDragOver={dragOverIdx === i && draggingIdx !== i}
              suggestions={knownExercises}
              dragHandleProps={{
                onPointerDown: e => onDragPointerDown(i, e),
                onPointerMove: onDragPointerMove,
                onPointerUp: onDragPointerUp,
              }}
            />
          </div>
        ))}

        {exercises.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            margin: '4px 0 10px', opacity: 0.6,
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--b)' }} />
            <span style={{ fontFamily: 'var(--mo)', fontSize: 10, color: 'var(--t3)', whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--rd)' }}>■</span> tap left to decrease · <span style={{ color: 'var(--gr)' }}>■</span> tap right to increase
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--b)' }} />
          </div>
        )}

        <div
          onClick={addExercise}
          style={{
            width: '100%', padding: 14, background: 'transparent',
            border: '1.5px dashed var(--b)', borderRadius: 14,
            color: 'var(--t3)', fontSize: 14, cursor: 'pointer',
            marginTop: 4, textAlign: 'center', transition: 'all .15s',
          }}
        >
          + Add exercise
        </div>

        {/* ── 4-week forecast ── */}
        {exercises.some(e => e.muscle !== 'Cardio' && e.name.trim() && (e.progressStep ?? 2.5) > 0) && (
          <div style={{ marginTop: 24, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--b)' }} />
              <span style={{ fontFamily: 'var(--mo)', fontSize: 9, color: 'var(--t3)', letterSpacing: '.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>4-week forecast</span>
              <div style={{ flex: 1, height: 1, background: 'var(--b)' }} />
            </div>
            <div style={{ background: 'var(--s1)', border: '1px solid var(--b)', borderRadius: 14, overflow: 'hidden' }}>
              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(5, auto)', gap: '0 12px', padding: '8px 14px', borderBottom: '1px solid var(--b)' }}>
                <span style={{ fontFamily: 'var(--mo)', fontSize: 9, color: 'var(--t3)', letterSpacing: '.08em' }}></span>
                {['Now', '+1', '+2', '+3', '+4'].map(h => (
                  <span key={h} style={{ fontFamily: 'var(--mo)', fontSize: 9, color: 'var(--t3)', letterSpacing: '.08em', textAlign: 'right' }}>{h}</span>
                ))}
              </div>
              {/* Exercise rows */}
              {exercises.filter(e => e.muscle !== 'Cardio' && e.name.trim()).map((ex, i) => {
                const step = ex.progressStep ?? 2.5
                const weeks = [0, 1, 2, 3, 4].map(w => dispKg(ex.kg + w * step, db.unit))
                return (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr repeat(5, auto)', gap: '0 12px', padding: '9px 14px', borderBottom: i < exercises.filter(e => e.muscle !== 'Cardio' && e.name.trim()).length - 1 ? '1px solid var(--b)' : 'none' }}>
                    <span style={{ fontFamily: 'var(--fn)', fontSize: 12, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</span>
                    {weeks.map((w, wi) => (
                      <span key={wi} style={{ fontFamily: 'var(--mo)', fontSize: 11, color: wi === 0 ? 'var(--t1)' : 'var(--ac)', textAlign: 'right', whiteSpace: 'nowrap' }}>{w}</span>
                    ))}
                  </div>
                )
              })}
            </div>
            <div style={{ fontFamily: 'var(--mo)', fontSize: 9, color: 'var(--t3)', textAlign: 'center', marginTop: 8 }}>
              assumes all sets completed at target reps
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
