interface IVaultManager {
  createVault(args: {
    location: string
    name: string
    algorithm: string
    passphrase: string
  }): void

  addFile(args: { vaultId: string; filepath: string }): Promise<string>

  deleteFile(args: { vaultId: string; fileId: string }): void

  readFile(args: { vaultId: string; fileId: string }): Buffer

  streamFile(args: {
    vaultId: string
    fileId: string
    signal?: AbortSignal
  }): AsyncIterable<Uint8Array>

  readMeta(args: { vaultId: string; fileId: string }): VaultFileMeta

  restoreFile(args: {
    vaultId: string
    fileId: string
    outputFilepath: string
  }): void

  hasSession(vaultId: string): boolean
  removeSession(vaultId: string): void

  getVaultFiles(vaultId: string): string[]

  unlockVault(args: { vaultId: string; passphrase: string }): void
  addExistingVault(vaultPath: string): void
  unlinkVault(id: string): void
  getVaults(): VaultEntry[]

  startUpload(args: {
    vaultId: string
    name: string
    mime: string
  }): Promise<string>
  uploadChunk(args: { uploadId: string; chunk: number[] }): void
  finishUpload(args: { uploadId: string }): Promise<string>
}
