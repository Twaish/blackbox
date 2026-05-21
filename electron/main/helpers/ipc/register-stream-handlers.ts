import { ipcMain, WebContents } from 'electron'
import { Modules } from './types'

export function registerStreamHandlers(modules: Modules) {
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
      const abortController = new AbortController()

      const onAbort = (_: Electron.IpcMainEvent, id: string) => {
        if (id !== streamId) return
        abortController.abort()
        ipcMain.off('stream:abort', onAbort)
      }
      ipcMain.on('stream:abort', onAbort)

      try {
        for await (const chunk of modules.VaultManager.streamFile({
          vaultId,
          fileId,
          signal: abortController.signal,
        })) {
          if (sender.isDestroyed()) break
          sender.send('stream:chunk', streamId, chunk)
        }

        if (!sender.isDestroyed()) {
          sender.send('stream:end', streamId)
        }
      } catch (err: unknown) {
        ipcMain.off('stream:abort', onAbort)
        if (!sender.isDestroyed()) {
          const msg = err instanceof Error ? err.message : String(err)
          sender.send('stream:end', streamId, msg)
        }
      }
    },
  )
}
