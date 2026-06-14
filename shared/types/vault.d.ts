type CreateVaultArgs = {
  name: string
  location: string
  passphrase: string
}

type VaultEntry = {
  id: string
  name: string
  location: string
}

type VaultFileMeta = {
  fileId: string
  original: {
    name: string
    ext: string
    mime: string
  }
}
