import { memo, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { shouldPreviewQueryOptions } from '../../queries'
import { MimeIcon } from './MimeIcon'
import { streamVaultFile } from '../../actions'

type CachedPreview = {
  url: string
  lastAccess: number
}

const previewCache = new Map<string, CachedPreview>()
const MAX_CACHE_SIZE = 200

function touch(fileId: string) {
  const item = previewCache.get(fileId)
  if (!item) return

  item.lastAccess = Date.now()
}

function evictIfNeeded() {
  if (previewCache.size <= MAX_CACHE_SIZE) return

  const sorted = [...previewCache.entries()].sort(
    (a, b) => a[1].lastAccess - b[1].lastAccess,
  )

  while (previewCache.size > MAX_CACHE_SIZE) {
    const oldest = sorted.shift()
    if (!oldest) break

    URL.revokeObjectURL(oldest[1].url)
    previewCache.delete(oldest[0])
  }
}

export function getCachedPreview(fileId: string) {
  const cached = previewCache.get(fileId)
  if (cached) {
    touch(fileId)
    return cached.url
  }
  return null
}

export function setCachedPreview(fileId: string, url: string) {
  previewCache.set(fileId, {
    url,
    lastAccess: Date.now(),
  })
  evictIfNeeded()
}

export const FilePreview = memo(function FilePreview({
  meta,
  vaultId,
}: {
  meta: VaultFileMeta
  vaultId: string
}) {
  const { data: shouldPreview } = useQuery(shouldPreviewQueryOptions())
  const mime = meta.original.mime
  const isImage = mime.startsWith('image/')

  const fileId = meta.fileId

  const [url, setUrl] = useState<string | null>(() =>
    shouldPreview ? getCachedPreview(fileId) : null,
  )

  useEffect(() => {
    if (!isImage || !shouldPreview) return

    const cached = getCachedPreview(fileId)

    if (cached) {
      setUrl(cached)
      return
    }

    const controller = new AbortController()

    let cancelled = false

    streamVaultFile({
      vaultId,
      fileId,
      signal: controller.signal,

      async onDone(blob) {
        if (cancelled) return

        const source = await createImageBitmap(blob)
        const targetSize = 512

        const scale = Math.max(
          targetSize / source.width,
          targetSize / source.height,
        )
        const scaledWidth = Math.ceil(source.width * scale)
        const scaledHeight = Math.ceil(source.height * scale)

        const canvas = document.createElement('canvas')
        canvas.width = targetSize
        canvas.height = targetSize

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const offsetX = (targetSize - scaledWidth) / 2
        const offsetY = (targetSize - scaledHeight) / 2
        ctx.drawImage(source, offsetX, offsetY, scaledWidth, scaledHeight)

        source.close()

        const previewBlob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/webp', 0.82)
        })
        if (!previewBlob) return

        const objectUrl = URL.createObjectURL(previewBlob)
        setCachedPreview(fileId, objectUrl)
        setUrl(objectUrl)
      },
    })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [fileId, vaultId, shouldPreview, isImage])

  useEffect(() => {
    if (!shouldPreview) setUrl(null)
  }, [shouldPreview])

  if (isImage && url) {
    return (
      <img
        className="pointer-events-none h-full w-full object-cover"
        src={url}
        alt={meta.original.name}
        loading="lazy"
        decoding="async"
      />
    )
  }

  return <MimeIcon mimeType={mime} />
})
