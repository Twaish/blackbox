import { Modules } from './types'
import { StreamManager } from '@/core/StreamManager'

export function registerStreamHandlers({ VaultManager }: Modules) {
  const streams = new StreamManager()
  streams.registerAbort()
  streams.registerDownload({
    startChannel: 'stream:start',
    chunkChannel: 'stream:chunk',
    endChannel: 'stream:end',

    handler: async function* (
      { vaultId, fileId }: { vaultId: string; fileId: string },
      { signal },
    ) {
      yield* VaultManager.streamFile({
        vaultId,
        fileId,
        signal,
      })
    },
  })
  streams.registerUpload({
    startChannel: 'upload:start',
    chunkChannel: 'upload:chunk',
    endChannel: 'upload:finish',

    handler: {
      async start({ streamId, vaultId, name, mime, size }) {
        await VaultManager.startUpload({
          streamId,
          vaultId,
          name,
          mime,
          size,
        })
      },

      async chunk(streamId, chunk) {
        await VaultManager.uploadChunk({
          streamId,
          chunk,
        })
      },

      async finish(streamId) {
        return VaultManager.finishUpload({ streamId })
      },

      async abort(streamId) {
        VaultManager.abortUpload({ streamId })
      },
    },
  })
}
