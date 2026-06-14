interface IVaultRegistry {
  getAll(): VaultEntry[]
  get(vaultId: string): VaultEntry
  has(id: string): boolean
  add(entry: VaultEntry): void
  addExisting(location: string): Promise<void>
  remove(id: string): void
  update(id: string, patch: Partial<VaultEntry>): void
  getManifest(vaultPath: string): Promise<VaultManifest>
  vaultExists(vaultId: string): Promise<boolean>
}
