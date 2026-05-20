import { cn } from '@/utils/tailwind'
import { ComponentProps } from 'react'

export function EmptyIndicator({
  className,
  children,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex h-screen w-full flex-col items-center justify-center p-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

EmptyIndicator.Content = function Content({
  className,
  children,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex w-full max-w-xs flex-col gap-4', className)}
      {...props}
    >
      {children}
    </div>
  )
}

EmptyIndicator.Header = function Header({
  className,
  children,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex flex-col items-center gap-2 text-center', className)}
      {...props}
    >
      {children}
    </div>
  )
}

EmptyIndicator.Title = function Title({
  className,
  children,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-xl font-semibold tracking-tight', className)}
      {...props}
    >
      {children}
    </div>
  )
}
EmptyIndicator.Description = function Description({
  className,
  children,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div className={cn('text-muted-foreground text-sm', className)} {...props}>
      {children}
    </div>
  )
}

EmptyIndicator.Icon = function Icon({
  className,
  children,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn('bg-primary/10 text-primary rounded-full p-3', className)}
      {...props}
    >
      {children}
    </div>
  )
}
