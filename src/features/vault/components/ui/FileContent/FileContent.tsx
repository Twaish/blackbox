import { useEffect, useRef, useState } from 'react'
import { cn } from '@/utils/tailwind'
import { streamVaultFile } from '../../../actions'
import { Loader2 } from 'lucide-react'
import { extractID3Metadata } from '../../../utils/audio-utils'
import { TextContent } from './TextContent'
import { AudioContent } from './AudioContent'
import { VideoContent } from './VideoContent'

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
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    activeControllerRef.current?.abort()
    setUrl(null)
    setTextContent(null)

    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }

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
            if (controller.signal.aborted) return

            if (mime.startsWith('audio/')) {
              const meta = await extractID3Metadata(blob)
              if (controller.signal.aborted) return
              setAudioMetadata(meta)
            }

            const objUrl = URL.createObjectURL(blob)
            urlRef.current = objUrl
            setUrl(objUrl)
          },
        }),
      )
    }

    return () => {
      controller.abort()
    }
  }, [vaultId, meta.fileId, isText])

  useEffect(() => {
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
    }
  }, [])

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
    return <VideoContent src={url} className={className} />

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
