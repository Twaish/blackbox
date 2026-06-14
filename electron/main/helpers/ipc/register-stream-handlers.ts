import { ipcMain } from 'electron'
import { Modules } from './types'

const abortHandlers = new Map<string, (streamId: string) => void>()
function cleanHandlers(streamId: string) {
  abortHandlers.delete(streamId)
}
function abort(streamId: string) {
  const handler = abortHandlers.get(streamId)
  handler?.(streamId)
  cleanHandlers(streamId)
}

function noEvent<T extends unknown[], K>(callback: (...args: T) => K) {
  return (_: unknown, ...args: T) => callback(...args)
}

export function registerStreamHandlers({
  VaultManager,
  VaultUploads,
}: Modules) {
  registerAbort()
  registerUpload({
    startChannel: 'upload:start',
    chunkChannel: 'upload:chunk',
    endChannel: 'upload:finish',
    handler: {
      start: VaultManager.startUpload.bind(VaultManager),
      chunk: VaultUploads.writeChunk.bind(VaultUploads),
      finish: VaultUploads.finish.bind(VaultUploads),
      abort: VaultUploads.abort.bind(VaultUploads),
    },
  })
  registerDownload({
    startChannel: 'stream:start',
    chunkChannel: 'stream:chunk',
    endChannel: 'stream:end',
    handler: VaultManager.streamFile.bind(VaultManager),
  })
}

function registerAbort() {
  ipcMain.on('stream:abort', noEvent(abort))
}

function registerUpload<TPayload>({
  startChannel,
  chunkChannel,
  endChannel,
  handler,
}: {
  startChannel: string
  chunkChannel: string
  endChannel: string
  handler: {
    start(payload: TPayload): Promise<void | string>
    chunk(streamId: string, chunk: ArrayBuffer): Promise<void>
    finish(streamId: string): Promise<string>
    abort?(streamId: string): Promise<void> | void
  }
}) {
  ipcMain.handle(
    startChannel,
    async (_, payload: TPayload & { streamId: string }) => {
      abortHandlers.set(payload.streamId, () => {
        handler.abort?.(payload.streamId)
      })
      await handler.start(payload)
    },
  )
  ipcMain.handle(chunkChannel, noEvent(handler.chunk))
  ipcMain.handle(endChannel, async (_, streamId: string) => {
    try {
      return await handler.finish(streamId)
    } finally {
      cleanHandlers(streamId)
    }
  })
}

function registerDownload<TPayload>({
  startChannel,
  chunkChannel,
  endChannel,
  handler,
}: {
  startChannel: string
  chunkChannel: string
  endChannel: string
  handler: (payload: TPayload) => AsyncIterable<Uint8Array | string>
}) {
  ipcMain.on(
    startChannel,
    async (event, payload: TPayload & { streamId: string }) => {
      const sender = event.sender

      try {
        for await (const chunk of handler(payload)) {
          if (sender.isDestroyed()) return
          sender.send(chunkChannel, payload.streamId, chunk)
        }

        if (!sender.isDestroyed()) {
          sender.send(endChannel, payload.streamId)
        }
      } catch (err) {
        if (!sender.isDestroyed()) {
          sender.send(
            endChannel,
            payload.streamId,
            err instanceof Error ? err.message : String(err),
          )
        }
      } finally {
        cleanHandlers(payload.streamId)
      }
    },
  )
}
