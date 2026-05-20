import { cn } from '@/utils/tailwind'
import { ComponentProps } from 'react'

export function ToolbarButton({
  className,
  children,
  ...props
}: ComponentProps<'button'>) {
  return (
    <button
      className={cn(
        'no-drag focus-visible:bg-secondary/50 text-muted-foreground hover:bg-secondary/50 flex h-full min-w-6 items-center justify-center gap-1 rounded-none text-xs outline-none select-none',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
