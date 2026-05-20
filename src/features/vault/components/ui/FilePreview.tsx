import { useQuery } from '@tanstack/react-query'
import { readVaultFileQueryOptions } from '../../queries'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MimeIcon } from './MimeIcon'
import { streamVaultFile } from '../../actions'

export function FilePreview({
  meta,
  vaultId,
}: {
  meta: VaultFileMeta
  vaultId: string
}) {
  const mime = meta.original.mime
  const isImage = mime.startsWith('image/')

  const [url, setUrl] = useState<string | null>(null)

  const activeControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!isImage) return

    activeControllerRef.current?.abort()
    setUrl(null)

    const controller = new AbortController()
    activeControllerRef.current = controller

    streamVaultFile({
      vaultId,
      fileId: meta.fileId,
      signal: controller.signal,
      onDone(blob) {
        setUrl(URL.createObjectURL(blob))
      },
    })

    return () => {
      controller.abort()
      if (url) URL.revokeObjectURL(url)
    }
  }, [vaultId, meta.fileId])

  if (isImage && url) {
    return (
      <img
        className="pointer-events-none h-full w-full object-cover"
        src={url}
        alt={meta.original.name}
      />
    )
  }

  return <MimeIcon mimeType={mime} />
}

// export function FilePreview({
//   meta,
//   vaultId,
// }: {
//   meta: VaultFileMeta
//   vaultId: string
// }) {
//   const mime = meta.original.mime
//   const isImage = mime.startsWith('image/')

//   const { data: fileBuffer } = useQuery({
//     ...readVaultFileQueryOptions(vaultId, meta.fileId),
//     enabled: isImage,
//   })

//   const blobUrl = useMemo(() => {
//     if (!fileBuffer) return null

//     const bytes = new Uint8Array(fileBuffer.data)

//     const blob = new Blob([bytes], {
//       type: mime,
//     })

//     return URL.createObjectURL(blob)
//   }, [fileBuffer, mime])

//   if (isImage && blobUrl) {
//     return (
//       <img
//         className="pointer-events-none h-full w-full object-cover"
//         src={blobUrl}
//         alt={meta.original.name}
//       />
//     )
//   }

//   return <MimeIcon mimeType={mime} />
// }
