import { ComponentProps, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/utils/tailwind'
import {
  Pause,
  Play,
  Repeat,
  Volume,
  Volume1,
  Volume2,
  VolumeOff,
  VolumeX,
  Metronome,
  SkipForward,
  SkipBack,
  Check,
} from 'lucide-react'
import { FilePreview } from '../FilePreview'
import styles from './AudioContent.module.css'
import { create } from 'zustand'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useVaultFilesStore } from '@/features/vault/stores/useVaultFilesStore'
import { readVaultFileMeta } from '@/features/vault/actions'

type AudioPlayerStore = {
  audio: HTMLAudioElement | null

  isPlaying: boolean
  duration: number
  currentTime: number

  volume: number
  isMuted: boolean

  isRepeating: boolean
  playbackSpeed: number

  setAudio: (audio: HTMLAudioElement | null) => void

  play: () => Promise<void>
  pause: () => void
  togglePlay: () => Promise<void>

  seek: (time: number) => void

  setVolume: (volume: number) => void
  toggleMute: () => void

  toggleRepeat: () => void

  setPlaybackSpeed: (speed: number) => void

  setDuration: (duration: number) => void
  setCurrentTime: (time: number) => void
}

const useAudioPlayerStore = create<AudioPlayerStore>((set, get) => ({
  audio: null,

  isPlaying: false,
  duration: 0,
  currentTime: 0,

  volume: 0.5,
  isMuted: false,

  isRepeating: false,
  playbackSpeed: 1,

  setAudio: (audio) => {
    if (!audio) {
      set({ audio: null })
      return
    }

    audio.volume = get().volume
    audio.muted = get().isMuted
    audio.loop = get().isRepeating
    audio.playbackRate = get().playbackSpeed

    set({ audio, isPlaying: false, currentTime: 0, duration: 0 })
  },

  play: async () => {
    const audio = get().audio
    if (!audio) return

    await audio.play()

    set({ isPlaying: true })
  },

  pause: () => {
    const audio = get().audio
    if (!audio) return

    audio.pause()

    set({ isPlaying: false })
  },

  togglePlay: async () => {
    const { isPlaying, play, pause } = get()

    if (isPlaying) {
      pause()
    } else {
      await play()
    }
  },

  seek: (time) => {
    const audio = get().audio
    if (!audio) return

    audio.currentTime = time

    set({ currentTime: time })
  },

  setVolume: (volume) => {
    const audio = get().audio

    if (audio) {
      audio.volume = volume

      if (volume > 0 && audio.muted) {
        audio.muted = false
      }
    }

    set({
      volume,
      isMuted: volume > 0 ? false : get().isMuted,
    })
  },

  toggleMute: () => {
    const audio = get().audio
    if (!audio) return

    audio.muted = !audio.muted

    set({
      isMuted: audio.muted,
    })
  },

  toggleRepeat: () => {
    const audio = get().audio
    if (!audio) return

    audio.loop = !audio.loop

    set({
      isRepeating: audio.loop,
    })
  },

  setPlaybackSpeed: (speed) => {
    const audio = get().audio

    if (audio) {
      audio.playbackRate = speed
    }

    set({
      playbackSpeed: speed,
    })
  },

  setDuration: (duration) => set({ duration }),

  setCurrentTime: (currentTime) => set({ currentTime }),
}))

