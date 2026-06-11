import { useQuery } from '@tanstack/react-query'
import { ComponentProps, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Download, Trash, X } from 'lucide-react'
import {
  hasSessionQueryOptions,
  readVaultFileMetaQueryOptions,
} from '../../queries'
import { restoreVaultFile } from '../../actions'
import { useRemoveVaultFiles } from '../../mutations'
import { cn } from '@/utils/tailwind'
import { Button } from '@/components/ui/button'
import { useConfirmationDialog } from '@/components/confirmation-dialog/useConfirmationDialog'
import { MimeIcon } from '../ui/MimeIcon'
import { FileHeader } from '../ui/FileHeader'
import { StreamedFileContent } from '../ui/FileContent/FileContent'
import { saveFile } from '@/app/instance/actions'
import { useVaultFiles } from '../../contexts/useVaultFiles'
import { useVaultFilesStore } from '../../stores/useVaultFilesStore'
import { useHasVaultSession } from '../../hooks/useHasVaultSession'

export function FileOverlay() {
  const vaultId = useVaultFiles()
  const selectedVaultId = useVaultFilesStore((s) => s.selectedVaultId)
  const selectedFileId = useVaultFilesStore((s) => s.selectedFileId)
  const vaultHasChanged = selectedVaultId !== vaultId

  const { data: hasSession2 } = useQuery(hasSessionQueryOptions(vaultId))
  const { hasSession } = useHasVaultSession(vaultId)
  const { data: meta } = useQuery({
    ...readVaultFileMetaQueryOptions(vaultId, selectedFileId!),
    enabled: !!selectedFileId && !vaultHasChanged,
  })

  if (!meta) return null
  if (!hasSession) return null
  if (vaultHasChanged) return null

  return (
    <div className="bg-background/80 absolute inset-0 flex flex-col backdrop-blur-sm">
      <div className="flex h-16 items-center">
        <div className="flex h-full overflow-hidden">
          <div className="flex h-full w-12 min-w-12 items-center justify-center">
            <MimeIcon
              className="text-muted-foreground/50 stroke-1"
              mimeType={meta.original.mime}
            />
          </div>
          <FileHeader meta={meta} className="justify-center overflow-hidden" />
        </div>
        <FileOverlay.Actions meta={meta} />
      </div>
      <FileOverlay.Content meta={meta} />
    </div>
  )
}
FileOverlay.Actions = function Actions({ meta }: { meta: VaultFileMeta }) {
  const vaultId = useVaultFiles()
  const selectedFileId = useVaultFilesStore((s) => s.selectedFileId)
  const setSelectedFileId = useVaultFilesStore((s) => s.setSelectedFileId)

  const close = () => setSelectedFileId(undefined)
  const { mutate: removeFiles } = useRemoveVaultFiles(vaultId)
  const { confirm: confirmRemove } = useConfirmationDialog({
    onConfirm: () => {
      if (!selectedFileId) return
      removeFiles([selectedFileId])
      close()
    },
  })

  const download = async () => {
    const outputFilepath = await saveFile(meta.original.name)
    if (!outputFilepath) return
    await restoreVaultFile(vaultId, meta.fileId, outputFilepath)
  }

  return (
    <div className="ml-auto flex gap-4 px-4">
      <ActionButton onClick={confirmRemove}>
        <Trash className="h-4 w-4" />
      </ActionButton>
      <ActionButton onClick={download}>
        <Download className="h-4 w-4" />
      </ActionButton>
      <ActionButton onClick={close}>
        <X className="h-4 w-4" />
      </ActionButton>
    </div>
  )
}
FileOverlay.Content = function Content({ meta }: { meta: VaultFileMeta }) {
  const vaultId = useVaultFiles()

  const selectNext = useVaultFilesStore((s) => s.selectNext)
  const selectPrev = useVaultFilesStore((s) => s.selectPrev)

  const setSelectedFileId = useVaultFilesStore((s) => s.setSelectedFileId)

  const close = () => setSelectedFileId(undefined)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') selectNext()
      if (e.key === 'ArrowLeft') selectPrev()
      if (e.key === 'Escape') close()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectNext, selectPrev])

  return (
    <div className="flex h-full w-full items-center justify-between overflow-hidden">
      <ControlButton onClick={selectPrev}>
        <ChevronLeft />
      </ControlButton>
      <div className="flex h-full max-h-[70vh] w-full max-w-[70vw] flex-col items-center justify-center overflow-hidden">
        <StreamedFileContent
          className="max-h-full max-w-full object-contain"
          vaultId={vaultId}
          meta={meta}
        />
      </div>
      <ControlButton onClick={selectNext}>
        <ChevronRight />
      </ControlButton>
    </div>
  )
}

function ActionButton({
  className,
  children,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      variant={'ghost'}
      className={cn('h-8 w-8 p-0', className)}
      {...props}
    >
      {children}
    </Button>
  )
}

function ControlButton({
  className,
  children,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'hover:bg-secondary/20 flex h-full w-8 cursor-pointer items-center justify-center select-none',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
