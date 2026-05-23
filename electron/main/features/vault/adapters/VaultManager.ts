import { randomUUID, randomBytes, createDecipheriv } from 'node:crypto'
import { join } from 'path'
import { mkdir, writeFile } from 'node:fs/promises'
import { VaultPaths } from './VaultPaths'
import { VaultCrypto } from './VaultCrypto'
import { VaultRegistry } from './VaultRegistry'
import { SessionStore } from './SessionStore'
import { VaultFileStore } from './VaultFileStore'
import { UploadStore } from './UploadStore'

const ALGO = 'aes-256-gcm'

export class VaultManager implements IVaultManager {
  constructor(
    private registry: VaultRegistry,
    private sessions: SessionStore,
    private files: VaultFileStore,
    private uploads: UploadStore,
    private crypto: VaultCrypto,
    private paths: VaultPaths,
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
    return this.files.add(vault, session.key, filepath)
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

  deleteFile({ vaultId, fileId }: { vaultId: string; fileId: string }): void {
    const vault = this.registry.get(vaultId)
    this.files.delete(vault, fileId)
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
    return await this.uploads.start(
      streamId,
      vault,
      session.key,
      name,
      mime,
      size,
    )
  }

  async uploadChunk({
    streamId,
    chunk,
  }: {
    streamId: string
    chunk: ArrayBuffer
  }): Promise<void> {
    await this.uploads.chunk(streamId, chunk)
  }

  async finishUpload({ streamId }: { streamId: string }): Promise<string> {
    const upload = this.uploads.get(streamId)
    const vault = this.registry.get(upload.vaultId)
    const session = this.sessions.get(upload.vaultId)
    return await this.uploads.finish(streamId, vault, session.key)
  }

  async abortUpload({ streamId }: { streamId: string }): Promise<void> {
    const upload = this.uploads.get(streamId)
    const vault = this.registry.get(upload.vaultId)
    this.uploads.abort(streamId, vault)
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
