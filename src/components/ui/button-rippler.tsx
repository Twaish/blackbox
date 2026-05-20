import { useEffect, useRef } from 'react'

export const Rippler = ({
  buttonRef,
  duration = 500,
}: {
  buttonRef: React.RefObject<HTMLButtonElement | null>
  duration?: number
}): React.ReactNode => {
  const ripplerRef = useRef<HTMLDivElement>(null)
  const handleClick = (e: MouseEvent) => {
    const button = buttonRef.current
    const rippler = ripplerRef.current
    if (!button || !rippler) {
      return
    }
    const rect = button.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ripple = document.createElement('span')
    ripple.classList.add('ripple')
    ripple.className =
      'absolute pointer-events-none rounded-full bg-current opacity-30 animate-[ripple] duration-[var(--anim-time)]'
    ripple.style.setProperty('--anim-time', `${duration}ms`)
    ripple.style.left = x + 'px'
    ripple.style.top = y + 'px'
    ripple.style.transform = 'translate(-50%, -50%)'
    rippler.appendChild(ripple)

    setTimeout(() => {
      ripple.remove()
    }, duration)
  }

  useEffect(() => {
    const button = buttonRef?.current
    if (!button) {
      return
    }
    button.addEventListener('click', handleClick)

    return () => {
      button.removeEventListener('click', handleClick)
    }
  }, [buttonRef])

  if (!buttonRef) return

  return (
    <div
      ref={ripplerRef}
      className={'absolute inset-0 overflow-hidden rounded-[inherit]'}
    ></div>
  )
}