export function AudioContent({
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
  return (
    <div className={cn('flex w-full flex-col gap-3', className, 'max-w-55')}>
      <AudioContent.AudioSource {...props} />
      <FilePreview
        className="w-full"
        forcePreview
        vaultId={vaultId}
        meta={meta}
      />
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
      <AudioContent.AudioControls vaultId={vaultId} fileId={meta.fileId} />
      <div className="flex flex-col gap-1">
        <AudioContent.TimeSlider />

        <div className="flex items-center justify-between">
          <AudioContent.CurrentTime />
          <AudioContent.VolumeControls />
          <AudioContent.Duration />
        </div>
      </div>
    </div>
  )
}

AudioContent.TimeSlider = function TimeSlider({
  className,
  ...props
}: ComponentProps<'input'>) {
  const currentTime = useAudioPlayerStore((s) => s.currentTime)
  const duration = useAudioPlayerStore((s) => s.duration)
  const seek = useAudioPlayerStore((s) => s.seek)

  return (
    <input
      type="range"
      min={0}
      max={duration || 0}
      step={0.1}
      value={currentTime}
      onChange={(e) => seek(Number(e.target.value))}
      style={
        {
          '--value': currentTime / duration,
        } as React.CSSProperties
      }
      className={cn(
        'bg-secondary/25 w-full appearance-none rounded-full',
        styles.range,
        className,
      )}
      {...props}
    />
  )
}

AudioContent.AudioControls = function AudioControls({
  vaultId,
  fileId,
}: {
  vaultId: string
  fileId: string
}) {
  const isPlaying = useAudioPlayerStore((s) => s.isPlaying)
  const isRepeating = useAudioPlayerStore((s) => s.isRepeating)
  const currentTime = useAudioPlayerStore((s) => s.currentTime)

  const togglePlay = useAudioPlayerStore((s) => s.togglePlay)
  const toggleRepeat = useAudioPlayerStore((s) => s.toggleRepeat)
  const seek = useAudioPlayerStore((s) => s.seek)

  const setSelectedFileId = useVaultFilesStore((s) => s.setSelectedFileId)

  const skipTo = async (find: () => Promise<string | null>) => {
    const nextId = await find()
    if (nextId) setSelectedFileId(nextId, vaultId)
  }

  const handleSkipPrev = () => {
    if (currentTime > 3) {
      seek(0)
      return
    }
    skipTo(() => findPrevAudioFileId(vaultId, fileId))
  }

  const handleSkipNext = () => {
    skipTo(() => findNextAudioFileId(vaultId, fileId))
  }

  return (
    <div className="flex w-full items-center justify-center gap-6">
      <button title="Toggle repeat" onClick={toggleRepeat}>
        <Repeat
          className={cn(
            'h-3.5 w-3.5 transition-colors duration-200',
            isRepeating
              ? 'text-secondary-foreground'
              : 'text-secondary-foreground/50 hover:text-secondary-foreground',
          )}
        />
      </button>
      <button onClick={handleSkipPrev} title="Skip to previous audio">
        <SkipBack className="h-4.5 w-4.5 fill-current" />
      </button>
      <button
        title={isPlaying ? 'Pause Audio' : 'Play Audio'}
        className="cursor-default"
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className="h-4.5 w-4.5 fill-current transition-all duration-200 hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]" />
        ) : (
          <Play className="h-4.5 w-4.5 fill-current transition-all duration-200 hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]" />
        )}
      </button>
      <button onClick={handleSkipNext} title="Skip to next audio">
        <SkipForward className="h-4.5 w-4.5 fill-current" />
      </button>
      <AudioContent.PlaybackSpeedButton />
    </div>
  )
}
AudioContent.VolumeControls = function VolumeControls() {
  const volume = useAudioPlayerStore((s) => s.volume)
  const isMuted = useAudioPlayerStore((s) => s.isMuted)

  const setVolume = useAudioPlayerStore((s) => s.setVolume)
  const toggleMute = useAudioPlayerStore((s) => s.toggleMute)
  const VolumeIcon = useMemo(() => {
    if (isMuted) return VolumeOff
    if (volume <= 1 && volume > 2 / 3) return Volume2
    if (volume <= 2 / 3 && volume > 1 / 3) return Volume1
    if (volume <= 1 / 3 && volume > 0) return Volume
    return VolumeX
  }, [volume, isMuted])
  return (
    <>
      <button
        title="Toggle volume"
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
        onChange={(e) => setVolume(Number(e.target.value))}
        className={cn(
          'w-full max-w-50 appearance-none rounded-full',
          styles.range,
        )}
      />
    </>
  )
}

