export default function ParamSpin({ label, value, unit, onDown, onUp, flex = 1 }) {
  return (
    <div style={{
      flex, display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 8, userSelect: 'none', minWidth: 0,
    }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--mo)', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
        {label}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center',
        background: 'var(--s2)', border: '1px solid var(--b)',
        borderRadius: 14, overflow: 'hidden', width: '100%',
      }}>
        <div
          onPointerDown={onDown}
          style={{
            width: 44, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: 'var(--t2)', cursor: 'pointer', flexShrink: 0,
            borderRight: '1px solid var(--b)',
          }}
        >
          −
        </div>
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 2, minWidth: 0, padding: '0 2px',
        }}>
          <span style={{ fontSize: 19, fontWeight: 700, color: 'var(--t1)', fontFamily: 'var(--mo)', lineHeight: 1 }}>
            {value}
          </span>
          {unit ? <span style={{ fontSize: 9, fontFamily: 'var(--mo)', color: 'var(--t3)' }}>{unit}</span> : null}
        </div>
        <div
          onPointerDown={onUp}
          style={{
            width: 44, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: 'var(--t2)', cursor: 'pointer', flexShrink: 0,
            borderLeft: '1px solid var(--b)',
          }}
        >
          +
        </div>
      </div>
    </div>
  )
}
