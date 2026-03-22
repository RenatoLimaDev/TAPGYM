import { test } from '@playwright/test'

const SEED = {
  unit: 'kg',
  day: 0,
  toured: true,
  workouts: [
    { id: 1, name: 'Push Day', day: 1, exercises: [
      { id: 11, name: 'Bench Press',     sets: 4, rest: 90,  kg: 60,  reps: 8,  muscle: 'Chest',     progressStep: 2 },
      { id: 12, name: 'Shoulder Press',  sets: 3, rest: 90,  kg: 40,  reps: 10, muscle: 'Shoulders', progressStep: 2 },
      { id: 13, name: 'Tricep Pushdown', sets: 3, rest: 60,  kg: 25,  reps: 12, muscle: 'Triceps',   progressStep: 2 },
    ]},
    { id: 2, name: 'Pull Day', day: 3, exercises: [
      { id: 21, name: 'Pull-ups',    sets: 4, rest: 90, kg: 0,  reps: 8,  muscle: 'Back',    progressStep: 0 },
      { id: 22, name: 'Barbell Row', sets: 4, rest: 90, kg: 50, reps: 8,  muscle: 'Back',    progressStep: 2 },
      { id: 23, name: 'Bicep Curl',  sets: 3, rest: 60, kg: 15, reps: 12, muscle: 'Biceps',  progressStep: 1 },
    ]},
    { id: 3, name: 'Leg Day', day: 5, exercises: [
      { id: 31, name: 'Squat',       sets: 4, rest: 120, kg: 80,  reps: 6,  muscle: 'Quads',      progressStep: 2 },
      { id: 32, name: 'Leg Press',   sets: 3, rest: 90,  kg: 120, reps: 10, muscle: 'Quads',      progressStep: 5 },
      { id: 33, name: 'Romanian DL', sets: 3, rest: 90,  kg: 60,  reps: 10, muscle: 'Hamstrings', progressStep: 2 },
    ]},
  ],
  history: [
    { id: 101, wid: 1, date: daysAgo(14), dur: 2700, sets: 10, vol: 2400, restSec: 900,
      exercises: [
        { name: 'Bench Press',    muscle: 'Chest',      sets: [{ kg: 60, reps: 8 }, { kg: 60, reps: 8 }, { kg: 60, reps: 7 }, { kg: 60, reps: 7 }] },
        { name: 'Shoulder Press', muscle: 'Shoulders',  sets: [{ kg: 40, reps: 10 }, { kg: 40, reps: 9 }, { kg: 40, reps: 9 }] },
        { name: 'Tricep Pushdown',muscle: 'Triceps',    sets: [{ kg: 25, reps: 12 }, { kg: 25, reps: 12 }, { kg: 25, reps: 11 }] },
      ]},
    { id: 102, wid: 2, date: daysAgo(12), dur: 3000, sets: 11, vol: 2800, restSec: 1080,
      exercises: [
        { name: 'Pull-ups',    muscle: 'Back',   sets: [{ kg: 0, reps: 8 }, { kg: 0, reps: 7 }, { kg: 0, reps: 6 }, { kg: 0, reps: 6 }] },
        { name: 'Barbell Row', muscle: 'Back',   sets: [{ kg: 50, reps: 8 }, { kg: 50, reps: 8 }, { kg: 50, reps: 8 }, { kg: 50, reps: 7 }] },
        { name: 'Bicep Curl',  muscle: 'Biceps', sets: [{ kg: 15, reps: 12 }, { kg: 15, reps: 12 }, { kg: 15, reps: 11 }] },
      ]},
    { id: 103, wid: 3, date: daysAgo(10), dur: 3300, sets: 10, vol: 4200, restSec: 1200,
      exercises: [
        { name: 'Squat',       muscle: 'Quads',      sets: [{ kg: 80, reps: 6 }, { kg: 80, reps: 6 }, { kg: 80, reps: 5 }, { kg: 80, reps: 5 }] },
        { name: 'Leg Press',   muscle: 'Quads',      sets: [{ kg: 120, reps: 10 }, { kg: 120, reps: 10 }, { kg: 120, reps: 9 }] },
        { name: 'Romanian DL', muscle: 'Hamstrings', sets: [{ kg: 60, reps: 10 }, { kg: 60, reps: 10 }, { kg: 60, reps: 9 }] },
      ]},
    { id: 104, wid: 1, date: daysAgo(7), dur: 2800, sets: 10, vol: 2520, restSec: 960,
      exercises: [
        { name: 'Bench Press',    muscle: 'Chest',     sets: [{ kg: 62, reps: 8 }, { kg: 62, reps: 8 }, { kg: 62, reps: 8 }, { kg: 62, reps: 7 }] },
        { name: 'Shoulder Press', muscle: 'Shoulders', sets: [{ kg: 42, reps: 10 }, { kg: 42, reps: 10 }, { kg: 42, reps: 9 }] },
        { name: 'Tricep Pushdown',muscle: 'Triceps',   sets: [{ kg: 27, reps: 12 }, { kg: 27, reps: 12 }, { kg: 27, reps: 12 }] },
      ]},
    { id: 105, wid: 2, date: daysAgo(5), dur: 3100, sets: 11, vol: 2900, restSec: 1020,
      exercises: [
        { name: 'Pull-ups',    muscle: 'Back',   sets: [{ kg: 0, reps: 8 }, { kg: 0, reps: 8 }, { kg: 0, reps: 7 }, { kg: 0, reps: 7 }] },
        { name: 'Barbell Row', muscle: 'Back',   sets: [{ kg: 52, reps: 8 }, { kg: 52, reps: 8 }, { kg: 52, reps: 8 }, { kg: 52, reps: 8 }] },
        { name: 'Bicep Curl',  muscle: 'Biceps', sets: [{ kg: 16, reps: 12 }, { kg: 16, reps: 12 }, { kg: 16, reps: 12 }] },
      ]},
    { id: 106, wid: 3, date: daysAgo(3), dur: 3400, sets: 10, vol: 4400, restSec: 1140,
      exercises: [
        { name: 'Squat',       muscle: 'Quads',      sets: [{ kg: 82, reps: 6 }, { kg: 82, reps: 6 }, { kg: 82, reps: 6 }, { kg: 82, reps: 6 }] },
        { name: 'Leg Press',   muscle: 'Quads',      sets: [{ kg: 125, reps: 10 }, { kg: 125, reps: 10 }, { kg: 125, reps: 10 }] },
        { name: 'Romanian DL', muscle: 'Hamstrings', sets: [{ kg: 62, reps: 10 }, { kg: 62, reps: 10 }, { kg: 62, reps: 10 }] },
      ]},
    { id: 107, wid: 1, date: daysAgo(1), dur: 2900, sets: 10, vol: 2640, restSec: 900,
      exercises: [
        { name: 'Bench Press',    muscle: 'Chest',     sets: [{ kg: 64, reps: 8 }, { kg: 64, reps: 8 }, { kg: 64, reps: 8 }, { kg: 64, reps: 8 }] },
        { name: 'Shoulder Press', muscle: 'Shoulders', sets: [{ kg: 44, reps: 10 }, { kg: 44, reps: 10 }, { kg: 44, reps: 10 }] },
        { name: 'Tricep Pushdown',muscle: 'Triceps',   sets: [{ kg: 29, reps: 12 }, { kg: 29, reps: 12 }, { kg: 29, reps: 12 }] },
      ]},
  ],
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/TAPGYM/')
  await page.evaluate(seed => {
    localStorage.setItem('tapgym3', JSON.stringify(seed))
  }, SEED)
  await page.reload()
  // The app overrides day to today on mount — click All to show every workout
  await page.waitForSelector('text=All')
  await page.click('text=All')
  // Wait for the unit toggle to fade out (4s timer + 0.5s transition)
  await page.waitForTimeout(4800)
})

test('home screen', async ({ page }) => {
  await page.waitForSelector('text=Push Day')
  await page.screenshot({ path: '.github/assets/home.png', fullPage: false })
})

test('workout screen', async ({ page }) => {
  await page.waitForSelector('text=Push Day')
  await page.click('text=Push Day')
  await page.waitForSelector('text=Bench Press')
  // Wait for toggle fade-out (nav re-triggers the 4s timer) + rep scroll animation
  await page.waitForTimeout(5200)
  await page.screenshot({ path: '.github/assets/workout.png', fullPage: false })
})

test('stats screen', async ({ page }) => {
  await page.waitForSelector('text=STATS')
  await page.click('text=STATS')
  await page.waitForTimeout(500)
  await page.screenshot({ path: '.github/assets/stats.png', fullPage: false })
})

test('history screen', async ({ page }) => {
  await page.waitForSelector('text=HISTORY')
  await page.click('text=HISTORY')
  await page.waitForTimeout(300)
  await page.screenshot({ path: '.github/assets/history.png', fullPage: false })
})