AudioContent.AudioSource = function AudioSource(
  props: ComponentProps<'audio'>,
) {
  const ref = useRef<HTMLAudioElement>(null)

  const setAudio = useAudioPlayerStore((s) => s.setAudio)
  const setDuration = useAudioPlayerStore((s) => s.setDuration)
  const setCurrentTime = useAudioPlayerStore((s) => s.setCurrentTime)

  useEffect(() => {
    const audio = ref.current
    if (!audio) return

    setAudio(audio)

    const onLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const onEnded = () => {
      useAudioPlayerStore.setState({
        isPlaying: false,
      })
    }

    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)

      setAudio(null)
    }
  }, [setAudio, setDuration, setCurrentTime])

  return <audio ref={ref} className="hidden" {...props} />
}

AudioContent.PlaybackSpeedButton = function PlaybackSpeedButton() {
  const audioSource = useAudioPlayerStore((s) => s.audio)
  const [playback, setPlayback] = useState(1)
  const [open, setOpen] = useState(false)

  const handlePlayback = (playbackSpeed: number) => {
    if (audioSource) {
      audioSource.playbackRate = playbackSpeed
      setPlayback(playbackSpeed)
      setOpen(false)
    }
  }

  const playbackSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          title="Change playback speed"
          className="flex items-center justify-center"
        >
          <Metronome
            className={cn(
              'text-secondary-foreground/50 hover:text-secondary-foreground h-3.5 w-3.5 transition-colors duration-200',
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-w-40 gap-0 p-0 font-mono text-xs select-none">
        {playbackSpeeds.map((playbackSpeed) => {
          const isSelected = playback === playbackSpeed
          return (
            <div
              key={playbackSpeed}
              onClick={() => handlePlayback(playbackSpeed)}
              className={cn(
                'hover:bg-secondary/20 flex items-center px-3 py-1.5',
                isSelected && 'bg-secondary/35 border-primary border-l',
              )}
            >
              <span>{playbackSpeed}</span>
              {isSelected && <Check className="ml-auto h-3.5 w-3.5" />}
            </div>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}

AudioContent.CurrentTime = function CurrentTime() {
  const currentTime = useAudioPlayerStore((s) => s.currentTime)
  return (
    <span className="ml-0.5 w-12 text-[11px] font-light">
      {formatTime(currentTime)}
    </span>
  )
}
AudioContent.Duration = function Duration() {
  const duration = useAudioPlayerStore((s) => s.duration)
  return (
    <span className="w-12 text-right text-[11px] font-light">
      {formatTime(duration)}
    </span>
  )
}

function formatTime(time: number) {
  if (!Number.isFinite(time)) return '0:00'

  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

async function findAdjacentAudioFileId(
  vaultId: string,
  currentFileId: string,
  direction: 'next' | 'prev',
): Promise<string | null> {
  const files = useVaultFilesStore.getState().files
  const currentIndex = files.indexOf(currentFileId)

  if (currentIndex === -1) return null

  const searchOrder =
    direction === 'next'
      ? [...files.slice(currentIndex + 1), ...files.slice(0, currentIndex)]
      : [
          ...files.slice(0, currentIndex).reverse(),
          ...files.slice(currentIndex + 1).reverse(),
        ]

  for (const fileId of searchOrder) {
    try {
      const meta = await readVaultFileMeta(vaultId, fileId)
      if (meta.original.mime.startsWith('audio/')) {
        return fileId
      }
    } catch {
      continue
    }
  }

  return null
}

function findNextAudioFileId(vaultId: string, currentFileId: string) {
  return findAdjacentAudioFileId(vaultId, currentFileId, 'next')
}

function findPrevAudioFileId(vaultId: string, currentFileId: string) {
  return findAdjacentAudioFileId(vaultId, currentFileId, 'prev')
}
