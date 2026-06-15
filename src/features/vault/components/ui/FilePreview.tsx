import { ComponentProps, memo, useEffect, useState } from 'react'
import { MimeIcon } from './MimeIcon'
import { streamVaultFile } from '../../actions'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { cn } from '@/utils/tailwind'
import {
  extractFLACCoverArt,
  extractID3CoverArt,
  extractMP4CoverArt,
} from '../../utils/audio-utils'

interface LRUNode {
  key: string
  url: string
  prev: LRUNode | null
  next: LRUNode | null
}

const MAX_CACHE_SIZE = 200
const lruMap = new Map<string, LRUNode>()
let lruHead: LRUNode | null = null
let lruTail: LRUNode | null = null

function lruPromote(node: LRUNode) {
  if (node === lruHead) return

  const { prev, next } = node

  // detach
  if (prev) prev.next = next
  if (next) next.prev = prev
  if (node === lruTail) lruTail = prev

  // prepend
  node.prev = null
  node.next = lruHead
  if (lruHead) lruHead.prev = node

  lruHead = node
  if (!lruTail) lruTail = node
}

function lruGet(key: string): string | null {
  const node = lruMap.get(key)
  if (!node) return null
  lruPromote(node)
  return node.url
}

function lruSet(key: string, url: string) {
  const existing = lruMap.get(key)
  if (existing) {
    existing.url = url
    lruPromote(existing)
    return
  }

  const node: LRUNode = { key, url, prev: null, next: lruHead }
  if (lruHead) lruHead.prev = node
  lruHead = node
  if (!lruTail) lruTail = node
  lruMap.set(key, node)

  if (lruMap.size > MAX_CACHE_SIZE) {
    const evict = lruTail!
    if (evict.prev) evict.prev.next = null
    else lruHead = null
    lruTail = evict.prev
    lruMap.delete(evict.key)
    URL.revokeObjectURL(evict.url)
  }
}

type PreviewType = 'image' | 'video' | 'audio'

function getPreviewType(mime: string): PreviewType | null {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  return null
}

async function buildPreview(
  blob: Blob,
  type: PreviewType,
  mime: string,
): Promise<Blob | null> {
  switch (type) {
    case 'image':
      return createImagePreview(blob)
    case 'video':
      return createVideoPreview(blob)
    case 'audio':
      return createAudioPreview(blob, mime)
  }
}

export const FilePreview = memo(function FilePreview({
  meta,
  vaultId,
  className,
  forcePreview = false,
  ...props
}: {
  meta: VaultFileMeta
  vaultId: string
  forcePreview?: boolean
} & (ComponentProps<'img'> | ComponentProps<'svg'>)) {
  const shouldPreviewSetting = useSettingsStore((s) => s.shouldPreview)
  const shouldPreview = forcePreview || shouldPreviewSetting
  const mime = meta.original.mime
  const previewType = getPreviewType(mime)
  const isPreviewable = previewType !== null
  const fileId = meta.fileId

  const [url, setUrl] = useState<string | null>(() =>
    shouldPreview ? lruGet(fileId) : null,
  )

  useEffect(() => {
    if (!isPreviewable || !shouldPreview) return

    const cached = lruGet(fileId)
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

        const previewBlob = await buildPreview(blob, previewType, mime)
        if (!previewBlob || cancelled) return

        const objectUrl = URL.createObjectURL(previewBlob)

        lruSet(fileId, objectUrl)
        setUrl(objectUrl)
      },
    })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [fileId, vaultId, shouldPreview, isPreviewable])

  useEffect(() => {
    if (!shouldPreview) setUrl(null)
  }, [shouldPreview])

  if (isPreviewable && url) {
    return (
      <img
        className={cn(
          'pointer-events-none h-full w-full object-cover',
          className,
        )}
        src={url}
        alt={meta.original.name}
        loading="lazy"
        decoding="async"
        {...(props as ComponentProps<'img'>)}
      />
    )
  }

  return (
    <MimeIcon
      className={className}
      mimeType={mime}
      {...(props as ComponentProps<'svg'>)}
    />
  )
})

async function createImagePreview(
  blob: Blob,
  size = 384,
): Promise<Blob | null> {
  const source = await createImageBitmap(blob)

  try {
    const scale = Math.max(size / source.width, size / source.height)

    const scaledWidth = Math.ceil(source.width * scale)
    const scaledHeight = Math.ceil(source.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const offsetX = (size - scaledWidth) / 2
    const offsetY = (size - scaledHeight) / 2

    ctx.drawImage(source, offsetX, offsetY, scaledWidth, scaledHeight)

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', 0.82)
    })
  } finally {
    source.close()
  }
}

async function createVideoPreview(
  blob: Blob,
  size = 384,
): Promise<Blob | null> {
  const video = document.createElement('video')

  video.muted = true
  video.playsInline = true
  video.preload = 'metadata'

  const url = URL.createObjectURL(blob)
  video.src = url

  try {
    await new Promise<void>((resolve, reject) => {
      if (video.readyState >= 2) return resolve()
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(video.error)
    })

    video.currentTime = Math.min(1, video.duration * 0.25)

    await new Promise<void>((resolve, reject) => {
      video.onseeked = () => resolve()
      video.onerror = () => reject(video.error)
    })

    const scale = Math.max(size / video.videoWidth, size / video.videoHeight)

    const scaledWidth = Math.ceil(video.videoWidth * scale)
    const scaledHeight = Math.ceil(video.videoHeight * scale)

    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const offsetX = (size - scaledWidth) / 2
    const offsetY = (size - scaledHeight) / 2

    ctx.drawImage(video, offsetX, offsetY, scaledWidth, scaledHeight)

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', 0.82)
    })
  } finally {
    URL.revokeObjectURL(url)

    video.pause()
    video.removeAttribute('src')
    video.load()
  }
}

const MAX_METADATA_BYTES = 2 * 1024 * 1024
async function createAudioPreview(
  blob: Blob,
  mime: string,
  size = 384,
): Promise<Blob | null> {
  const buffer = await blob.slice(0, MAX_METADATA_BYTES).arrayBuffer()

  let cover: Blob | null = null

  switch (mime) {
    case 'audio/mpeg': // mp3
      cover = extractID3CoverArt(buffer)
      break
    case 'audio/mp4':
    case 'audio/aac':
    case 'audio/x-m4a':
      cover = extractMP4CoverArt(buffer)
      break
    case 'audio/flac':
    case 'audio/x-flac':
      cover = extractFLACCoverArt(buffer)
      break
    default:
      cover =
        extractID3CoverArt(buffer) ??
        extractMP4CoverArt(buffer) ??
        extractFLACCoverArt(buffer)
  }
  if (!cover) return null

  return createImagePreview(cover, size)
}
