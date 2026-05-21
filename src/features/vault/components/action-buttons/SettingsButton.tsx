import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Settings } from 'lucide-react'
import { ComponentProps } from 'react'
import { PreviewToggle } from '../ui/PreviewToggle'
import { cn } from '@/utils/tailwind'

export function SettingsButton({
  ...props
}: ComponentProps<typeof PopoverTrigger>) {
  return (
    <Popover>
      <PopoverTrigger {...props} asChild>
        <button className="no-drag hover:bg-secondary/50 h-full px-1">
          <Settings className="text-muted-foreground h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={'end'}
        className="flex min-w-80 flex-col gap-0 p-2"
      >
        <Setting title="Previews" description="Toggle previews of file content">
          <PreviewToggle />
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
