export default class UnlinkVault {
  constructor(private readonly registry: IVaultRegistry) {}

  async execute(vaultId: string) {
    return this.registry.remove(vaultId)
  }
}
