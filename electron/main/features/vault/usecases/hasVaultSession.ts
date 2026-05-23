import { SessionStore } from '../adapters/SessionStore'

export default class HasVaultSession {
  constructor(private readonly sessions: SessionStore) {}

  async execute(vaultId: string) {
    return this.sessions.has(vaultId)
  }
}
