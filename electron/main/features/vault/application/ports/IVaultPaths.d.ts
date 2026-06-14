interface IVaultPaths {
  data(vaultPath: string, fileId?: string): string
  meta(vaultPath: string, fileId?: string): string
  manifest(vaultPath: string): string
}
