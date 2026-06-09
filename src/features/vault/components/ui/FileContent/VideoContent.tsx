import { cn } from '@/utils/tailwind'
import { useEffect, useRef, useState, useCallback } from 'react'

type ContextMenuState = {
  x: number
  y: number
  visible: boolean
}

export function VideoContent({
  src,
  className,
}: {
  src: string
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [loop, setLoop] = useState(false)
  const [menu, setMenu] = useState<ContextMenuState>({
    x: 0,
    y: 0,
    visible: false,
  })

  useEffect(() => {
    if (videoRef.current) videoRef.current.loop = loop
  }, [loop])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    setMenu({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
    })
  }, [])

  const closeMenu = useCallback(() => {
    setMenu((prev) => ({ ...prev, visible: false }))
  }, [])

  useEffect(() => {
    if (!menu.visible) return
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && closeMenu()
    window.addEventListener('mousedown', closeMenu)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', closeMenu)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [menu.visible, closeMenu])

  const toggleLoop = useCallback(() => {
    setLoop((prev) => !prev)
    closeMenu()
  }, [closeMenu])

  return (
    <div
      ref={containerRef}
      className="relative flex max-h-[inherit] max-w-[inherit]"
    >
      <video
        ref={videoRef}
        className={className}
        src={src}
        controls
        onContextMenu={handleContextMenu}
      />

      {menu.visible && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{ top: menu.y, left: menu.x }}
          className={cn(
            'border-border bg-popover/90 absolute z-50 min-w-40 overflow-hidden border backdrop-blur-md',
          )}
        >
          <MenuItem onClick={toggleLoop}>
            Repeat: {loop ? 'on' : 'off'}
          </MenuItem>
        </div>
      )}
    </div>
  )
}

function MenuItem({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'hover:bg-accent hover:text-accent-foreground flex w-full cursor-default items-center gap-2 px-3 py-1.5 text-left text-sm outline-none select-none',
      )}
    >
      {children}
    </button>
  )
}
