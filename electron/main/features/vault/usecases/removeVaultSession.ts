export default class RemoveVaultSession {
  constructor(private readonly sessions: IVaultSessions) {}

  async execute(vaultId: string) {
    return this.sessions.remove(vaultId)
  }
}
