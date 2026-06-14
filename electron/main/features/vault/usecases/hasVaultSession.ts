export default class HasVaultSession {
  constructor(private readonly sessions: IVaultSessions) {}

  async execute(vaultId: string) {
    return this.sessions.has(vaultId)
  }
}
