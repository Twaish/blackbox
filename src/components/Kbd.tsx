import { ReactNode } from 'react'

export function Kbd({
  keys,
  children,
}: {
  keys?: string[]
  children?: ReactNode
}) {
  return (
    <span className="text-muted-foreground bg-muted/50 flex min-h-5 items-center justify-center border px-1 py-px font-mono text-[10px] [&_svg]:h-2.5 [&_svg]:w-2.5">
      {keys?.join(' ')}
      {children}
    </span>
  )
}
