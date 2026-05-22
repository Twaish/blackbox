type VaultManifest = {
  id: string
  name: string
  crypto: {
    salt: string
    keyCheck: {
      iv: string
      data: string
      tag: string
    }
  }
}
