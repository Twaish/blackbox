import { ipcMain, WebContents } from 'electron'
import { Modules } from './types'

const abortControllers = new Map<string, AbortController>()

export function registerStreamHandlers(modules: Modules) {
  ipcMain.on('stream:abort', (_event, streamId: string) => {
    const controller = abortControllers.get(streamId)
    if (!controller) return

    controller.abort()
    abortControllers.delete(streamId)
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
      const abortController = new AbortController()

      abortControllers.set(streamId, abortController)

      try {
        for await (const chunk of modules.VaultManager.streamFile({
          vaultId,
          fileId,
          signal: abortController.signal,
        })) {
          if (sender.isDestroyed()) return
          sender.send('stream:chunk', streamId, chunk)
        }

        if (!sender.isDestroyed()) {
          sender.send('stream:end', streamId)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)

        if (!sender.isDestroyed()) {
          sender.send('stream:end', streamId, msg)
        }
      } finally {
        abortControllers.delete(streamId)
      }
    },
  )
}
