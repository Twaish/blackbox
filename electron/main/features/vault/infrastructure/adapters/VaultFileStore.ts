import { createReadStream, readdirSync, ReadStream } from 'fs'
import { open, readFile, unlink } from 'fs/promises'
import { createDecipheriv } from 'crypto'
import path from 'path'

import { VaultCrypto } from './VaultCrypto'
import { VaultPaths } from './VaultPaths'

const ALGO = 'aes-256-gcm'

export class VaultFileStore {
  constructor(
    private crypto: VaultCrypto,
    private paths: VaultPaths,
  ) {}

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
    const encryptedFile = await readFile(
      this.paths.meta(vault.location, fileId),
    )
    return JSON.parse(this.crypto.decrypt(encryptedFile, key).toString('utf-8'))
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
