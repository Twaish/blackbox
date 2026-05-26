import { VaultSessions } from '../adapters/VaultSessions'

export default class RemoveVaultSession {
  constructor(private readonly sessions: VaultSessions) {}

  async execute(vaultId: string) {
    return this.sessions.remove(vaultId)
  }
}
