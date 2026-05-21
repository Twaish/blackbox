import { VaultStreamHandle } from '@shared/types'
import { ipcRenderer, contextBridge, IpcRendererEvent } from 'electron'

window.addEventListener('message', (event) => {
  if (event.data === 'START_ORPC') {
    const [serverPort] = event.ports

    ipcRenderer.postMessage('START_ORPC', null, [serverPort])
  }
})

contextBridge.exposeInMainWorld('streams', {
  streamVaultFile: (
    vaultId: string,
    fileId: string,
    handlers: {
      onChunk?: (chunk: Uint8Array) => void
      onEnd?: (err?: string) => void
    } = {},
  ): VaultStreamHandle => {
    const streamId = crypto.randomUUID()

    let resolvePromise!: () => void
    let rejectPromise!: (err: unknown) => void

    const promise = new Promise<void>((resolve, reject) => {
      resolvePromise = resolve
      rejectPromise = reject
    })

    const cleanup = () => {
      ipcRenderer.off('stream:chunk', handleChunk)
      ipcRenderer.off('stream:end', handleEnd)
    }

    const handleChunk = (
      _: IpcRendererEvent,
      id: string,
      chunk: Uint8Array,
    ) => {
      if (id !== streamId) return
      handlers.onChunk?.(chunk)
    }

    const handleEnd = (_: IpcRendererEvent, id: string, err?: string) => {
      if (id !== streamId) return
      cleanup()

      if (err) {
        handlers.onEnd?.(err)
        rejectPromise(new Error(err))
      } else {
        handlers.onEnd?.()
        resolvePromise()
      }
    }

    ipcRenderer.on('stream:chunk', handleChunk)
    ipcRenderer.on('stream:end', handleEnd)

    ipcRenderer.send('stream:start', { streamId, vaultId, fileId })

    return {
      cancel: () => {
        cleanup()
        ipcRenderer.send('stream:abort', streamId)
        resolvePromise
      },
      promise,
    }
  },

  abortStream: (streamId: string): void => {
    ipcRenderer.send('stream:abort', streamId)
  },
})
