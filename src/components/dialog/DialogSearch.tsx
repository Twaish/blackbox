import { Search } from 'lucide-react'
import { ComponentProps, forwardRef } from 'react'

export const DialogSearch = forwardRef<
  HTMLInputElement,
  ComponentProps<'input'>
>((props, ref) => {
  return (
    <div className="flex min-h-12 items-center gap-3 border-b px-4">
      <Search size={15} className="text-muted-foreground/50 shrink-0" />
      <input
        ref={ref}
        className="flex-1 border-none font-mono text-xs outline-none"
        autoComplete="off"
        spellCheck={false}
        {...props}
      />
    </div>
  )
})
DialogSearch.displayName = 'DialogSearch'
