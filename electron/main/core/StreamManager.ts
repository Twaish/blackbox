import { ipcMain, WebContents } from 'electron'

type StreamContext = {
  streamId: string
  sender: WebContents
  signal: AbortSignal
}

type DownloadHandler<TPayload> = (
  payload: TPayload,
  ctx: StreamContext,
) => AsyncIterable<Uint8Array | string>

type UploadHandler<TStartPayload> = {
  start(payload: TStartPayload, ctx: StreamContext): Promise<void>
  chunk(streamId: string, chunk: ArrayBuffer): Promise<void>
  finish(streamId: string): Promise<any>
  abort?(streamId: string): Promise<void> | void
}

export class StreamManager {
  private abortHandlers = new Map<string, (streamId: string) => void>()

  registerDownload<TPayload>({
    startChannel,
    chunkChannel,
    endChannel,
    handler,
  }: {
    startChannel: string
    chunkChannel: string
    endChannel: string
    handler: DownloadHandler<TPayload>
  }) {
    ipcMain.on(
      startChannel,
      async (event, payload: TPayload & { streamId: string }) => {
        const sender = event.sender
        const controller = new AbortController()

        this.abortHandlers.set(payload.streamId, () => {
          controller.abort()
        })

        try {
          const stream = handler(payload, {
            streamId: payload.streamId,
            sender,
            signal: controller.signal,
          })

          for await (const chunk of stream) {
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
          this.abortHandlers.delete(payload.streamId)
        }
      },
    )
  }

  registerUpload<TPayload>({
    startChannel,
    chunkChannel,
    endChannel,
    handler,
  }: {
    startChannel: string
    chunkChannel: string
    endChannel: string
    handler: UploadHandler<TPayload>
  }) {
    ipcMain.handle(
      startChannel,
      async (event, payload: TPayload & { streamId: string }) => {
        const sender = event.sender
        const controller = new AbortController()

        this.abortHandlers.set(payload.streamId, () => {
          controller.abort()
          handler.abort?.(payload.streamId)
        })

        await handler.start(payload, {
          streamId: payload.streamId,
          sender,
          signal: controller.signal,
        })
      },
    )

    ipcMain.handle(chunkChannel, (_, streamId: string, chunk: ArrayBuffer) => {
      return handler.chunk(streamId, chunk)
    })

    ipcMain.handle(endChannel, async (_, streamId: string) => {
      try {
        return await handler.finish(streamId)
      } finally {
        this.abortHandlers.delete(streamId)
      }
    })
  }

  registerAbort(channel = 'stream:abort') {
    ipcMain.on(channel, (_, streamId: string) => {
      this.abort(streamId)
    })
  }

  abort(streamId: string) {
    const handler = this.abortHandlers.get(streamId)
    if (!handler) return

    handler(streamId)
    this.abortHandlers.delete(streamId)
  }
}
