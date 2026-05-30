import { useEffect, useRef, useState } from 'react'
import { cn } from '@/utils/tailwind'
import { streamVaultFile } from '../../../actions'
import { Loader2 } from 'lucide-react'
import { extractID3Metadata } from '../../../utils/audio-utils'
import { TextContent } from './TextContent'
import { AudioContent } from './AudioContent'

export function StreamedFileContent({
  meta,
  vaultId,
  className,
}: {
  meta: VaultFileMeta
  vaultId: string
  className: string
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [audioMetadata, setAudioMetadata] = useState<{
    title: string
    artist: string
  } | null>(null)
  const mime = meta.original.mime
  const isText = mime.startsWith('text/') || mime === 'application/json'

  const activeControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    activeControllerRef.current?.abort()
    setUrl(null)
    setTextContent(null)

    const controller = new AbortController()
    activeControllerRef.current = controller

    const streamOptions = (
      options: Partial<Parameters<typeof streamVaultFile>[0]>,
    ) => ({
      vaultId,
      fileId: meta.fileId,
      onError: console.error,
      signal: controller.signal,
      ...options,
    })

    if (isText) {
      const decoder = new TextDecoder('utf-8')
      let accumulatedText = ''
      streamVaultFile(
        streamOptions({
          onChunk(chunk) {
            accumulatedText += decoder.decode(chunk, { stream: true })
            setTextContent(accumulatedText)
          },
        }),
      )
    } else {
      streamVaultFile(
        streamOptions({
          async onDone(blob) {
            if (mime.startsWith('audio/')) {
              setAudioMetadata(await extractID3Metadata(blob))
            }
            setUrl(URL.createObjectURL(blob))
          },
        }),
      )
    }

    return () => {
      controller.abort()
      if (url) URL.revokeObjectURL(url)
    }
  }, [vaultId, meta.fileId, isText])

  if (isText && textContent != null)
    return <TextContent className={className}>{textContent}</TextContent>

  if (!url) {
    return <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
  }

  if (mime.startsWith('image/'))
    return (
      <img
        draggable={false}
        className={className}
        src={url}
        alt={meta.original.name}
      />
    )

  if (mime.startsWith('video/'))
    return <video className={className} src={url} controls />

  if (mime.startsWith('audio/'))
    return (
      <AudioContent
        vaultId={vaultId}
        meta={meta}
        audioMeta={audioMetadata}
        className={className}
        src={url}
      />
    )

  if (mime === 'application/pdf')
    return <iframe src={url} className={cn('h-200 w-full', className)} />

  return <div>{mime} mime-type is not supported</div>
}
