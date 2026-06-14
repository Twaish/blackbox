type VaultSession = {
  vaultId: string
  dek: Buffer
  unlockedAt: number
}

export class VaultSessions {
  private sessions = new Map<string, VaultSession>()

  has(vaultId: string): boolean {
    return this.sessions.has(vaultId)
  }

  get(vaultId: string): VaultSession {
    const session = this.sessions.get(vaultId)
    if (!session) throw new Error('Vault is locked')
    return session
  }

  set(vaultId: string, dek: Buffer): void {
    this.sessions.set(vaultId, { vaultId, dek, unlockedAt: Date.now() })
  }

  remove(vaultId: string): void {
    this.sessions.delete(vaultId)
  }
}
