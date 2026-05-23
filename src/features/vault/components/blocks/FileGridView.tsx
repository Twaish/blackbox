import { useQuery } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useEffect, useState, useLayoutEffect, useMemo } from 'react'
import { getVaultFilesQueryOptions } from '../../queries'
import { EmptyFileView } from './EmptyFileView'
import { VaultFile } from './VaultFile'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/tailwind'
import { useVaultFiles } from '../../contexts/useVaultFiles'
import { useVaultFilesStore } from '../../stores/useVaultFilesStore'

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
  }, [])

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
    const isNearEnd = lastItem.index >= rows.length - 1
    const hasMore = visibleCount < fileIds.length

    if (isNearEnd && hasMore) {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, fileIds.length))
    }
  }, [virtualItems, rows.length, visibleCount, fileIds.length])

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
        <>
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
                  <VaultFile key={fileId} viewStyle="grid" fileId={fileId} />
                ))}
              </div>
            ))}
          </div>

          {visibleCount < fileIds.length && (
            <Button
              onClick={() =>
                setVisibleCount((prev) =>
                  Math.min(prev + PAGE_SIZE, fileIds.length),
                )
              }
              size={'sm'}
              variant={'secondary'}
              className="mx-auto my-4 flex text-center"
            >
              Load more
            </Button>
          )}
        </>
      )}
    </div>
  )
}

// Loads files in pages with infinite scrolling
export function FileGridViewInfinite() {
  const parentRef = useRef<HTMLDivElement>(null)

  const vaultId = useVaultFiles()
  const { data: fileIds = [] } = useQuery(getVaultFilesQueryOptions(vaultId))
  const setFiles = useVaultFilesStore((s) => s.setFiles)

  useEffect(() => {
    setFiles(fileIds)
  }, [fileIds, setFiles])

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

  useEffect(() => {
    const el = parentRef.current
    if (!el) return

    const onScroll = () => {
      const hasMore = visibleCount < fileIds.length

      if (!hasMore) return

      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight

      if (distanceFromBottom <= 0) {
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, fileIds.length))
      }
    }
    onScroll()

    el.addEventListener('scroll', onScroll)

    return () => {
      el.removeEventListener('scroll', onScroll)
    }
  }, [visibleCount, fileIds.length])

  if (!fileIds.length) {
    return <EmptyFileView />
  }

  return (
    <div ref={parentRef} className="h-full overflow-auto p-px pb-50">
      <div
        className="grid gap-px"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {visibleFileIds.map((fileId) => (
          <VaultFile key={fileId} viewStyle="grid" fileId={fileId} />
        ))}
      </div>

      {visibleCount < fileIds.length && (
        <div className="text-muted-foreground py-4 text-center text-sm">
          Loading more...
        </div>
      )}
    </div>
  )
}

// Loads all files into view at once
export function FileGridViewAll() {
  const vaultId = useVaultFiles()
  const { data: fileIds = [] } = useQuery(getVaultFilesQueryOptions(vaultId))
  const setFiles = useVaultFilesStore((s) => s.setFiles)

  useEffect(() => {
    setFiles(fileIds)
  }, [fileIds])

  if (!fileIds.length) {
    return <EmptyFileView />
  }

  return (
    <div className="grid h-min w-full grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-px p-px pb-50">
      {fileIds.map((fileId) => (
        <VaultFile key={fileId} viewStyle="grid" fileId={fileId} />
      ))}
    </div>
  )
}
