interface IVaultManager {
  createVault(args: {
    location: string
    name: string
    passphrase: string
  }): Promise<void>
  unlockVault(args: { vaultId: string; passphrase: string }): Promise<void>
  renameVault(args: { vaultId: string; name: string }): Promise<void>
  changePassphrase(args: {
    vaultId: string
    oldPassphrase: string
    newPassphrase: string
  }): Promise<void>

  addFile(args: { vaultId: string; filepath: string }): Promise<string>

  deleteFiles(args: { vaultId: string; fileIds: string[] }): Promise<void>

  streamFile(args: {
    vaultId: string
    fileId: string
    signal?: AbortSignal
  }): AsyncIterable<Uint8Array>

  readMeta(args: { vaultId: string; fileId: string }): Promise<VaultFileMeta>

  restoreFile(args: {
    vaultId: string
    fileId: string
    outputFilepath: string
  }): Promise<void>
  restoreAllFiles(args: { vaultId: string; outputDir: string }): Promise<void>

  getVaultFiles(vaultId: string, query?: string): Promise<string[]>

  startUpload(args: {
    streamId: string
    vaultId: string
    name: string
    mime: string
    size: number
  }): Promise<string>
}
