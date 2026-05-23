export default class GetVaultFiles {
  constructor(private readonly manager: IVaultManager) {}

  async execute(vaultId: string) {
    return this.manager.getVaultFiles(vaultId)
  }
}
