import {
  createReadStream,
  createWriteStream,
  readdirSync,
  ReadStream,
} from 'fs'
import { open, readFile, appendFile, unlink, stat } from 'fs/promises'
import { randomUUID, createDecipheriv } from 'crypto'
import { pipeline } from 'stream/promises'
import mime from 'mime-types'
import path from 'path'

import { EncryptedJsonStore } from './EncryptedJsonStore'
import { VaultCrypto } from './VaultCrypto'
import { VaultPaths } from './VaultPaths'
import { UploadEvents } from './UploadEvents'

const ALGO = 'aes-256-gcm'

export class VaultFileStore {
  constructor(
    private jsonStore: EncryptedJsonStore,
    private crypto: VaultCrypto,
    private paths: VaultPaths,
    private events: UploadEvents,
  ) {}

  async add(vault: VaultEntry, key: Buffer, filepath: string): Promise<string> {
    const fileId = randomUUID()

    const statResult = await stat(filepath)
    const total = statResult.size

    this.events.emit('started', {
      uploadId: fileId,
      filename: path.basename(filepath),
      total,
    })

    const { iv, cipher } = this.crypto.createEncryptionStream(key)
    const encryptedFilepath = this.paths.data(vault.location, fileId)

    const input = createReadStream(filepath)
    const output = createWriteStream(encryptedFilepath)

    let transferred = 0

    input.on('data', (chunk: Buffer | string) => {
      transferred += chunk.length

      this.events.emit('progress', {
        uploadId: fileId,
        transferred,
        total,
        percent: Math.round((transferred / total) * 100),
      })
    })

    output.write(iv)
    await pipeline(input, cipher, output)
    await appendFile(encryptedFilepath, cipher.getAuthTag())

    const mimeType = mime.lookup(filepath)
    const metadata: VaultFileMeta = {
      fileId,
      original: {
        name: path.basename(filepath),
        ext: path.extname(filepath),
        mime:
          typeof mimeType === 'string' ? mimeType : 'application/octet-stream',
      },
    }

    const metaPath = this.paths.meta(vault.location, fileId)
    await this.jsonStore.write(metaPath, metadata, key)

    this.events.emit('finished', {
      uploadId: fileId,
      fileId,
    })

    return fileId
  }

  async read(vault: VaultEntry, key: Buffer, fileId: string): Promise<Buffer> {
    const encryptedFile = await readFile(
      this.paths.data(vault.location, fileId),
    )
    return this.crypto.decrypt(encryptedFile, key)
  }

  async *stream(
    vault: VaultEntry,
    key: Buffer,
    fileId: string,
    signal?: AbortSignal,
  ): AsyncGenerator<Uint8Array> {
    const filePath = this.paths.data(vault.location, fileId)
    const fd = await open(filePath, 'r')

    let encryptedStream: ReadStream | undefined
    let closed = false

    const closeStream = async () => {
      if (closed) return
      closed = true
      encryptedStream?.destroy()
      await fd.close().catch(() => {})
    }

    try {
      const { size } = await fd.stat()
      if (size < 28) throw new Error('Invalid encrypted file')

      const iv = Buffer.allocUnsafe(12)
      const tag = Buffer.allocUnsafe(16)
      await Promise.all([fd.read(iv, 0, 12, 0), fd.read(tag, 0, 16, size - 16)])

      const decipher = createDecipheriv(ALGO, key, iv)
      decipher.setAuthTag(tag)

      encryptedStream = createReadStream(filePath, {
        fd,
        autoClose: false,
        start: 12,
        end: size - 17,
        highWaterMark: 64 * 1024,
        signal,
      })

      encryptedStream.on('error', async (err) => {
        if ((err as Error).name !== 'AbortError') return
        await closeStream()
      })

      for await (const chunk of encryptedStream.pipe(decipher)) {
        if (signal?.aborted) break
        yield chunk
      }
    } finally {
      await closeStream()
    }
  }

  async readMeta(
    vault: VaultEntry,
    key: Buffer,
    fileId: string,
  ): Promise<VaultFileMeta> {
    return await this.jsonStore.read(
      this.paths.meta(vault.location, fileId),
      key,
    )
  }

  async delete(vault: VaultEntry, fileId: string): Promise<void> {
    await Promise.allSettled([
      unlink(this.paths.data(vault.location, fileId)),
      unlink(this.paths.meta(vault.location, fileId)),
    ])
  }

  list(vault: VaultEntry): string[] {
    return readdirSync(this.paths.data(vault.location)).map(
      (file) => path.parse(file).name,
    )
  }
}
