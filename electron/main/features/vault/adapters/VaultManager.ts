import {
  ISettingsBuilder,
  Schema,
  SettingsInterface,
} from '@/app/settings/application/ports/ISettingsBuilder'
import {
  randomUUID,
  randomBytes,
  scryptSync,
  createCipheriv,
  createDecipheriv,
  CipherGCM,
} from 'node:crypto'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  createReadStream,
  createWriteStream,
  existsSync,
  readdirSync,
  readFileSync,
  ReadStream,
  unlinkSync,
  WriteStream,
} from 'node:fs'
import path from 'node:path'
import { fileTypeFromBuffer } from 'file-type'
import mime from 'mime-types'
import { open } from 'node:fs/promises'

const ALGO = 'aes-256-gcm'

function deriveKey(passphrase: string, salt: Buffer) {
  return scryptSync(passphrase, salt, 32)
}

function encrypt(data: Buffer, key: Buffer) {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, key, iv)

  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
  const tag = cipher.getAuthTag()

  return Buffer.concat([iv, encrypted, tag])
}

function decrypt(buffer: Buffer, key: Buffer) {
  const iv = buffer.subarray(0, 12)
  const tag = buffer.subarray(buffer.length - 16)
  const data = buffer.subarray(12, buffer.length - 16)

  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)

  return Buffer.concat([decipher.update(data), decipher.final()])
}

const settingsSchema = {
  vaults: { default: [] as VaultEntry[] },
} satisfies Schema

type VaultSession = {
  vaultId: string
  key: Buffer
  unlockedAt: number
}

type UploadSession = {
  uploadId: string
  vaultId: string
  fileId: string
  stream: WriteStream
  cipher: CipherGCM
  iv: Buffer
  name: string
  mime: string
}

export class VaultManager implements IVaultManager {
  private settings: SettingsInterface<typeof settingsSchema>
  private sessions = new Map<string, VaultSession>()

  private uploads = new Map<string, UploadSession>()

  constructor(builder: ISettingsBuilder) {
    this.settings = builder.defineSettings(
      'vaults',
      'vaults-settings',
      settingsSchema,
    )
  }

  async init() {
    await this.settings.init()
  }

  async addFile({
    vaultId,
    filepath,
  }: {
    vaultId: string
    filepath: string
  }): Promise<string> {
    const session = this.getSession(vaultId)
    const fileBuffer = readFileSync(filepath)
    const fileId = randomUUID()
    const encryptedFile = encrypt(fileBuffer, session.key)
    const encryptedFilepath = this.getVaultFilePath(vaultId, fileId)
    writeFileSync(encryptedFilepath, encryptedFile)

    const mimeFromLookup = mime.lookup(filepath)
    const inferredMime =
      (await fileTypeFromBuffer(fileBuffer))?.mime ??
      (typeof mimeFromLookup === 'string' ? mimeFromLookup : undefined) ??
      'application/octet-stream'

    const metadata: VaultFileMeta = {
      fileId,
      original: {
        name: path.basename(filepath),
        ext: path.extname(filepath),
        mime: inferredMime,
      },
    }

    const encryptedMeta = encrypt(
      Buffer.from(JSON.stringify(metadata), 'utf-8'),
      session.key,
    )

    writeFileSync(this.getVaultMetaPath(vaultId, fileId), encryptedMeta)

    return fileId
  }

