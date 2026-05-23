import EventEmitter from 'events'

export type UploadEventMap = {
  started: {
    uploadId: string
    filename: string
    total?: number
  }

  progress: {
    uploadId: string
    transferred: number
    total?: number
    percent?: number
  }

  finished: {
    uploadId: string
    fileId: string
  }

  aborted: {
    uploadId: string
  }
}

export class UploadEvents {
  private emitter = new EventEmitter()

  on<K extends keyof UploadEventMap>(
    event: K,
    listener: (payload: UploadEventMap[K]) => void,
  ): () => void {
    this.emitter.on(event, listener)

    return () => {
      this.emitter.off(event, listener)
    }
  }

  emit<K extends keyof UploadEventMap>(
    event: K,
    payload: UploadEventMap[K],
  ): void {
    this.emitter.emit(event, payload)
  }
}
