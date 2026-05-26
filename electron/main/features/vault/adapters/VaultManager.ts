import { randomUUID, randomBytes, createDecipheriv } from 'node:crypto'
import { join } from 'path'
import { access, mkdir, writeFile } from 'node:fs/promises'
import { VaultPaths } from './VaultPaths'
import { VaultCrypto } from './VaultCrypto'
import { VaultRegistry } from './VaultRegistry'
import { VaultSessions } from './VaultSessions'
import { VaultFileStore } from './VaultFileStore'
import path from 'node:path'
import { ITaskService } from '@/app/tasks/application/interfaces/ITaskService'
import { UploadManager } from './UploadManager'

const ALGO = 'aes-256-gcm'

export class VaultManager implements IVaultManager {
  constructor(
    private registry: VaultRegistry,
    private sessions: VaultSessions,
    private files: VaultFileStore,
    private crypto: VaultCrypto,
    private paths: VaultPaths,
    private tasks: ITaskService,
    private uploadManager: UploadManager,
  ) {}

  async addFile({
    vaultId,
    filepath,
  }: {
    vaultId: string
    filepath: string
  }): Promise<string> {
    const vault = this.registry.get(vaultId)
    const session = this.sessions.get(vaultId)
    return await this.uploadManager.uploadFile(vault, session.key, filepath)
  }

  async readMeta({
    vaultId,
    fileId,
  }: {
    vaultId: string
    fileId: string
  }): Promise<VaultFileMeta> {
    const vault = this.registry.get(vaultId)
    const session = this.sessions.get(vaultId)
    return this.files.readMeta(vault, session.key, fileId)
  }

  async *streamFile({
    vaultId,
    fileId,
    signal,
  }: {
    vaultId: string
    fileId: string
    signal?: AbortSignal
  }): AsyncGenerator<Uint8Array> {
    const vault = this.registry.get(vaultId)
    const session = this.sessions.get(vaultId)
    const stream = this.files.stream(vault, session.key, fileId, signal)
    for await (const chunk of stream) {
      if (signal?.aborted) break
      yield chunk
    }
  }

  async restoreFile({
    vaultId,
    fileId,
    outputFilepath,
  }: {
    vaultId: string
    fileId: string
    outputFilepath: string
  }): Promise<void> {
    const vault = this.registry.get(vaultId)
    const session = this.sessions.get(vaultId)
    const fileBuffer = await this.files.read(vault, session.key, fileId)
    await writeFile(outputFilepath, fileBuffer)
  }
  async restoreAllFiles({
    vaultId,
    outputDir,
  }: {
    vaultId: string
    outputDir: string
  }): Promise<void> {
    const vault = this.registry.get(vaultId)
    const session = this.sessions.get(vaultId)

    const fileIds = this.files.list(vault)

    const task = this.tasks.startTask({
      label: `Exporting ${vault.name}`,
      description: 'Exporting files from vault ',
    })

    try {
      const total = fileIds.length
      for (let i = 0; i < total; i++) {
        const fileId = fileIds[i]
        const meta = await this.files.readMeta(vault, session.key, fileId)

        this.tasks.updateTaskProgress({
          id: task.id,
          progress: Math.round((i / total) * 100),
          description: `Exporting ${meta.original.name} (${i + 1}/${total})`,
        })

        const outputPath = await this.getUniqueRestorePath(
          outputDir,
          meta.original.name,
        )

        await mkdir(path.dirname(outputPath), {
          recursive: true,
        })

        const fileBuffer = await this.files.read(vault, session.key, fileId)

        await writeFile(outputPath, fileBuffer)
      }

      this.tasks.updateTaskProgress({
        id: task.id,
        progress: 100,
        description: `Export completed`,
      })

      this.tasks.finishTask(task.id)
    } catch (error) {
      this.tasks.abortTask(task.id)
      throw error
    }
  }
  private async getUniqueRestorePath(
    outputDir: string,
    filename: string,
  ): Promise<string> {
    const ext = path.extname(filename)
    const base = path.basename(filename, ext)

    let candidate = path.join(outputDir, filename)
    let counter = 1

    while (await this.pathExists(candidate)) {
      candidate = path.join(outputDir, `${base} (${counter})${ext}`)

      counter++
    }

    return candidate
  }

