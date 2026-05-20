import { cn } from '@/utils/tailwind'
import { ComponentProps } from 'react'

export function FileHeader({
  meta,
  className,
  ...props
}: { meta: VaultFileMeta } & ComponentProps<'div'>) {
  return (
    <div className={cn('flex flex-col font-mono', className)} {...props}>
      <div className="flex items-start gap-1">
        <span className="overflow-hidden text-xs text-ellipsis whitespace-pre">
          {meta.original.name}
        </span>
        <div className="text-muted-foreground text-xs">
          ({meta.original.mime})
        </div>
      </div>
      <div className="text-muted-foreground w-max text-[10px]">
        ID: {meta.fileId}
      </div>
    </div>
  )
}
