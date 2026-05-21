import { useQuery } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useEffect, useState, useLayoutEffect, useMemo } from 'react'
import { getVaultFilesQueryOptions } from '../../queries'
import { useVaultFiles, useVaultFilesStore } from '../VaultFiles'
import { EmptyFileView } from './EmptyFileView'
import { VaultFile } from './VaultFile'

const ITEM_HEIGHT = 320
const GAP = 1
const MIN_WIDTH = 250
const PAGE_SIZE = 5
export function FileGridView() {
  const parentRef = useRef<HTMLDivElement>(null)

  const vaultId = useVaultFiles()
  const { data: fileIds = [] } = useQuery(getVaultFilesQueryOptions(vaultId))
  const setFiles = useVaultFilesStore((s) => s.setFiles)

  useEffect(() => {
    setFiles(fileIds)
  }, [fileIds])

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [vaultId])

  const [columns, setColumns] = useState(() =>
    Math.max(1, Math.floor(window.innerWidth / MIN_WIDTH)),
  )

  useLayoutEffect(() => {
    const el = parentRef.current
    if (!el) return

    let timer: ReturnType<typeof setTimeout>

    const measure = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        setColumns(Math.max(1, Math.floor(el.offsetWidth / MIN_WIDTH)))
      }, 100)
    }

    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(el)

    return () => {
      clearTimeout(timer)
      ro.disconnect()
    }
  }, [parentRef.current])

  const visibleFileIds = useMemo(
    () => fileIds.slice(0, visibleCount),
    [fileIds, visibleCount],
  )

  const rows = useMemo(() => {
    if (!visibleFileIds.length) return []

    const chunks: string[][] = []
    for (let i = 0; i < visibleFileIds.length; i += columns) {
      chunks.push(visibleFileIds.slice(i, i + columns))
    }
    return chunks
  }, [visibleFileIds, columns])

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT + GAP,
    overscan: 5,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()

  useEffect(() => {
    if (!virtualItems.length) return

    const lastItem = virtualItems[virtualItems.length - 1]
    const isNearEnd = lastItem.index >= rows.length - 2
    const hasMore = visibleCount < fileIds.length

    if (isNearEnd && hasMore) {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, fileIds.length))
    }
  }, [virtualItems, rows.length, visibleCount, fileIds.length])

  if (!fileIds.length) {
    return <EmptyFileView />
  }

  return (
    <div ref={parentRef} className="h-full overflow-auto p-px pb-50">
      <div
        className="relative"
        style={{
          height: rowVirtualizer.getTotalSize(),
        }}
      >
        {virtualItems.map((virtualRow) => (
          <div
            key={virtualRow.key}
            className="absolute top-0 left-0 grid w-full gap-px"
            style={{
              transform: `translateY(${virtualRow.start}px)`,
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {rows[virtualRow.index].map((fileId) => (
              <VaultFile key={fileId} fileId={fileId} />
            ))}
          </div>
        ))}
      </div>

      {visibleCount < fileIds.length && (
        <div className="text-muted-foreground py-4 text-center text-sm">
          Scroll to load more...
        </div>
      )}
    </div>
  )
}

// function FileGrid() {
//   const vaultId = useVaultFiles()
//   const { data: fileIds = [] } = useQuery(getVaultFilesQueryOptions(vaultId))
//   const setFiles = useVaultFilesStore((s) => s.setFiles)

//   useEffect(() => {
//     setFiles(fileIds)
//   }, [fileIds])

//   if (!fileIds.length) {
//     return <EmptyFileGrid />
//   }

//   return (
//     <div className="grid h-min w-full grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-px p-px pb-50">
//       {fileIds.map((fileId) => (
//         <VaultFile key={fileId} fileId={fileId} />
//       ))}
//     </div>
//   )
// }