  private async pathExists(filepath: string): Promise<boolean> {
    try {
      await access(filepath)
      return true
    } catch {
      return false
    }
  }

  async deleteFile({
    vaultId,
    fileId,
  }: {
    vaultId: string
    fileId: string
  }): Promise<void> {
    const vault = this.registry.get(vaultId)
    await this.files.delete(vault, fileId)
  }

  async createVault({
    location,
    name,
    passphrase,
  }: {
    location: string
    name: string
    passphrase: string
  }): Promise<void> {
    const vaultPath = join(location, name)

    await mkdir(vaultPath, { recursive: true })
    await Promise.all([
      mkdir(this.paths.data(vaultPath)),
      mkdir(this.paths.meta(vaultPath)),
    ])

    const salt = randomBytes(16)
    const key = this.crypto.deriveKey(passphrase, salt)
    const keyCheck = this.createKeyCheck(key)

    const id = randomUUID()
    const manifest: VaultManifest = {
      id,
      name,
      crypto: {
        salt: salt.toString('base64'),
        keyCheck,
      },
    }

    await writeFile(
      this.paths.manifest(vaultPath),
      JSON.stringify(manifest, null, 2),
      'utf-8',
    )

    this.registry.add({ id, name, location: vaultPath })
  }

  async unlockVault({
    vaultId,
    passphrase,
  }: {
    vaultId: string
    passphrase: string
  }): Promise<void> {
    const key = await this.getVerifiedKey(vaultId, passphrase)
    this.sessions.set(vaultId, key)
  }

  async renameVault({ vaultId, name }: { vaultId: string; name: string }) {
    const vault = this.registry.get(vaultId)
    const manifest = await this.registry.getManifest(vault.location)

    manifest.name = name

    const manifestPath = this.paths.manifest(vault.location)
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')

    this.registry.update(vaultId, { name })
  }

  getVaultFiles(vaultId: string): string[] {
    return this.files.list(this.registry.get(vaultId))
  }

  async startUpload({
    streamId,
    vaultId,
    name,
    mime,
    size,
  }: {
    streamId: string
    vaultId: string
    name: string
    mime: string
    size: number
  }): Promise<string> {
    const vault = this.registry.get(vaultId)
    const session = this.sessions.get(vaultId)
    return await this.uploadManager.createUpload({
      uploadId: streamId,
      vault,
      key: session.key,
      name,
      mime,
      size,
    })
  }

  private createKeyCheck(key: Buffer): VaultManifest['crypto']['keyCheck'] {
    const { iv, cipher } = this.crypto.createEncryptionStream(key)
    const plain = Buffer.from('vault-check', 'utf8')
    const data = Buffer.concat([cipher.update(plain), cipher.final()])
    return {
      iv: iv.toString('base64'),
      data: data.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
    }
  }

  private async getVerifiedKey(
    vaultId: string,
    passphrase: string,
  ): Promise<Buffer> {
    const vault = this.registry.get(vaultId)
    const manifest = await this.registry.getManifest(vault.location)

    const salt = Buffer.from(manifest.crypto.salt, 'base64')
    const key = this.crypto.deriveKey(passphrase, salt)
    const check = manifest.crypto.keyCheck

    const iv = Buffer.from(check.iv, 'base64')
    const data = Buffer.from(check.data, 'base64')
    const tag = Buffer.from(check.tag, 'base64')

    try {
      const decipher = createDecipheriv(ALGO, key, iv)
      decipher.setAuthTag(tag)

      const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
      if (decrypted.toString('utf8') !== 'vault-check') throw new Error()

      return key
    } catch {
      throw new Error('Invalid passphrase')
    }
  }
}
