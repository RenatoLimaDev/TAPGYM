export default function UnitToggle({ db, onSave, visible, spinning }) {
  const toggle = () => onSave({ ...db, unit: db.unit === 'lbs' ? 'kg' : 'lbs' })

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: 0, right: 0,
      display: 'flex', justifyContent: 'center',
      zIndex: 200, pointerEvents: 'none',
      opacity: visible ? 1 : 0,
      transition: 'opacity .5s ease',
    }}>
      <div style={{ width: 90, height: 90, position: 'relative', pointerEvents: 'auto' }}>
        <svg width="90" height="90" style={{ position: 'absolute', inset: 0, animation: 'orbit 9s linear infinite' }}>
          <defs>
            <path id="orbitPath" d="M 81,45 A 36,36 0 0 1 9,45 A 36,36 0 0 1 81,45" />
          </defs>
          <text>
            <textPath href="#orbitPath" textLength="220" style={{ fontSize: 8.5, fill: '#e8ff47', fontFamily: 'var(--mo)', fontWeight: 700 }}>
              TAP TO SWITCH · TAP TO SWITCH · TAP TO SWITCH ·
            </textPath>
          </text>
        </svg>
        <div
          onClick={toggle}
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
    </div>
  )
}
