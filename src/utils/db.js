// ─── Constants ────────────────────────────────────────────────────────────────
export const MUSCLES   = ['Chest','Back','Shoulders','Biceps','Triceps','Quads','Hamstrings','Glutes','Calves','Core','Cardio']
export const SETS_OPTS = [1,2,3,4,5,6]
export const REST_OPTS = [30,45,60,75,90,120,150,180]
export const MIN_OPTS  = [5,10,15,20,25,30,45,60]
export const PROG_OPTS = [0, 1, 2, 3, 5, 10, 15, 20]
export const DAYS_LABELS = ['All','Mon','Tue','Wed','Thu','Fri','Sat','Sun']
export const DAYS_SHORT  = ['—','Mon','Tue','Wed','Thu','Fri','Sat','Sun']

// ─── Default DB ───────────────────────────────────────────────────────────────
const KEY = 'tapgym3'

function initDB() {
  return {
    unit: 'kg',
    day: 0,
    toured: false,
    workouts: [
      { id: 1, name: 'Push Day', day: 1, exercises: [
        { id: 11, name: 'Bench Press',     sets: 4, rest: 90,  kg: 60,  reps: 8,  muscle: 'Chest' },
        { id: 12, name: 'Shoulder Press',  sets: 3, rest: 90,  kg: 40,  reps: 10, muscle: 'Shoulders' },
        { id: 13, name: 'Tricep Pushdown', sets: 3, rest: 60,  kg: 25,  reps: 12, muscle: 'Triceps' },
      ]},
      { id: 2, name: 'Pull Day', day: 3, exercises: [
        { id: 21, name: 'Pull-ups',    sets: 4, rest: 90, kg: 0,  reps: 8,  muscle: 'Back' },
        { id: 22, name: 'Barbell Row', sets: 4, rest: 90, kg: 50, reps: 8,  muscle: 'Back' },
        { id: 23, name: 'Bicep Curl',  sets: 3, rest: 60, kg: 15, reps: 12, muscle: 'Biceps' },
      ]},
      { id: 3, name: 'Leg Day', day: 5, exercises: [
        { id: 31, name: 'Squat',       sets: 4, rest: 120, kg: 80,  reps: 6,  muscle: 'Quads' },
        { id: 32, name: 'Leg Press',   sets: 3, rest: 90,  kg: 120, reps: 10, muscle: 'Quads' },
        { id: 33, name: 'Romanian DL', sets: 3, rest: 90,  kg: 60,  reps: 10, muscle: 'Hamstrings' },
      ]},
    ],
    history: [],
  }
}

export function dbLoad() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw || raw === 'undefined') return initDB()
    return JSON.parse(raw) || initDB()
  } catch {
    localStorage.removeItem(KEY)
    return initDB()
  }
}

export function dbSave(db) {
  localStorage.setItem(KEY, JSON.stringify(db))
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const fmt      = n => String(n).padStart(2, '0')
export const vibe     = p => navigator.vibrate && navigator.vibrate(p)
export const dispKg   = (v, unit) => unit === 'lbs' ? Math.round(v * 2.2046 * 10) / 10 : v
export const timeSince = d => {
  const h = Math.floor((Date.now() - new Date(d)) / 3600000)
  if (h < 1)  return 'today'
  if (h < 24) return h + 'h ago'
  return Math.floor(h / 24) + 'd ago'
}
export const fmtDuration = secs =>
  fmt(Math.floor(secs / 60)) + ':' + fmt(secs % 60)
