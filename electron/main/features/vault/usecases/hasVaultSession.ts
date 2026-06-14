import { VaultSessions } from '../infrastructure/adapters/VaultSessions'

export default class HasVaultSession {
  constructor(private readonly sessions: VaultSessions) {}

  async execute(vaultId: string) {
    return this.sessions.has(vaultId)
  }
}
