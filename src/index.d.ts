import { VaultStreamHandle } from '@shared/types'

export {}

declare global {
  interface Window {
    streams: {
      streamVaultFile: (
        vaultId: string,
        fileId: string,
        handlers: {
          onChunk?: (chunk: Uint8Array) => void
          onEnd?: (err?: string) => void
        },
      ) => VaultStreamHandle
      abortStream: (streamId: string) => void
    }
    uploads: {
      start: (data: {
        vaultId: string
        name: string
        mime: string
      }) => Promise<string>
      chunk: (streamId: string, chunk: ArrayBuffer) => Promise<void>
      finish: (streamId: string) => Promise<string>
    }
  }
}
