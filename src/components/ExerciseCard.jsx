import { useState } from 'react'
import ParamSpin from './ParamSpin.jsx'
import { useConfirm } from '../hooks/useConfirm.js'
import { MUSCLES, SETS_OPTS, REST_OPTS, MIN_OPTS, PROG_OPTS, dispKg } from '../utils/db.js'

const REPS_OPTS = Array.from({ length: 20 }, (_, k) => k + 1)

export default function ExerciseCard({ exercise, index, unit, onChange, onDelete, isDragging, dragHandleProps, suggestions = [] }) {
  const [deleteConfirm, armDeleteConfirm, resetDeleteConfirm] = useConfirm()
  const [muscleOpen, setMuscleOpen] = useState(false)
  const [showSug, setShowSug] = useState(false)
  const filteredSug = suggestions.filter(s =>
    s.toLowerCase().includes(exercise.name.toLowerCase()) && s !== exercise.name
  ).slice(0, 5)

  const handleDelete = () => {
    if (!deleteConfirm) { armDeleteConfirm(); return }
    resetDeleteConfirm()
    onDelete()
  }

  const spin = (field, dir) => {
    const opts = field === 'sets' ? SETS_OPTS : field === 'rest' ? REST_OPTS : field === 'min' ? MIN_OPTS : field === 'progressStep' ? PROG_OPTS : REPS_OPTS
    const ci = opts.indexOf(exercise[field])
    const ni = Math.max(0, Math.min(opts.length - 1, ci + dir))
    onChange({ [field]: opts[ni] })
  }

  const spinKg = dir => {
    onChange({ kg: Math.max(0, Math.round((exercise.kg + dir * 2.5) * 2) / 2) })
  }

  return (
    <div style={{
      position: 'relative',
      borderRadius: 16, marginBottom: 10, overflow: 'hidden',
      border: `1px solid ${isDragging ? 'var(--ac)' : 'var(--b)'}`,
      boxShadow: isDragging ? '0 16px 48px rgba(0,0,0,.7)' : 'none',
      transition: 'border-color .15s, box-shadow .15s',
    }}>

      {/* Drag handles — left and right edges */}
      {[{ left: 8 }, { right: 8 }].map((pos, hi) => (
        <div
          key={hi}
          {...dragHandleProps}
          style={{
            position: 'absolute', ...pos, top: '50%', transform: 'translateY(-50%)',
            display: 'flex', flexDirection: 'column', gap: 4, zIndex: 1,
            cursor: 'grab', touchAction: 'none', userSelect: 'none', padding: '4px 2px',
          }}
        >
          {[0, 1, 2, 3].map(k => (
            <div key={k} style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--t3)' }} />
          ))}
        </div>
      ))}

      {/* Top strip — muscle selector + delete */}
      <div style={{
        background: 'var(--s2)', borderBottom: '1px solid var(--b)',
        display: 'flex', alignItems: 'center',
      }}>
        {muscleOpen ? (
          <div style={{
            flex: 1, overflowX: 'auto',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
            maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
          }}>
            <div style={{ display: 'flex', gap: 5, padding: '8px 28px', width: 'max-content' }}>
              {MUSCLES.map(m => (
                <div
                  key={m}
                  onClick={() => { onChange({ muscle: m, ...(m === 'Cardio' && !exercise.min ? { min: 20 } : {}) }); setMuscleOpen(false) }}
                  style={{
                    padding: '4px 10px', borderRadius: 20, fontSize: 10, whiteSpace: 'nowrap',
                    fontFamily: 'var(--mo)', cursor: 'pointer',
                    background: exercise.muscle === m ? 'rgba(232,255,71,.12)' : 'var(--b)',
                    border: `1px solid ${exercise.muscle === m ? 'rgba(232,255,71,.4)' : 'transparent'}`,
                    color: exercise.muscle === m ? 'var(--ac)' : 'var(--t2)',
                    transition: 'all .12s',
                  }}
                >
                  {m}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            onClick={() => setMuscleOpen(true)}
            style={{ flex: 1, padding: '6px 28px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span style={{ fontSize: 8, fontFamily: 'var(--mo)', color: 'var(--t3)', letterSpacing: '.1em', textTransform: 'uppercase' }}>muscle</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--mo)', color: 'var(--ac)' }}>{exercise.muscle}</span>
            <span style={{ fontSize: 8, color: 'var(--t3)', marginLeft: -3 }}>▾</span>
          </div>
        )}

        {/* Delete */}
        <div
          onClick={handleDelete}
          style={{
            padding: '0 14px', alignSelf: 'stretch',
            borderLeft: `1px solid ${deleteConfirm ? 'var(--rd)' : 'var(--b)'}`,
            background: deleteConfirm ? 'rgba(224,85,85,.1)' : 'transparent',
            color: deleteConfirm ? 'var(--rd)' : 'var(--t3)',
            fontSize: deleteConfirm ? 10 : 16,
            fontFamily: 'var(--mo)', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all .15s', flexShrink: 0,
          }}
        >
          {deleteConfirm ? 'Sure?' : '×'}
        </div>
      </div>

      {/* Main content */}
      <div style={{ background: 'var(--s1)', padding: '12px 28px 16px' }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6, background: 'var(--s2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontFamily: 'var(--mo)', color: 'var(--t3)', flexShrink: 0,
          }}>
            {index + 1}
          </div>
          <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
            <input
              value={exercise.name}
              onChange={e => onChange({ name: e.target.value })}
              onFocus={() => setShowSug(true)}
              onBlur={() => setTimeout(() => setShowSug(false), 150)}
              placeholder="Exercise name"
              maxLength={28}
              style={{
                width: '100%', background: 'transparent', border: 'none',
                color: 'var(--t1)', fontFamily: 'var(--fn)', fontSize: 15, fontWeight: 600,
                outline: 'none', minWidth: 0,
              }}
            />
            {showSug && filteredSug.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: -8, right: -8, zIndex: 50, background: 'var(--s2)', border: '1px solid var(--b)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,.5)' }}>
                {filteredSug.map(s => (
                  <div
                    key={s}
                    onMouseDown={() => { onChange({ name: s }); setShowSug(false) }}
                    style={{ padding: '10px 14px', fontSize: 13, fontFamily: 'var(--fn)', color: 'var(--t1)', cursor: 'pointer', borderBottom: '1px solid var(--b)' }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Param spinners */}
        <div style={{ display: 'flex', gap: 8 }}>
          <ParamSpin label="Sets" value={exercise.sets} unit="" onDown={() => spin('sets', -1)} onUp={() => spin('sets', 1)} />
          <ParamSpin label="Rest" value={exercise.rest} unit="s" onDown={() => spin('rest', -1)} onUp={() => spin('rest', 1)} />
          {exercise.muscle === 'Cardio' ? (
            <ParamSpin label="Min" value={exercise.min || 20} unit="min" onDown={() => spin('min', -1)} onUp={() => spin('min', 1)} />
          ) : (
            <>
              <ParamSpin label="Target" value={dispKg(exercise.kg, unit)} unit={unit} onDown={() => spinKg(-1)} onUp={() => spinKg(1)} />
              <ParamSpin label="Reps"   value={exercise.reps || 8}        unit=""     onDown={() => spin('reps', -1)} onUp={() => spin('reps', 1)} />
              <ParamSpin label="Prog"   value={(exercise.progressStep ?? 2) > 0 ? `+${exercise.progressStep ?? 2}` : 'off'} unit={(exercise.progressStep ?? 2) > 0 ? unit : ''} onDown={() => spin('progressStep', -1)} onUp={() => spin('progressStep', 1)} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
