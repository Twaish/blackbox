type VaultManifest = {
  id: string
  name: string
  crypto: {
    salt: string
    encryptedDek: string
  }
}
