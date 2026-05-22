type VaultSession = {
  vaultId: string
  key: Buffer
  unlockedAt: number
}

export class SessionStore {
  private sessions = new Map<string, VaultSession>()

  has(vaultId: string): boolean {
    return this.sessions.has(vaultId)
  }

  get(vaultId: string): VaultSession {
    const session = this.sessions.get(vaultId)
    if (!session) throw new Error('Vault is locked')
    return session
  }

  set(vaultId: string, key: Buffer): void {
    this.sessions.set(vaultId, { vaultId, key, unlockedAt: Date.now() })
  }

  remove(vaultId: string): void {
    this.sessions.delete(vaultId)
  }
}
