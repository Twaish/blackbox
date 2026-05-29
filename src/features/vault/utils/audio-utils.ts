export function parseID3Header(buffer: ArrayBuffer) {
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  // "ID3"
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return null

  const syncSafe = (offset: number) =>
    ((bytes[offset] & 0x7f) << 21) |
    ((bytes[offset + 1] & 0x7f) << 14) |
    ((bytes[offset + 2] & 0x7f) << 7) |
    (bytes[offset + 3] & 0x7f)

  const tagSize = syncSafe(6)

  const version = bytes[3]
  const flags = bytes[5]

  let offset = 10

  const hasExtHeader = (flags & 0x40) !== 0

  if (hasExtHeader) {
    if (version === 4) {
      offset += syncSafe(offset)
    } else {
      offset += 4 + view.getUint32(offset)
    }
  }

  return {
    view,
    bytes,
    version,
    tagSize,
    offset,
    syncSafe,
  }
}

export async function extractID3Metadata(blob: Blob) {
  const id3 = parseID3Header(await blob.arrayBuffer())
  if (!id3) return null

  const { view, bytes, version, tagSize } = id3
  let { offset } = id3

  let title = ''
  let artist = ''

  while (offset + 10 < tagSize + 10) {
    const frameId = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3],
    )

    const frameSize =
      version === 4 ? id3.syncSafe(offset + 4) : view.getUint32(offset + 4)

    if (!frameId.trim() || frameSize <= 0) break

    let pos = offset

    offset += 10 + frameSize
    if (frameId !== 'TIT2' && frameId !== 'TPE1') {
      continue
    }

    const encoding = view.getUint8(pos + 10)

    const dataStart = pos + 11
    const dataEnd = dataStart + frameSize - 1

    const ID3Text = bytes.slice(dataStart, dataEnd)
    const value = decodeID3Text(encoding, ID3Text).replace(/\0/g, '').trim()

    if (frameId === 'TIT2') {
      title = value
    }
    if (frameId === 'TPE1') {
      artist = value
    }
  }

  return { title, artist }
}

function decodeID3Text(encoding: number, bytes: Uint8Array): string {
  try {
    switch (encoding) {
      case 0:
        return new TextDecoder('latin1').decode(bytes) // ISO-8859-1
      case 1:
        return new TextDecoder('utf-16').decode(bytes) // UTF-16 with BOM
      case 2:
        return new TextDecoder('utf-16be').decode(bytes) // UTF-16BE
      case 3:
        return new TextDecoder('utf-8').decode(bytes) // UTF-8
      default:
        return new TextDecoder('utf-8').decode(bytes)
    }
  } catch {
    return ''
  }
}

export function extractID3CoverArt(buffer: ArrayBuffer): Blob | null {
  const id3 = parseID3Header(buffer)
  if (!id3) return null

  const { view, bytes, version, tagSize } = id3
  let { offset } = id3

  while (offset + 10 < tagSize + 10) {
    const frameId = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3],
    )

    const frameSize =
      version === 4 ? id3.syncSafe(offset + 4) : view.getUint32(offset + 4)

    if (!frameId.trim() || frameSize <= 0) break

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

export function extractMP4CoverArt(buffer: ArrayBuffer): Blob | null {
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

  // Validate bounds
  const dataSize = view.getUint32(data)
  if (dataSize < 16) return null

  const dataEnd = data + dataSize
  if (dataEnd > bytes.length) return null

  // data: [4 type flags][4 locale][image bytes]
  const typeFlag = view.getUint32(data + 8)
  const mime = typeFlag === 13 ? 'image/jpeg' : 'image/png'
  const imageData = bytes.slice(data + 16, covr + covrSize)

  return new Blob([imageData], { type: mime })
}

export function extractFLACCoverArt(buffer: ArrayBuffer): Blob | null {
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
