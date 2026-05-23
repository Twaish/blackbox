import { VaultStreamHandle } from '@shared/types'

export {}

declare global {
  interface Window {
    streams: {
      uploadVaultFile(
        vaultId: string,
        name: string,
        mime: string,
        size: number,
        getChunk: (offset: number, size: number) => Promise<ArrayBuffer>,
      ): VaultStreamHandle
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
