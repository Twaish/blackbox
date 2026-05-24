import { useState, useEffect, ComponentProps } from 'react'
import { Inbox, X } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  abortStream,
  onUploadAborted,
  onUploadFinished,
  onUploadProgress,
  onUploadStarted,
} from '../../actions'
import { cn } from '@/utils/tailwind'

type UploadInfo = {
  uploadId: string
  name: string
  percent: number
  transferred: number
  total?: number
}

export function UploadsButton(props: ComponentProps<typeof PopoverTrigger>) {
  const [open, setOpen] = useState(false)
  const [uploads, setUploads] = useState<UploadInfo[]>([])

  useEffect(() => {
    const upsertUpload = (
      patch: Partial<UploadInfo> & { uploadId: string },
    ) => {
      setUploads((prev) => {
        const idx = prev.findIndex((u) => u.uploadId === patch.uploadId)

        if (idx === -1) {
          return [
            ...prev,
            {
              uploadId: patch.uploadId,
              name: patch.name ?? 'Upload',
              percent: patch.percent ?? 0,
              transferred: patch.transferred ?? 0,
              total: patch.total,
            },
          ]
        }

        const next = [...prev]

        next[idx] = {
          ...next[idx],
          ...patch,
        }

        return next
      })
    }

    const removeUpload = (uploadId: string) => {
      setUploads((prev) => prev.filter((u) => u.uploadId !== uploadId))
    }

    const cancels = [
      onUploadStarted((e: any) => {
        upsertUpload({
          uploadId: e.uploadId,
          name: e.filename,
          percent: 0,
          transferred: 0,
          total: e.total,
        })

        // Auto-open when a new upload starts
        setOpen(true)
      }),

      onUploadProgress((e: any) => {
        upsertUpload({
          uploadId: e.uploadId,
          transferred: e.transferred,
          total: e.total,
          percent: e.percent ?? 0,
        })
      }),

      onUploadFinished((e: any) => {
        removeUpload(e.uploadId)
      }),

      onUploadAborted((e: any) => {
        removeUpload(e.uploadId)
      }),
    ]

    return () => {
      cancels.forEach((cancel) => cancel())
    }
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger {...props} asChild>
        <button
          title="Tasks"
          className={cn(
            'no-drag hover:bg-secondary/50 h-full px-1',
            open && 'bg-secondary/50',
          )}
        >
          <Inbox
            className={cn(
              'text-muted-foreground h-3.5 w-3.5',
              open && 'text-secondary-foreground',
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent className="mr-2 flex min-w-80 flex-col gap-1 p-2">
        <p className="text-muted-foreground text-xs font-medium">
          Uploading ({uploads.length})
        </p>
        {uploads.length ? (
          <div className="flex flex-col gap-1.5">
            {uploads.map((upload) => (
              <ActiveUploadItem
                key={upload.uploadId}
                upload={upload}
                onAbort={abortStream}
              />
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground flex h-20 w-full items-center justify-center text-xs">
            No uploads
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export function ActiveUploadItem({
  upload,
  onAbort,
}: {
  upload: UploadInfo
  onAbort: (uploadId: string) => void
}) {
  return (
    <div className="bg-background/50 flex items-center gap-2 text-xs backdrop-blur-md">
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs">{upload.name}</div>

        <div className="flex items-center">
          <div className="text-muted-foreground mt-0.5 text-[11px] whitespace-pre">
            {formatBytes(upload.transferred)} / {formatBytes(upload.total!)}
          </div>

          <div className="ml-auto flex items-center">
            <div className="flex w-16 gap-px">
              {Array.from({ length: 10 }).map((_, j) => (
                <div
                  key={j}
                  className={`h-2 flex-1 rounded-[1px] ${
                    j < Math.floor(upload.percent / 10)
                      ? 'bg-primary'
                      : 'bg-secondary'
                  }`}
                />
              ))}
            </div>

            <span className="w-8 text-right font-mono text-[11px]">
              {upload.percent}%
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onAbort(upload.uploadId)}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))

  const value = bytes / Math.pow(1024, i)

  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}
