type VaultManifest = {
  id: string
  name: string
  crypto: {
    salt: string
    kdf: 'scrypt'
    algorithm: 'aes-256-gcm'
    keyCheck: {
      iv: string
      data: string
      tag: string
    }
  }
}
