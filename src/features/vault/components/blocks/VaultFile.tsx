import { cn } from '@/utils/tailwind'
import { useQuery } from '@tanstack/react-query'
import {
  readVaultFileMetaQueryOptions,
  viewStyleQueryOptions,
} from '../../queries'
import { FileHeader } from '../ui/FileHeader'
import { FilePreview } from '../ui/FilePreview'
import { useVaultFiles, useVaultFilesStore } from '../VaultFiles'

export function VaultFile({ fileId }: { fileId: string }) {
  const vaultId = useVaultFiles()
  const { data: meta } = useQuery(
    readVaultFileMetaQueryOptions(vaultId, fileId),
  )
  const { data: viewStyle } = useQuery(viewStyleQueryOptions())
  const setSelectedFileId = useVaultFilesStore((s) => s.setSelectedFileId)

  if (!meta) return

  return (
    <button
      className={cn(
        'flex overflow-hidden border',
        viewStyle === 'grid'
          ? 'h-80 flex-col'
          : 'h-12 w-full items-center gap-2',
      )}
      onClick={() => setSelectedFileId(meta.fileId, vaultId)}
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
}
