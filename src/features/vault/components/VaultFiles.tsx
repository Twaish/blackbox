import { useQueries, useQuery } from '@tanstack/react-query'
import {
  getVaultFilesQueryOptions,
  hasSessionQueryOptions,
  readVaultFileMetaQueryOptions,
} from '../queries'
import { cn } from '@/utils/tailwind'
import { FilePreview } from './ui/FilePreview'
import {
  ComponentProps,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useRemoveVaultFile, useUnlockVault } from '../mutations'
import { Button } from '@/components/ui/button'
import { create } from 'zustand'
import { FileContent, StreamedFileContent } from './ui/FileContent'
import { MimeIcon } from './ui/MimeIcon'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  MousePointer2,
  Trash,
  Upload,
  X,
} from 'lucide-react'
import { saveFile } from '@/app/instance/actions'
import { restoreVaultFile, streamVaultFile } from '../actions'
import { FileHeader } from './ui/FileHeader'
import { useVaultStore } from '../stores/useVaultStore'
import { useConfirmationDialog } from '@/components/confirmation-dialog/useConfirmationDialog'
import { Kbd } from '@/components/Kbd'
import { EmptyIndicator } from './ui/EmptyIndicator'
import { UploadList } from './FileUploads'

type VaultFilesStore = {
  files: VaultFileMeta[]
  selectedFileMeta?: VaultFileMeta
  selectedVaultId?: string

  setFiles: (files: VaultFileMeta[]) => void
  setSelectedFileMeta: (meta?: VaultFileMeta, vaultId?: string) => void

  selectNext: () => void
  selectPrev: () => void
}

const useVaultFilesStore = create<VaultFilesStore>((set, get) => ({
  files: [],
  selectedFileMeta: undefined,

  setFiles: (files) => set({ files }),
  setSelectedFileMeta: (meta, vaultId) =>
    set({ selectedFileMeta: meta, selectedVaultId: vaultId }),

  selectNext: () => {
    const { files, selectedFileMeta } = get()
    if (!selectedFileMeta) return

    const index = files.findIndex((f) => f.fileId === selectedFileMeta.fileId)

    const next = files[index + 1]
    if (next) set({ selectedFileMeta: next })
  },
  selectPrev: () => {
    const { files, selectedFileMeta } = get()
    if (!selectedFileMeta) return

    const index = files.findIndex((f) => f.fileId === selectedFileMeta.fileId)

    const prev = files[index - 1]
    if (prev) set({ selectedFileMeta: prev })
  },
}))

const VaultFilesContext = createContext<string | null>(null)

function useVaultFiles() {
  const ctx = useContext(VaultFilesContext)
  if (!ctx) {
    throw new Error('useVaultFiles must be used within VaultFiles')
  }
  return ctx
}

export function VaultFiles() {
  const vaultId = useVaultStore((s) => s.selectedVaultId)
  const { data: hasSession } = useQuery({
    ...hasSessionQueryOptions(vaultId!),
    enabled: !!vaultId,
  })

  if (!vaultId) return null

  return (
    <VaultFilesContext.Provider value={vaultId}>
      {hasSession ? <FileGrid /> : <Unlock />}
      <FileOverlay />
    </VaultFilesContext.Provider>
  )
}

function Unlock() {
  const vaultId = useVaultFiles()
  const [passphrase, setPassphrase] = useState('')
  const [show, setShow] = useState(false)
  const { mutate, isPending, isError } = useUnlockVault(vaultId)

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!passphrase.trim()) return

    mutate(passphrase, {
      onSuccess: () => setPassphrase(''),
    })
  }

  return (
    <EmptyIndicator>
      <EmptyIndicator.Content>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="text-muted-foreground mb-0.5 font-mono text-xs uppercase">
              Passphrase
            </span>
            <div className="flex h-8 w-full items-center rounded-md border text-sm">
              <div className="flex items-center justify-center px-2">
                <KeyRound className="text-muted-foreground h-3 w-3" />
              </div>
              <input
                type={show ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="e.g. securepass123"
                className="h-full w-full font-mono text-xs outline-none"
              />
              <div
                onClick={() => setShow(!show)}
                className="flex aspect-square h-full cursor-pointer items-center justify-center px-2 select-none"
              >
                {show ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
              </div>
            </div>
            {isError && (
              <div className="text-destructive-foreground text-xs">
                Incorrect passphrase. Please try again.
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !passphrase.trim()}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Unlocking...
              </>
            ) : (
              'Unlock'
            )}
          </Button>
        </form>
      </EmptyIndicator.Content>
    </EmptyIndicator>
  )
}

