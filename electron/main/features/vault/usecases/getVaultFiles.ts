export default class GetVaultFiles {
  constructor(private readonly manager: IVaultManager) {}

  async execute({ vaultId, query }: { vaultId: string; query?: string }) {
    return this.manager.getVaultFiles(vaultId, query)
  }
}
