import { cn } from '@/utils/tailwind'
import { ComponentProps } from 'react'
import { useVaultFilesStore } from '../stores/useVaultFilesStore'
import { ArrowRightFromLine, Trash, X } from 'lucide-react'
import { useConfirmationDialog } from '@/components/confirmation-dialog/useConfirmationDialog'
import { useRemoveVaultFiles } from '../mutations'
import { useVaultFiles } from '../contexts/useVaultFiles'
import { selectFolder } from '@/app/instance/actions'
import { restoreVaultFiles } from '../actions'

export function SelectionBar({ className, ...props }: ComponentProps<'div'>) {
  const markedFilesCount = useVaultFilesStore((s) => s.markedFileIds.size)
  if (!markedFilesCount) return null

  return (
    <div
      className={cn(
        'bg-background/90 absolute bottom-0 flex h-8 w-full border-t backdrop-blur-md',
        className,
      )}
      {...props}
    >
      <div className="text-muted-foreground flex h-full items-center border-r p-2 font-mono text-xs">
        {markedFilesCount} selected
      </div>
      <div className="flex">
        <SelectionBar.ExportButton />
        <SelectionBar.DeleteButton />
      </div>
      <SelectionBar.ClearButton />
    </div>
  )
}

SelectionBar.ExportButton = function ExportButton() {
  const vaultId = useVaultFiles()
  const markedFileIds = useVaultFilesStore((s) => s.markedFileIds)

  const handleExport = async () => {
    const outputDir = await selectFolder()
    if (!outputDir) return
    await restoreVaultFiles(vaultId, [...markedFileIds], outputDir)
  }

  return (
    <button
      title="Export selected files"
      onClick={handleExport}
      className="hover:bg-secondary/75 flex h-full items-center justify-center gap-1 border-r px-2 text-xs"
    >
      <ArrowRightFromLine className="h-4 w-4" />
      Export
    </button>
  )
}

SelectionBar.DeleteButton = function DeleteButton() {
  const vaultId = useVaultFiles()
  const markedFileIds = useVaultFilesStore((s) => s.markedFileIds)

  const { mutate: removeFiles } = useRemoveVaultFiles(vaultId)
  const { confirm: confirmRemove } = useConfirmationDialog({
    onConfirm: () => {
      removeFiles([...markedFileIds])
    },
  })

  return (
    <button
      title="Remove selected files"
      onClick={confirmRemove}
      className="hover:bg-secondary/75 flex h-full items-center justify-center gap-1 border-r px-2 text-xs"
    >
      <Trash className="h-4 w-4" />
      Delete
    </button>
  )
}

SelectionBar.ClearButton = function ClearButton() {
  const clearMarked = useVaultFilesStore((s) => s.clearMarked)

  return (
    <button
      title="Clear selection"
      onClick={clearMarked}
      className="hover:bg-secondary/75 ml-auto flex h-full items-center justify-center gap-1 px-2 text-xs"
    >
      <X className="h-4 w-4" />
      Clear
    </button>
  )
}
