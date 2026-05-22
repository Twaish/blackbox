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
    streams.delete(id)
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
    cancel: () => ipcRenderer.send('stream:abort', streamId),
    promise,
  }
}

function abortStream(streamId: string) {
  ipcRenderer.send('stream:abort', streamId)
}

contextBridge.exposeInMainWorld('streams', {
  streamVaultFile,
  abortStream,
})

contextBridge.exposeInMainWorld('uploads', {
  start: (data: { vaultId: string; name: string; mime: string }) => {
    return ipcRenderer.invoke('upload:start', data)
  },

  chunk: (streamId: string, chunk: ArrayBuffer) => {
    ipcRenderer.invoke('upload:chunk', streamId, chunk)
  },

  finish: (streamId: string): Promise<string> => {
    return ipcRenderer.invoke('upload:finish', streamId)
  },
})
