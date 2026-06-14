import { randomUUID, randomBytes } from 'node:crypto'
import { join } from 'path'
import { access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { ITaskService } from '@/app/tasks/application/interfaces/ITaskService'
import { existsSync } from 'node:fs'

export class VaultManager implements IVaultManager {
  constructor(
    private registry: IVaultRegistry,
    private sessions: IVaultSessions,
    private files: IVaultFileStore,
    private crypto: IVaultCrypto,
    private paths: IVaultPaths,
    private tasks: ITaskService,
    private uploads: IVaultUploads,
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
    return await this.uploads.uploadFile(vault, session.dek, filepath)
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

  private async restoreFileToDir(
    vault: VaultEntry,
    dek: Buffer,
    fileId: string,
    outputDir: string,
  ): Promise<void> {
    const meta = await this.files.readMeta(vault, dek, fileId)
    const outputPath = await this.getUniqueRestorePath(
      outputDir,
      meta.original.name,
    )
    await mkdir(path.dirname(outputPath), { recursive: true })
    const fileBuffer = await this.files.read(vault, dek, fileId)
    await writeFile(outputPath, fileBuffer)
  }
  private async restoreFilesBatch(
    vault: VaultEntry,
    dek: Buffer,
    fileIds: string[],
    outputDir: string,
    taskId: string,
  ): Promise<void> {
    const total = fileIds.length
    for (let i = 0; i < total; i++) {
      const meta = await this.files.readMeta(vault, dek, fileIds[i])
      this.tasks.updateTaskProgress({
        id: taskId,
        progress: Math.round((i / total) * 100),
        description: `Exporting ${meta.original.name} (${i + 1}/${total})`,
      })
      await this.restoreFileToDir(vault, dek, fileIds[i], outputDir)
    }
  }
  private async runRestoreTask(
    label: string,
    fn: (taskId: string) => Promise<void>,
  ): Promise<void> {
    const task = this.tasks.startTask({
      label,
      description: 'Exporting files from vault',
    })
    try {
      await fn(task.id)
      this.tasks.updateTaskProgress({
        id: task.id,
        progress: 100,
        description: 'Export completed',
      })
      this.tasks.finishTask(task.id)
    } catch (error) {
      this.tasks.abortTask(task.id)
      throw error
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
  async restoreFiles({
    vaultId,
    fileIds,
    outputDir,
  }: {
    vaultId: string
    fileIds: string[]
    outputDir: string
  }): Promise<void> {
    const vault = this.registry.get(vaultId)
    const { dek } = this.sessions.get(vaultId)
    await this.runRestoreTask(`Exporting ${fileIds.length} files`, (taskId) =>
      this.restoreFilesBatch(vault, dek, fileIds, outputDir, taskId),
    )
  }
  async restoreAllFiles({
    vaultId,
    outputDir,
  }: {
    vaultId: string
    outputDir: string
  }): Promise<void> {
    const vault = this.registry.get(vaultId)
    const { dek } = this.sessions.get(vaultId)
    const fileIds = this.files.list(vault)
    await this.runRestoreTask(`Exporting ${vault.name}`, (taskId) =>
      this.restoreFilesBatch(vault, dek, fileIds, outputDir, taskId),
    )
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
  }: CreateVaultArgs): Promise<void> {
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
    return await this.uploads.createUpload({
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
