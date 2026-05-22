interface IVaultManager {
  createVault(args: {
    location: string
    name: string
    passphrase: string
  }): Promise<void>

  addFile(args: { vaultId: string; filepath: string }): Promise<string>

  deleteFile(args: { vaultId: string; fileId: string }): void

  readFile(args: { vaultId: string; fileId: string }): Promise<Buffer>

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

  hasSession(vaultId: string): boolean
  removeSession(vaultId: string): void

  getVaultFiles(vaultId: string): string[]

  unlockVault(args: { vaultId: string; passphrase: string }): Promise<void>
  addExistingVault(vaultPath: string): Promise<void>
  unlinkVault(id: string): void
  getVaults(): VaultEntry[]

  startUpload(args: {
    vaultId: string
    name: string
    mime: string
  }): Promise<string>
  uploadChunk(args: { streamId: string; chunk: ArrayBuffer }): void
  finishUpload(args: { streamId: string }): Promise<string>
  abortUpload(args: { streamId: string }): Promise<void>
}
