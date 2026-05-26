import { memo, useEffect, useState } from 'react'
import { MimeIcon } from './MimeIcon'
import { streamVaultFile } from '../../actions'
import { useSettingsStore } from '../../stores/useSettingsStore'

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

async function createImagePreview(
  blob: Blob,
  size = 512,
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
  size = 512,
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

async function createAudioPreview(blob: Blob): Promise<Blob | null> {
  const buffer = await blob.arrayBuffer()
  return parseID3v2(buffer) ?? parseMP4(buffer) ?? parseFlacOgg(buffer)
}

export const FilePreview = memo(function FilePreview({
  meta,
  vaultId,
}: {
  meta: VaultFileMeta
  vaultId: string
}) {
  const shouldPreview = useSettingsStore((s) => s.shouldPreview)
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
            ? await createAudioPreview(blob)
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

function parseID3v2(buffer: ArrayBuffer): Blob | null {
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  // "ID3" magic
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return null

  const version = view.getUint8(3) // 2, 3, or 4
  const flags = view.getUint8(5)
  const hasExtHeader = (flags & 0x40) !== 0

  // Syncsafe integer: 4 bytes, MSB of each byte is always 0
  const tagSize =
    ((bytes[6] & 0x7f) << 21) |
    ((bytes[7] & 0x7f) << 14) |
    ((bytes[8] & 0x7f) << 7) |
    (bytes[9] & 0x7f)

  let offset = 10

  if (hasExtHeader) {
    if (version === 4) {
      const extSize =
        ((bytes[offset] & 0x7f) << 21) |
        ((bytes[offset + 1] & 0x7f) << 14) |
        ((bytes[offset + 2] & 0x7f) << 7) |
        (bytes[offset + 3] & 0x7f)
      offset += extSize
    } else {
      offset += 4 + view.getUint32(offset)
    }
  }

  const end = 10 + tagSize

  while (offset + 10 < end) {
    const frameId = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3],
    )

    const frameSize =
      version === 4
        ? ((bytes[offset + 4] & 0x7f) << 21) |
          ((bytes[offset + 5] & 0x7f) << 14) |
          ((bytes[offset + 6] & 0x7f) << 7) |
          (bytes[offset + 7] & 0x7f)
        : view.getUint32(offset + 4)

    offset += 10

    if (frameId === 'APIC') {
      // APIC: [encoding(1)][mime: null-terminated][picture type(1)][description: null-terminated][data]
      let pos = offset
      const encoding = bytes[pos++]
      const nullChar = encoding === 0 || encoding === 3 ? 1 : 2

      // read MIME type (always Latin-1, null-terminated with 1 byte)
      const mimeStart = pos
      while (bytes[pos] !== 0x00) pos++
      const mime = new TextDecoder('latin1').decode(bytes.slice(mimeStart, pos))
      pos++ // skip null
      pos++ // skip picture type byte

      // skip description
      if (nullChar === 1) {
        while (bytes[pos] !== 0x00) pos++
        pos++
      } else {
        while (bytes[pos] !== 0x00 || bytes[pos + 1] !== 0x00) pos += 2
        pos += 2
      }

      const imageData = bytes.slice(pos, offset + frameSize)
      return new Blob([imageData], { type: mime || 'image/jpeg' })
    }

    if (version === 2 && frameId.startsWith('PIC')) {
      console.warn('ID3v2.2 preview not supported')
      return null
    }

    offset += frameSize
  }

  return null
}

function parseMP4(buffer: ArrayBuffer): Blob | null {
  const bytes = new Uint8Array(buffer)
  const view = new DataView(buffer)

  function findAtom(
    data: Uint8Array,
    name: string,
    start = 0,
    end = data.length,
  ): number {
    let i = start
    while (i + 8 <= end) {
      const size = new DataView(data.buffer, data.byteOffset + i, 4).getUint32(
        0,
      )
      const id = String.fromCharCode(
        data[i + 4],
        data[i + 5],
        data[i + 6],
        data[i + 7],
      )
      if (id === name) return i
      if (size < 8) break
      i += size
    }
    return -1
  }

  // moov > udta > meta > ilst > covr > data
  const moov = findAtom(bytes, 'moov')
  if (moov < 0) return null
  const moovSize = view.getUint32(moov)

  const udta = findAtom(bytes, 'udta', moov + 8, moov + moovSize)
  if (udta < 0) return null
  const udtaSize = view.getUint32(udta)

  const meta = findAtom(bytes, 'meta', udta + 8, udta + udtaSize)
  if (meta < 0) return null
  const metaSize = view.getUint32(meta)

  const ilst = findAtom(bytes, 'ilst', meta + 12, meta + metaSize)
  if (ilst < 0) return null
  const ilstSize = view.getUint32(ilst)

  const covr = findAtom(bytes, 'covr', ilst + 8, ilst + ilstSize)
  if (covr < 0) return null
  const covrSize = view.getUint32(covr)

  const data = findAtom(bytes, 'data', covr + 8, covr + covrSize)
  if (data < 0) return null

  // data: [4 type flags][4 locale][image bytes]
  const typeFlag = view.getUint32(data + 8)
  const mime = typeFlag === 13 ? 'image/jpeg' : 'image/png'
  const imageData = bytes.slice(data + 16, covr + covrSize)

  return new Blob([imageData], { type: mime })
}
function parseFlacOgg(buffer: ArrayBuffer): Blob | null {
  const bytes = new Uint8Array(buffer)
  const view = new DataView(buffer)

  // "fLaC" magic
  const isFLAC =
    bytes[0] === 0x66 &&
    bytes[1] === 0x4c &&
    bytes[2] === 0x61 &&
    bytes[3] === 0x43

  if (!isFLAC) return null

  let offset = 4
  while (offset + 4 < bytes.length) {
    const blockHeader = bytes[offset]
    const isLast = (blockHeader & 0x80) !== 0
    const blockType = blockHeader & 0x7f
    const blockSize =
      (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]

    offset += 4

    if (blockType === 6) {
      // [4 type][4 mime length][mime][4 desc length][desc][4 w][4 h][4 depth][4 colors][4 data length][data]
      const mimeLen = view.getUint32(offset + 4)
      const mime = new TextDecoder().decode(
        bytes.slice(offset + 8, offset + 8 + mimeLen),
      )
      const descLen = view.getUint32(offset + 8 + mimeLen)
      const dataOffset = offset + 8 + mimeLen + 4 + descLen + 16
      const dataLen = view.getUint32(dataOffset)
      const imageData = bytes.slice(dataOffset + 4, dataOffset + 4 + dataLen)
      return new Blob([imageData], { type: mime })
    }

    offset += blockSize
    if (isLast) break
  }

  return null
}
