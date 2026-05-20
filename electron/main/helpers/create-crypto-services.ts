import { safeStorage } from 'electron'

export function createCryptoServices(): {
  encrypt: (value: string) => string
  decrypt: (value: string) => string
} {
  return {
    encrypt: (value) => {
      if (!safeStorage.isEncryptionAvailable())
        throw new Error(`Cryptography is not ready yet`)
      return safeStorage.encryptString(value).toString('base64')
    },
    decrypt: (value) => {
      if (!safeStorage.isEncryptionAvailable())
        throw new Error(`Cryptography is not ready yet`)
      return safeStorage.decryptString(Buffer.from(value, 'base64'))
    },
  }
}
