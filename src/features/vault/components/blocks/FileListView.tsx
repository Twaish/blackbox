import { useQuery } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useEffect } from 'react'
import { getVaultFilesQueryOptions } from '../../queries'
import { EmptyFileView } from './EmptyFileView'
import { VaultFile } from './VaultFile'
import { cn } from '@/utils/tailwind'
import { useVaultFiles } from '../../contexts/useVaultFiles'
import { useVaultFilesStore } from '../../stores/useVaultFilesStore'

const LIST_ITEM_HEIGHT = 48
const GAP = 1
export function FileListView() {
  const parentRef = useRef<HTMLDivElement>(null)

  const vaultId = useVaultFiles()
  const { data: fileIds = [] } = useQuery(getVaultFilesQueryOptions(vaultId))
  const setFiles = useVaultFilesStore((s) => s.setFiles)

  useEffect(() => {
    setFiles(fileIds)
  }, [fileIds, setFiles])

  const rowVirtualizer = useVirtualizer({
    count: fileIds.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => LIST_ITEM_HEIGHT + GAP,
    overscan: 10,
  })

  const hasFiles = fileIds.length

  return (
    <div
      ref={parentRef}
      className={cn(
        'h-full overflow-auto p-px',
        hasFiles ? 'pb-50' : 'overflow-hidden',
      )}
    >
      {!hasFiles ? (
        <EmptyFileView />
      ) : (
        <div
          className="relative w-full"
          style={{
            height: rowVirtualizer.getTotalSize(),
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={virtualRow.key}
              className="absolute top-0 left-0 w-full"
              style={{
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <VaultFile viewStyle="list" fileId={fileIds[virtualRow.index]} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
