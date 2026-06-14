interface IVaultUploads {
  createUpload(args: {
    uploadId?: string
    vault: VaultEntry
    key: Buffer
    name: string
    mime: string
    size: number
    onEnd?: () => void
  }): Promise<string>
  writeChunk(uploadId: string, chunk: ArrayBuffer): Promise<void>
  finish(uploadId: string): Promise<string>
  abort(uploadId: string): Promise<void>
  uploadFile(vault: VaultEntry, key: Buffer, filepath: string): Promise<string>
}
