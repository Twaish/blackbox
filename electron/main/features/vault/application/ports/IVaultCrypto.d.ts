interface IVaultCrypto {
  deriveKey(passphrase: string, salt: Buffer): Buffer
  generateKey(): Buffer
  encrypt(data: Buffer, key: Buffer): Buffer
  decrypt(buffer: Buffer, key: Buffer): Buffer
  createEncryptionStream(key: Buffer): {
    iv: Buffer
    cipher: import('crypto').CipherGCM
  }
}
