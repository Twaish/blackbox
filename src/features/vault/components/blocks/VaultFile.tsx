import { cn } from '@/utils/tailwind'
import { useQuery } from '@tanstack/react-query'
import { readVaultFileMetaQueryOptions } from '../../queries'
import { FileHeader } from '../ui/FileHeader'
import { FilePreview } from '../ui/FilePreview'
import { memo, useCallback } from 'react'
import { ViewStyle } from '../../actions'
import { useVaultFiles } from '../../contexts/useVaultFiles'
import { useVaultFilesStore } from '../../stores/useVaultFilesStore'

export const VaultFile = memo(function VaultFile({
  fileId,
  viewStyle,
}: {
  fileId: string
  viewStyle: ViewStyle
}) {
  const vaultId = useVaultFiles()
  const { data: meta } = useQuery(
    readVaultFileMetaQueryOptions(vaultId, fileId),
  )
  const setSelectedFileId = useVaultFilesStore((s) => s.setSelectedFileId)

  const handleClick = useCallback(() => {
    if (meta) setSelectedFileId(meta.fileId, vaultId)
  }, [meta?.fileId, vaultId, setSelectedFileId])

  if (!meta) return

  return (
    <button
      className={cn(
        'flex overflow-hidden border',
        viewStyle === 'grid'
          ? 'h-80 flex-col'
          : 'h-12 w-full items-center gap-2',
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          'flex items-center justify-center overflow-hidden',
          viewStyle === 'grid' ? 'flex-1' : 'aspect-square h-full border-r',
        )}
      >
        <FilePreview meta={meta} vaultId={vaultId} />
      </div>
      <FileHeader
        meta={meta}
        className={cn(viewStyle === 'grid' && 'border-t p-2')}
      />
    </button>
  )
})
