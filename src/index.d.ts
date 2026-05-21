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
  }
}
