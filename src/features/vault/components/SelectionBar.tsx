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
  const vaultId = useVaultFiles()
  const markedFileIds = useVaultFilesStore((s) => s.markedFileIds)
  const clearMarked = useVaultFilesStore((s) => s.clearMarked)

  const { mutate: removeFiles } = useRemoveVaultFiles(vaultId)
  const { confirm: confirmRemove } = useConfirmationDialog({
    onConfirm: () => {
      if (!markedFileIds.size) return
      removeFiles([...markedFileIds])
    },
  })

  const handleExport = async () => {
    const outputDir = await selectFolder()
    if (!outputDir) return
    await restoreVaultFiles(vaultId, [...markedFileIds], outputDir)
  }

  if (!markedFileIds.size) return null

  return (
    <div className={cn('flex h-8 border-t', className)} {...props}>
      <div className="flex h-full items-center border-r p-2 text-sm">
        {markedFileIds.size} selected
      </div>
      <div className="flex">
        <button
          title="Export selected files"
          onClick={handleExport}
          className="hover:bg-secondary/50 flex h-full items-center justify-center gap-1 border-r px-2 text-xs"
        >
          <ArrowRightFromLine className="h-4 w-4" />
          Export
        </button>
        <button
          title="Remove selected files"
          onClick={confirmRemove}
          className="hover:bg-secondary/50 flex h-full items-center justify-center gap-1 border-r px-2 text-xs"
        >
          <Trash className="h-4 w-4" />
          Delete
        </button>
      </div>
      <button
        onClick={clearMarked}
        className="hover:bg-secondary/50 ml-auto flex h-full items-center justify-center gap-1 px-2 text-xs"
      >
        <X className="h-4 w-4" />
        Clear
      </button>
    </div>
  )
}
