import { cn } from '@/utils/tailwind'
import { ComponentProps } from 'react'

export function TextContent({ className, children }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'bg-secondary/50 flex w-full flex-1 overflow-auto p-2',
        className,
      )}
    >
      <pre className="font-mono text-sm">{children}</pre>
    </div>
  )
}
