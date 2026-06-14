interface IVaultSessions {
  has(vaultId: string): boolean
  get(vaultId: string): VaultSession
  set(vaultId: string, dek: Buffer): void
  remove(vaultId: string): void
}
