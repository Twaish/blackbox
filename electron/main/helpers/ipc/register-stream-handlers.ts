import { ipcMain, WebContents } from 'electron'
import { Modules } from './types'

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

const abortHandlers = new Map<string, () => void>()

export function registerStreamHandlers({ VaultManager }: Modules) {
  ipcMain.on('stream:abort', (_, streamId: string) => {
    abortHandlers.get(streamId)?.()
    abortHandlers.delete(streamId)
  })

  ipcMain.on(
    'stream:start',
    async (
      event,
      {
        streamId,
        vaultId,
        fileId,
      }: { streamId: string; vaultId: string; fileId: string },
    ) => {
      const sender: WebContents = event.sender
      const controller = new AbortController()
      abortHandlers.set(streamId, () => controller.abort())

      try {
        for await (const chunk of VaultManager.streamFile({
          vaultId,
          fileId,
          signal: controller.signal,
        })) {
          if (sender.isDestroyed()) return
          sender.send('stream:chunk', streamId, chunk)
        }

        if (!sender.isDestroyed()) {
          sender.send('stream:end', streamId)
        }
      } catch (err) {
        if (!sender.isDestroyed()) {
          sender.send('stream:end', streamId, errorMessage(err))
        }
      } finally {
        abortHandlers.delete(streamId)
      }
    },
  )

  ipcMain.handle('upload:start', async (_, data) => {
    const streamId = await VaultManager.startUpload(data)
    abortHandlers.set(streamId, () => VaultManager.abortUpload({ streamId }))
    return streamId
  })

  ipcMain.handle('upload:chunk', (_, streamId: string, chunk: ArrayBuffer) => {
    return VaultManager.uploadChunk({ streamId, chunk })
  })

  ipcMain.handle('upload:finish', async (_, streamId: string) => {
    try {
      return await VaultManager.finishUpload({ streamId })
    } finally {
      abortHandlers.delete(streamId)
    }
  })
}
