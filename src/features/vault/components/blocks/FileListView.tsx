import { useQuery } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useEffect } from 'react'
import { getVaultFilesQueryOptions } from '../../queries'
import { useVaultFiles, useVaultFilesStore } from '../VaultFiles'
import { EmptyFileView } from './EmptyFileView'
import { VaultFile } from './VaultFile'

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

  if (!fileIds.length) {
    return <EmptyFileView />
  }

  return (
    <div ref={parentRef} className="h-full overflow-auto p-px pb-50">
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
            <VaultFile fileId={fileIds[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
