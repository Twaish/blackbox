type VaultUploadSession = {
  id: string
  vaultId: string
  fileId: string
  taskId: string

  name: string
  mime: string
  size: number

  transferred: number

  encryptedPath: string
  metaPath: string

  iv: Buffer
  cipher: import('crypto').CipherGCM
  output: import('fs').WriteStream

  key: Buffer

  onEnd?: () => void
  hasEnded: boolean
  abortPromise: Promise<void> | null
}
