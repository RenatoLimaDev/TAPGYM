export default function Toast({ msg }) {
  if (!msg) return null
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: 0, right: 0,
      display: 'flex', justifyContent: 'center',
      zIndex: 99, pointerEvents: 'none',
    }}>
      <div style={{
        background: 'var(--s2)', color: 'var(--t1)',
        padding: '10px 20px', borderRadius: 20,
        fontFamily: 'var(--mo)', fontSize: 11,
        letterSpacing: '.06em', textTransform: 'uppercase',
        border: '1px solid var(--b)',
        whiteSpace: 'nowrap', animation: 'fadeUp .28s ease',
      }}>
        {msg}
      </div>
    </div>
  )
}
