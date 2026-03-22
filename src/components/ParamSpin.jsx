export default function ParamSpin({ label, value, unit, onDown, onUp }) {
  return (
    <div style={{
      flex: 1, background: 'var(--s2)', borderRadius: 12,
      padding: '12px 8px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 3, border: '1px solid var(--b)',
      position: 'relative', minWidth: 0, overflow: 'hidden',
      userSelect: 'none',
    }}>
      <div style={{ fontSize: 9, fontFamily: 'var(--mo)', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', fontFamily: 'var(--mo)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 9, fontFamily: 'var(--mo)', color: 'var(--t3)' }}>
        {unit}
      </div>

      {/* Split tap zones with always-visible − + */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
        <div
          onPointerDown={e => { e.currentTarget.style.background = 'rgba(232,255,71,.1)'; onDown() }}
          onPointerUp={e => { e.currentTarget.style.background = 'transparent' }}
          onPointerLeave={e => { e.currentTarget.style.background = 'transparent' }}
          style={{
            flex: 1, cursor: 'pointer', display: 'flex',
            alignItems: 'flex-end', justifyContent: 'flex-start',
            padding: '0 6px 5px', color: 'var(--t3)', fontSize: 13, fontWeight: 700,
            transition: 'background .1s',
          }}
        >
          −
        </div>
        <div
          onPointerDown={e => { e.currentTarget.style.background = 'rgba(232,255,71,.1)'; onUp() }}
          onPointerUp={e => { e.currentTarget.style.background = 'transparent' }}
          onPointerLeave={e => { e.currentTarget.style.background = 'transparent' }}
          style={{
            flex: 1, cursor: 'pointer', display: 'flex',
            alignItems: 'flex-end', justifyContent: 'flex-end',
            padding: '0 6px 5px', color: 'var(--t3)', fontSize: 13, fontWeight: 700,
            transition: 'background .1s',
          }}
        >
          +
        </div>
      </div>
    </div>
  )
}