import { randomUUID, randomBytes } from 'node:crypto'
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
import { existsSync } from 'node:fs'

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
    return await this.uploadManager.uploadFile(vault, session.dek, filepath)
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
    return this.files.readMeta(vault, session.dek, fileId)
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
    const stream = this.files.stream(vault, session.dek, fileId, signal)
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
    const fileBuffer = await this.files.read(vault, session.dek, fileId)
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
        const meta = await this.files.readMeta(vault, session.dek, fileId)

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

        const fileBuffer = await this.files.read(vault, session.dek, fileId)

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
      candidate = path.join(outputDir, `${base} (${counter++})${ext}`)
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

  async deleteFiles({
    vaultId,
    fileIds,
  }: {
    vaultId: string
    fileIds: string[]
  }): Promise<void> {
    const vault = this.registry.get(vaultId)
    await Promise.all(fileIds.map((fileId) => this.files.delete(vault, fileId)))
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

    if (existsSync(vaultPath)) {
      throw new Error(`Vault at path ${vaultPath} already exists`)
    }

    await mkdir(vaultPath, { recursive: true })
    await Promise.all([
      mkdir(this.paths.data(vaultPath)),
      mkdir(this.paths.meta(vaultPath)),
    ])

    const salt = randomBytes(16)
    const kek = this.crypto.deriveKey(passphrase, salt)
    const dek = this.crypto.generateKey()
    const encryptedDek = this.crypto.encrypt(dek, kek)

    const key = this.crypto.deriveKey(passphrase, salt)

    const id = randomUUID()
    const manifest: VaultManifest = {
      id,
      name,
      crypto: {
        salt: salt.toString('base64'),
        encryptedDek: encryptedDek.toString('base64'),
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
    const dek = await this.unlockDek(vaultId, passphrase)
    this.sessions.set(vaultId, dek)
  }

  async renameVault({ vaultId, name }: { vaultId: string; name: string }) {
    const vault = this.registry.get(vaultId)
    const manifest = await this.registry.getManifest(vault.location)

    manifest.name = name

    const manifestPath = this.paths.manifest(vault.location)
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')

    this.registry.update(vaultId, { name })
  }

  async getVaultFiles(vaultId: string, query?: string): Promise<string[]> {
    const vault = this.registry.get(vaultId)
    const allIds = this.files.list(vault)
    if (!query || query.trim() === '') return allIds

    const session = this.sessions.get(vaultId)
    const lowerQuery = query.toLowerCase()
    const matchedIds: string[] = []

    await Promise.all(
      allIds.map(async (fileId) => {
        try {
          const meta = await this.files.readMeta(vault, session.dek, fileId)

          if (meta.original.name.toLowerCase().includes(lowerQuery)) {
            matchedIds.push(fileId)
          }
        } catch (err) {
          console.warn(`Failed to read meta for search on file ${fileId}`, err)
        }
      }),
    )

    return matchedIds

    // await Promise.all(
    //   allIds.map()
    // )

    // return this.files.list(this.registry.get(vaultId))
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
      key: session.dek,
      name,
      mime,
      size,
    })
  }

  async changePassphrase({
    vaultId,
    oldPassphrase,
    newPassphrase,
  }: {
    vaultId: string
    oldPassphrase: string
    newPassphrase: string
  }): Promise<void> {
    const vault = this.registry.get(vaultId)
    const manifest = await this.registry.getManifest(vault.location)

    const oldSalt = Buffer.from(manifest.crypto.salt, 'base64')
    const oldKek = this.crypto.deriveKey(oldPassphrase, oldSalt)

    const dek = this.crypto.decrypt(
      Buffer.from(manifest.crypto.encryptedDek, 'base64'),
      oldKek,
    )

    const newSalt = randomBytes(16)
    const newKek = this.crypto.deriveKey(newPassphrase, newSalt)
    const encryptedDek = this.crypto.encrypt(dek, newKek)

    manifest.crypto = {
      salt: newSalt.toString('base64'),
      encryptedDek: encryptedDek.toString('base64'),
    }

    await writeFile(
      this.paths.manifest(vault.location),
      JSON.stringify(manifest, null, 2),
      'utf8',
    )
  }

  private async unlockDek(
    vaultId: string,
    passphrase: string,
  ): Promise<Buffer> {
    const vault = this.registry.get(vaultId)
    const manifest = await this.registry.getManifest(vault.location)

    const salt = Buffer.from(manifest.crypto.salt, 'base64')
    const kek = this.crypto.deriveKey(passphrase, salt)
    const encryptedDek = Buffer.from(manifest.crypto.encryptedDek, 'base64')

    try {
      return this.crypto.decrypt(encryptedDek, kek)
    } catch {
      throw new Error('Invalid passphrase')
    }
  }
}
