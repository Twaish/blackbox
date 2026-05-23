import { SessionStore } from '../adapters/SessionStore'

export default class RemoveVaultSession {
  constructor(private readonly sessions: SessionStore) {}

  async execute(vaultId: string) {
    return this.sessions.remove(vaultId)
  }
}
