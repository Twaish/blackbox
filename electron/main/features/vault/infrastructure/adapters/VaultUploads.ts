import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { createReadStream, createWriteStream, type WriteStream } from 'node:fs'
import { stat, unlink, writeFile } from 'node:fs/promises'
import mime from 'mime-types'

export class VaultUploads implements IVaultUploads {
  private uploads = new Map<string, VaultUploadSession>()

  constructor(
    private crypto: IVaultCrypto,
    private paths: IVaultPaths,
    private tasks: ITaskService,
  ) {}

  async createUpload({
    uploadId = randomUUID(),
    vault,
    key,
    name,
    mime,
    size,
    onEnd,
  }: {
    uploadId?: string

    vault: VaultEntry
    key: Buffer

    name: string
    mime: string
    size: number

    onEnd?: () => void
  }): Promise<string> {
    const fileId = randomUUID()
    const metaPath = this.paths.meta(vault.location, fileId)
    const encryptedPath = this.paths.data(vault.location, fileId)
    const { iv, cipher } = this.crypto.createEncryptionStream(key)

    const output = createWriteStream(encryptedPath)
    output.once('error', (err) => console.log(err))

    await write(output, iv)

    const task = this.tasks.startTask(
      {
        label: `Uploading ${name}`,
        description: progressDescription(0, size),
      },
      () => this.abort(uploadId),
    )

    this.uploads.set(uploadId, {
      id: uploadId,
      vaultId: vault.id,
      fileId,
      taskId: task.id,

      name,
      mime,
      size,

      transferred: 0,

      encryptedPath,
      metaPath,

      iv,
      cipher,
      output,
      key,

      onEnd,
      hasEnded: false,
      abortPromise: null,
    })

    return uploadId
  }

  async writeChunk(uploadId: string, chunk: ArrayBuffer): Promise<void> {
    const session = this.uploads.get(uploadId)
    if (!session || session.hasEnded) return
    if (session.abortPromise) return await session.abortPromise

    const buffer = Buffer.from(chunk)
    await write(session.output, session.cipher.update(buffer))

    session.transferred += buffer.length
    this.tasks.updateTaskProgress({
      id: session.taskId,
      progress: Math.round((session.transferred / session.size) * 100),
      description: progressDescription(session.transferred, session.size),
    })
  }

  async finish(uploadId: string): Promise<string> {
    const session = this.uploads.get(uploadId)
    if (!session) throw new Error(`Upload session "${uploadId}" not found`)
    if (session.hasEnded) return session.fileId

    try {
      await this.finalizeStream(session)
      await this.writeMetadata(session)

      session.hasEnded = true

      this.tasks.finishTask(session.taskId)
      this.uploads.delete(uploadId)

      return session.fileId
    } catch (error) {
      await this.abort(uploadId)
      throw error
    }
  }

  async abort(uploadId: string): Promise<void> {
    const session = this.uploads.get(uploadId)
    if (!session || session.hasEnded) return
    if (session.abortPromise) return session.abortPromise

    session.hasEnded = true
    session.abortPromise = (async () => {
      this.tasks.abortTask(session.taskId)
      session.onEnd?.()
      session.cipher.destroy()
      session.output.destroy()

      await Promise.allSettled([
        unlink(session.encryptedPath).catch(() => {}),
        unlink(session.metaPath).catch(() => {}),
      ])

      this.uploads.delete(uploadId)
    })()
    return session.abortPromise
  }

  async uploadFile(
    vault: VaultEntry,
    key: Buffer,
    filepath: string,
  ): Promise<string> {
    const stats = await stat(filepath)
    const mimeType = mime.lookup(filepath)
    const input = createReadStream(filepath)
    const uploadId = await this.createUpload({
      vault,
      key,
      name: path.basename(filepath),
      mime:
        typeof mimeType === 'string' ? mimeType : 'application/octet-stream',
      size: stats.size,
      onEnd: () => input.destroy(),
    })

    try {
      for await (const chunk of input) {
        await this.writeChunk(uploadId, chunk)
      }
      return await this.finish(uploadId)
    } catch (error) {
      await this.abort(uploadId)
      throw error
    }
  }

  private async finalizeStream(session: VaultUploadSession): Promise<void> {
    await write(session.output, session.cipher.final())
    await write(session.output, session.cipher.getAuthTag())

    await new Promise<void>((resolve, reject) => {
      session.output.once('finish', resolve)
      session.output.once('error', reject)
      session.output.end()
    })
  }

  private async writeMetadata(session: VaultUploadSession): Promise<void> {
    const metadata: VaultFileMeta = {
      fileId: session.fileId,
      original: {
        name: session.name,
        ext: path.extname(session.name),
        mime: session.mime || 'application/octet-stream',
      },
    }

    await writeFile(
      session.metaPath,
      this.crypto.encrypt(
        Buffer.from(JSON.stringify(metadata), 'utf-8'),
        session.key,
      ),
    )
  }
}

async function write(stream: WriteStream, chunk: Buffer): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    stream.write(chunk, (error) => {
      if (error) reject(error)
      else resolve()
    }),
  )
}

function progressDescription(transferred: number, total: number): string {
  return `${formatBytes(transferred)} / ${formatBytes(total)}`
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))

  const value = bytes / Math.pow(1024, i)

  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}
