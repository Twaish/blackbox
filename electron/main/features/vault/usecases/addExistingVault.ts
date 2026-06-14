export default class AddExistingVault {
  constructor(private readonly registry: IVaultRegistry) {}

  async execute(vaultPath: string) {
    return this.registry.addExisting(vaultPath)
  }
}
