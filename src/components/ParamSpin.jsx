export default function ParamSpin({ label, value, unit, onDown, onUp, flex = 1 }) {
  return (
    <div style={{
      flex, background: 'var(--s2)', borderRadius: 12,
      border: '1px solid var(--b)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 3,
      padding: '12px 8px 14px',
      position: 'relative', minWidth: 0, overflow: 'hidden',
      userSelect: 'none',
    }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--mo)', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', fontFamily: 'var(--mo)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontFamily: 'var(--mo)', color: 'var(--t3)' }}>
        {unit || '\u00a0'}
      </div>

      {/* Two-tone bottom bar: left=red (−), right=green (+) */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, display: 'flex' }}>
        <div style={{ flex: 1, background: 'var(--rd)', opacity: 0.5, borderRadius: '0 0 0 12px' }} />
        <div style={{ flex: 1, background: 'var(--gr)', opacity: 0.5, borderRadius: '0 0 12px 0' }} />
      </div>

      {/* Split tap zones */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
        <div
          onPointerDown={e => { e.currentTarget.style.background = 'rgba(224,85,85,.12)'; onDown() }}
          onPointerUp={e => { e.currentTarget.style.background = 'transparent' }}
          onPointerLeave={e => { e.currentTarget.style.background = 'transparent' }}
          style={{ flex: 1, cursor: 'pointer', transition: 'background .1s' }}
        />
        <div
          onPointerDown={e => { e.currentTarget.style.background = 'rgba(61,184,130,.12)'; onUp() }}
          onPointerUp={e => { e.currentTarget.style.background = 'transparent' }}
          onPointerLeave={e => { e.currentTarget.style.background = 'transparent' }}
          style={{ flex: 1, cursor: 'pointer', transition: 'background .1s' }}
        />
      </div>
    </div>
  )
}
