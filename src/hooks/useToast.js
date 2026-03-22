import { useState, useRef, useCallback } from 'react'

export function useToast() {
  const [msg, setMsg] = useState('')
  const timer = useRef(null)

  const show = useCallback(text => {
    setMsg(text)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMsg(''), 2200)
  }, [])

  return { msg, show }
}
