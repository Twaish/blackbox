import { cn } from '@/utils/tailwind'
import { ComponentProps } from 'react'
import { Search } from 'lucide-react'

export function SearchField({
  className,
  children,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn('relative flex h-8 items-center gap-2 px-2', className)}
      {...props}
    >
      {children}
    </div>
  )
}

SearchField.Icon = function Icon({
  className,
  ...props
}: ComponentProps<'svg'>) {
  return (
    <Search
      className={cn('text-muted-foreground h-3.5 w-3.5', className)}
      {...props}
    />
  )
}

SearchField.Input = function Input({
  className,
  ...props
}: ComponentProps<'input'>) {
  return (
    <input
      className={cn('no-drag h-full border-none text-xs outline-0', className)}
      {...props}
    />
  )
}
