import { ipcRenderer, contextBridge, IpcRendererEvent } from 'electron'

window.addEventListener('message', (event) => {
  if (event.data === 'START_ORPC') {
    const [serverPort] = event.ports

    ipcRenderer.postMessage('START_ORPC', null, [serverPort])
  }
})

function deferred<T = void>() {
  let resolve!: (v: T) => void
  let reject!: (e: Error) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

type StreamState = {
  onChunk?: (chunk: Uint8Array) => void
  onEnd?: (err?: string) => void
  resolve: () => void
  reject: (err: Error) => void
}

const streams = new Map<string, StreamState>()
const abortControllers = new Map<string, AbortController>()

function cleanupStream(id: string) {
  streams.delete(id)
  abortControllers.delete(id)
}

function abortStream(streamId: string) {
  const controller = abortControllers.get(streamId)
  if (controller) {
    controller.abort()
  }
  ipcRenderer.send('stream:abort', streamId)
  cleanupStream(streamId)
}

ipcRenderer.on(
  'stream:chunk',
  (_: IpcRendererEvent, id: string, chunk: Uint8Array) => {
    streams.get(id)?.onChunk?.(chunk)
  },
)

ipcRenderer.on(
  'stream:end',
  (_: IpcRendererEvent, id: string, err?: string) => {
    const stream = streams.get(id)
    if (!stream) return

    stream.onEnd?.(err)
    if (err) {
      stream.reject(new Error(err))
    } else {
      stream.resolve()
    }
    cleanupStream(id)
  },
)

function streamVaultFile(
  vaultId: string,
  fileId: string,
  handlers: {
    onChunk?: (chunk: Uint8Array) => void
    onEnd?: (err?: string) => void
  } = {},
) {
  const streamId = crypto.randomUUID()
  const { promise, resolve, reject } = deferred()

  streams.set(streamId, {
    onChunk: handlers.onChunk ?? (() => {}),
    onEnd: handlers.onEnd ?? (() => {}),
    resolve,
    reject,
  })

  ipcRenderer.send('stream:start', { streamId, vaultId, fileId })

  return {
    streamId,
    promise,
    cancel: () => abortStream(streamId),
  }
}

function uploadVaultFile(
  vaultId: string,
  name: string,
  mime: string,
  size: number,
  getChunk: (offset: number, size: number) => Promise<ArrayBuffer>,
) {
  const streamId = crypto.randomUUID()
  const { promise, resolve, reject } = deferred()

  const abortController = new AbortController()

  streams.set(streamId, { resolve, reject })
  abortControllers.set(streamId, abortController)

  ipcRenderer
    .invoke('upload:start', { streamId, vaultId, name, mime, size })
    .then(async () => {
      const CHUNK_SIZE = 1024 * 1024
      let offset = 0

      try {
        while (offset < size) {
          if (abortController.signal.aborted)
            throw new Error('Upload cancelled')

          const chunk = await getChunk(offset, CHUNK_SIZE)

          await ipcRenderer.invoke('upload:chunk', streamId, chunk)

          offset += CHUNK_SIZE
        }

        const fileId = await ipcRenderer.invoke('upload:finish', streamId)
        resolve(fileId)
      } catch (err) {
        abortStream(streamId)
        reject(err instanceof Error ? err : new Error(String(err)))
      } finally {
        cleanupStream(streamId)
      }
    })

  return {
    streamId,
    promise,
    cancel: () => abortStream(streamId),
  }
}

contextBridge.exposeInMainWorld('streams', {
  uploadVaultFile,
  streamVaultFile,
  abortStream,
})
