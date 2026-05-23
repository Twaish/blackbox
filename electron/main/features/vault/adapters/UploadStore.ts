import path from 'node:path'
import { randomUUID, CipherGCM } from 'node:crypto'
import { createWriteStream, WriteStream } from 'node:fs'
import { VaultPaths } from './VaultPaths'
import { VaultCrypto } from './VaultCrypto'
import { VaultFileStore } from './VaultFileStore'
import { EncryptedJsonStore } from './EncryptedJsonStore'
import { writeToStream } from '../utils/write-to-stream'
import { UploadEvents } from './UploadEvents'

type UploadSession = {
  streamId: string
  vaultId: string
  fileId: string
  stream: WriteStream
  cipher: CipherGCM
  iv: Buffer
  name: string
  mime: string
  size: number
  transferred: number
}

export class UploadStore {
  private uploads = new Map<string, UploadSession>()

  constructor(
    private jsonStore: EncryptedJsonStore,
    private crypto: VaultCrypto,
    private paths: VaultPaths,
    private files: VaultFileStore,
    private events: UploadEvents,
  ) {}

  async start(
    streamId: string,
    vault: VaultEntry,
    key: Buffer,
    name: string,
    mime: string,
    size: number,
  ): Promise<string> {
    const fileId = randomUUID()
    const { iv, cipher } = this.crypto.createEncryptionStream(key)

    const stream = createWriteStream(this.paths.data(vault.location, fileId))
    await writeToStream(stream, iv)

    this.uploads.set(streamId, {
      streamId,
      vaultId: vault.id,
      fileId,
      stream,
      cipher,
      iv,
      name,
      mime,
      size,
      transferred: 0,
    })

    this.events.emit('started', {
      uploadId: streamId,
      filename: name,
      total: size,
    })

    return streamId
  }

  async chunk(streamId: string, chunk: ArrayBuffer): Promise<void> {
    const upload = this.get(streamId)
    const buffer = Buffer.from(chunk)
    upload.transferred += buffer.length

    await writeToStream(upload.stream, upload.cipher.update(buffer))

    this.events.emit('progress', {
      uploadId: streamId,
      transferred: upload.transferred,
      total: upload.size,
      percent: Math.round((upload.transferred / upload.size) * 100),
    })
  }

  async finish(
    streamId: string,
    vault: VaultEntry,
    key: Buffer,
  ): Promise<string> {
    const { cipher, stream, fileId, name, mime } = this.get(streamId)

    await writeToStream(stream, cipher.final())
    await writeToStream(stream, cipher.getAuthTag())
    await new Promise<void>((resolve) => stream.end(resolve))

    const metadata: VaultFileMeta = {
      fileId,
      original: {
        name,
        ext: path.extname(name),
        mime: mime || 'application/octet-stream',
      },
    }

    const metaPath = this.paths.meta(vault.location, fileId)
    await this.jsonStore.write(metaPath, metadata, key)
    this.uploads.delete(streamId)
    this.events.emit('finished', {
      uploadId: streamId,
      fileId,
    })
    return fileId
  }

  async abort(streamId: string, vault: VaultEntry): Promise<void> {
    const upload = this.uploads.get(streamId)
    if (!upload) return

    await new Promise<void>((resolve, reject) => {
      upload.stream.once('close', resolve)
      upload.stream.once('error', reject)
      upload.stream.destroy()
    })

    this.uploads.delete(streamId)
    this.files.delete(vault, upload.fileId)
    this.events.emit('aborted', {
      uploadId: streamId,
    })
  }

  get(streamId: string): UploadSession {
    const upload = this.uploads.get(streamId)
    if (!upload) throw new Error('Upload session not found')
    return upload
  }
}
