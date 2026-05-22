import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto'

const ALGO = 'aes-256-gcm'
const IV_LENGTH = 12
const TAG_LENGTH = 16
const KEY_LENGTH = 32

export class VaultCrypto {
  deriveKey(passphrase: string, salt: Buffer): Buffer {
    return scryptSync(passphrase, salt, KEY_LENGTH)
  }

  encrypt(data: Buffer, key: Buffer): Buffer {
    const iv = randomBytes(IV_LENGTH)
    const cipher = createCipheriv(ALGO, key, iv)
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
    const tag = cipher.getAuthTag()
    return Buffer.concat([iv, encrypted, tag])
  }

  createEncryptionStream(key: Buffer) {
    const iv = randomBytes(IV_LENGTH)
    const cipher = createCipheriv(ALGO, key, iv)
    return { iv, cipher }
  }

  decrypt(buffer: Buffer, key: Buffer): Buffer {
    if (buffer.length < IV_LENGTH + TAG_LENGTH)
      throw new Error('Invalid encrypted payload')

    const iv = buffer.subarray(0, IV_LENGTH)
    const tag = buffer.subarray(buffer.length - TAG_LENGTH)
    const data = buffer.subarray(IV_LENGTH, buffer.length - TAG_LENGTH)

    const decipher = createDecipheriv(ALGO, key, iv)
    decipher.setAuthTag(tag)

    return Buffer.concat([decipher.update(data), decipher.final()])
  }
}