  deleteFile({ vaultId, fileId }: { vaultId: string; fileId: string }): void {
    const filePath = this.getVaultFilePath(vaultId, fileId)
    const metaPath = this.getVaultMetaPath(vaultId, fileId)

    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath)
      }
    } catch (err) {
      console.error(err)
    }

    try {
      if (existsSync(metaPath)) {
        unlinkSync(metaPath)
      }
    } catch (err) {
      console.error(err)
    }
  }

  readFile({ vaultId, fileId }: { vaultId: string; fileId: string }): Buffer {
    const session = this.getSession(vaultId)
    const encryptedFile = readFileSync(this.getVaultFilePath(vaultId, fileId))
    return decrypt(encryptedFile, session.key)
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
    const session = this.getSession(vaultId)
    const filePath = this.getVaultFilePath(vaultId, fileId)

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

      const decipher = createDecipheriv(ALGO, session.key, iv)
      decipher.setAuthTag(tag)

      encryptedStream = createReadStream(filePath, {
        fd: fd,
        autoClose: false,
        start: 12,
        end: size - 17,
        highWaterMark: 64 * 1024,
        signal,
      })

      encryptedStream.on('error', async function (err) {
        if ((err as Error).name !== 'AbortError') return
        await closeStream()
      })

      const decryptedStream = encryptedStream.pipe(decipher)

      for await (const chunk of decryptedStream) {
        if (signal?.aborted) break
        yield chunk
      }
    } finally {
      await closeStream()
    }
  }

  readMeta({
    vaultId,
    fileId,
  }: {
    vaultId: string
    fileId: string
  }): VaultFileMeta {
    const session = this.getSession(vaultId)
    const encryptedMeta = readFileSync(this.getVaultMetaPath(vaultId, fileId))
    const decryptedMeta = decrypt(encryptedMeta, session.key)
    return JSON.parse(decryptedMeta.toString('utf-8'))
  }

  createVault({
    location,
    name,
    passphrase,
  }: {
    location: string
    name: string
    algorithm: string
    passphrase: string
  }): void {
    try {
      const vaultId = randomUUID()
      const vaultName = name

      const vaultPath = join(location, vaultName)

      mkdirSync(vaultPath, { recursive: true })
      mkdirSync(join(vaultPath, 'data'))
      mkdirSync(join(vaultPath, 'meta'))

      const salt = randomBytes(16)
      const key = deriveKey(passphrase, salt)

      const checkIv = randomBytes(12)
      const checkCipher = createCipheriv(ALGO, key, checkIv)

      const checkPlain = Buffer.from('vault-check', 'utf8')

      const checkEncrypted = Buffer.concat([
        checkCipher.update(checkPlain),
        checkCipher.final(),
      ])

      const checkTag = checkCipher.getAuthTag()

      const manifest: VaultManifest = {
        id: vaultId,
        name: vaultName,
        crypto: {
          salt: salt.toString('base64'),
          kdf: 'scrypt',
          algorithm: ALGO,
          keyCheck: {
            iv: checkIv.toString('base64'),
            data: checkEncrypted.toString('base64'),
            tag: checkTag.toString('base64'),
          },
        },
      }

      const manifestPath = join(vaultPath, 'manifest.json')
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')

      this.settings.vaults = [
        ...this.settings.vaults,
        {
          id: vaultId,
          name: vaultName,
          location: vaultPath,
        },
      ]
    } catch (err) {
      console.error(err)
    }
  }

  unlockVault({
    vaultId,
    passphrase,
  }: {
    vaultId: string
    passphrase: string
  }): void {
    const key = this.getVerifiedKey(vaultId, passphrase)

    this.sessions.set(vaultId, {
      vaultId,
      key,
      unlockedAt: Date.now(),
    })
  }

  getVaults() {
    return this.settings.vaults
  }

  addExistingVault(vaultPath: string): void {
    const manifest = this.getManifest(vaultPath)
    const exists = this.settings.vaults.find((v) => v.id === manifest.id)
    if (exists)
      throw new Error(
        `Vault "${manifest.name}" with id ${manifest.id} already exists`,
      )

    this.settings.vaults = [
      ...this.settings.vaults,
      {
        id: manifest.id,
        name: manifest.name,
        location: vaultPath,
      },
    ]
  }

  restoreFile({
    vaultId,
    fileId,
    outputFilepath,
  }: {
    vaultId: string
    fileId: string
    outputFilepath: string
  }) {
    const fileBuffer = this.readFile({ vaultId, fileId })
    writeFileSync(outputFilepath, fileBuffer)
  }

  getVaultFiles(vaultId: string): string[] {
    const files = readdirSync(this.getVaultFilePath(vaultId))
    return files.map((file) => path.parse(file).name)
  }

  hasSession(vaultId: string): boolean {
    return this.sessions.has(vaultId)
  }

  removeSession(vaultId: string): void {
    this.sessions.delete(vaultId)
  }

  unlinkVault(id: string): void {
    this.settings.vaults = this.settings.vaults.filter((v) => v.id !== id)
  }

  async startUpload({
    vaultId,
    name,
    mime,
  }: {
    vaultId: string
    name: string
    mime: string
  }): Promise<string> {
    const session = this.getSession(vaultId)

    const uploadId = randomUUID()
    const fileId = randomUUID()

    const encryptedPath = this.getVaultFilePath(vaultId, fileId)

    const iv = randomBytes(12)

    const cipher = createCipheriv(ALGO, session.key, iv)

    const stream = createWriteStream(encryptedPath)

    await new Promise<void>((resolve, reject) => {
      stream.write(iv, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })

    this.uploads.set(uploadId, {
      uploadId,
      vaultId,
      fileId,
      stream,
      cipher,
      iv,
      name,
      mime,
    })

    return uploadId
  }

  async uploadChunk({
    uploadId,
    chunk,
  }: {
    uploadId: string
    chunk: number[]
  }): Promise<void> {
    const upload = this.uploads.get(uploadId)

    if (!upload) {
      throw new Error('Upload session not found')
    }

    const buffer = Buffer.from(chunk)
    const encrypted = upload.cipher.update(buffer)

    return await new Promise<void>((resolve, reject) => {
      upload.stream.write(encrypted, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async finishUpload({ uploadId }: { uploadId: string }): Promise<string> {
    const upload = this.uploads.get(uploadId)
    if (!upload) throw new Error('Upload session not found')

    const final = upload.cipher.final()
    const tag = upload.cipher.getAuthTag()

    await new Promise<void>((resolve, reject) => {
      upload.stream.write(final, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })

    // append auth tag after ciphertext
    await new Promise<void>((resolve, reject) => {
      upload.stream.write(tag, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })

    await new Promise<void>((resolve) => {
      upload.stream.end(resolve)
    })

    const metadata: VaultFileMeta = {
      fileId: upload.fileId,
      original: {
        name: upload.name,
        ext: path.extname(upload.name),
        mime: upload.mime || 'application/octet-stream',
      },
    }

    const session = this.getSession(upload.vaultId)

    const encryptedMeta = encrypt(
      Buffer.from(JSON.stringify(metadata), 'utf8'),
      session.key,
    )

    writeFileSync(
      this.getVaultMetaPath(upload.vaultId, upload.fileId),
      encryptedMeta,
    )

    this.uploads.delete(uploadId)

    return upload.fileId
  }

  private getVaultFilePath(vaultId: string, fileId?: string): string {
    const vault = this.getVault(vaultId)

    if (fileId) {
      return path.join(vault.location, 'data', `${fileId}.enc`)
    } else {
      return path.join(vault.location, 'data')
    }
  }

  private getVaultMetaPath(vaultId: string, fileId: string): string {
    const vault = this.getVault(vaultId)

    return path.join(vault.location, 'meta', `${fileId}.enc`)
  }

  private getVault(vaultId: string): VaultEntry {
    const vault = this.settings.vaults.find((v) => v.id === vaultId)
    if (!vault) {
      throw new Error('Vault not found')
    }
    return vault
  }

  private getVerifiedKey(vaultId: string, passphrase: string): Buffer {
    const vault = this.getVault(vaultId)
    const manifest = this.getManifest(vault.location)

    const salt = Buffer.from(manifest.crypto.salt, 'base64')
    const key = deriveKey(passphrase, salt)

    const check = manifest.crypto.keyCheck

    const iv = Buffer.from(check.iv, 'base64')
    const data = Buffer.from(check.data, 'base64')
    const tag = Buffer.from(check.tag, 'base64')

    try {
      const decipher = createDecipheriv(ALGO, key, iv)
      decipher.setAuthTag(tag)

      const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
      if (decrypted.toString('utf8') !== 'vault-check') {
        throw new Error()
      }

      return key
    } catch {
      throw new Error('Invalid passphrase')
    }
  }

  private getSession(vaultId: string): VaultSession {
    const session = this.sessions.get(vaultId)
    if (!session) throw new Error('Vault is locked')
    return session
  }

  private getManifest(vaultPath: string): VaultManifest {
    const manifestPath = join(vaultPath, 'manifest.json')
    if (!existsSync(manifestPath))
      throw new Error(`Manifest not found for vault at ${vaultPath}`)

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    return manifest
  }
}
