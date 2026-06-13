import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Settings } from 'lucide-react'
import { ComponentProps, useEffect, useRef, useState } from 'react'
import { PreviewToggle } from './PreviewToggle'
import { cn } from '@/utils/tailwind'
import { ViewStyleSelector } from './ViewStyleSelector'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
  downloadUpdate,
  getAppVersion,
  getUpdateStatus,
  onStatus,
  quitAndInstall,
} from '@/app/instance/actions'
import { useCheckForUpdates } from '@/app/instance/mutations'
import { UpdateStatus } from '@shared/types/instance'
import { create } from 'zustand'
import { useConfirmationDialog } from '@/components/confirmation-dialog/useConfirmationDialog'

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
        className="flex min-w-80 flex-col gap-0 p-0"
      >
        <div className="flex flex-col gap-1 p-2">
          <Setting
            title="Previews"
            description="Toggle previews of file content"
          >
            <PreviewToggle />
          </Setting>
          <Setting title="View Style" description="Style of file view">
            <ViewStyleSelector />
          </Setting>
        </div>
        <div className="border-t" />
        <div className="flex h-8 items-center justify-between p-1 pl-2 text-xs">
          <VersionLabel />
          <UpdateButton />
        </div>
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

function VersionLabel() {
  const { data: appVersion } = useSuspenseQuery({
    queryKey: ['appVersion'],
    queryFn: getAppVersion,
    staleTime: Infinity,
  })
  return <span className="text-muted-foreground">Version {appVersion}</span>
}

type UpdateStore = {
  status: UpdateStatus
  setStatus: (status: UpdateStatus) => void
  init: () => Promise<void>
  subscribe: () => () => void
}

export const useUpdateStore = create<UpdateStore>((set) => ({
  status: { state: 'idle' },
  setStatus: (status) => set({ status }),

  init: async () => {
    const status = await getUpdateStatus()
    set({ status })
  },

  subscribe: () => {
    return onStatus((status) => set({ status: status as UpdateStatus }))
  },
}))

function UpdateButton() {
  const status = useUpdateStore((s) => s.status)
  const setStatus = useUpdateStore((s) => s.setStatus)
  const init = useUpdateStore((s) => s.init)
  const subscribe = useUpdateStore((s) => s.subscribe)

  const { confirm: confirmQuitAndInstall } = useConfirmationDialog({
    title: 'Install update now?',
    description:
      'Close and restart app to complete the update. Ongoing uploads may be lost',
    onConfirm: () => {
      quitAndInstall()
    },
  })

  useEffect(() => {
    init()
    return subscribe()
  }, [init, subscribe])

  const checkMutation = useCheckForUpdates({
    onSuccess: (data) => setStatus(data as UpdateStatus),
  })

  const checking = status.state === 'checking' || status.state === 'downloading'

  function checkForUpdates() {
    setStatus({ state: 'checking' })
    checkMutation.mutate()
  }

  function renderLabel() {
    switch (status.state) {
      case 'idle':
        return 'Check for updates'
      case 'checking':
        return 'Checking'
      case 'not-available':
        return 'Up to date'
      case 'available':
        return `Download Update ${status.info.version}`
      case 'downloading':
        return `Downloading`
      case 'downloaded':
        return 'Restart to update'
      case 'error':
        return 'Check failed'
      default:
        return 'Check for updates'
    }
  }

  function handleClick() {
    if (status.state === 'downloaded') {
      confirmQuitAndInstall()
      return
    }
    if (status.state === 'available') {
      setStatus({ state: 'downloading' })
      downloadUpdate()
      return
    }
    checkForUpdates()
  }
  return (
    <button
      onClick={handleClick}
      disabled={checking}
      className={cn(
        'flex items-center select-none',
        checking
          ? 'text-muted-foreground cursor-default'
          : 'text-secondary-foreground hover:bg-muted/50 px-2 py-1',
      )}
    >
      {checking && (
        <span className="mr-1 inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {renderLabel()}
    </button>
  )
}
