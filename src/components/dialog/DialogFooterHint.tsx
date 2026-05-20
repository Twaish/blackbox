import { ComponentProps, ReactNode } from 'react'
import { Kbd } from '../Kbd'
import { cn } from '@/utils/tailwind'

export function DialogFooterHint({
  text,
  children,
  className,
  ...rest
}: ComponentProps<'span'> & {
  text: string
  children?: ReactNode
}) {
  return (
    <span
      className={cn(
        'text-muted-foreground flex items-center gap-1.5 text-[11px]',
        className,
      )}
      {...rest}
    >
      <Kbd>{children}</Kbd>
      {text}
    </span>
  )
}
