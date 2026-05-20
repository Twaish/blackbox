import { ReactNode } from 'react'

export function DialogEmptyIndicator({ children }: { children: ReactNode }) {
  return (
    <div className="text-muted-foreground/80 px-4 py-10 text-center text-xs">
      {children}
    </div>
  )
}
