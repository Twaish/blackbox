import { ComponentProps, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/utils/tailwind'
import { streamVaultFile } from '../../actions'
import {
  Loader2,
  Pause,
  Play,
  Repeat,
  Volume,
  Volume1,
  Volume2,
  VolumeOff,
  VolumeX,
  Metronome,
  Shuffle,
  SkipForward,
  SkipBack,
  Timer,
} from 'lucide-react'
import { FilePreview } from './FilePreview'
import { extractID3Metadata } from '../../utils/audio-utils'
import styles from './FileContent.module.css'

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
        className={cn(className)}
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
        controls
      />
    )

  if (mime === 'application/pdf')
    return <iframe src={url} className={cn('h-200 w-full', className)} />

  return <div>{mime} mime-type is not supported</div>
}

function TextContent({ className, children }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'bg-secondary/50 flex w-full flex-1 overflow-auto p-2',
        className,
      )}
    >
      <pre className="font-mono text-sm">{children}</pre>
    </div>
  )
}

// TODO: Split into separate components
function AudioContent({
  className,
  children,
  vaultId,
  meta,
  audioMeta,
  ...props
}: {
  vaultId: string
  meta: VaultFileMeta
  audioMeta?: { title: string; artist: string } | null
} & ComponentProps<'audio'>) {
  const audioRef = useRef<HTMLAudioElement>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0.5)
  const [isMuted, setIsMuted] = useState(false)
  const [isRepeating, setIsRepeating] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onLoadedMetadata = () => {
      setDuration(audio.duration)
    }
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }
    const onEnded = () => {
      setIsPlaying(false)
    }

    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      await audio.play()
      setIsPlaying(true)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const time = Number(e.target.value)

    audio.currentTime = time
    setCurrentTime(time)
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const value = Number(e.target.value)

    audio.volume = value
    setVolume(value)

    if (value > 0 && isMuted) {
      audio.muted = false
      setIsMuted(false)
    }
  }

  // TODO: Implement playback menu
  const handlePlayback = (e: React.ChangeEvent<HTMLInputElement>) => {
    // const playback
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.muted = !audio.muted
    setIsMuted(audio.muted)
  }

  const toggleRepeat = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.loop = !audio.loop
    setIsRepeating(audio.loop)
  }

  const formatTime = (time: number) => {
    if (!Number.isFinite(time)) return '0:00'

    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)

    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const VolumeIcon = useMemo(() => {
    if (isMuted) return VolumeOff
    if (volume <= 1 && volume > 2 / 3) return Volume2
    if (volume <= 2 / 3 && volume > 1 / 3) return Volume1
    if (volume <= 1 / 3 && volume > 0) return Volume
    return VolumeX
  }, [volume, isMuted])

  return (
    <div className={cn('flex w-full flex-col gap-3', className, 'max-w-55')}>
      <audio className="hidden" muted={isMuted} ref={audioRef} {...props} />
      <FilePreview className="w-full" vaultId={vaultId} meta={meta} />
      <div className="flex flex-col items-center">
        {audioMeta?.title && (
          <span className="text-center leading-none">{audioMeta.title}</span>
        )}
        {audioMeta?.artist && (
          <span className="text-muted-foreground text-center text-xs leading-none">
            {audioMeta.artist}
          </span>
        )}
      </div>
      <div className="flex w-full items-center justify-center gap-6">
        <button>
          <Shuffle className="text-secondary-foreground/50 h-3.5 w-3.5" />
        </button>
        <button>
          <SkipBack className="h-4.5 w-4.5 fill-current" />
        </button>
        <button className="cursor-default" onClick={togglePlay}>
          {isPlaying ? (
            <Pause className="h-4.5 w-4.5 fill-current transition-all duration-200 hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]" />
          ) : (
            <Play className="h-4.5 w-4.5 fill-current transition-all duration-200 hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]" />
          )}
        </button>
        <button>
          <SkipForward className="h-4.5 w-4.5 fill-current" />
        </button>
        <button onClick={toggleRepeat}>
          <Repeat
            className={cn(
              'h-3.5 w-3.5 transition-colors duration-200',
              isRepeating
                ? 'text-secondary-foreground'
                : 'text-secondary-foreground/50 hover:text-secondary-foreground',
            )}
          />
        </button>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            style={
              {
                '--value': currentTime / duration,
              } as React.CSSProperties
            }
            className={cn(
              'bg-secondary/25 w-full appearance-none rounded-full',
              styles.range,
            )}
          />
        </div>

        <div className="flex justify-between">
          <span className="ml-0.5 w-12 text-[11px] font-light">
            {formatTime(currentTime)}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleMute}
              className="flex items-center justify-center"
            >
              <VolumeIcon className="text-secondary-foreground/70 h-4 w-4" />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              disabled={isMuted}
              value={volume}
              style={
                {
                  '--value': volume,
                } as React.CSSProperties
              }
              onChange={handleVolume}
              className={cn(
                'w-full max-w-50 appearance-none rounded-full',
                styles.range,
              )}
            />
            <button className="flex items-center justify-center">
              <Metronome
                className={cn(
                  'text-secondary-foreground/50 hover:text-secondary-foreground h-3.5 w-3.5 transition-colors duration-200',
                )}
              />
            </button>
          </div>

          <span className="w-12 text-right text-[11px] font-light">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  )
}