function FileGrid() {
  const vaultId = useVaultFiles()
  const { data: fileIds = [] } = useQuery(getVaultFilesQueryOptions(vaultId))
  const setFiles = useVaultFilesStore((s) => s.setFiles)

  const metaQueries = useQueries({
    queries: fileIds.map((fileId) =>
      readVaultFileMetaQueryOptions(vaultId, fileId),
    ),
  })

  const files = metaQueries.flatMap((q) => q.data ?? [])

  useEffect(() => {
    setFiles(files)
  }, [files, setFiles])

  if (!files.length) {
    return <EmptyFileGrid />
  }

  return (
    <div className="grid h-min w-full grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-px p-px pb-50">
      {files.map((meta) => (
        <VaultFile key={meta.fileId} meta={meta} />
      ))}
    </div>
  )
}

function EmptyFileGrid() {
  return (
    <EmptyIndicator>
      <EmptyIndicator.Content className="max-w-md">
        <EmptyIndicator.Description className="text-center">
          No files yet
        </EmptyIndicator.Description>
        <div className="text-muted-foreground flex flex-col items-center gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Kbd>
              <Upload className="h-3 w-3 shrink-0" />
            </Kbd>
            <span>Upload button in the toolbar</span>
          </div>
          <div className="flex items-center gap-2">
            <Kbd>
              <MousePointer2 className="h-3 w-3 shrink-0" />
            </Kbd>
            <span>Drag and drop anywhere</span>
          </div>
          <div className="flex items-center gap-2">
            <Kbd>ctrl + v</Kbd>
            <span>Paste from clipboard</span>
          </div>
        </div>
      </EmptyIndicator.Content>
    </EmptyIndicator>
  )
}

function VaultFile({ meta }: { meta: VaultFileMeta }) {
  const vaultId = useVaultFiles()
  const setSelectedFileMeta = useVaultFilesStore((s) => s.setSelectedFileMeta)

  return (
    <button
      className={cn('flex h-80 flex-col overflow-hidden border')}
      onClick={() => setSelectedFileMeta(meta, vaultId)}
    >
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <FilePreview meta={meta} vaultId={vaultId} />
      </div>
      <FileHeader meta={meta} className="border-t p-2" />
    </button>
  )
}

function FileOverlay() {
  const vaultId = useVaultFiles()
  const selectedVaultId = useVaultFilesStore((s) => s.selectedVaultId)
  const selectedFileMeta = useVaultFilesStore((s) => s.selectedFileMeta)

  const { data: hasSession } = useQuery({
    ...hasSessionQueryOptions(vaultId),
    enabled: !!vaultId,
  })

  if (!hasSession) return null
  if (!selectedFileMeta) return null
  if (selectedVaultId !== vaultId) return null

  return (
    <div className="bg-background/80 absolute inset-0 flex flex-col backdrop-blur-sm">
      <div className="flex h-16 items-center">
        <div className="flex h-full overflow-hidden">
          <div className="flex h-full w-12 min-w-12 items-center justify-center">
            <MimeIcon
              className="text-muted-foreground/50 stroke-1"
              mimeType={selectedFileMeta.original.mime}
            />
          </div>
          <FileHeader
            meta={selectedFileMeta}
            className="justify-center overflow-hidden"
          />
        </div>
        <FileOverlay.Actions />
      </div>
      <FileOverlay.Content />
    </div>
  )
}
FileOverlay.Actions = function Actions() {
  const vaultId = useVaultFiles()

  const selectedFileMeta = useVaultFilesStore((s) => s.selectedFileMeta)
  const setSelectedFileMeta = useVaultFilesStore((s) => s.setSelectedFileMeta)

  const { mutate: removeFile } = useRemoveVaultFile(vaultId)

  const close = () => setSelectedFileMeta(undefined)

  const { confirm: confirmRemove } = useConfirmationDialog({
    onConfirm: () => {
      if (!selectedFileMeta) return
      removeFile(selectedFileMeta.fileId)
      close()
    },
  })

  const download = async () => {
    const outputFilepath = await saveFile(selectedFileMeta!.original.name)
    if (!outputFilepath) return
    await restoreVaultFile(vaultId, selectedFileMeta!.fileId, outputFilepath)
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
FileOverlay.Content = function Content() {
  const vaultId = useVaultFiles()

  const selectNext = useVaultFilesStore((s) => s.selectNext)
  const selectPrev = useVaultFilesStore((s) => s.selectPrev)

  const selectedFileMeta = useVaultFilesStore((s) => s.selectedFileMeta)
  const setSelectedFileMeta = useVaultFilesStore((s) => s.setSelectedFileMeta)

  const close = () => setSelectedFileMeta(undefined)

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
        {/* <FileContent
          className="max-h-full max-w-full object-contain"
          vaultId={vaultId}
          meta={selectedFileMeta!}
        /> */}
        <StreamedFileContent
          className="max-h-full max-w-full object-contain"
          vaultId={vaultId}
          meta={selectedFileMeta!}
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
