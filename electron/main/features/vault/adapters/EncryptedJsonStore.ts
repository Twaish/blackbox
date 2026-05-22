import { readFile, writeFile } from 'fs/promises'
import { VaultCrypto } from './VaultCrypto'

export class EncryptedJsonStore {
  constructor(private readonly crypto: VaultCrypto) {}

  async write<T>(filepath: string, value: T, key: Buffer): Promise<void> {
    const encrypted = this.crypto.encrypt(
      Buffer.from(JSON.stringify(value), 'utf-8'),
      key,
    )
    await writeFile(filepath, encrypted)
  }

  async read<T>(filepath: string, key: Buffer): Promise<T> {
    const encrypted = await readFile(filepath)
    return JSON.parse(
      this.crypto.decrypt(encrypted, key).toString('utf-8'),
    ) as T
  }
}
