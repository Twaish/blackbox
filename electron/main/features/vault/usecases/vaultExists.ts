export default class VaultExists {
  constructor(private readonly registry: IVaultRegistry) {}

  async execute(vaultId: string) {
    return this.registry.vaultExists(vaultId)
  }
}
