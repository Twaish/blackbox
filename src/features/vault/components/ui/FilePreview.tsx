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

function getCachedPreview(fileId: string) {
  const cached = previewCache.get(fileId)
  if (cached) {
    touch(fileId)
    return cached.url
  }
  return null
}

function setCachedPreview(fileId: string, url: string) {
  previewCache.set(fileId, {
    url,
    lastAccess: Date.now(),
  })
  evictIfNeeded()
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
  const viewStyle = useSettingsStore((s) => s.viewStyle)
  const mime = meta.original.mime
  const isImage = mime.startsWith('image/')
  const isVideo = mime.startsWith('video/')
  const isAudio = mime.startsWith('audio/')
  const isPreviewable = isImage || isVideo || isAudio

  const fileId = meta.fileId

  const [url, setUrl] = useState<string | null>(() =>
    shouldPreview ? getCachedPreview(fileId) : null,
  )

  useEffect(() => {
    if (!isPreviewable || !shouldPreview) return

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

        const previewBlob = isVideo
          ? await createVideoPreview(blob)
          : isAudio
            ? await createAudioPreview(blob, mime)
            : await createImagePreview(blob)

        if (!previewBlob || cancelled) return

        const objectUrl = URL.createObjectURL(previewBlob)

        setCachedPreview(fileId, objectUrl)
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
