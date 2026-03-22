import { useState, useRef } from 'react'

export function useConfirm(timeout = 2500) {
  const [armed, setArmed] = useState(false)
  const timerRef = useRef()

  const arm = () => {
    setArmed(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setArmed(false), timeout)
  }

  const reset = () => {
    clearTimeout(timerRef.current)
    setArmed(false)
  }

  return [armed, arm, reset]
}