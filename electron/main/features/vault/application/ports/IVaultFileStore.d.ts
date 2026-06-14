interface IVaultFileStore {
  read(vault: VaultEntry, key: Buffer, fileId: string): Promise<Buffer>
  stream(
    vault: VaultEntry,
    key: Buffer,
    fileId: string,
    signal?: AbortSignal,
  ): AsyncGenerator<Uint8Array>
  readMeta(
    vault: VaultEntry,
    key: Buffer,
    fileId: string,
  ): Promise<VaultFileMeta>
  delete(vault: VaultEntry, fileId: string): Promise<void>
  list(vault: VaultEntry): string[]
}
