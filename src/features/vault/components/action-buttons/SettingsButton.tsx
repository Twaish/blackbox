import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Settings } from 'lucide-react'
import { ComponentProps, useState } from 'react'
import { PreviewToggle } from './PreviewToggle'
import { cn } from '@/utils/tailwind'
import { ViewStyleSelector } from './ViewStyleSelector'

export function SettingsButton({
  ...props
}: ComponentProps<typeof PopoverTrigger>) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger {...props} asChild>
        <button
          title="Settings"
          className={cn(
            'no-drag hover:bg-secondary/50 h-full px-1',
            open && 'bg-secondary/50',
          )}
        >
          <Settings
            className={cn(
              'text-muted-foreground h-3.5 w-3.5',
              open && 'text-secondary-foreground',
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={'end'}
        className="flex min-w-80 flex-col gap-1 p-2"
      >
        <Setting title="Previews" description="Toggle previews of file content">
          <PreviewToggle />
        </Setting>
        <Setting title="View Style" description="Style of file view">
          <ViewStyleSelector />
        </Setting>
      </PopoverContent>
    </Popover>
  )
}

function Setting({
  title,
  description,
  className,
  children,
  ...props
}: { title: string; description: string } & Omit<
  ComponentProps<'div'>,
  'title'
>) {
  return (
    <div className={cn('flex justify-between', className)} {...props}>
      <div className="flex flex-col">
        <span className="text-xs">{title}</span>
        <span className="text-muted-foreground text-xs">{description}</span>
      </div>
      <span className="flex items-center">{children}</span>
    </div>
  )
}
